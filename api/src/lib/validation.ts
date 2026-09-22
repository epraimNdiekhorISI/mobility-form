import { z } from "zod";

// Champ texte optionnel : trim, max 2000 caractères, chaîne vide => absent.
const text = z
  .string()
  .trim()
  .max(2000)
  .optional()
  .transform((v) => (v ? v : undefined));

/*
 * Whitelist stricte des champs par profil. zod supprime par défaut les clés
 * inconnues (pas de .passthrough()) : seul ce qui est listé ici est stocké.
 */
const usagerSchema = z.object({
  role: z.literal("usager"),
  quartier: text,
  moyen: text,
  probleme: text,
  difficulte: text,
  attente: text,
  telephone: text,
  mobile_money: text,
  interet: text,
  supplement: text,
  recontact: text,
  horodatage: text, // horodatage client, conservé à titre indicatif
});

const conducteurSchema = z.object({
  role: z.literal("conducteur"),
  type_vehicule: text,
  propriete: text,
  anciennete: text,
  zone: text,
  courses_jour: text,
  trouver_clients: text,
  probleme: text,
  difficulte: text,
  telephone: text,
  mobile_money: text,
  interet: text,
  commission: text,
  financement: text,
  recontact: text,
  horodatage: text,
});

export const responseSchema = z.discriminatedUnion("role", [usagerSchema, conducteurSchema]);
export type CleanResponse = z.infer<typeof responseSchema>;

/** Colonnes « promues » (filtrage/stats) extraites de la réponse nettoyée. */
export function toColumns(r: CleanResponse) {
  return {
    role: r.role,
    vehicleType: r.role === "conducteur" ? r.type_vehicule ?? null : null,
    zone: (r.role === "usager" ? r.quartier : r.zone) ?? null,
    probleme: r.probleme ?? null,
    difficulte: r.difficulte ?? null,
    interet: r.interet ?? null,
    telephone: r.telephone ?? null,
    mobileMoney: r.mobile_money ?? null,
    recontact: r.recontact ?? null,
    payload: r,
  };
}

/** Message d'erreur lisible, sans renvoyer les valeurs soumises. */
export function formatError(err: z.ZodError): string {
  return err.issues.map((i) => `${i.path.join(".") || "(corps)"}: ${i.message}`).join("; ");
}

/** Ensemble des champs du formulaire (ordre des colonnes de l'export CSV). */
export const ALL_FIELDS = [
  ...new Set([...Object.keys(usagerSchema.shape), ...Object.keys(conducteurSchema.shape)]),
].filter((k) => k !== "role");
