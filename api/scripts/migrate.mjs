/*
 * Applique les migrations Prisma (exécuté par « npm run build », donc à chaque déploiement).
 * Passe d'abord par resolve-db-url pour accepter les variables créées par Neon.
 */
import { spawnSync } from "node:child_process";
import db from "./resolve-db-url.cjs";

const { pooled } = db.resolveDatabaseUrls();
if (!pooled) {
  console.error("Aucune adresse de base trouvée (DATABASE_URL ou variable Neon). Migration impossible.");
  process.exit(1);
}
// On n'affiche que l'hôte, jamais les identifiants.
console.log("[migrate] base :", new URL(pooled).host);

const res = spawnSync("npx", ["prisma", "migrate", "deploy"], { stdio: "inherit", shell: true });
process.exit(res.status ?? 1);
