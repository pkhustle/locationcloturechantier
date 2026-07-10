import type { CollectionEntry } from 'astro:content';

export type GateResult = {
  indexable: boolean;
  passed: number;
  checks: {
    permit: boolean;
    providers: boolean;
    context: boolean;
    pricing: boolean;
  };
};

/**
 * The per-page publish gate (PROGRAMMATIC-SPEC §6).
 *
 * A city page is only set `index,follow` and added to the sitemap when it
 * carries genuinely unique, useful data. Otherwise it renders with `noindex`
 * and is excluded from the sitemap — content should be folded into its region
 * hub. This is the single defense against thin-content / scaled-abuse risk.
 */
export function cityGate(city: CollectionEntry<'cities'>['data']): GateResult {
  const p = city.permit;
  const checks = {
    // Real municipal permit data (the moat): a source URL + a concrete rule.
    permit: Boolean(
      p && (p.bylaw_url || p.permit_url) && (p.min_height_m != null || p.public_domain_permit_required),
    ),
    // Something to actually offer the searcher.
    providers: city.providers.length >= 2,
    // Hand-written, city-specific prose.
    context: Boolean(city.local_context && city.unique_fact),
    // A local pricing signal.
    pricing: Boolean(city.pricing_note),
  };
  const passed = Object.values(checks).filter(Boolean).length;
  return { indexable: passed >= 4, passed, checks };
}
