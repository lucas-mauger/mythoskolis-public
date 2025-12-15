import { load } from "js-yaml";
import genealogieRaw from "../../data/genealogie_new_structure.yaml?raw";
import { createGenealogieStore } from "./genealogie-shared";
import type {
  GenealogieData,
  GenealogieEntity,
  GenealogieRelation,
  GraphDisplayData,
  RelationSource,
  RelationType,
  RelatedNode,
  GraphNodeCard,
  GraphSection,
  EgoGraph,
} from "./genealogie-shared";

type RawEntity = {
  id: string;
  slug?: string;
  name?: string;
  culture?: string;
  relations?: Record<string, any>;
};

function normalizeEntity(entity: RawEntity): GenealogieEntity {
  const slug = (entity.slug ?? entity.id ?? "").toString();
  const culture = (entity.culture ?? "grecque").toString().toLowerCase();
  return {
    id: entity.id,
    slug,
    name: entity.name ?? slug,
    culture,
  };
}

function cleanSources(sources: any, consensus?: boolean): RelationSource[] {
  if (!Array.isArray(sources)) return [];
  return sources
    .map((s) => ({
      author: s.author ?? "",
      work: s.work ?? "",
      note: s.passage ?? s.note ?? "",
      consensus: consensus ?? true,
    }))
    .filter((s) => s.author || s.work || s.note);
}

function dedupeSources(sources: RelationSource[]): RelationSource[] {
  const seen = new Set<string>();
  return sources.filter((s) => {
    const key = `${s.author}|${s.work}|${s.note ?? ""}|${s.consensus ?? true}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function buildRelations(rawEntities: RawEntity[]) {
  const relMap = new Map<string, GenealogieRelation>();

  const pushRel = (
    origin: string,
    source: string,
    target: string,
    type: RelationType,
    consensus?: boolean,
    sources?: any,
  ) => {
    if (!source || !target) return;
    const key = `${origin}|${type}|${source}|${target}`;
    const cleanedSources = cleanSources(sources, consensus);
    if (relMap.has(key)) {
      const existing = relMap.get(key)!;
      existing.source_texts = dedupeSources([...existing.source_texts, ...cleanedSources]);
      // si l'une des variantes est non consensuelle, on marque la relation comme non consensuelle
      if (consensus === false) existing.consensus = false;
      return;
    }
    relMap.set(key, {
      origin_id: origin,
      source_id: source,
      target_id: target,
      type,
      consensus: consensus ?? true,
      source_texts: dedupeSources(cleanedSources),
    });
  };

  for (const ent of rawEntities) {
    const rel = ent.relations || {};
    const id = ent.id;
    // parents -> parent edge parent->child
    for (const item of Array.isArray(rel.parents) ? rel.parents : []) {
      pushRel(id, item.id, id, "parent", item.consensus, item.sources);
    }
    // children -> parent edge current->child
    for (const item of Array.isArray(rel.children) ? rel.children : []) {
      pushRel(id, id, item.id, "parent", item.consensus, item.sources);
    }
    // siblings undirected
    for (const item of Array.isArray(rel.siblings) ? rel.siblings : []) {
      const [a, b] = [id, item.id].sort();
      pushRel(id, a, b, "sibling", item.consensus, item.sources);
    }
    // consorts undirected
    for (const item of Array.isArray(rel.consorts) ? rel.consorts : []) {
      const [a, b] = [id, item.id].sort();
      pushRel(id, a, b, "consort", item.consensus, item.sources);
    }
  }

  return Array.from(relMap.values());
}

const raw = load(genealogieRaw) as { entities?: RawEntity[] };
const entities = Array.isArray(raw?.entities) ? raw.entities.map(normalizeEntity) : [];
const relations = buildRelations(raw?.entities ?? []);

const genealogieData: GenealogieData = { entities, relations };
const store = createGenealogieStore(genealogieData);

export { createGenealogieStore };
export type {
  GenealogieData,
  GenealogieEntity,
  RelationSource,
  RelationType,
  RelatedNode,
  GraphNodeCard,
  GraphSection,
  GraphDisplayData,
  EgoGraph,
};

export const getAllEntities = store.getAllEntities;
export const getEntityBySlug = store.getEntityBySlug;
export const getEgoGraph = store.getEgoGraphBySlug;
export const getGraphDisplayData = store.getGraphDisplayData;
export const getEgoGraphById = store.getEgoGraphById;
export const getEntityById = store.getEntityById;
export const getRawRelations = () => relations;
export const getRawEntities = () => entities;
