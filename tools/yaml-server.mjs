import http from "node:http";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { load as loadYaml, dump as dumpYaml } from "js-yaml";

const root = resolve(new URL("..", import.meta.url).pathname);
const yamlPath = resolve(root, "data/genealogie.yaml");
const htmlPath = resolve(root, "tools", "yaml-inspector.html");
const port = process.env.PORT || 4322;

async function serveYaml(res) {
  try {
    const raw = await readFile(yamlPath, "utf8");
    const data = loadYaml(raw) ?? {};
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify(data));
  } catch (err) {
    res.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ error: "Impossible de lire/parse genealogie.yaml", details: err.message }));
  }
}

async function serveHtml(res) {
  try {
    const html = await readFile(htmlPath, "utf8");
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(html);
  } catch {
    res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Page non trouvée. Vérifie tools/yaml-inspector.html");
  }
}

async function saveEntity(req, res) {
  try {
    let body = "";
    for await (const chunk of req) {
      body += chunk.toString();
    }
    const payload = JSON.parse(body || "{}");
    const { originalId, entity } = payload;
    if (!entity || !entity.id) {
      res.writeHead(400, { "Content-Type": "application/json; charset=utf-8" });
      return res.end(JSON.stringify({ error: "Entity avec id requise" }));
    }

    const raw = await readFile(yamlPath, "utf8");
    const data = loadYaml(raw) ?? {};
    const entities = Array.isArray(data.entities) ? data.entities : [];
    const idx = entities.findIndex((e) => e?.id === originalId || e?.id === entity.id);
    if (idx === -1) {
      res.writeHead(404, { "Content-Type": "application/json; charset=utf-8" });
      return res.end(JSON.stringify({ error: "Entité introuvable" }));
    }

    const current = entities[idx] ?? {};
    entities[idx] = {
      ...current,
      ...entity,
    };
    const nextYaml = dumpYaml({ ...data, entities }, { lineWidth: 0, noRefs: true });
    await writeFile(yamlPath, nextYaml, "utf8");
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ ok: true }));
  } catch (err) {
    res.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ error: "Échec sauvegarde", details: err.message }));
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
    return saveEntity(req, res);
  }
  if (req.url.startsWith("/favicon")) {
    res.writeHead(204);
    return res.end();
  }
  return serveHtml(res);
});

server.listen(port, () => {
  console.log(`🔎 YAML inspector dispo sur http://localhost:${port}`);
});
