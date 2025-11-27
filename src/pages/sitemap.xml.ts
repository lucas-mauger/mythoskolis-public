import { getCollection } from 'astro:content';

const SITE = 'https://mythoskolis.netlify.app'; // à ajuster si domaine final différent

export async function GET() {
  const entites = await getCollection('entites');

  const staticPaths = ['/', '/entites/', '/ressources/', '/a-propos/'];
  const urls = new Set<string>();

  staticPaths.forEach((p) => urls.add(p));

  entites.forEach((entry) => {
    const id = entry.data.id ?? entry.slug;
    urls.add(`/entites/${id}/`);
    urls.add(`/genealogie/${id}/`);
  });

  const body =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    Array.from(urls)
      .map(
        (path) => `  <url>
    <loc>${SITE}${path}</loc>
  </url>`,
      )
      .join('\n') +
    '\n</urlset>';

  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  });
}
