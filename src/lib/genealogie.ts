import { load } from "js-yaml";
import genealogieRaw from "../../data/genealogie_new_structure.yaml?raw";
import { createGenealogieStore } from "./genealogie-shared";
import type {
  GenealogieData,
  GenealogieEntity,
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

function cleanSources(sources: any): RelationSource[] {
  if (!Array.isArray(sources)) return [];
  return sources
    .map((s) => ({
      author: s.author ?? "",
      work: s.work ?? "",
      note: s.passage ?? s.note ?? "",
    }))
    .filter((s) => s.author || s.work || s.note);
}

function buildRelations(rawEntities: RawEntity[]) {
  const relations: { source_id: string; target_id: string; type: RelationType; source_texts: RelationSource[] }[] = [];
  const seen = new Set<string>();

  const pushRel = (source: string, target: string, type: RelationType, consensus?: boolean, sources?: any) => {
    if (!source || !target) return;
    if (consensus === false) return; // on ne garde que le consensus pour l'ego-graph
    const key = `${type}|${source}|${target}`;
    if (seen.has(key)) return;
    seen.add(key);
    relations.push({
      source_id: source,
      target_id: target,
      type,
      source_texts: cleanSources(sources),
    });
  };

  for (const ent of rawEntities) {
    const rel = ent.relations || {};
    const id = ent.id;
    // parents -> parent edge parent->child
    for (const item of Array.isArray(rel.parents) ? rel.parents : []) {
      pushRel(item.id, id, "parent", item.consensus, item.sources);
    }
    // children -> parent edge current->child
    for (const item of Array.isArray(rel.children) ? rel.children : []) {
      pushRel(id, item.id, "parent", item.consensus, item.sources);
    }
    // siblings undirected
    for (const item of Array.isArray(rel.siblings) ? rel.siblings : []) {
      const [a, b] = [id, item.id].sort();
      pushRel(a, b, "sibling", item.consensus, item.sources);
    }
    // consorts undirected
    for (const item of Array.isArray(rel.consorts) ? rel.consorts : []) {
      const [a, b] = [id, item.id].sort();
      pushRel(a, b, "consort", item.consensus, item.sources);
    }
  }

  return relations;
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
