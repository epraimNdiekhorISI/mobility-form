# Formulaire d'enquête

Site statique, sans étape de build.

```text
form/
├─ enquete-ndjamena.html   structure de la page
├─ css/style.css           styles
├─ js/app.js               logique (questions, navigation, envoi à l'API)
└─ img/
   ├─ hero.webp            photo de l'écran d'accueil
   └─ flag.webp            photo de l'écran de remerciement
```

Dépendances externes, chargées par le HTML : les polices Google Fonts (Sora, Plus Jakarta Sans) et GSAP (cdnjs).

## Questions

- **Obligatoires** : toutes, sauf deux laissées facultatives à dessein — le verbatim (« Raconte avec tes mots ») et l'adresse e-mail de recontact. Le bouton « Suivant » reste inactif tant que la réponse n'est pas saisie.
- **Choix multiples** (cases à cocher) : moyens de transport, mobile money, et façon de trouver les clients. Les réponses sont enregistrées séparées par « ; », et les statistiques les comptent une par une. Cocher « Aucun » décoche le reste.
- **Recontact** : adresse e-mail, dont le format est vérifié avant de passer à la suite.

## Endpoint

En haut de `js/app.js` :

```js
const API_URL_PROD = "https://mobility-form-api.vercel.app"; // API déployée
// En local (localhost), le formulaire bascule tout seul sur http://localhost:4000
```

Une chaîne vide active le mode démonstration : aucune donnée n'est envoyée.

## Test en local

Ouvrir le fichier directement (`file://`) envoie l'origine `null`, que le CORS de l'API refuse.
Servir le dossier sur le port 3000 (déjà présent dans `ALLOWED_ORIGIN`) :

```bash
npx serve form -l 3000
# puis http://localhost:3000/enquete-ndjamena.html
```

## Déploiement

Déposer **tout le dossier** `form/` (HTML, `css/`, `js/`, `img/`), par exemple sur Netlify Drop.
Mettre à jour `API_URL` dans `js/app.js`, et ajouter l'origine du formulaire dans `ALLOWED_ORIGIN` de l'API.
