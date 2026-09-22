# Enquête mobilité N'Djamena

Enregistrement des réponses au formulaire d'enquête (usagers et conducteurs) et tableau de bord interne.

```text
api/    Express + TypeScript + Prisma : reçoit, valide et stocke les réponses ; routes admin
admin/  React + Vite + TypeScript : statistiques, liste filtrable, détail, export CSV, suppression
form/   Formulaire statique : HTML, css/, js/, img/ (voir form/README.md)
```

Base de données : SQLite en local, PostgreSQL en production (même couche Prisma).

## Démarrage local

Prérequis : Node.js 20 ou plus récent.

```bash
# API
cd api && npm i
cp .env.example .env          # puis choisir ADMIN_PASSWORD (mot de passe du tableau de bord)
npx prisma migrate dev --name init
npm run dev                   # tsx watch src/server.ts, sur :4000

# Dashboard
cd ../admin && npm i
cp .env.example .env
npm run dev                   # Vite, sur :5173

# Formulaire (API_URL dans form/js/app.js)
npx serve form -l 3000        # puis http://localhost:3000/enquete-ndjamena.html
```

Le mot de passe (`ADMIN_PASSWORD` dans `api/.env`) se saisit à l'ouverture du dashboard. Il est conservé dans le navigateur (`localStorage`), et le bouton « Se déconnecter » l'efface.
Après 10 essais ratés en 15 minutes, l'adresse IP concernée est bloquée pendant 15 minutes.
Après toute modification de `.env`, redémarrer l'API.

## Tester l'API

Avec l'API lancée :

```bash
cd api && npm run test:post
```

Le script envoie une réponse usager et une réponse conducteur. Il vérifie ensuite la whitelist des champs, les erreurs 400, la protection admin (401), la liste, les stats, l'export CSV et la suppression, puis supprime ses données de test.
Pour des tests manuels, [api/test.http](api/test.http) fonctionne avec l'extension VS Code « REST Client ».

## Routes

| Méthode | Route | Accès | Rôle |
|---|---|---|---|
| `POST` | `/api/responses` | public (CORS + 20 req/min/IP) | enregistre une réponse |
| `GET` | `/api/responses` | admin | liste paginée : `?role=&vehicleType=&limit=&cursor=` |
| `GET` | `/api/responses/:id` | admin | détail d'une réponse (verbatim + numéro de recontact) |
| `DELETE` | `/api/responses/:id` | admin | suppression (droit à l'effacement) |
| `GET` | `/api/stats` | admin | agrégats |
| `GET` | `/api/export.csv` | admin | export CSV (`?role=` optionnel) |
| `GET` | `/api/health` | public | `{ ok: true }` |

Routes admin : en-tête `Authorization: Bearer <ADMIN_PASSWORD>`. C'est un mot de passe partagé pour un outil interne, pas une gestion de comptes.

## Données et confidentialité

- **Whitelist** : seuls les champs prévus pour chaque profil sont conservés. Les autres clés sont ignorées (zod, sans `passthrough`). Chaque champ fait au plus 2000 caractères.
- **`recontact`** (numéro volontaire) est la seule donnée personnelle. Il n'apparaît ni dans la liste ni dans l'export CSV : on ne le voit que dans le panneau de détail.
- **Effacement** : sur demande d'un répondant, ouvrir sa réponse dans le dashboard et cliquer sur « Supprimer cette réponse ».
- **Journaux** : ni les payloads ni les numéros ne sont loggués.
- **Secrets** : `.env` est git-ignoré et `ADMIN_PASSWORD` ne doit jamais être commité. En production, choisir un mot de passe d'au moins 12 caractères.
- **Export CSV** : séparateur `;` et BOM UTF-8 pour Excel en français. Les cellules qui commencent par `=`, `+`, `-` ou `@` sont neutralisées contre l'injection de formules.

## Mise en production

**API + PostgreSQL** (Render, Railway ou Fly.io) :

1. Dans `api/prisma/schema.prisma` : `provider = "postgresql"` et `payload Json` au lieu de `String`.
   Dans `api/src/lib/validation.ts` (`toColumns`), remplacer `payload: JSON.stringify(r)` par `payload: r`.
   Dans `api/src/routes/responses.ts`, supprimer les `JSON.parse(...payload)`.
2. Supprimer `api/prisma/migrations` (générées pour SQLite) puis régénérer avec `npx prisma migrate dev --name init` sur une base Postgres.
3. Au déploiement : `npm ci && npx prisma migrate deploy && npm run build`, puis `npm start`.
4. Variables : `DATABASE_URL`, `ADMIN_PASSWORD`, `ALLOWED_ORIGIN` (URL du formulaire et du dashboard, séparées par des virgules), `PORT`.

**Dashboard** (Netlify ou Vercel) : build `npm run build`, dossier `dist`, variable `VITE_API_URL` = URL de l'API.

**Formulaire** (Netlify Drop, tout le dossier `form/`) : `API_URL` dans `form/js/app.js` = URL de l'API, et ajouter l'origine du formulaire dans `ALLOWED_ORIGIN`.

L'hébergeur fournit HTTPS, obligatoire en production.
