import { createHash, timingSafeEqual } from "node:crypto";
import type { RequestHandler } from "express";
import rateLimit from "express-rate-limit";

/**
 * Protection des routes admin par un mot de passe partagé (ADMIN_PASSWORD dans .env).
 * Le dashboard l'envoie à chaque appel : Authorization: Bearer <mot de passe>.
 * Suffisant pour un outil interne — ce n'est pas une gestion d'utilisateurs.
 */

// Anti-devinette : 10 essais ratés max par IP sur 15 minutes (les appels réussis ne comptent pas).
const failedLoginLimiter = rateLimit({
  windowMs: 15 * 60_000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  requestWasSuccessful: (_req, res) => res.statusCode !== 401,
  skipSuccessfulRequests: true,
  message: { ok: false, error: "Trop d'essais. Réessaie dans 15 minutes." },
});

const checkPassword: RequestHandler = (req, res, next) => {
  const expected = process.env.ADMIN_PASSWORD;
  const header = req.get("authorization") ?? "";
  const given = header.startsWith("Bearer ") ? header.slice(7) : "";

  // Sans ADMIN_PASSWORD configuré, on refuse tout plutôt que d'ouvrir l'accès.
  if (!expected || !given || !safeEqual(given, expected)) {
    res.status(401).json({ ok: false, error: "Mot de passe incorrect" });
    return;
  }
  next();
};

export const requireAdmin: RequestHandler[] = [failedLoginLimiter, checkPassword];

// Comparaison à temps constant (sur des empreintes de même longueur).
function safeEqual(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}
