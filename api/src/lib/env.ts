import { config } from "dotenv";

/*
 * Variables d'environnement, dans l'ordre de priorité :
 *   1. .env.development.local  — produit par « npx vercel env pull » (adresses de la base)
 *   2. .env                    — réglages locaux (mot de passe, origines, port)
 * La première valeur trouvée gagne ; dotenv n'écrase jamais une variable déjà définie.
 * Sur Vercel, aucun de ces fichiers n'existe : les variables viennent du projet.
 */
config({ path: [".env.development.local", ".env"], quiet: true });
