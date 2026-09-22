import { Router, type RequestHandler } from "express";
import rateLimit from "express-rate-limit";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { requireAdmin } from "../lib/auth";
import { responseSchema, toColumns, formatError, ALL_FIELDS } from "../lib/validation";

export const responsesRouter = Router();

// Anti-spam : limite uniquement l'écriture publique (pas la consultation admin).
// Réponse JSON : le formulaire lit toujours le corps avec res.json().
const writeLimiter = rateLimit({
  windowMs: 60_000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: "Trop de réponses envoyées, réessaie dans une minute." },
});

/* ---------- POST /api/responses — public ---------- */
responsesRouter.post("/", writeLimiter, async (req, res) => {
  const parsed = responseSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ ok: false, error: formatError(parsed.error) });
    return;
  }
  // Important : on ne loggue jamais le contenu (payload, recontact).
  const created = await prisma.response.create({ data: toColumns(parsed.data), select: { id: true } });
  res.status(201).json({ ok: true, id: created.id });
});

/* ---------- GET /api/responses — admin, liste paginée par curseur ---------- */
responsesRouter.get("/", ...requireAdmin, async (req, res) => {
  const limit = Math.min(Math.max(Number(req.query.limit) || 25, 1), 100);
  const cursor = typeof req.query.cursor === "string" && req.query.cursor ? req.query.cursor : undefined;

  const rows = await prisma.response.findMany({
    where: buildWhere(req.query),
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit + 1, // un de plus pour savoir s'il reste une page
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    // Pas de recontact ni de payload dans la liste : visibles seulement dans le détail.
    select: {
      id: true, createdAt: true, role: true, vehicleType: true, zone: true,
      probleme: true, interet: true, telephone: true, mobileMoney: true,
    },
  });

  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  res.json({ ok: true, items, nextCursor: hasMore ? items[items.length - 1].id : null });
});

/* ---------- GET /api/responses/:id — admin, détail (verbatim + recontact) ---------- */
responsesRouter.get("/:id", ...requireAdmin, async (req, res) => {
  const row = await prisma.response.findUnique({ where: { id: String(req.params.id) } });
  if (!row) {
    res.status(404).json({ ok: false, error: "Introuvable" });
    return;
  }
  res.json({ ok: true, item: row });
});

/* ---------- DELETE /api/responses/:id — admin, droit à l'effacement ---------- */
responsesRouter.delete("/:id", ...requireAdmin, async (req, res) => {
  try {
    await prisma.response.delete({ where: { id: String(req.params.id) } });
    res.json({ ok: true });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      res.status(404).json({ ok: false, error: "Introuvable" });
      return;
    }
    throw err;
  }
});

/* ---------- GET /api/stats — admin ---------- */
type Tally = { label: string; count: number }[];

export const statsHandler: RequestHandler = async (_req, res) => {
  // Petits volumes (centaines de lignes) : groupBy Prisma, puis mise en forme.
  const [byRole, byVehicle, byProbleme, byInteret, byTelephone, byMobileMoney] = await Promise.all([
    prisma.response.groupBy({ by: ["role"], _count: { _all: true } }),
    prisma.response.groupBy({ by: ["vehicleType"], where: { role: "conducteur" }, _count: { _all: true } }),
    prisma.response.groupBy({ by: ["role", "probleme"], where: { probleme: { not: null } }, _count: { _all: true } }),
    prisma.response.groupBy({ by: ["role", "interet"], where: { interet: { not: null } }, _count: { _all: true } }),
    prisma.response.groupBy({ by: ["telephone"], where: { telephone: { not: null } }, _count: { _all: true } }),
    prisma.response.groupBy({ by: ["mobileMoney"], where: { mobileMoney: { not: null } }, _count: { _all: true } }),
  ]);

  const count = (role: string) => byRole.find((r) => r.role === role)?._count._all ?? 0;
  const usagers = count("usager");
  const conducteurs = count("conducteur");

  // Transforme un groupBy en liste { label, count } triée par effectif décroissant.
  // Les questions à choix multiples stockent « A ; B » : chaque réponse est comptée à part.
  const tally = (rows: { label: string | null; n: number }[]): Tally => {
    const totals = new Map<string, number>();
    for (const r of rows) {
      for (const label of (r.label ?? "Non renseigné").split(" ; ")) {
        totals.set(label, (totals.get(label) ?? 0) + r.n);
      }
    }
    return [...totals].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count);
  };

  // Même chose, séparé usager / conducteur.
  const perRole = (rows: { role: string; label: string | null; n: number }[]) => ({
    usager: tally(rows.filter((r) => r.role === "usager")),
    conducteur: tally(rows.filter((r) => r.role === "conducteur")),
  });

  const problemes = perRole(byProbleme.map((r) => ({ role: r.role, label: r.probleme, n: r._count._all })));

  res.json({
    ok: true,
    total: usagers + conducteurs,
    usagers,
    conducteurs,
    vehicleTypes: tally(byVehicle.map((r) => ({ label: r.vehicleType, n: r._count._all }))),
    topProblemes: { usager: problemes.usager.slice(0, 10), conducteur: problemes.conducteur.slice(0, 10) },
    interet: perRole(byInteret.map((r) => ({ role: r.role, label: r.interet, n: r._count._all }))),
    telephone: tally(byTelephone.map((r) => ({ label: r.telephone, n: r._count._all }))),
    mobileMoney: tally(byMobileMoney.map((r) => ({ label: r.mobileMoney, n: r._count._all }))),
  });
};

/* ---------- GET /api/export.csv — admin ---------- */
// L'adresse e-mail de recontact n'est volontairement PAS exportée : on limite la dissémination
// de la seule donnée personnelle (il reste consultable dans le panneau de détail).
const CSV_FIELDS = ALL_FIELDS.filter((f) => f !== "recontact");

export const exportHandler: RequestHandler = async (req, res) => {
  const rows = await prisma.response.findMany({
    where: buildWhere(req.query),
    orderBy: { createdAt: "asc" },
    select: { id: true, createdAt: true, role: true, payload: true },
  });

  const header = ["id", "date_serveur", "role", ...CSV_FIELDS];
  const lines = [header.map(csvCell).join(";")];
  for (const r of rows) {
    const p = r.payload as Record<string, string | undefined>;
    const cells = [r.id, r.createdAt.toISOString(), r.role, ...CSV_FIELDS.map((f) => p[f] ?? "")];
    lines.push(cells.map(csvCell).join(";"));
  }

  const date = new Date().toISOString().slice(0, 10);
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="enquete-ndjamena-${date}.csv"`);
  // BOM UTF-8 + séparateur « ; » : ouverture directe dans Excel en français.
  res.send("﻿" + lines.join("\r\n"));
};

/* ---------- utilitaires ---------- */

function buildWhere(query: Record<string, unknown>): Prisma.ResponseWhereInput {
  const where: Prisma.ResponseWhereInput = {};
  if (query.role === "usager" || query.role === "conducteur") where.role = query.role;
  if (typeof query.vehicleType === "string" && query.vehicleType) where.vehicleType = query.vehicleType;
  return where;
}

function csvCell(value: string): string {
  let v = value;
  // Neutralise l'injection de formules (le verbatim est saisi par le public).
  if (/^[=+\-@\t\r]/.test(v)) v = "'" + v;
  return /[";\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}
