import { SITE } from './site';

/** JSON-LD builders. Each returns a plain object serialized into the <head>. */

export function organizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE.name,
    url: SITE.url,
    telephone: SITE.phone,
    email: SITE.email,
    areaServed: { '@type': 'AdministrativeArea', name: 'Québec, Canada' },
  };
}

export function websiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE.name,
    url: SITE.url,
    inLanguage: 'fr-CA',
  };
}

export function serviceSchema(opts: { name: string; description: string; areaName: string }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: 'Location de clôture de chantier',
    name: opts.name,
    description: opts.description,
    provider: { '@type': 'Organization', name: SITE.name, url: SITE.url },
    areaServed: { '@type': 'Place', name: opts.areaName },
  };
}

export function faqSchema(items: { q: string; a: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((i) => ({
      '@type': 'Question',
      name: i.q,
      acceptedAnswer: { '@type': 'Answer', text: i.a },
    })),
  };
}

export function breadcrumbSchema(crumbs: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: `${SITE.url}${c.path}`,
    })),
  };
}
