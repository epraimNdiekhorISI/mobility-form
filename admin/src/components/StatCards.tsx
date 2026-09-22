import type { Stats, Tally } from "../api";

// Cartes de synthèse : totaux, puis répartition des conducteurs par véhicule.
export function StatCards({ stats }: { stats: Stats }) {
  return (
    <section className="cards" aria-label="Synthèse">
      <Card label="Réponses" value={stats.total} />
      <Card label="Usagers" value={stats.usagers} role="usager" />
      <Card label="Conducteurs" value={stats.conducteurs} role="conducteur" />
      <div className="card card-wide">
        <div className="card-label">Conducteurs par véhicule</div>
        {stats.vehicleTypes.length === 0 ? (
          <div className="muted">Aucune réponse conducteur.</div>
        ) : (
          <ul className="mini-list">
            {stats.vehicleTypes.map((v) => (
              <li key={v.label}>
                <span>{v.label}</span>
                <strong>{v.count}</strong>
              </li>
            ))}
          </ul>
        )}
      </div>
      <SmallTally title="Téléphone" rows={stats.telephone} />
      <SmallTally title="Mobile money" rows={stats.mobileMoney} />
    </section>
  );
}

function Card({ label, value, role }: { label: string; value: number; role?: "usager" | "conducteur" }) {
  return (
    <div className="card">
      <div className="card-label">
        {role && <span className={`swatch ${role}`} aria-hidden="true" />}
        {label}
      </div>
      <div className="card-value">{value}</div>
    </div>
  );
}

function SmallTally({ title, rows }: { title: string; rows: Tally }) {
  const total = rows.reduce((s, r) => s + r.count, 0);
  return (
    <div className="card">
      <div className="card-label">{title}</div>
      {total === 0 ? (
        <div className="muted">—</div>
      ) : (
        <ul className="mini-list">
          {rows.map((r) => (
            <li key={r.label}>
              <span>{r.label}</span>
              <strong>{Math.round((r.count / total) * 100)} %</strong>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
