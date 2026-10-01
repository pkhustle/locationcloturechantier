# Démarchage des fournisseurs — modèles de courriel (FR)

Objectif : transformer les 8 fournisseurs de notre répertoire en liens entrants.
La logique d'échange est naturelle : **nous leur envoyons des demandes de soumission
qualifiées → ils nous citent en retour.** C'est un lien pertinent, francophone et
dans le bon secteur — le meilleur type de lien pour un site neuf.

## Règles d'envoi (important pour ne pas paraître spam)

1. **Personnaliser chaque courriel** — jamais un envoi de masse identique. Utiliser la
   ligne d'angle propre à chaque fournisseur (tableau plus bas).
2. **Trouver un vrai contact** — page « Contact » ou « À propos » du site du fournisseur,
   pas `info@` en dernier recours seulement.
3. **Espacer les envois** — 2-3 par semaine, pas les 8 le même jour.
4. **Relancer une seule fois** après 7-10 jours, poliment, puis laisser tomber.
5. **Tenir le suivi** dans `BACKLINKS.md` (colonne statut).

---

## Modèle de courriel — premier contact

> **Objet :** {name} est répertorié sur LocationClôtureChantier.ca
>
> Bonjour,
>
> Je vous écris au nom de **LocationClôtureChantier.ca**, un répertoire indépendant qui
> met en relation les entrepreneurs et gestionnaires de chantier du Québec avec des
> fournisseurs de clôture de chantier.
>
> Nous avons ajouté **{name}** à notre répertoire pour les secteurs de **{villes}**.
> {angle} Votre fiche renvoie déjà vers votre site, et nous acheminons vers vous les
> demandes de soumission des visiteurs de ces régions :
> https://locationcloturechantier.ca/fournisseurs
>
> Deux choses :
>
> 1. **Exactitude** — pouvez-vous confirmer que vos secteurs desservis et vos services
>    sont bien représentés ? Je corrige avec plaisir.
> 2. **Lien** — si la ressource vous semble utile à vos clients, un lien depuis votre
>    site (page « Partenaires », « Liens utiles » ou un article de blogue) les aiderait
>    à nous trouver et renforcerait notre collaboration.
>
> Merci et au plaisir,
> [Votre nom]
> LocationClôtureChantier.ca

## Modèle de relance (J+7 à J+10)

> **Objet :** Re: {name} sur LocationClôtureChantier.ca
>
> Bonjour,
>
> Petit suivi de mon message de la semaine dernière — souhaitez-vous que je mette à jour
> votre fiche, ou ajouter un lien vers nous depuis votre site ? Sans réponse d'ici la fin
> du mois, je laisse tout tel quel. Merci !
>
> [Votre nom]

---

## Angles personnalisés par fournisseur

| Fournisseur | Contact ciblé & Courriel vérifié | Villes à citer | Ligne d'angle `{angle}` à insérer |
|---|---|---|---|
| **Location d'équipement Battlefield** | Jean Savard (Dir. QC) : `jean.savard@battlefieldequipment.ca` | Montréal, Québec, Laval, Gatineau, Longueuil | « Votre réseau de succursales au Québec et votre inventaire de clôtures 6 et 8 pi couvrent bien la demande de ces régions. » |
| **Clôture Sécure** | Vincent Lizotte (Président) : `vlizotte@groupechoquette.com` | Montréal, Laval, Longueuil | « Votre service 24/7 dans la région de Montréal ressort auprès des chantiers qui nous contactent en urgence. » |
| **Clôture Temporaire** | Direction (Laval) : `info@cloturetemporaire.com` (438-865-3530) | Montréal, Laval | « Vos clôtures opaques et brise-vent répondent à une demande fréquente en milieu urbain dense. » |
| **Groupe Choquette** | Vincent Lizotte (Président) : `vlizotte@groupechoquette.com` | Montréal, Laval, Longueuil | « Votre disponibilité 24/7 à Montréal est un atout que nos visiteurs recherchent. » |
| **LOU-TEC** | Hugues Charbonneau (Dir. Ventes) : `hugues.charbonneau@loutec.com` | Montréal, Québec, Laval, Gatineau, Longueuil | « Votre réseau de centres de location actif depuis 1979 couvre l'ensemble des grands marchés que nous desservons. » |
| **Modu-Loc** | Rob Palbom (Regional Director) : `rpalbom@moduloc.ca` | Montréal, Québec, Laval, Gatineau, Longueuil | « Vos solutions pour chantiers et événements élargissent l'offre présentée à nos visiteurs. » |
| **Simplex** | Daniel Laliberté (Dir. Dév. Affaires) : `dlaliberte@simplex.ca` | Montréal, Québec, Laval | « Vos clôtures robustes de chantier intéressent les entrepreneurs de la région de Montréal et de Québec. » |
| **Super Save — Location de Clôture** | Steve Cummings (Ops Manager) : `scummings@supersave.ca` | Montréal, Laval, Longueuil | « Votre service d'urgence 24/7 avec installation et retrait répond aux besoins fréquents de nos visiteurs. » |

> **Note :** aucun de ces fournisseurs n'est encore marqué `is_partner: true` dans
> `src/data/providers/`. Dès qu'un fournisseur accepte un échange formel (lien + priorité
> sur les soumissions), passez son `is_partner` à `true` et remontez-le dans le répertoire.
