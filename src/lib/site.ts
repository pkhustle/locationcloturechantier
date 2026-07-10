export const SITE = {
  url: 'https://locationcloturechantier.ca',
  name: 'Location Clôture Chantier',
  tagline: 'Location de clôture de chantier au Québec',
  // Lead-gen contact — swap for the real line before launch.
  phone: '1-800-000-0000',
  email: 'info@locationcloturechantier.ca',
  locale: 'fr-CA',
} as const;

/** Reference pricing surfaced from live Québec SERPs (July 2026). */
export const PRICING = {
  perLinearFoot: '0,30 $ à 0,80 $ / pi linéaire / mois',
  dailyPanel: 'environ 15 $ / jour pour un panneau de 8 pi',
  extras: ['livraison', 'installation', 'surcharge carburant', 'retrait'],
} as const;
