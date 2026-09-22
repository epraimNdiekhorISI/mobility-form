// Client de l'API admin : ajoute le mot de passe sur chaque appel.
const API_URL = (import.meta.env.VITE_API_URL ?? "http://localhost:4000").replace(/\/$/, "");
const PASSWORD_KEY = "ndjamena-admin-password";

export type Role = "usager" | "conducteur";
export type Tally = { label: string; count: number }[];

export interface Stats {
  total: number;
  usagers: number;
  conducteurs: number;
  vehicleTypes: Tally;
  topProblemes: Record<Role, Tally>;
  interet: Record<Role, Tally>;
  telephone: Tally;
  mobileMoney: Tally;
}

export interface ResponseRow {
  id: string;
  createdAt: string;
  role: Role;
  vehicleType: string | null;
  zone: string | null;
  probleme: string | null;
  interet: string | null;
  telephone: string | null;
  mobileMoney: string | null;
}

export interface ResponseDetail extends ResponseRow {
  difficulte: string | null;
  recontact: string | null;
  payload: Record<string, string>;
}

export interface Filters {
  role?: string;
  vehicleType?: string;
}

/* ---------- mot de passe (localStorage, protégé contre un stockage indisponible) ---------- */

export function getPassword(): string | null {
  try {
    return localStorage.getItem(PASSWORD_KEY);
  } catch {
    return null;
  }
}

export function setPassword(password: string | null) {
  try {
    if (password) localStorage.setItem(PASSWORD_KEY, password);
    else localStorage.removeItem(PASSWORD_KEY);
  } catch {
    /* stockage indisponible : le mot de passe reste en mémoire le temps de la session */
  }
}

/** Levée sur un 401 ou un 429 : l'interface renvoie alors vers l'écran de connexion. */
export class UnauthorizedError extends Error {}

async function request(path: string, password: string, init: RequestInit = {}): Promise<Response> {
  let res: Response;
  try {
    res = await fetch(API_URL + path, {
      ...init,
      headers: { ...init.headers, Authorization: `Bearer ${password}` },
    });
  } catch {
    // Erreur réseau (« Failed to fetch ») : API arrêtée, mauvaise URL ou origine refusée par CORS.
    throw new Error(`API injoignable (${API_URL}). Vérifie qu'elle est lancée : npm run dev dans api/.`);
  }
  if (res.status === 401) throw new UnauthorizedError("Mot de passe incorrect.");
  // Trop d'essais ratés : on reste sur l'écran de connexion avec le message de l'API.
  if (res.status === 429) throw new UnauthorizedError((await res.json().catch(() => null))?.error ?? "Trop d'essais.");
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? `Erreur ${res.status}`);
  }
  return res;
}

function query(params: Record<string, string | number | undefined>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== "") q.set(k, String(v));
  const s = q.toString();
  return s ? `?${s}` : "";
}

/* ---------- appels ---------- */

export async function fetchStats(password: string): Promise<Stats> {
  return (await request("/api/stats", password)).json();
}

export async function fetchResponses(
  password: string,
  filters: Filters,
  cursor?: string,
): Promise<{ items: ResponseRow[]; nextCursor: string | null }> {
  return (await request(`/api/responses${query({ ...filters, cursor, limit: 25 })}`, password)).json();
}

export async function fetchResponse(password: string, id: string): Promise<ResponseDetail> {
  const data = await (await request(`/api/responses/${encodeURIComponent(id)}`, password)).json();
  return data.item;
}

export async function deleteResponse(password: string, id: string): Promise<void> {
  await request(`/api/responses/${encodeURIComponent(id)}`, password, { method: "DELETE" });
}

/** Télécharge l'export CSV (le mot de passe ne peut pas passer par un simple lien). */
export async function downloadCsv(password: string, filters: Filters): Promise<void> {
  const res = await request(`/api/export.csv${query({ role: filters.role })}`, password);
  const blob = await res.blob();
  const name =
    /filename="([^"]+)"/.exec(res.headers.get("content-disposition") ?? "")?.[1] ?? "enquete-ndjamena.csv";
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}
