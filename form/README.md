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

## Endpoint

En haut de `js/app.js` :

```js
const API_URL = "http://localhost:4000"; // en prod : l'URL de l'API déployée
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
