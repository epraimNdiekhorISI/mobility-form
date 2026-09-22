import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Role, Stats, Tally } from "../api";

/*
 * Graphes simples en barres (pas de camembert).
 * Couleur = identité du profil, identique partout : usager = bleu, conducteur = orange.
 * Les couleurs sont portées par des classes CSS (voir styles.css) pour suivre le mode sombre.
 */

const ROLE_LABEL: Record<Role, string> = { usager: "Usagers", conducteur: "Conducteurs" };
const INTERET_ORDER = ["Oui", "Peut-être", "Non"];

export function Charts({ stats }: { stats: Stats }) {
  return (
    <section className="charts">
      <ProblemesChart role="usager" rows={stats.topProblemes.usager} />
      <ProblemesChart role="conducteur" rows={stats.topProblemes.conducteur} />
      <InteretChart stats={stats} />
    </section>
  );
}

/* ---------- Top problèmes (barres horizontales, une série) ---------- */

function ProblemesChart({ role, rows }: { role: Role; rows: Tally }) {
  const height = Math.max(120, rows.length * 34 + 24);
  return (
    <figure className="panel chart">
      <figcaption>
        <span className={`swatch ${role}`} aria-hidden="true" />
        Principaux problèmes — {ROLE_LABEL[role].toLowerCase()}
      </figcaption>
      {rows.length === 0 ? (
        <p className="muted empty">Pas encore de réponses.</p>
      ) : (
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 36, bottom: 4, left: 4 }} barCategoryGap={6}>
            <CartesianGrid horizontal={false} />
            <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} />
            <YAxis type="category" dataKey="label" width={150} tickLine={false} axisLine={false} interval={0} />
            <Tooltip cursor={{ className: "chart-cursor" }} content={<CountTooltip />} />
            <Bar dataKey="count" name="Réponses" className={`bar ${role}`} radius={[0, 4, 4, 0]} maxBarSize={22} isAnimationActive={false}>
              <LabelList dataKey="count" position="right" className="bar-label" />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </figure>
  );
}

/* ---------- Intérêt (barres groupées, en % de chaque profil) ---------- */

// Le formulaire propose « Oui, certainement » aux usagers et « Oui » aux conducteurs :
// on regroupe sous « Oui » pour comparer les deux profils.
const normalizeInteret = (label: string) => (/^oui\b/i.test(label) ? "Oui" : label);

function InteretChart({ stats }: { stats: Stats }) {
  const interet = {
    usager: stats.interet.usager.map((r) => ({ ...r, label: normalizeInteret(r.label) })),
    conducteur: stats.interet.conducteur.map((r) => ({ ...r, label: normalizeInteret(r.label) })),
  };
  // Pourcentages par profil : les deux populations n'ont pas la même taille.
  const totals = {
    usager: interet.usager.reduce((s, r) => s + r.count, 0),
    conducteur: interet.conducteur.reduce((s, r) => s + r.count, 0),
  };
  const labels = [
    ...INTERET_ORDER,
    ...[...interet.usager, ...interet.conducteur]
      .map((r) => r.label)
      .filter((l, i, all) => !INTERET_ORDER.includes(l) && all.indexOf(l) === i),
  ];
  const data = labels.map((label) => {
    const row: Record<string, string | number> = { label };
    for (const role of ["usager", "conducteur"] as Role[]) {
      const count = interet[role].filter((r) => r.label === label).reduce((s, r) => s + r.count, 0);
      row[role] = totals[role] ? Math.round((count / totals[role]) * 100) : 0;
      row[`${role}Count`] = count;
    }
    return row;
  });

  return (
    <figure className="panel chart chart-wide">
      <figcaption>Intérêt pour le service (% de chaque profil)</figcaption>
      <ul className="legend">
        {(["usager", "conducteur"] as Role[]).map((role) => (
          <li key={role}>
            <span className={`swatch ${role}`} aria-hidden="true" />
            {ROLE_LABEL[role]} <span className="muted">(n = {totals[role]})</span>
          </li>
        ))}
      </ul>
      {totals.usager + totals.conducteur === 0 ? (
        <p className="muted empty">Pas encore de réponses.</p>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data} margin={{ top: 20, right: 8, bottom: 4, left: 0 }} barGap={2} barCategoryGap="28%">
            <CartesianGrid vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} />
            <YAxis unit=" %" domain={[0, 100]} tickLine={false} axisLine={false} width={48} />
            <Tooltip cursor={{ className: "chart-cursor" }} content={<InteretTooltip />} />
            {(["usager", "conducteur"] as Role[]).map((role) => (
              <Bar key={role} dataKey={role} name={ROLE_LABEL[role]} className={`bar ${role}`} radius={[4, 4, 0, 0]} maxBarSize={48} isAnimationActive={false}>
                <LabelList dataKey={role} position="top" className="bar-label" formatter={(v) => `${v} %`} />
              </Bar>
            ))}
          </BarChart>
        </ResponsiveContainer>
      )}
    </figure>
  );
}

/* ---------- infobulles ---------- */

type TooltipProps = { active?: boolean; payload?: { payload: Record<string, string | number> }[]; label?: string };

function CountTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div className="tooltip">
      <div className="tooltip-title">{row.label}</div>
      <div>{row.count} réponse(s)</div>
    </div>
  );
}

function InteretTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div className="tooltip">
      <div className="tooltip-title">{label}</div>
      {(["usager", "conducteur"] as Role[]).map((role) => (
        <div key={role} className="tooltip-row">
          <span className={`swatch ${role}`} aria-hidden="true" />
          {ROLE_LABEL[role]} : <strong>{row[role]} %</strong> ({row[`${role}Count`]})
        </div>
      ))}
    </div>
  );
}
