import type { Filters, ResponseRow } from "../api";

// Le numéro de recontact n'apparaît jamais ici : seulement dans le panneau de détail.
export function ResponsesTable(props: {
  rows: ResponseRow[];
  filters: Filters;
  vehicleTypes: string[];
  loading: boolean;
  hasMore: boolean;
  selectedId: string | null;
  onFilters: (f: Filters) => void;
  onMore: () => void;
  onSelect: (id: string) => void;
  onExport: () => void;
}) {
  const { rows, filters, vehicleTypes, loading, hasMore, selectedId } = props;

  return (
    <section className="panel table-panel">
      <div className="toolbar">
        <h2>Réponses</h2>
        <label>
          Profil
          <select
            value={filters.role ?? ""}
            onChange={(e) =>
              props.onFilters({
                role: e.target.value || undefined,
                // Le type de véhicule n'a de sens que pour les conducteurs.
                vehicleType: e.target.value === "usager" ? undefined : filters.vehicleType,
              })
            }
          >
            <option value="">Tous</option>
            <option value="usager">Usagers</option>
            <option value="conducteur">Conducteurs</option>
          </select>
        </label>
        <label>
          Véhicule
          <select
            value={filters.vehicleType ?? ""}
            disabled={filters.role === "usager"}
            onChange={(e) => props.onFilters({ ...filters, vehicleType: e.target.value || undefined })}
          >
            <option value="">Tous</option>
            {vehicleTypes.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </label>
        <button className="btn" onClick={props.onExport}>
          Exporter en CSV
        </button>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Profil</th>
              <th>Véhicule</th>
              <th>Zone</th>
              <th>Problème</th>
              <th>Intérêt</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.id}
                className={r.id === selectedId ? "selected" : undefined}
                onClick={() => props.onSelect(r.id)}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && props.onSelect(r.id)}
                tabIndex={0}
              >
                <td className="nowrap">
                  <span className={`swatch ${r.role}`} aria-hidden="true" />
                  {r.role === "usager" ? "Usager" : "Conducteur"}
                </td>
                <td>{r.vehicleType ?? "—"}</td>
                <td>{r.zone ?? "—"}</td>
                <td>{r.probleme ?? "—"}</td>
                <td>{r.interet ?? "—"}</td>
                <td className="nowrap">{formatDate(r.createdAt)}</td>
              </tr>
            ))}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={6} className="muted empty">Aucune réponse pour ces filtres.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="table-footer">
        {loading && <span className="muted">Chargement…</span>}
        {!loading && hasMore && (
          <button className="btn" onClick={props.onMore}>Afficher plus</button>
        )}
      </div>
    </section>
  );
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });
}
