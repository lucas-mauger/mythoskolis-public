import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { load as loadYaml } from "js-yaml";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "..");
const yamlPath = resolve(projectRoot, "data/genealogie_new_structure.yaml");
const outputPath = resolve(projectRoot, "public/data/genealogie.json");

function normalizeEntity(entity) {
  const slug = (entity.slug ?? "").toString();
  const culture = (entity.culture ?? "grecque").toString().toLowerCase();
  const id = (entity.id ?? `${culture}-${slug}`).toString();
  return {
    id,
    slug,
    culture,
    name: entity.name ?? slug,
  };
}

function cleanSources(sources) {
  if (!Array.isArray(sources)) return [];
  return sources
    .map((s) => ({
      author: s.author ?? "",
      work: s.work ?? "",
      passage: s.passage ?? "",
      consensus: s.consensus !== false,
    }))
    .filter((s) => s.author || s.work || s.passage);
}

function dedupeSources(sources = []) {
  const seen = new Set();
  const out = [];
  for (const s of sources) {
    const key = `${s.author ?? ""}|${s.work ?? ""}|${s.passage ?? ""}|${s.consensus !== false}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(s);
  }
  return out;
}

function dedupeRelations(relations) {
  const map = new Map();
  for (const r of relations) {
    const key = `${r.type}|${[r.source_id, r.target_id].sort().join("|")}`;
    const normalizedSources = (r.sources || []).map((s) => ({
      author: s.author ?? "",
      work: s.work ?? "",
      passage: s.passage ?? "",
      consensus: r.consensus === false ? false : s.consensus !== false,
    }));
    if (!map.has(key)) {
      map.set(key, {
        ...r,
        consensus: r.consensus !== false,
        _hasConsensual: r.consensus !== false,
        _hasNonConsensual: r.consensus === false,
        sources: dedupeSources(normalizedSources),
      });
      continue;
    }
    const existing = map.get(key);
    existing.sources = dedupeSources([...(existing.sources || []), ...normalizedSources]);
    if (r.consensus === false) {
      existing._hasNonConsensual = true;
      existing.consensus = existing._hasConsensual ? null : false;
    } else {
      existing._hasConsensual = true;
      if (!existing._hasNonConsensual) {
        existing.consensus = true;
      } else {
        existing.consensus = null;
      }
    }
  }
  return Array.from(map.values()).map((item) => {
    const { _hasConsensual, _hasNonConsensual, ...rest } = item;
    if (_hasNonConsensual) {
      rest.consensus = _hasConsensual ? null : false;
    } else {
      rest.consensus = true;
    }
    return rest;
  });
}

async function generateJson() {
  const yamlContent = await readFile(yamlPath, "utf-8");
  const data = loadYaml(yamlContent) ?? {};
  const entities = Array.isArray(data.entities) ? data.entities.map(normalizeEntity) : [];
  const byId = new Map(entities.map((e) => [e.id, e]));

  const relations = [];

  const upsertRelation = (sourceId, targetId, type, consensus, sources) => {
    if (!sourceId || !targetId) return;
    if (!byId.has(sourceId) || !byId.has(targetId)) return;
    relations.push({
      source_id: sourceId,
      target_id: targetId,
      type,
      consensus: consensus !== false,
      sources: cleanSources(sources),
    });
  };

  const entitiesRaw = Array.isArray(data.entities) ? data.entities : [];
  for (const ent of entitiesRaw) {
    const centralId = ent.id;
    const rel = ent.relations || {};

    // parents -> edge parent: parent -> child
    for (const item of Array.isArray(rel.parents) ? rel.parents : []) {
      upsertRelation(item.id, centralId, "parent", item.consensus, item.sources);
    }
    // children -> edge parent: central -> child
    for (const item of Array.isArray(rel.children) ? rel.children : []) {
      upsertRelation(centralId, item.id, "parent", item.consensus, item.sources);
    }
    // siblings (undirected)
    for (const item of Array.isArray(rel.siblings) ? rel.siblings : []) {
      const a = centralId;
      const b = item.id;
      if (!a || !b) continue;
      const [s, t] = [a, b].sort();
      upsertRelation(s, t, "sibling", item.consensus, item.sources);
    }
    // consorts (undirected)
    for (const item of Array.isArray(rel.consorts) ? rel.consorts : []) {
      const a = centralId;
      const b = item.id;
      if (!a || !b) continue;
      const [s, t] = [a, b].sort();
      upsertRelation(s, t, "consort", item.consensus, item.sources);
    }
  }

  // ne conserver que les relations consensuelles pour l'ego-graph V1
  const deduped = dedupeRelations(relations).map((r) => ({
    source_id: r.source_id,
    target_id: r.target_id,
    type: r.type,
    consensus: r.consensus === false ? false : r.consensus === null ? null : true,
    source_texts: (r.sources || []).map((s) => ({
      author: s.author ?? "",
      work: s.work ?? "",
      note: s.passage ?? "",
      consensus: s.consensus !== false,
    })),
  }));

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(
    outputPath,
    JSON.stringify(
      {
        entities,
        relations: deduped,
      },
      null,
      2,
    ),
    "utf-8",
  );
  console.log(`✅ Données généalogiques (nouveau format) exportées vers ${outputPath}`);
}

generateJson().catch((error) => {
  console.error("❌ Impossible de générer genealogie_new.json :", error);
  process.exit(1);
});
