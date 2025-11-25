import http from "node:http";
import { readFile, writeFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";
import { load as loadYaml, dump as dumpYaml } from "js-yaml";
import matter from "gray-matter";

const root = resolve(new URL("..", import.meta.url).pathname);
const yamlPath = resolve(root, "data/genealogie_new_structure.yaml");
const htmlPath = resolve(root, "tools", "yaml-inspector-new.html");
const mdInspectorPath = resolve(root, "tools", "md-inspector.html");
const mdDir = resolve(root, "src/content/entites");
const port = process.env.PORT || 4323;

async function readYaml() {
  const raw = await readFile(yamlPath, "utf8");
  const data = loadYaml(raw) ?? {};
  const entities = Array.isArray(data.entities) ? data.entities : [];
  return { data, entities };
}

async function serveYaml(res) {
  try {
    const { data } = await readYaml();
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify(data));
  } catch (err) {
    res.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ error: "Impossible de lire/parse le YAML", details: err.message }));
  }
}

async function serveHtml(res) {
  try {
    const html = await readFile(htmlPath, "utf8");
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(html);
  } catch (err) {
    res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Page non trouvée. Vérifie tools/yaml-inspector-new.html");
  }
}
async function serveMdInspector(res) {
  try {
    const html = await readFile(mdInspectorPath, "utf8");
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(html);
  } catch (err) {
    res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Page non trouvée. Vérifie tools/md-inspector.html");
  }
}

async function updateEntity(req, res) {
  try {
    let body = "";
    for await (const chunk of req) body += chunk.toString();
    const payload = JSON.parse(body || "{}");
    const { originalId, entity } = payload;
    if (!entity?.id) {
      res.writeHead(400, { "Content-Type": "application/json; charset=utf-8" });
      return res.end(JSON.stringify({ error: "Champ id requis" }));
    }
    const { data, entities } = await readYaml();
    const idx = entities.findIndex((e) => e?.id === originalId);
    if (idx === -1) {
      res.writeHead(404, { "Content-Type": "application/json; charset=utf-8" });
      return res.end(JSON.stringify({ error: "Entité introuvable" }));
    }
    entities[idx] = { ...entities[idx], ...entity };
    const next = dumpYaml({ ...data, entities }, { lineWidth: 0, noRefs: true });
    await writeFile(yamlPath, next, "utf8");
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ ok: true }));
  } catch (err) {
    res.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ error: "Échec sauvegarde entité", details: err.message }));
  }
}

function invertType(type) {
  const t = (type || "").replace(/s$/, "");
  switch (t) {
    case "parent":
      return "child";
    case "child":
      return "parent";
    case "sibling":
      return "sibling";
    case "consort":
      return "consort";
    default:
      return null;
  }
}

function ensureRelations(obj, type) {
  if (!obj.relations || typeof obj.relations !== "object") obj.relations = {};
  if (!Array.isArray(obj.relations[type])) obj.relations[type] = [];
}

function relationExists(list, targetId) {
  return list.some((r) => r.id === targetId);
}

function keyForType(type) {
  if (!type) return "";
  switch (type) {
    case "parent":
    case "parents":
      return "parents";
    case "child":
    case "children":
      return "children";
    case "sibling":
    case "siblings":
      return "siblings";
    case "consort":
    case "consorts":
      return "consorts";
    default:
      return type.endsWith("s") ? type : `${type}s`;
  }
}

function buildSources(sourcePayload) {
  const sources = [];
  const { author, work, passage } = sourcePayload || {};
  if (author || work || passage) {
    sources.push({ author: author || "", work: work || "", passage: passage || "" });
  }
  return sources;
}

function hasConsensus(list, targetId) {
  return Array.isArray(list) && list.some((r) => r.id === targetId && r.consensus !== false);
}

function sameRel(rel, targetId, consensusFlag, sources) {
  const sameId = rel.id === targetId;
  const sameConsensus = (rel.consensus !== false) === (consensusFlag !== false);
  const srcA = JSON.stringify(rel.sources || []);
  const srcB = JSON.stringify(sources || []);
  return sameId && sameConsensus && srcA === srcB;
}

// MD helpers
const FM_ORDER = ["title", "culture", "id", "nature", "gender", "role", "description", "domains", "symbols"];

function formatFrontmatter(data) {
  const ordered = {};
  FM_ORDER.forEach((key) => {
    if (data[key] !== undefined) ordered[key] = data[key];
  });
  Object.keys(data).forEach((key) => {
    if (!ordered.hasOwnProperty(key)) ordered[key] = data[key];
  });
  return ordered;
}

async function listMdEntities() {
  const files = await readdir(mdDir);
  const mdFiles = files.filter((f) => f.endsWith(".md"));
  const result = [];
  for (const file of mdFiles) {
    const raw = await readFile(resolve(mdDir, file), "utf8");
    const parsed = matter(raw);
    result.push({
      file,
      slug: file.replace(/\\.md$/, ""),
      frontmatter: parsed.data || {},
      content: parsed.content || "",
    });
  }
  return result;
}

function ensureMdFilename(name) {
  const base = (name || "").replace(/\.md$/i, "");
  return `${base}.md`;
}

async function updateMdEntity({ file, frontmatter, content }) {
  const path = resolve(mdDir, ensureMdFilename(file));
  const cleanFm = { ...(frontmatter || {}) };
  // on ne persiste plus le slug pour éviter les champs vides
  delete cleanFm.slug;
  const formatted = formatFrontmatter(cleanFm);
  const next = matter.stringify(content || "", formatted, { lineWidth: 0 });
  await writeFile(path, next, "utf8");
}

async function createMdEntity(payload) {
  const { title, culture, slug, id, role, description, domains, symbols, gender, nature } = payload;
  if (!title || !slug || !culture || !id) {
    throw new Error("title, slug, culture, id requis");
  }
  const file = ensureMdFilename(slug);
  const path = resolve(mdDir, file);
  const fm = formatFrontmatter({
    title,
    culture,
    id,
    nature,
    gender,
    role,
    description,
    domains,
    symbols,
  });
  const next = matter.stringify("\n", fm, { lineWidth: 0 });
  await writeFile(path, next, "utf8");
  return file;
}

async function addRelation(req, res) {
  try {
    let body = "";
    for await (const chunk of req) body += chunk.toString();
    const payload = JSON.parse(body || "{}");
    const { sourceId, targetId, type, consensus = false, sourceInfo = {}, addInverse = false } = payload;
    if (!sourceId || !targetId || !type) {
      res.writeHead(400, { "Content-Type": "application/json; charset=utf-8" });
      return res.end(JSON.stringify({ error: "sourceId, targetId et type requis" }));
    }
    const inverseType = invertType(type);
    const { data, entities } = await readYaml();
    const src = entities.find((e) => e.id === sourceId);
    const tgt = entities.find((e) => e.id === targetId);
    if (!src || !tgt) {
      res.writeHead(404, { "Content-Type": "application/json; charset=utf-8" });
      return res.end(JSON.stringify({ error: "source ou cible introuvable" }));
    }

    const sources = buildSources(sourceInfo);
    const key = keyForType(type);
    ensureRelations(src, key);
    if (consensus && hasConsensus(src.relations[key], targetId)) {
      res.writeHead(409, { "Content-Type": "application/json; charset=utf-8" });
      return res.end(JSON.stringify({ error: "Cette relation existe déjà de façon consensuelle." }));
    }
    // autoriser plusieurs versions non consensuelles
    src.relations[key].push({ id: targetId, consensus, sources });

    if (addInverse && inverseType) {
      const invKey = keyForType(inverseType);
      ensureRelations(tgt, invKey);
      if (consensus && hasConsensus(tgt.relations[invKey], sourceId)) {
        res.writeHead(409, { "Content-Type": "application/json; charset=utf-8" });
        return res.end(JSON.stringify({ error: "Cette relation existe déjà de façon consensuelle." }));
      }
      tgt.relations[invKey].push({ id: sourceId, consensus, sources });
    }

    const next = dumpYaml({ ...data, entities }, { lineWidth: 0, noRefs: true });
    await writeFile(yamlPath, next, "utf8");
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ ok: true }));
  } catch (err) {
    res.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ error: "Échec ajout relation", details: err.message }));
  }
}

async function updateRelation(req, res) {
  try {
    let body = "";
    for await (const chunk of req) body += chunk.toString();
    const payload = JSON.parse(body || "{}");
    const {
      sourceId,
      originType,
      targetId,
      newType,
      consensus = false,
      sourceInfo = {},
      addInverse = true,
      originalConsensus = undefined,
      originalSources = [],
    } = payload;
    if (!sourceId || !originType || !targetId) {
      res.writeHead(400, { "Content-Type": "application/json; charset=utf-8" });
      return res.end(JSON.stringify({ error: "sourceId, originType, targetId requis" }));
    }
    const { data, entities } = await readYaml();
    const src = entities.find((e) => e.id === sourceId);
    const tgt = entities.find((e) => e.id === targetId);
    if (!src || !tgt) {
      res.writeHead(404, { "Content-Type": "application/json; charset=utf-8" });
      return res.end(JSON.stringify({ error: "source ou cible introuvable" }));
    }
    const originKey = keyForType(originType);
    const invOrigin = invertType(originType);
    const invOriginKey = keyForType(invOrigin);
    // remove old
    ensureRelations(src, originKey);
    src.relations[originKey] = src.relations[originKey].filter(
      (r) => !sameRel(r, targetId, originalConsensus, originalSources),
    );
    if (invOriginKey && tgt.relations) {
      ensureRelations(tgt, invOriginKey);
      tgt.relations[invOriginKey] = tgt.relations[invOriginKey].filter(
        (r) => !sameRel(r, sourceId, originalConsensus, originalSources),
      );
    }
    // si newType vide => suppression simple
    if (!newType) {
      const next = dumpYaml({ ...data, entities }, { lineWidth: 0, noRefs: true });
      await writeFile(yamlPath, next, "utf8");
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      return res.end(JSON.stringify({ ok: true }));
    }

    // add new
    const sources = buildSources(sourceInfo);
    const newKey = keyForType(newType);
    ensureRelations(src, newKey);
    if (consensus && hasConsensus(src.relations[newKey], targetId)) {
      res.writeHead(409, { "Content-Type": "application/json; charset=utf-8" });
      return res.end(JSON.stringify({ error: "Cette relation existe déjà de façon consensuelle." }));
    }
    src.relations[newKey].push({ id: targetId, consensus, sources });
    const inverseType = invertType(newType);
    if (addInverse && inverseType) {
      const invKey = keyForType(inverseType);
      const tgtEnt = entities.find((e) => e.id === targetId);
      if (tgtEnt) {
        ensureRelations(tgtEnt, invKey);
        if (consensus && hasConsensus(tgtEnt.relations[invKey], sourceId)) {
          res.writeHead(409, { "Content-Type": "application/json; charset=utf-8" });
          return res.end(JSON.stringify({ error: "Cette relation existe déjà de façon consensuelle." }));
        }
        tgtEnt.relations[invKey].push({ id: sourceId, consensus, sources });
      }
    }
    const next = dumpYaml({ ...data, entities }, { lineWidth: 0, noRefs: true });
    await writeFile(yamlPath, next, "utf8");
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ ok: true }));
  } catch (err) {
    res.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ error: "Échec mise à jour relation", details: err.message }));
  }
}

async function addEntity(req, res) {
  try {
    let body = "";
    for await (const chunk of req) body += chunk.toString();
    const payload = JSON.parse(body || "{}");
    const { name, slug, culture, display_class, relation } = payload;
    if (!name || !slug || !culture) {
      res.writeHead(400, { "Content-Type": "application/json; charset=utf-8" });
      return res.end(JSON.stringify({ error: "name, slug et culture requis" }));
    }
    const id = `${culture}-${slug}`;
    const { data, entities } = await readYaml();
    if (entities.some((e) => e.id === id)) {
      res.writeHead(409, { "Content-Type": "application/json; charset=utf-8" });
      return res.end(JSON.stringify({ error: "ID déjà existant" }));
    }
    const newEnt = { name, slug, culture, id };
    if (display_class) newEnt.display_class = display_class;
    if (relation && relation.targetId && relation.type) {
      const key = keyForType(relation.type);
      const isConsensus = !!relation.consensus;
      const sources = buildSources(relation.sourceInfo);
      ensureRelations(newEnt, key);
      if (isConsensus) clearConsensus(newEnt.relations[key], relation.targetId);
      newEnt.relations[key].push({
        id: relation.targetId,
        consensus: isConsensus,
        sources,
      });
      if (relation.addInverse) {
        const tgt = entities.find((e) => e.id === relation.targetId);
        const inverseType = invertType(relation.type);
        const invKey = keyForType(inverseType);
        if (tgt && invKey) {
          ensureRelations(tgt, invKey);
          if (isConsensus) clearConsensus(tgt.relations[invKey], id);
          if (!relationExists(tgt.relations[invKey], id)) {
            tgt.relations[invKey].push({
              id,
              consensus: isConsensus,
              sources,
            });
          }
        }
      }
    }
    ensureRelations(newEnt, "parents");
    ensureRelations(newEnt, "children");
    ensureRelations(newEnt, "siblings");
    ensureRelations(newEnt, "consorts");
    entities.push(newEnt);

    // auto-créer les inverses si d'autres entités pointaient déjà vers ce nouvel id
    const typesMap = {
      parents: "parent",
      children: "child",
      siblings: "sibling",
      consorts: "consort",
    };
    for (const e of entities) {
      if (!e.relations) continue;
      for (const key of Object.keys(typesMap)) {
        const list = Array.isArray(e.relations[key]) ? e.relations[key] : [];
        for (const rel of list) {
          if (rel.id !== id) continue;
          const inverseType = invertType(typesMap[key]);
          const invKey = keyForType(inverseType);
          if (!invKey) continue;
          ensureRelations(newEnt, invKey);
          if (!relationExists(newEnt.relations[invKey], e.id)) {
            newEnt.relations[invKey].push({
              id: e.id,
              consensus: rel.consensus ?? true,
              sources: rel.sources ?? [],
            });
          }
        }
      }
    }

    const next = dumpYaml({ ...data, entities }, { lineWidth: 0, noRefs: true });
    await writeFile(yamlPath, next, "utf8");
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ ok: true }));
  } catch (err) {
    res.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ error: "Échec création entité", details: err.message }));
  }
}

async function deleteEntity(req, res) {
  try {
    let body = "";
    for await (const chunk of req) body += chunk.toString();
    const payload = JSON.parse(body || "{}");
    const { id } = payload;
    if (!id) {
      res.writeHead(400, { "Content-Type": "application/json; charset=utf-8" });
      return res.end(JSON.stringify({ error: "id requis" }));
    }
    const { data, entities } = await readYaml();
    const nextEntities = entities.filter((e) => e.id !== id);
    if (nextEntities.length === entities.length) {
      res.writeHead(404, { "Content-Type": "application/json; charset=utf-8" });
      return res.end(JSON.stringify({ error: "Entité introuvable" }));
    }
    // nettoyer les références vers l'entité supprimée
    nextEntities.forEach((e) => {
      if (!e.relations) return;
      Object.keys(e.relations).forEach((k) => {
        if (Array.isArray(e.relations[k])) {
          e.relations[k] = e.relations[k].filter((r) => r.id !== id);
        }
      });
    });
    const next = dumpYaml({ ...data, entities: nextEntities }, { lineWidth: 0, noRefs: true });
    await writeFile(yamlPath, next, "utf8");
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ ok: true }));
  } catch (err) {
    res.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ error: "Échec suppression entité", details: err.message }));
  }
}

const server = http.createServer((req, res) => {
  if (!req.url) {
    res.writeHead(400);
    return res.end();
  }
  if (req.method === "GET" && req.url.startsWith("/data")) {
    return serveYaml(res);
  }
  if (req.method === "POST" && req.url.startsWith("/entities")) {
    return updateEntity(req, res);
  }
  if (req.method === "POST" && req.url.startsWith("/entity-new")) {
    return addEntity(req, res);
  }
  if (req.method === "POST" && req.url.startsWith("/entity-delete")) {
    return deleteEntity(req, res);
  }
  if (req.method === "POST" && req.url.startsWith("/relation-update")) {
    return updateRelation(req, res);
  }
  if (req.method === "POST" && req.url.startsWith("/relations")) {
    return addRelation(req, res);
  }
  if (req.url.startsWith("/favicon")) {
    res.writeHead(204);
    return res.end();
  }
  if (req.method === "GET" && req.url.startsWith("/md/list")) {
    listMdEntities()
      .then((list) => {
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ files: list }));
      })
      .catch((err) => {
        res.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ error: err.message }));
      });
    return;
  }
  if (req.method === "POST" && req.url.startsWith("/md/update")) {
    (async () => {
      try {
        let body = "";
        for await (const chunk of req) body += chunk.toString();
        const payload = JSON.parse(body || "{}");
        if (!payload.file || !payload.frontmatter) throw new Error("file et frontmatter requis");
        await updateMdEntity(payload);
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ ok: true }));
      } catch (err) {
        res.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ error: err.message }));
      }
    })();
    return;
  }
  if (req.method === "POST" && req.url.startsWith("/md/create")) {
    (async () => {
      try {
        let body = "";
        for await (const chunk of req) body += chunk.toString();
        const payload = JSON.parse(body || "{}");
        const file = await createMdEntity(payload);
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ ok: true, file }));
      } catch (err) {
        res.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ error: err.message }));
      }
    })();
    return;
  }
  if (req.url.startsWith("/md-inspector")) {
    return serveMdInspector(res);
  }
  return serveHtml(res);
});

server.listen(port, () => {
  console.log(`🔎 YAML inspector (new format) sur http://localhost:${port}`);
});
