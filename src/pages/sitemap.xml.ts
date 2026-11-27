// Sitemap for search engines. Lists every page automatically (people and research directions included).
import type { APIRoute } from 'astro';
import { loadAll } from '../lib/data';

export const GET: APIRoute = async ({ site }) => {
  const { people, directions } = await loadAll();
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const paths = [
    '/', '/research/', '/people/', '/publications/', '/teaching/', '/join/',
    ...directions.map((d) => `/research/${d.id}/`),
    ...people.map((p) => `/people/${p.id}/`),
  ];
  const urls = paths.map((p) => `  <url><loc>${new URL(base + p, site).href}</loc></url>`).join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml' } });
};
