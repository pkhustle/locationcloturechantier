import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * Data-driven content collections.
 * The Zod schemas are quality gates: `astro build` FAILS if any record is
 * malformed, so incomplete data can never silently ship a thin page.
 */

const cities = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/data/cities' }),
  schema: z.object({
    slug: z.string(),
    name: z.string(),
    region: z.string(),
    mrc: z.string().optional(),
    population: z.number().optional(),
    demand_tier: z.number().int().min(1).max(3),
    geo: z.object({ lat: z.number(), lng: z.number() }).optional(),
    permit: z
      .object({
        public_domain_permit_required: z.boolean().optional(),
        min_height_m: z.number().optional(),
        bylaw_name: z.string().optional(),
        bylaw_url: z.string().url().optional(),
        permit_url: z.string().url().optional(),
        cost_note: z.string().optional(),
        lead_time_note: z.string().optional(),
        notes: z.string().optional(),
      })
      .optional(),
    boroughs: z.array(z.string()).optional(),
    local_context: z.string().optional(),
    nearby_cities: z.array(z.string()).default([]),
    providers: z.array(z.string()).default([]),
    pricing_note: z.string().optional(),
    unique_fact: z.string().optional(),
    // Photo de clôture spécifique à la ville. Vide → placeholder; renseigné → l'image s'affiche.
    image: z.string().optional(),
    image_alt: z.string().optional(),
  }),
});

const providers = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/data/providers' }),
  schema: z.object({
    id: z.string(),
    name: z.string(),
    url: z.string().url(),
    phone: z.string().optional(),
    cities_served: z.array(z.string()).default([]),
    regions_served: z.array(z.string()).default([]),
    fence_types: z.array(z.string()).default([]),
    services: z
      .object({
        delivery: z.boolean().optional(),
        install: z.boolean().optional(),
        h24_7: z.boolean().optional(),
      })
      .optional(),
    is_partner: z.boolean().default(false),
    notes: z.string().optional(),
  }),
});

const types = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/data/types' }),
  schema: z.object({
    slug: z.string(),
    name: z.string(),
    dimensions: z.array(z.string()).default([]),
    material: z.string().optional(),
    use_cases: z.array(z.string()).default([]),
    price_range: z.string().optional(),
    differentiator: z.string().optional(),
    intro: z.string().optional(),
    priority: z.enum(['high', 'med', 'low']).default('med'),
  }),
});

const regions = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/data/regions' }),
  schema: z.object({
    slug: z.string(),
    name: z.string(),
    description: z.string().optional(),
  }),
});

const guides = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/data/guides' }),
  schema: z.object({
    title: z.string(),
    h1: z.string().optional(),
    description: z.string(),
    priority: z.enum(['high', 'med', 'low']).default('high'),
    updated: z.string(),
  }),
});

export const collections = { cities, providers, types, regions, guides };
