/**
 * Photo manifest. Files live in /public/images (served at /images/*).
 * Each entry carries French, keyword-rich alt text for image SEO.
 * Central map so a photo swap happens in one place, not scattered across templates.
 */

export interface Photo {
  src: string;
  alt: string;
  caption: string;
}

const P = (file: string, alt: string, caption: string): Photo => ({
  src: `/images/${file}`,
  alt,
  caption,
});

export const PHOTOS = {
  clotureTemporaire: P(
    'Cloture-temporaire-1.webp',
    'Clôture de chantier temporaire à panneaux grillagés sécurisant un chantier de construction',
    'Clôture temporaire — chantier',
  ),
  clotureTemporaire2: P(
    'Cloture-temporaire-2.webp',
    'Chantier de construction entièrement clôturé avec des panneaux de clôture temporaire',
    'Chantier clôturé',
  ),
  clotureRenfort: P(
    'Cloture-temporaire-avec-renfort.webp',
    'Clôture de chantier temporaire renforcée par des contreventements contre le vent',
    'Clôture temporaire renforcée',
  ),
  barriereStandard: P(
    'Barriere-standard.webp',
    'Panneaux de clôture grillagée standard installés en périmètre de chantier',
    'Panneaux grillagés standard',
  ),
  barriereBloc: P(
    'barriere-sur-bloc-de-beton-1.webp',
    'Clôture de chantier mobile montée sur des blocs de béton',
    'Clôture mobile sur blocs de béton',
  ),
  clotureGlissiere: P(
    'Cloture-sur-glissiere-en-beton.webp',
    'Clôture de chantier fixée sur une glissière de béton (barrière Jersey)',
    'Clôture sur glissière de béton',
  ),
  cameraMobile: P(
    'Camera-mobile-1.webp',
    'Caméra de surveillance mobile protégeant un chantier de construction 24/7',
    'Surveillance mobile 24/7',
  ),
} as const;

/** Photo shown at the top of each /types/[type] page, keyed by type slug. */
export const TYPE_PHOTO: Record<string, Photo> = {
  'cloture-temporaire': PHOTOS.clotureTemporaire,
  'cloture-panneau-grillage': PHOTOS.barriereStandard,
  'cloture-opaque-brise-vent': PHOTOS.clotureRenfort,
  'cloture-mobile': PHOTOS.barriereBloc,
  'cloture-anti-bruit': PHOTOS.clotureGlissiere,
};

/** Homepage "Réalisations" gallery, in display order. */
export const GALLERY: Photo[] = [
  PHOTOS.clotureTemporaire,
  PHOTOS.barriereBloc,
  PHOTOS.barriereStandard,
  PHOTOS.clotureGlissiere,
  PHOTOS.clotureRenfort,
  PHOTOS.cameraMobile,
];
