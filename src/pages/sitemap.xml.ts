import { getCollection } from 'astro:content';
import fs from 'node:fs/promises';
import path from 'node:path';

const SITE =
  (import.meta.env.SITE as string | undefined) ||
  (import.meta.env.SITE_URL as string | undefined) ||
  'https://mythoskolis.com'; // domaine canonique par défaut

const contentRoot = path.resolve(process.cwd(), 'src', 'content');

async function getLastmod(filePath: string): Promise<string | undefined> {
  try {
    const stats = await fs.stat(filePath);
    return stats.mtime.toISOString();
  } catch {
    return undefined;
  }
}

async function getMetaDocs(): Promise<UrlEntry[]> {
  const metaDir = path.resolve(process.cwd(), 'src', 'pages', 'meta');
  try {
    const files = await fs.readdir(metaDir);
    const allowedExt = new Set(['.md', '.mdx', '.astro']);
    const entries: UrlEntry[] = [];

    for (const file of files) {
      const ext = path.extname(file).toLowerCase();
      if (!allowedExt.has(ext)) continue;

      const basename = path.basename(file, ext);
      const filePath = path.join(metaDir, file);
      const lastmod = await getLastmod(filePath);

      if (basename === 'index') {
        entries.push({ path: '/meta/', lastmod });
      } else {
        entries.push({ path: `/meta/${basename}/`, lastmod });
      }
    }

    return entries;
  } catch {
    return [];
  }
}

type UrlEntry = { path: string; lastmod?: string };

export async function GET() {
  const entites = await getCollection('entites');
  const recits = await getCollection('recits');
  const ressources = await getCollection('ressources');
  const metaDocs = await getMetaDocs();

  const staticPaths: UrlEntry[] = [
    { path: '/' },
    { path: '/entites/' },
    { path: '/entites/natures/' },
    { path: '/recits/' },
    { path: '/recits/tags/' },
    { path: '/ressources/' },
    { path: '/a-propos/' },
    { path: '/holograph/' },
    { path: '/contact/' },
    { path: '/contact/merci/' },
  ];

  const urls = new Map<string, UrlEntry>();
  staticPaths.forEach((u) => urls.set(u.path, u));

  for (const entry of entites) {
    const id = entry.data.id ?? entry.slug;
    const filePath = path.join(contentRoot, 'entites', `${entry.slug}.md`);
    const lastmod = await getLastmod(filePath);
    urls.set(`/entites/${id}/`, { path: `/entites/${id}/`, lastmod });
    urls.set(`/genealogie/${id}/`, { path: `/genealogie/${id}/`, lastmod });
  }

  for (const recit of recits) {
    const slug = recit.data.slug ?? recit.data.id ?? recit.slug;
    const filePath = path.join(contentRoot, 'recits', `${recit.slug}.md`);
    const lastmod = await getLastmod(filePath);
    urls.set(`/recits/${slug}/`, { path: `/recits/${slug}/`, lastmod });
  }

  for (const ressource of ressources) {
    const slug = ressource.data.slug ?? ressource.data.id ?? ressource.slug;
    const filePath = path.join(contentRoot, 'ressources', `${ressource.slug}.md`);
    const lastmod = await getLastmod(filePath);
    urls.set(`/ressources/${slug}/`, { path: `/ressources/${slug}/`, lastmod });
  }

  for (const doc of metaDocs) {
    urls.set(doc.path, doc);
  }

  const body =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    Array.from(urls.values())
      .map((entry) => {
        const lastmod = entry.lastmod ? `\n    <lastmod>${entry.lastmod}</lastmod>` : '';
        return `  <url>\n    <loc>${SITE}${entry.path}</loc>${lastmod}\n  </url>`;
      })
      .join('\n') +
    '\n</urlset>';

  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  });
}
