import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { cityGate } from '../lib/publishGate';
import { SITE } from '../lib/site';

/**
 * Gate-aware sitemap. Only indexable pages are listed — noindexed city stubs,
 * empty region hubs, and the /soumission form are intentionally excluded.
 */
export const GET: APIRoute = async () => {
  const [cities, regions, types, guides] = await Promise.all([
    getCollection('cities'),
    getCollection('regions'),
    getCollection('types'),
    getCollection('guides'),
  ]);

  const indexableCities = cities.filter((c) => cityGate(c.data).indexable);

  const paths: string[] = ['/', '/fournisseurs'];
  for (const c of indexableCities) paths.push(`/villes/${c.id}`);
  for (const c of indexableCities.filter((c) => c.data.demand_tier === 1)) {
    paths.push(`/villes/${c.id}/cloture-temporaire`);
  }
  for (const t of types) paths.push(`/types/${t.id}`);
  for (const g of guides) paths.push(`/guides/${g.id}`);
  for (const r of regions) {
    if (indexableCities.some((c) => c.data.region === r.id)) paths.push(`/regions/${r.id}`);
  }

  const body =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    paths.map((p) => `  <url><loc>${SITE.url}${p}</loc></url>`).join('\n') +
    `\n</urlset>\n`;

  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
