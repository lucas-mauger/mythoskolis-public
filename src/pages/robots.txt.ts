export function GET() {
  const SITE =
    (import.meta.env.SITE as string | undefined) ||
    (import.meta.env.SITE_URL as string | undefined) ||
    'https://mythoskolis.com';
  const lines = [
    'User-agent: *',
    'Allow: /',
    `Sitemap: ${SITE}/sitemap.xml`,
    '',
  ].join('\n');

  return new Response(lines, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
}
