import { useEffect, useState } from "react";
import { fetchResponse, type ResponseDetail } from "../api";
import { formatDate } from "./ResponsesTable";

// Libellés lisibles des champs du formulaire.
const FIELD_LABELS: Record<string, string> = {
  quartier: "Quartier", moyen: "Moyen de transport", probleme: "Problème principal", attente: "Temps d'attente",
  telephone: "Téléphone", mobile_money: "Mobile money", interet: "Intérêt", supplement: "Prêt à payer un supplément",
  type_vehicule: "Type de véhicule", propriete: "Propriété du véhicule", anciennete: "Ancienneté", zone: "Zone",
  courses_jour: "Courses par jour", trouver_clients: "Trouver des clients", commission: "Commission acceptable",
  financement: "Financement", horodatage: "Horodatage (client)",
};
const HIDDEN = new Set(["role", "difficulte", "recontact"]); // affichés à part

export function DetailPanel(props: {
  id: string;
  password: string;
  onClose: () => void;
  onDelete: (id: string) => Promise<void>;
  onError: (err: unknown) => void;
}) {
  const [item, setItem] = useState<ResponseDetail | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { id, password, onError } = props;

  useEffect(() => {
    let cancelled = false;
    setItem(null);
    fetchResponse(password, id).then((d) => !cancelled && setItem(d), onError);
    return () => {
      cancelled = true;
    };
  }, [id, password, onError]);

  // Fermeture au clavier (Échap).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && props.onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [props.onClose]);

  async function remove() {
    if (!window.confirm("Supprimer définitivement cette réponse ? Cette action est irréversible.")) return;
    setDeleting(true);
    try {
      await props.onDelete(id);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <aside className="drawer" aria-label="Détail de la réponse">
      <header className="drawer-head">
        <h2>Détail de la réponse</h2>
        <button className="btn ghost" onClick={props.onClose} aria-label="Fermer">✕</button>
      </header>

      {!item ? (
        <p className="muted">Chargement…</p>
      ) : (
        <div className="drawer-body">
          <p className="muted">
            <span className={`swatch ${item.role}`} aria-hidden="true" />
            {item.role === "usager" ? "Usager" : "Conducteur"} · reçue le {formatDate(item.createdAt)}
          </p>

          <h3>Difficulté (verbatim)</h3>
          <blockquote className="verbatim">{item.difficulte || <span className="muted">Non renseigné.</span>}</blockquote>

          <dl className="fields">
            {Object.entries(item.payload)
              .filter(([k]) => !HIDDEN.has(k))
              .map(([k, v]) => (
                <div key={k}>
                  <dt>{FIELD_LABELS[k] ?? k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
          </dl>

          <h3>Numéro de recontact</h3>
          <p className="pii">
            {item.recontact ?? <span className="muted">Non communiqué.</span>}
          </p>
          <p className="muted small">Donnée personnelle : ne pas copier hors de cet outil.</p>

          <div className="drawer-actions">
            <button className="btn danger" onClick={remove} disabled={deleting}>
              {deleting ? "Suppression…" : "Supprimer cette réponse"}
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
