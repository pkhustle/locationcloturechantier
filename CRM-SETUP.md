# CRM — soumissions en base de données + zone admin

Le site combine des **pages marketing statiques ultra-performantes générées par Astro** avec un **backend natif PHP 8.3 / SQLite** pour le traitement des formulaires et la zone d'administration.

```
Visiteur ─► Formulaire ─► /api/soumission.php ─► SQLite (data/leads.db)
                                               ├─► Alerte courriel instantanée (komp76@gmail.com)
                                               └─► Redirection /merci

Gestionnaire ─► /admin ─► /admin/index.php ◄── Authentification session + SQLite
```

| Fichier | Rôle |
|---|---|
| `public/api/db.php` | Connexion SQLite 3 partagée, initialisation automatique du schéma |
| `public/api/soumission.php` | Endpoint de traitement du formulaire, anti-spam, alerte courriel |
| `public/admin/index.php` | Tableau de bord admin, authentification session, export CSV |
| `public/.htaccess` | Réécritures d'URL propres (`/api/soumission`, `/admin`), sécurité et cache |
| `public/styles/admin.css` | Feuilles de style dédiées pour la zone d'administration |

## 1. Base de données (SQLite)

Aucune configuration compliquée : le fichier de base de données est créé automatiquement à la première soumission.

- Emplacement : `DATABASE_PATH` ou par défaut `data/leads.db` (en dehors du web root pour la sécurité).
- Mode WAL activé pour supporter les lectures et écritures concurrentes.
- **Sauvegarde** : copier le fichier `leads.db`.
- Table `leads` : date, source, ville, type, longueur, durée, courriel, téléphone, détails, IP, user-agent, **statut** et **notes internes**.
- Statuts du pipeline : `nouveau`, `contacté`, `qualifié`, `envoyé au fournisseur`, `gagné`, `perdu`, `spam`.

## 2. Alertes courriels

À chaque nouvelle soumission de devis, une alerte détaillée est transmise automatiquement à **`komp76@gmail.com`** (ou l'adresse définie par `ALERT_EMAIL`) avec l'ensemble des coordonnées du client, le lieu des travaux et les spécifications de clôture demandées.

## 3. Zone administrateur

- URL : **`/admin`** (en `noindex` et bloquée dans `robots.txt`).
- Mot de passe unique configuré via la variable d'environnement **`ADMIN_PASSWORD`** (ou dans le fichier `.env`).
- Session sécurisée : cookie HTTP-only, `SameSite=Lax`, `Secure` en HTTPS.
- Fonctions :
  - Tuiles de comptage et répartition par statut.
  - Filtres par mot-clé (ville, courriel, téléphone, détails), statut et source.
  - Changement de statut instantané depuis le tableau.
  - Ajout et modification de notes internes.
  - Suppression de fiches.
  - **Export CSV complet** des demandes filtrées.
