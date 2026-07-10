# Programmatic Build Spec — Location Clôture Chantier

Turns `cluster-plan.md` into a buildable, thin-content-proof page-generation system.
Scale is small (~57 pages) → **index bloat is NOT the risk; thin city pages are.**
The entire spec is engineered around one thing: **every city page must carry unique data
no competitor has** (the municipal permit dataset), or it doesn't get indexed.

---

## 1. Tech stack & generation approach

| Layer | Choice | Why |
|---|---|---|
| Framework | **Astro** (content collections, static output) | Best Core Web Vitals; file-based data → pages; zero JS by default. New domain can't coast on authority — speed matters. |
| Data | JSON/YAML in `src/content/` (`cities`, `providers`, `types`, `guides`) | Version-controlled, typed via Zod schema, easy to hand-enrich |
| Templates | `.astro` page templates per route pattern | Static + dynamic block model (§4) |
| Rendering | 100% static (SSG) → CDN | Fast, cheap, crawlable |
| Lead form `/soumission` | Serverless fn (Cloudflare/Netlify) → email + partner routing | Capture + route leads to `is_partner` providers |
| Hosting | Cloudflare Pages / Netlify | Free tier, edge CDN, native forms |
| Schema | Zod validation on every record at build → **build fails if a record is incomplete** | Quality gate enforced in code, not by discipline |

---

## 2. Final URL patterns

```
/                                            Pillar (synonym cluster)
/villes/[ville]                              City page          e.g. /villes/montreal
/villes/[ville]/cloture-temporaire           City×type (Tier-1 cities ONLY)
/regions/[region]                            Regional hub
/types/[type]                                Fence-type service page
/guides/[slug]                               Guide
/guides/permis-municipal-cloture-chantier    Permit hub (parent of per-city permit data)
/outils/calculateur-prix                     Calculator
/fournisseurs                                Provider directory
/fournisseurs/[provider]                     (optional) provider profile — only if unique data
/soumission                                  Quote form
```

Rules: lowercase hyphenated slugs, no accents in slugs (`quebec` not `québec`), no query params
for content URLs, no trailing slash (pick one, enforce), self-referencing canonical on every page.

---

## 3. Data source schema (the uniqueness engine)

### 3a. `cities/[ville].json` — THE moat dataset

Every field marked ★ is what makes the page non-thin. **A city with no real permit data
does not get a published, indexed page** — it folds into its regional hub.

```jsonc
{
  "slug": "montreal",
  "name": "Montréal",
  "region": "montreal",            // → /regions/[region]
  "mrc": "Agglomération de Montréal",
  "population": 1780000,
  "demand_tier": 1,                // 1|2|3 — controls rollout + combo pages
  "geo": { "lat": 45.5017, "lng": -73.5673 },

  // ★ PERMIT DATA — unique per city, un-spinnable, genuinely useful
  "permit": {
    "public_domain_permit_required": true,
    "min_height_m": 1.8,
    "bylaw_name": "Règlement sur l'occupation du domaine public",
    "bylaw_url": "https://montreal.ca/...",
    "permit_url": "https://montreal.ca/demarches/...",
    "cost_note": "Tarif d'occupation du domaine public variable selon l'arrondissement",
    "lead_time_note": "Délai de traitement ~10 jours ouvrables",
    "notes": "Chaque arrondissement peut ajouter des exigences (bruit, poussière, trottoir)."
  },

  // ★ LOCAL CONTEXT — hand-written, min 1 unique sentence
  "boroughs": ["Ville-Marie", "Rosemont", "Le Plateau", "..."],
  "local_context": "Forte densité de chantiers en milieu urbain — clôtures opaques/brise-vent souvent exigées près des trottoirs.",
  "nearby_cities": ["laval", "longueuil", "brossard"],

  // ★ PROVIDERS serving this city (join → providers dataset)
  "providers": ["cloture-secure", "groupe-choquette", "battlefield-mtl"],

  // ★ LOCAL PRICING signal
  "pricing_note": "0,30–0,80 $/pi lin/mois; zone de livraison sans surcharge dans un rayon de 40 km.",

  "unique_fact": "La Ville exige un plan de gestion de chantier lors de la demande de permis d'occupation."
}
```

### 3b. `providers/[id].json` — directory + lead routing

```jsonc
{
  "id": "cloture-secure",
  "name": "Clôture Sécure",
  "url": "https://www.cloturesecure.com/",
  "phone": "+1-xxx-xxx-xxxx",
  "cities_served": ["montreal", "laval", "longueuil"],
  "regions_served": ["montreal", "monteregie"],
  "fence_types": ["cloture-temporaire", "cloture-panneau-grillage"],
  "services": { "delivery": true, "install": true, "24_7": true },
  "is_partner": false,             // true = route /soumission leads here
  "notes": "8 pi × 6 pi, livraison + installation Laval/Montréal."
}
```

### 3c. `types/[type].json` — service pages

```jsonc
{
  "slug": "cloture-temporaire",
  "name": "Clôture temporaire",
  "dimensions": ["8 pi × 6 pi", "7,5 pi × 6 pi"],
  "material": "Acier galvanisé, maille soudée",
  "use_cases": ["chantier de construction", "sécurisation de périmètre"],
  "price_range": "0,30–0,80 $/pi lin/mois",
  "differentiator": "Spécifications, dimensions et bases (blocs béton) — intent produit, pas générique.",
  "images": ["/img/types/cloture-temporaire.webp"]
}
```

---

## 4. Page templates — static vs dynamic blocks

Rule: **shared boilerplate ≤ 40% of body words**; unique/dynamic content ≥ 60% on city pages,
100% on type/guide pages. Boilerplate text counts against uniqueness (nav/header/footer excluded).

### City template (`/villes/[ville]`) block map
| Block | Type | Source | Unique? |
|---|---|---|---|
| H1 "Location de clôture de chantier à {name}" | dynamic | `name` | pattern |
| Intro (2–3 sent.) | dynamic | `local_context` + `unique_fact` | ★ yes |
| **Permis à {name}** section | dynamic | `permit.*` + links | ★★ yes (the moat) |
| Prix local | dynamic | `pricing_note` | ★ yes |
| Fournisseurs à {name} | dynamic | join `providers[]` | ★ yes |
| Types disponibles | dynamic-link | `types` filtered | links |
| CNESST/RBQ reminder | static (shared) | boilerplate | no (≤40%) |
| FAQ (3–5 Q) | semi-dynamic | 2 city-specific + shared | partial |
| CTA → /soumission | static | — | no |

**Standalone value test each city page must pass:** *"Would this page be worth publishing if it
were the only city page on the site?"* — Yes, because it answers "do I need a permit in {city},
how high, who rents here, what does it cost" — a real question with a city-specific answer.

### City×type combo (`/villes/[ville]/cloture-temporaire`) — Tier-1 cities ONLY
Only build when BOTH the city (Tier 1) AND the type have enough combined unique data. Otherwise
**don't generate** — link the city page to the type page instead. Prevents matrix index bloat.

### Type / Guide templates
100% unique content; no per-record cloning. Guides are hand-written long-form (see cluster C).

---

## 5. Internal-linking automation (generated at build)

| Link | Rule | Anchor |
|---|---|---|
| Every page → pillar `/` | mandatory | varied ("location de clôture de chantier au Québec") |
| Pillar → Tier-1 cities + top guides | mandatory | city / guide name |
| City → its `providers[]` + `nearby_cities[]` | auto (join) | provider / city name |
| City ↔ `/guides/permis-municipal...` | **bidirectional** | "permis à {city}" / "{city}" |
| City → relevant `/types/*` | auto (filter) | type name |
| Type → cities where offered | auto | city name |
| Region hub → member cities | auto | city name |
| Every page → `/soumission` | mandatory CTA | "Demander une soumission" |

Guardrails: ≥3 incoming internal links/page, 0 orphans, 3–5 body links per 1000 words,
**varied anchor text** (rotate synonyms — avoid exact-match repetition that trips spam detection).

---

## 6. Thin-content safeguard: the per-page PUBLISH GATE

Enforced in the build script. A page is set `index,follow` **only if it passes**; otherwise
`noindex` + excluded from sitemap (or folded into region hub).

**City page publishes (index) only if ≥ 4 of these are true:**
1. ★ Real `permit` data present (bylaw_url OR permit_url + min_height OR public_domain flag)
2. ≥ 2 providers in `providers[]`
3. `local_context` + `unique_fact` are non-empty and city-specific
4. `pricing_note` present
5. Body ≥ 500 words AND ≥ 60% unique vs every other city page

**Fails gate → `noindex`, drop from sitemap, fold content into `/regions/[region]`.**

| Metric | Threshold | Action |
|---|---|---|
| Unique content/page | < 60% (city) / <100% (type,guide) | ❌ block publish |
| Word count (city) | < 500 | ⚠️ review/fold |
| Providers on city page | 0 | ❌ noindex (nothing to offer) |
| Permit data | missing | ❌ noindex (loses the moat) |
| Sample human review | < 10% of generated pages | ⚠️ review before batch publish |

At ~57 pages we're far below the 100/500 hard-stop thresholds, so **no scaled-abuse risk** —
provided the gate holds. The gate is the whole defense.

---

## 7. Canonical, sitemap, rollout

- Self-referencing canonical on every indexed page. Combo pages canonical to themselves (they're
  unique) — never to the city page.
- `sitemap.xml` auto-generated, **excludes noindexed pages**, `<lastmod>` = data file mtime.
  Register in `robots.txt`. (One file — nowhere near the 50k split limit.)
- **Progressive rollout (matches Google's batch guidance):**
  - Batch 1: pillar + 4 HIGH guides + calculator + /soumission → index, wait 2–3 wk.
  - Batch 2: Tier-1 cities (5) + cloture-temporaire → monitor indexing/rankings 2–4 wk.
  - Batch 3: Tier-2 cities + remaining types + MED guides.
  - Batch 4: Tier-3 cities + region hubs + events + directory depth.
  - Never publish all cities at once; watch GSC indexation vs intended each batch.

---

## 8. Programmatic SEO Score: 88/100 (as designed)

| Category | Status | Score | Note |
|---|---|---|---|
| Data Quality | ✅ | 90 | Permit dataset = strong per-record uniqueness; needs real enrichment per city |
| Template Uniqueness | ✅ | 90 | ≥60% dynamic on city pages; guides/types 100% |
| URL Structure | ✅ | 95 | Clean hierarchy, no params, accent-free slugs |
| Internal Linking | ✅ | 88 | Automated hub-spoke + bidirectional permit links |
| Thin Content Risk | ✅ | 85 | Publish gate is the defense — only as good as data enrichment |
| Index Management | ✅ | 90 | Gate + noindex + sitemap exclusion; tiny scale = low bloat risk |

**The one thing that can sink this:** shipping city pages with empty `permit`/`providers` data.
The build gate prevents it — but it means the **real work is data enrichment** (filling each
city's bylaw + providers), not templating. That's also exactly why it's defensible: competitors
won't do that manual per-city research.

---

## 9. Immediate build backlog

1. Scaffold Astro + Zod content collections (`cities`, `providers`, `types`, `guides`).
2. Seed `providers/*.json` from SERP research (Clôture Sécure, Choquette, Battlefield, Lou-Tec,
   Super Save, cloturetemporaire.com, Modu-Loc, Simplex, Échafauds Plus, Falardeau…).
3. Enrich Tier-1 city permit data (Montréal, Québec, Laval, Gatineau, Longueuil) — real bylaw URLs.
4. Build city + type + guide templates with the block map (§4) + publish gate (§6).
5. Pillar + prix guide + permit hub + calculator as first indexable batch.
