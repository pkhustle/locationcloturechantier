# Cluster Plan — Location Clôture Chantier (SERP-overlap based)

Clustering method: grouped by **shared top-10 Google URLs** (how Google actually ranks),
not text similarity. Based on live Québec SERPs (July 2026).

---

## KEY FINDING: the head term is a synonym cluster (merge, don't split)

These queries share **7+ identical top-10 URLs** → Google treats them as ONE page.
Building separate pages = self-cannibalization.

| Query | Verdict |
|---|---|
| location clôture chantier | **PILLAR (primary)** |
| location clôture temporaire | merge → pillar secondary kw |
| location barrière de sécurité chantier | merge → pillar secondary kw |
| location clôture de construction / sécurité | merge → pillar secondary kw |

Shared URLs proving overlap: cloturetemporaire.com, locationcloture.ca, moduloc.ca,
cloturesecure.com, simplex.ca, loutec.com, battlefieldequipment.ca, echafaudsplus.com.

---

## PILLAR

**`/` — Location de clôture de chantier au Québec**
Targets: location clôture chantier / temporaire / barrière sécurité / clôture construction.
2,500–4,000 words. Schema: Organization + WebSite + Service + FAQPage.
Role: hub linking to all city, type, and guide spokes. This page carries the head-term fight.

---

## CLUSTER A — Fence Types (service spokes)

SERP note: "clôture temporaire" overlaps the pillar heavily → differentiate by **product-spec
intent** (dimensions, material, use). "mobile" & "panneau/grille" SERPs are EU-dominated (weak
QC demand) → build lean, or fold as sections. Priority = MEDIUM.

| URL | Target keyword | Intent | Priority | Notes |
|---|---|---|---|---|
| /types/cloture-temporaire | clôture temporaire location | transactional | HIGH | Differentiate vs pillar: specs/dimensions |
| /types/cloture-panneau-grillage | panneau / grille de clôture chantier | transactional | MED | Mesh 6ft/8ft panels, Heras-style |
| /types/cloture-opaque-brise-vent | clôture chantier avec toile / brise-vent / opaque | commercial | MED | Privacy, dust, urban sites |
| /types/cloture-mobile | clôture mobile de chantier | transactional | LOW | EU-heavy SERP; thin QC demand |
| /types/cloture-anti-bruit | clôture / panneau anti-bruit chantier | commercial | LOW | Niche, ties to noise bylaws |

---

## CLUSTER B — Cities (geo spokes) — TIERED ROLLOUT

Intent-bleed warning: some city SERPs pull in **permanent residential fence installers**
(e.g. cloturelaval.ca) — every city page must lock "**location … chantier/temporaire**" intent,
not residential fencing. Each page needs unique local data (bylaw + permit link + local providers).

**Tier 1 — launch (5):** Montréal · Québec · Laval · Gatineau · Longueuil
**Tier 2 — wk 5-12 (10):** Sherbrooke · Trois-Rivières · Lévis · Saguenay · Terrebonne ·
Brossard · Repentigny · Drummondville · Saint-Jean-sur-Richelieu · Granby
**Tier 3 — wk 13-24 (~20):** Saint-Jérôme · Blainville · Mirabel · Shawinigan · Rimouski ·
Victoriaville · Saint-Hyacinthe · Rouyn-Noranda · Sorel-Tracy · Vaudreuil-Dorion · Boucherville ·
Mascouche · Châteauguay · Salaberry-de-Valleyfield · Val-d'Or · Alma · Sept-Îles · Joliette ·
Saint-Georges · Thetford Mines

**Regional hubs (6)** — group long-tail + internal-link equity:
Montérégie · Laurentides · Lanaudière · Estrie · Capitale-Nationale · Outaouais

URL pattern: `/villes/{ville}` → `/villes/{ville}/cloture-temporaire` (combos: Tier-1 cities only).
Cap total city pages at ~35 + 6 regions. No page without unique local data.

---

## CLUSTER C — Guides (informational) ← THE MOAT

Distinct informational SERP (RBQ, CNESST, LégisQuébec, soumissionrenovation.ca blog). This is
where a lead-gen site out-ranks operators. Closest competitor model: **soumissionrenovation.ca**
("Clôture de chantier : règles, sécurité et coûts").

| URL | Target keyword | Template | Priority | Unique angle / authority hook |
|---|---|---|---|---|
| /guides/prix-location-cloture-chantier | prix / frais location clôture chantier | ultimate-guide | **HIGH** | Real data: $0.30–0.80/lin ft/mo, $15/day/8ft, delivery+install+fuel+removal |
| /outils/calculateur-prix | calculateur prix clôture chantier | landing/tool | **HIGH** | Interactive estimate — link magnet, AI-citable |
| /guides/permis-municipal-cloture-chantier | permis clôture chantier + {ville} | explainer/hub | **HIGH** | **Permit database** — per-city bylaw + permit links. Unbeatable moat |
| /guides/normes-cnesst-rbq-cloture-chantier | normes CNESST clôture chantier | ultimate-guide | **HIGH** | CNESST avis 10 jours, RBQ, Code sécurité S-2.1 r.4 |
| /guides/comment-securiser-chantier | comment sécuriser un chantier | how-to | MED | Incl. hors-heures + **vacances de la construction** (seasonal) |
| /guides/comment-choisir-cloture-chantier | comment choisir clôture chantier | explainer | MED | Type/height/duration decision guide → routes to /soumission |
| /guides/hauteur-cloture-chantier | hauteur clôture chantier (1,8 m) | explainer | LOW | Common PAA; feeds permit hub |

---

## CLUSTER D — Events (adjacent, LOW priority)

Different SERP entirely (venues, tents, stages). Only 1 page, clearly separated from chantier.

| URL | Target keyword | Priority |
|---|---|---|
| /types/cloture-evenement | location clôture événement / festival | LOW (Phase 3+) |

---

## CLUSTER E — Directory / conversion (monetization)

| URL | Purpose |
|---|---|
| /fournisseurs | Provider directory — genuine value + lead routing |
| /soumission | Quote-request form — PRIMARY conversion, linked from every page |

---

## Internal link matrix (rules)

- Every spoke → pillar (mandatory) and pillar → top spokes (mandatory).
- Every city page → relevant type pages + prix guide + permit hub + /soumission.
- Guides → relevant city + type pages (contextual).
- Permit hub `/guides/permis-municipal-cloture-chantier` ↔ each `/villes/{ville}` (bidirectional).
- Directory → cities; every page → /soumission.
- Min 3 incoming internal links per page; 0 orphans; keyword-rich anchors (no "cliquez ici").

---

## Build priority (what to create first)

1. Pillar `/` + `/soumission`
2. Guides: prix + calculateur + permis hub + CNESST/RBQ  ← ranks fastest, builds authority
3. Tier-1 cities (5) + `/types/cloture-temporaire`
4. Tier-2 cities + remaining type pages + comment-choisir/sécuriser
5. Tier-3 cities + regional hubs + events + directory depth

Rationale: informational guides face weaker (content-based) competition and rank on a new
domain in 2–4 months, generating the authority + internal links needed to push the pillar
head term to top 3 by months 6–12.
