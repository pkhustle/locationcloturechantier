# CRM — soumissions en base de données + zone admin

Le site est une **app Astro sur l'adaptateur Node**, déployée sur l'hébergement
Node.js de Hostinger. Les pages marketing sont prérendues (statiques); seuls les
`/api/*` et la zone `/admin` sont rendus à la demande (`export const prerender = false`).

```
Formulaire ─► /api/soumission ─► SQLite (data/leads.db)  ◄── /admin (zone protégée)
                              └─► (optionnel) Google Sheet ─► alerte courriel
```

| Fichier | Rôle |
|---|---|
| `src/lib/db.ts` | Base SQLite : schéma, insertion, recherche, statuts |
| `src/lib/auth.ts` | Mot de passe admin, cookie de session signé, anti-force brute |
| `src/pages/api/soumission.ts` | Réception du formulaire → BD (+ miroir Sheet) |
| `src/pages/admin/` | Connexion, tableau des soumissions, export CSV |
| `src/pages/api/admin/` | Connexion, déconnexion, actions sur une ligne |
| `crm/leads-sheet.gs` | Miroir Google Sheet **optionnel** (alerte courriel) |

## 1. Base de données (SQLite)

Aucune installation : un fichier créé automatiquement à la première soumission.

- Emplacement : `DATABASE_PATH`, par défaut `./data/leads.db` (à la racine de l'app).
- Mode WAL activé → il y a aussi `leads.db-wal` / `leads.db-shm` à côté.
- **Sauvegarde** = copier les trois fichiers (ou juste `leads.db` app arrêtée).
  Rien n'est committé : `data/` et `*.db` sont dans `.gitignore`.
- Table `leads` : date, source, ville, type, longueur, durée, courriel,
  téléphone, détails, IP, user-agent, **statut** et **notes internes**.
- Statuts du pipeline : `nouveau`, `contacté`, `qualifié`,
  `envoyé au fournisseur`, `gagné`, `perdu`, `spam`.

## 2. Zone admin

- URL : **`/admin`** (redirige vers `/admin/login`). En `noindex` et bloquée
  dans `robots.txt`.
- Un seul mot de passe partagé : `ADMIN_PASSWORD`. **Sans cette variable, la
  zone est inaccessible** — aucun mot de passe par défaut.
- Session : cookie `lcc_admin` `HttpOnly` + `SameSite=Lax` (+ `Secure` en HTTPS),
  signé en HMAC-SHA256, valide 12 h.
- Anti-force brute : 8 tentatives par IP par tranche de 15 min.
- Fonctions : filtres (statut, source, recherche plein texte), tuiles de
  comptage, changement de statut, notes internes, suppression, pagination
  (50 par page) et **export CSV** du filtre courant.

Changer le mot de passe déconnecte toutes les sessions, sauf si
`ADMIN_SESSION_SECRET` est défini.

## 3. Google Sheet (désactivé / optionnel)

Le site fonctionne de manière 100 % autonome sans Google Sheet. Toutes les soumissions
sont stockées directement dans la base SQLite locale et gérées via `/admin` (avec export CSV).
Laissez `APPS_SCRIPT_URL` vide pour ne pas l'utiliser.

## 4. Variables d'environnement

Deux sources possibles, modèle dans `.env.example` (ne jamais committer les valeurs) :

1. **hPanel ▸ Node.js app ▸ Environment** — puis **redémarrer l'application**.
2. **Fichier `.env`** à la racine de l'application : lu au démarrage du serveur
   par `src/lib/env.ts`. Le serveur Node ne lit pas `.env` tout seul (Vite ne
   l'expose qu'au build), d'où ce chargeur explicite. Chemin personnalisable
   avec `ENV_FILE=/chemin/vers/.env`.

Les variables du panneau ont priorité sur le fichier `.env`. Dans les deux cas,
**rien n'est rechargé à chaud** : il faut redémarrer l'app après un changement.

Si `/admin/login` affiche « Aucun mot de passe administrateur n'est configuré »,
les logs de l'app indiquent le dossier exact où `.env` a été cherché.

| Variable | Requis | Valeur |
|---|---|---|
| `ADMIN_PASSWORD` | **oui** | mot de passe de `/admin` (`openssl rand -base64 24`) |
| `ADMIN_SESSION_SECRET` | recommandé | clé de signature du cookie (`openssl rand -hex 32`) |
| `DATABASE_PATH` | non | défaut `./data/leads.db` |
| `APPS_SCRIPT_URL` | non | URL `/exec` du Sheet — vide = miroir désactivé |
| `APPS_SCRIPT_TOKEN` | non | doit correspondre au `TOKEN` du script |

## 5. Déploiement Hostinger (Node.js)

1. `npm install && npm run build` (produit `dist/client` + `dist/server/entry.mjs`).
2. Téléverser le projet (avec `dist/` et `node_modules/`, ou lancer
   `npm install --omit=dev` sur le serveur — `better-sqlite3` est un module
   natif : il doit être installé **sur la plateforme cible**, pas copié depuis macOS).
3. Config de l'app Node dans hPanel :
   - **Fichier de démarrage :** `dist/server/entry.mjs`
   - **Racine de l'application :** le dossier du projet
   - Variables d'environnement de l'étape 4. Passenger fournit `PORT`/`HOST`;
     le serveur standalone les lit automatiquement (`npm start` en local).
4. Le dossier `data/` doit être accessible en écriture par le processus Node.

## Tests

- Formulaire : envoyer `/soumission` → redirection vers `/merci`, la ligne
  apparaît dans `/admin`.
- Admin : `ADMIN_PASSWORD=test npm run dev`, puis ouvrir `/admin`.
- Mauvais mot de passe 9 fois → message « Trop de tentatives ».
- Export : `/admin/export.csv` (respecte les filtres de l'URL).

## Notes

- Anti-spam : champ honeypot `_gotcha` — les bots qui le remplissent sont
  ignorés silencieusement (aucune ligne créée).
- Le contrôle d'origine CSRF d'Astro est actif (`security.checkOrigin`), ce qui
  bloque les POST inter-sites vers les actions admin.
- Les leads contiennent des renseignements personnels (courriel, téléphone, IP) :
  garder le mot de passe admin hors du dépôt et supprimer les demandes devenues
  inutiles depuis la zone admin.
