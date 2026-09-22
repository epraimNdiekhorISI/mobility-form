/*
 * Retrouve l'adresse de la base Postgres.
 *
 * En local, DATABASE_URL vient du fichier .env. Sur Vercel, l'intégration Neon
 * crée ses propres variables, éventuellement préfixées (ex. mobility_DATABASE_URL) :
 * on accepte donc ces noms en repli, pour ne rien avoir à recopier à la main.
 */

/** Cherche la première variable définie parmi une liste de noms possibles. */
function pick(env, exact, suffix) {
  for (const name of exact) {
    if (env[name]) return env[name];
  }
  // Repli : n'importe quelle variable préfixée par l'intégration (mobility_DATABASE_URL…)
  const found = Object.keys(env)
    .filter((k) => k.endsWith(suffix) && env[k])
    .sort();
  return found.length ? env[found[0]] : undefined;
}

/** Complète DATABASE_URL et DATABASE_URL_UNPOOLED si elles manquent. */
function resolveDatabaseUrls(env = process.env) {
  const pooled = pick(env, ["DATABASE_URL", "POSTGRES_PRISMA_URL"], "_DATABASE_URL");
  const direct = pick(env, ["DATABASE_URL_UNPOOLED", "POSTGRES_URL_NON_POOLING"], "_DATABASE_URL_UNPOOLED");
  if (pooled && !env.DATABASE_URL) env.DATABASE_URL = pooled;
  // Les migrations utilisent la connexion directe ; à défaut, la connexion poolée.
  if (!env.DATABASE_URL_UNPOOLED) env.DATABASE_URL_UNPOOLED = direct ?? pooled ?? "";
  return { pooled: env.DATABASE_URL, direct: env.DATABASE_URL_UNPOOLED };
}

module.exports = { resolveDatabaseUrls };
