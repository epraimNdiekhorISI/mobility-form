import "dotenv/config";
import express, { type ErrorRequestHandler } from "express";
import helmet from "helmet";
import cors from "cors";
import { responsesRouter, statsHandler, exportHandler } from "./routes/responses";
import { requireAdmin } from "./lib/auth";

const app = express();
// Derrière le proxy Vercel : lire la vraie IP du visiteur (sinon le rate-limit compte tout le monde ensemble).
app.set("trust proxy", 1);
app.use(helmet());
app.use(express.json({ limit: "32kb" }));
// En prod, ALLOWED_ORIGIN = origines du formulaire et du dashboard, séparées par des virgules.
app.use(cors({ origin: process.env.ALLOWED_ORIGIN?.split(",").map((o) => o.trim()) ?? "*" }));

app.get("/api/health", (_req, res) => res.json({ ok: true }));
// Le rate-limit anti-spam est appliqué sur le POST, dans le routeur (pas sur les routes admin).
app.use("/api/responses", responsesRouter);
app.get("/api/stats", ...requireAdmin, statsHandler);
app.get("/api/export.csv", ...requireAdmin, exportHandler);

app.use((_req, res) => {
  res.status(404).json({ ok: false, error: "Route inconnue" });
});

// Gestionnaire d'erreurs : on loggue le type d'erreur, jamais le corps de la requête.
const onError: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err?.type === "entity.parse.failed") {
    res.status(400).json({ ok: false, error: "JSON invalide" });
    return;
  }
  if (err?.type === "entity.too.large") {
    res.status(413).json({ ok: false, error: "Corps trop volumineux" });
    return;
  }
  console.error("[api] erreur :", err?.name ?? "Error", err?.code ?? "");
  res.status(500).json({ ok: false, error: "Erreur serveur" });
};
app.use(onError);

// En local : serveur sur PORT. Sur Vercel : l'app exportée devient une fonction serverless.
if (!process.env.VERCEL) {
  const port = Number(process.env.PORT) || 4000;
  app.listen(port, () => console.log(`[api] à l'écoute sur http://localhost:${port}`));
}

export default app;
