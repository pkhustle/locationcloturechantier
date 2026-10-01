import { SITE } from './site';

/** JSON-LD builders. Each returns a plain object serialized into the <head>. */

export function organizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${SITE.url}/#organization`,
    name: SITE.name,
    url: SITE.url,
    logo: `${SITE.url}/favicon-48x48.png`,
    image: `${SITE.url}/images/og-image.jpg`,
    telephone: SITE.phone,
    email: SITE.email,
    description: 'Répertoire et ressource indépendante pour la location de clôture de chantier partout au Québec.',
    address: {
      '@type': 'PostalAddress',
      addressRegion: 'QC',
      addressCountry: 'CA',
    },
    areaServed: {
      '@type': 'AdministrativeArea',
      name: 'Québec',
      containedInPlace: { '@type': 'Country', name: 'Canada' },
    },
  };
}

export function websiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE.url}/#website`,
    name: SITE.name,
    url: SITE.url,
    inLanguage: 'fr-CA',
    description: SITE.tagline,
    publisher: {
      '@id': `${SITE.url}/#organization`,
    },
  };
}

export function serviceSchema(opts: {
  name: string;
  description: string;
  areaName: string;
  geo?: { lat: number; lng: number };
  priceRange?: string;
}) {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: 'Location de clôture de chantier',
    name: opts.name,
    description: opts.description,
    provider: {
      '@type': 'Organization',
      name: SITE.name,
      url: SITE.url,
      telephone: SITE.phone,
    },
    areaServed: {
      '@type': 'AdministrativeArea',
      name: opts.areaName,
      containedInPlace: { '@type': 'AdministrativeArea', name: 'Québec' },
    },
  };

  if (opts.geo) {
    schema.geo = {
      '@type': 'GeoCoordinates',
      latitude: opts.geo.lat,
      longitude: opts.geo.lng,
    };
  }

  if (opts.priceRange) {
    schema.offers = {
      '@type': 'Offer',
      priceCurrency: 'CAD',
      priceSpecification: {
        '@type': 'PriceSpecification',
        priceCurrency: 'CAD',
        description: opts.priceRange,
      },
    };
  }

  return schema;
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

export function articleSchema(opts: {
  title: string;
  description: string;
  url: string;
  dateModified: string;
  datePublished?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': opts.url,
    },
    headline: opts.title,
    description: opts.description,
    url: opts.url,
    inLanguage: 'fr-CA',
    author: {
      '@type': 'Organization',
      name: SITE.name,
      url: SITE.url,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE.name,
      url: SITE.url,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE.url}/favicon-48x48.png`,
      },
    },
    datePublished: opts.datePublished ?? opts.dateModified,
    dateModified: opts.dateModified,
    image: `${SITE.url}/images/og-image.jpg`,
  };
}

export function itemListSchema(opts: {
  name: string;
  description: string;
  items: { name: string; url: string; description?: string }[];
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: opts.name,
    description: opts.description,
    itemListElement: opts.items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      url: item.url,
      description: item.description,
    })),
  };
}

