/**
 * Test rapide de l'API (serveur lancé au préalable : npm run dev).
 *   npm run test:post
 * Vérifie : POST usager + conducteur, whitelist des champs, validation,
 * protection admin, liste, stats, export CSV, suppression.
 */
import "dotenv/config";

const API = process.env.API_URL ?? `http://localhost:${process.env.PORT || 4000}`;
const auth = { Authorization: `Bearer ${process.env.ADMIN_PASSWORD}` };
let failures = 0;

function check(label: string, cond: boolean) {
  console.log(`${cond ? "OK  " : "ÉCHEC"} ${label}`);
  if (!cond) failures++;
}

async function post(body: unknown) {
  const res = await fetch(`${API}/api/responses`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return { status: res.status, data: (await res.json()) as any };
}

async function main() {
  const usager = await post({
    role: "usager", quartier: "Moursal", moyen: "Clando", probleme: "Prix",
    difficulte: "Le matin il faut attendre longtemps au rond-point.", attente: "15-30 min",
    telephone: "Smartphone", mobile_money: "Oui", interet: "Oui", supplement: "Oui",
    recontact: "", horodatage: new Date().toISOString(),
    cle_inconnue: "doit être ignorée",
  });
  check("POST usager -> 201", usager.status === 201 && usager.data.ok && !!usager.data.id);

  const conducteur = await post({
    role: "conducteur", type_vehicule: "Moto-taxi", propriete: "Location", anciennete: "1-3 ans",
    zone: "Chagoua", courses_jour: "10-20", trouver_clients: "Au bord de la route",
    probleme: "Police", difficulte: "Trop de contrôles.", telephone: "Téléphone simple",
    mobile_money: "Oui", interet: "Peut-être", commission: "10%", financement: "Non",
    recontact: "+235 66 00 00 00", horodatage: new Date().toISOString(),
  });
  check("POST conducteur -> 201", conducteur.status === 201 && conducteur.data.ok);

  check("POST rôle invalide -> 400", (await post({ role: "pirate" })).status === 400);
  check("POST sans rôle -> 400", (await post({ quartier: "Moursal" })).status === 400);
  check("POST champ trop long -> 400", (await post({ role: "usager", difficulte: "x".repeat(2001) })).status === 400);

  const noAuth = await fetch(`${API}/api/responses`);
  check("GET liste sans mot de passe -> 401", noAuth.status === 401);

  const detail = (await (await fetch(`${API}/api/responses/${usager.data.id}`, { headers: auth })).json()) as any;
  check("clé inconnue retirée du payload", detail.ok && !("cle_inconnue" in detail.item.payload));
  check("colonne zone = quartier (usager)", detail.item.zone === "Moursal");

  const list = (await (await fetch(`${API}/api/responses?role=conducteur&limit=1`, { headers: auth })).json()) as any;
  check("liste filtrée conducteur", list.ok && list.items.every((i: any) => i.role === "conducteur"));
  check("liste sans recontact", list.items.every((i: any) => !("recontact" in i)));

  const stats = (await (await fetch(`${API}/api/stats`, { headers: auth })).json()) as any;
  check("stats: total >= 2", stats.ok && stats.total >= 2 && stats.total === stats.usagers + stats.conducteurs);

  const csv = await (await fetch(`${API}/api/export.csv`, { headers: auth })).text();
  check("export CSV contient l'en-tête", csv.includes("id;date_serveur;role"));
  check("export CSV sans numéro de recontact", !csv.includes("+235 66 00 00 00"));

  // Nettoyage : on supprime les réponses de test.
  for (const id of [usager.data.id, conducteur.data.id]) {
    const del = await fetch(`${API}/api/responses/${id}`, { method: "DELETE", headers: auth });
    check(`DELETE ${id} -> 200`, del.status === 200);
  }
  const gone = await fetch(`${API}/api/responses/${usager.data.id}`, { headers: auth });
  check("réponse supprimée -> 404", gone.status === 404);

  console.log(failures ? `\n${failures} échec(s).` : "\nTous les tests passent.");
  process.exit(failures ? 1 : 0);
}

main().catch((err) => {
  console.error(`Impossible de joindre l'API sur ${API} (${err.message}).`);
  console.error("Lance-la d'abord dans un autre terminal : npm run dev");
  process.exit(1);
});
