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
| `GET` | `/api/responses/:id` | admin | détail d'une réponse (verbatim + e-mail de recontact) |
| `DELETE` | `/api/responses/:id` | admin | suppression (droit à l'effacement) |
| `GET` | `/api/stats` | admin | agrégats |
| `GET` | `/api/export.csv` | admin | export CSV (`?role=` optionnel) |
| `GET` | `/api/health` | public | `{ ok: true }` |

Routes admin : en-tête `Authorization: Bearer <ADMIN_PASSWORD>`. C'est un mot de passe partagé pour un outil interne, pas une gestion de comptes.

## Données et confidentialité

- **Whitelist** : seuls les champs prévus pour chaque profil sont conservés. Les autres clés sont ignorées (zod, sans `passthrough`). Chaque champ fait au plus 2000 caractères.
- **`recontact`** (adresse e-mail volontaire) est la seule donnée personnelle. Il n'apparaît ni dans la liste ni dans l'export CSV : on ne le voit que dans le panneau de détail.
- **Effacement** : sur demande d'un répondant, ouvrir sa réponse dans le dashboard et cliquer sur « Supprimer cette réponse ».
- **Journaux** : ni les payloads ni les adresses e-mail ne sont loggués.
- **Secrets** : `.env` est git-ignoré et `ADMIN_PASSWORD` ne doit jamais être commité. En production, choisir un mot de passe d'au moins 12 caractères.
- **Export CSV** : séparateur `;` et BOM UTF-8 pour Excel en français. Les cellules qui commencent par `=`, `+`, `-` ou `@` sont neutralisées contre l'injection de formules.

## En production (Vercel)

Trois projets Vercel sur ce dépôt, chacun avec son *Root Directory*. Chaque `git push` sur `main` redéploie les trois.

| Projet Vercel | Root Directory | Adresse | Variables |
| --- | --- | --- | --- |
| `mobility-form-api` | `api` | <https://mobility-form-api.vercel.app> | base Neon (`mobility_*`), `ADMIN_PASSWORD`, `ALLOWED_ORIGIN` |
| `mobility-form` | `admin` | <https://mobility-form.vercel.app> | `VITE_API_URL` |
| `mobility-formulaire` | `form` | <https://mobility-formulaire.vercel.app> | aucune |

- **Base de données** : Neon, reliée au projet API (*Storage* → *Create Database*). L'intégration crée ses variables sous un préfixe (`mobility_DATABASE_URL`…) et Vercel les marque secrètes, donc illisibles. `api/scripts/resolve-db-url.cjs` accepte ces noms préfixés : rien n'est à recopier à la main, ni côté API, ni côté migration.
- **Build de l'API** : `npm run build` exécute `prisma generate && node scripts/migrate.mjs`, qui applique les migrations. Vercel compile lui-même le TypeScript ; `npm run typecheck` vérifie les types en local, `npm run compile` produit `dist/` pour un hébergeur classique.
- **Formulaire** : site statique. `form/vercel.json` sert le dossier tel quel et renvoie la racine vers `enquete-ndjamena.html` ; `form/package.json` n'existe que parce que Vercel réclame une commande de build.
- **`ALLOWED_ORIGIN`** doit contenir les adresses du formulaire et du dashboard, séparées par des virgules. Sans ça, le navigateur bloque leurs appels.
- **`API_URL_PROD`** dans `form/js/app.js` doit contenir l'adresse de l'API. En local, le formulaire bascule tout seul sur `http://localhost:4000`.
- HTTPS est fourni par Vercel.

Le rate-limit est gardé en mémoire de chaque instance. Sur Vercel, plusieurs instances peuvent tourner en parallèle : les limites sont donc approximatives, ce qui suffit pour de l'anti-spam.
