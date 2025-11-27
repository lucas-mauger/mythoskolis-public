export function GET() {
  const lines = [
    'User-agent: *',
    'Allow: /',
    'Sitemap: https://mythoskolis.netlify.app/sitemap.xml', // à ajuster si domaine final différent
    '',
  ].join('\n');

  return new Response(lines, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
}
