import { getAllEntities, getEgoGraphById, getRawRelations } from "../src/lib/genealogie.js";

/**
 * Ce script vérifie que l'ego-graph brut (utilisé par l'HoloGraph) contient
 * toutes les relations présentes dans le YAML pour chaque entité.
 * S'il échoue, cela signifie qu'un filtrage a été introduit dans getEgoGraphFromCentral
 * (comme le filtre par origin_id) et l'HoloGraph serait amputé.
 */

const relations = getRawRelations();
const entities = getAllEntities();
let errors = 0;

for (const ent of entities) {
  const graph = getEgoGraphById(ent.id);
  if (!graph) {
    console.warn(`Pas de graph pour ${ent.id}`);
    continue;
  }

  const relsFor = relations.filter(
    (r) => r.source_id === ent.id || r.target_id === ent.id
  );

  const expectCount = {
    parents: relsFor.filter((r) => r.type === "parent" && r.target_id === ent.id).length,
    children: relsFor.filter((r) => r.type === "parent" && r.source_id === ent.id).length,
    siblings: relsFor.filter((r) => r.type === "sibling").filter((r) => r.source_id === ent.id || r.target_id === ent.id).length,
    consorts: relsFor.filter((r) => r.type === "consort").filter((r) => r.source_id === ent.id || r.target_id === ent.id).length,
  };

  const actual = {
    parents: graph.parents.length,
    children: graph.children.length,
    siblings: graph.siblings.length,
    consorts: graph.consorts.length,
  };

  const mismatch = Object.entries(expectCount).filter(([key, count]) => actual[key] !== count);
  if (mismatch.length) {
    errors++;
    console.error(`Incohérence pour ${ent.id} (${ent.name})`);
    mismatch.forEach(([key, count]) => {
      console.error(`  ${key}: attendu ${count}, obtenu ${actual[key]}`);
    });
  }
}

if (errors > 0) {
  console.error(`\nÉchec: ${errors} entité(s) avec des relations manquantes dans l'ego-graph.`);
  process.exit(1);
}

console.log("OK: ego-graph couvre toutes les relations du YAML.");
