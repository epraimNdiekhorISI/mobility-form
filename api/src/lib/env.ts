import { config } from "dotenv";

/*
 * Variables d'environnement, dans l'ordre de priorité :
 *   1. .env.local / .env.development.local — produits par « npx vercel env pull »
 *   2. .env                                 — réglages locaux (mot de passe, origines, port)
 * La première valeur trouvée gagne ; dotenv n'écrase jamais une variable déjà définie.
 * Sur Vercel, aucun de ces fichiers n'existe : les variables viennent du projet.
 */
config({ path: [".env.local", ".env.development.local", ".env"], quiet: true });

// Complète DATABASE_URL à partir des variables créées par l'intégration Neon (voir le script).
const { resolveDatabaseUrls } = require("../../scripts/resolve-db-url.cjs");
resolveDatabaseUrls();
