import type { DashboardTable, DashboardTableColumn, DashboardTableRow } from "../types/dashboard";
import { formatDate, formatPriorityLabel, formatRoleLabel, formatStatusLabel } from "../utils/format";
import { EmptyState } from "./EmptyState";

const badgeClasses: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  actif: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  accepted: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  accepte: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  accepté: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  published: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  publie: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  publié: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  completed: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  termine: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  terminé: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  validated: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  valide: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  validé: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  assigned: "bg-blue-50 text-blue-700 ring-blue-200",
  affecte: "bg-blue-50 text-blue-700 ring-blue-200",
  affecté: "bg-blue-50 text-blue-700 ring-blue-200",
  "in-progress": "bg-blue-50 text-blue-700 ring-blue-200",
  "en-cours": "bg-blue-50 text-blue-700 ring-blue-200",
  pending: "bg-amber-50 text-amber-700 ring-amber-200",
  "en-attente": "bg-amber-50 text-amber-700 ring-amber-200",
  draft: "bg-slate-50 text-slate-600 ring-slate-200",
  brouillon: "bg-slate-50 text-slate-600 ring-slate-200",
  disabled: "bg-amber-50 text-amber-700 ring-amber-200",
  desactive: "bg-amber-50 text-amber-700 ring-amber-200",
  désactivé: "bg-amber-50 text-amber-700 ring-amber-200",
  archived: "bg-slate-100 text-slate-600 ring-slate-200",
  archive: "bg-slate-100 text-slate-600 ring-slate-200",
  archivé: "bg-slate-100 text-slate-600 ring-slate-200",
  rejected: "bg-rose-50 text-rose-700 ring-rose-200",
  refused: "bg-rose-50 text-rose-700 ring-rose-200",
  refuse: "bg-rose-50 text-rose-700 ring-rose-200",
  refusé: "bg-rose-50 text-rose-700 ring-rose-200",
  critical: "bg-rose-50 text-rose-700 ring-rose-200",
  critique: "bg-rose-50 text-rose-700 ring-rose-200",
  high: "bg-rose-50 text-rose-700 ring-rose-200",
  elevee: "bg-rose-50 text-rose-700 ring-rose-200",
  élevée: "bg-rose-50 text-rose-700 ring-rose-200",
  medium: "bg-amber-50 text-amber-700 ring-amber-200",
  moyenne: "bg-amber-50 text-amber-700 ring-amber-200",
  low: "bg-slate-50 text-slate-600 ring-slate-200",
  faible: "bg-slate-50 text-slate-600 ring-slate-200",
  "à-renforcer": "bg-amber-50 text-amber-700 ring-amber-200",
};

const emptyMessages: Record<string, { title: string; description: string }> = {
  recentAssignments: {
    title: "Aucune affectation récente pour le moment.",
    description: "Les employés ajoutés à vos projets apparaîtront ici.",
  },
  recommendedTrainings: {
    title: "Aucune formation recommandée pour le moment.",
    description: "Les recommandations apparaîtront après l’évaluation des compétences.",
  },
  criticalGaps: {
    title: "Aucun écart critique détecté.",
    description: "Les projets sélectionnés disposent d’une couverture suffisante ou n’ont pas encore d’exigences exploitables.",
  },
  currentTrainings: {
    title: "Aucune formation en cours.",
    description: "Les parcours commencés apparaîtront ici dès votre première inscription.",
  },
  pendingActivities: {
    title: "Aucune activité à rendre.",
    description: "Les travaux à soumettre apparaîtront ici lorsqu’un parcours en demandera.",
  },
  corrections: {
    title: "Aucune soumission à corriger.",
    description: "Les activités terminées par les apprenants apparaîtront ici après soumission.",
  },
  latestReviews: {
    title: "Aucun avis disponible.",
    description: "Les retours apprenants apparaîtront après publication et consultation des parcours.",
  },
};

function badgeKey(value?: string | null) {
  return (value ?? "").trim().toLowerCase().replace(/[\s_]+/g, "-");
}

function cellValue(row: DashboardTableRow, column: DashboardTableColumn) {
  if (column.key === "title") return row.title;
  if (column.key === "subtitle") return row.subtitle;
  if (column.key === "status") return row.status;
  if (column.key === "primaryValue") return row.primaryValue;
  if (column.key === "secondaryValue") return row.secondaryValue;
  if (column.key === "date") return row.date;
  return row.cells?.[column.key];
}

function StatusBadge({ value, type }: { value?: string | null; type?: string }) {
  const label = type === "priority" ? formatPriorityLabel(value) : type === "role" ? formatRoleLabel(value) : formatStatusLabel(value);
  const classes = badgeClasses[badgeKey(value)] ?? badgeClasses[badgeKey(label)] ?? "bg-slate-50 text-slate-600 ring-slate-200";
  return <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${classes}`}>{label}</span>;
}

function renderCell(row: DashboardTableRow, column: DashboardTableColumn, hasSubtitleColumn: boolean) {
  const value = cellValue(row, column);

  if (column.key === "title") {
    return (
      <div className="min-w-40">
        <p className="font-medium text-slate-800">{row.title || "—"}</p>
        {row.subtitle && !hasSubtitleColumn ? <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{row.subtitle}</p> : null}
      </div>
    );
  }

  if (column.type === "status" || column.type === "priority" || column.type === "role") {
    return <StatusBadge value={typeof value === "string" ? value : undefined} type={column.type} />;
  }

  if (column.type === "date") return <span className="whitespace-nowrap text-xs font-medium text-slate-500">{formatDate(typeof value === "string" ? value : null)}</span>;
  if (column.type === "percent") return <span className="whitespace-nowrap font-semibold tabular-nums text-slate-700">{typeof value === "number" ? `${value}%` : "—"}</span>;
  if (column.type === "level") return <span className="whitespace-nowrap font-semibold tabular-nums text-slate-700">{typeof value === "number" ? `${value}/5` : "—"}</span>;
  if (column.type === "rating") return <span className="whitespace-nowrap font-semibold tabular-nums text-slate-700">{typeof value === "number" ? `${value}/5` : "—"}</span>;
  if (column.type === "score") return <span className="whitespace-nowrap font-semibold tabular-nums text-slate-700">{typeof value === "number" ? value : "—"}</span>;
  if (column.type === "number") return <span className="whitespace-nowrap font-semibold tabular-nums text-slate-700">{typeof value === "number" ? value : "—"}</span>;

  return <span className="text-slate-600">{value === null || value === undefined || value === "" ? "—" : String(value)}</span>;
}

export function DataTableCard({ table }: { table: DashboardTable }) {
  const empty = emptyMessages[table.key];
  const hasSubtitleColumn = table.columns.some((column) => column.key === "subtitle");

  return (
    <article className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm shadow-slate-200/60">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-slate-950">{table.title}</h3>
        {table.description ? <p className="mt-1 text-xs leading-relaxed text-slate-500">{table.description}</p> : null}
      </div>
      {table.rows.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs font-semibold uppercase tracking-wide text-slate-500">
                {table.columns.map((column) => (
                  <th key={column.key} className="whitespace-nowrap px-3 py-3">
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.rows.slice(0, 8).map((row) => (
                <tr key={`${row.id}-${row.title}`} className="border-b border-slate-50 last:border-0 hover:bg-blue-50/40">
                  {table.columns.map((column) => (
                    <td key={column.key} className="px-3 py-3 align-top">
                      {renderCell(row, column, hasSubtitleColumn)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState title={empty?.title} description={empty?.description} />
      )}
    </article>
  );
}
