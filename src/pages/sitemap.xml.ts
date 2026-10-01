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

  const today = new Date().toISOString().split('T')[0];
  type SitemapEntry = { loc: string; changefreq: string; priority: string };
  const entries: SitemapEntry[] = [
    { loc: '/', changefreq: 'weekly', priority: '1.0' },
    { loc: '/fournisseurs', changefreq: 'weekly', priority: '0.8' },
    { loc: '/politique-de-confidentialite', changefreq: 'yearly', priority: '0.3' },
    { loc: '/conditions-utilisation', changefreq: 'yearly', priority: '0.3' },
  ];

  for (const c of indexableCities) {
    entries.push({ loc: `/villes/${c.id}`, changefreq: 'weekly', priority: c.data.demand_tier === 1 ? '0.9' : '0.8' });
  }
  for (const c of indexableCities.filter((c) => c.data.demand_tier === 1)) {
    entries.push({ loc: `/villes/${c.id}/cloture-temporaire`, changefreq: 'weekly', priority: '0.8' });
  }
  for (const t of types) {
    entries.push({ loc: `/types/${t.id}`, changefreq: 'monthly', priority: '0.8' });
  }
  for (const g of guides) {
    entries.push({ loc: `/guides/${g.id}`, changefreq: 'monthly', priority: '0.8' });
  }
  for (const r of regions) {
    if (indexableCities.some((c) => c.data.region === r.id)) {
      entries.push({ loc: `/regions/${r.id}`, changefreq: 'monthly', priority: '0.7' });
    }
  }

  const body =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    entries
      .map(
        (e) =>
          `  <url>\n    <loc>${SITE.url}${e.loc}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${e.changefreq}</changefreq>\n    <priority>${e.priority}</priority>\n  </url>`,
      )
      .join('\n') +
    `\n</urlset>\n`;

  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
