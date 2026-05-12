import type { DashboardTable, DashboardTableColumn, DashboardTableRow } from "../types/dashboard";
import { useState } from "react";
import { createPortal } from "react-dom";
import { formatDate, formatPriorityLabel, formatRoleLabel, formatStatusLabel } from "../utils/format";
import { EmptyState } from "./EmptyState";
import { EyeIcon } from "../../../icons/heroicons/outline";

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
  corrige: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  corrigé: "bg-emerald-50 text-emerald-700 ring-emerald-200",
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
  "à-revoir": "bg-amber-50 text-amber-700 ring-amber-200",
  "a-revoir": "bg-amber-50 text-amber-700 ring-amber-200",
  "ia-disponible": "bg-amber-50 text-amber-700 ring-amber-200",
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

function getScoreValue(row: DashboardTableRow, key: "score" | "aiScore", fallback?: number | null) {
  const raw = row.cells?.[key];
  if (typeof raw === "number") return raw;
  if (typeof raw === "string" && raw.trim() !== "") return Number(raw);
  return fallback ?? null;
}

function FeedbackDetailModal({
  row,
  onClose,
}: {
  row: DashboardTableRow;
  onClose: () => void;
}) {
  const finalScore = getScoreValue(row, "score", row.primaryValue ?? null);
  const aiScore = getScoreValue(row, "aiScore", row.secondaryValue ?? null);

  const content = (
    <div className="app-modal-backdrop fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-4">
      <div className="absolute inset-0 bg-slate-900/30" onClick={onClose} aria-hidden="true" />
      <div className="no-visible-scrollbar relative max-h-[min(92dvh,720px)] w-full max-w-2xl overflow-hidden overflow-y-auto rounded-3xl border border-violet-500/16 bg-white shadow-[0_18px_48px_rgba(109,40,217,0.14)]">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-7 sm:py-5">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-600">Détail du feedback</p>
            <h3 className="mt-1 truncate text-base font-bold text-slate-950">{row.title || "Activité"}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white/70 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
          >
            Fermer
          </button>
        </div>

        <div className="grid gap-4 px-5 py-5 sm:grid-cols-2 sm:px-7">
          <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Statut</p>
            <p className="mt-2 inline-flex rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700 ring-1 ring-violet-200">
              {formatStatusLabel(row.status)}
            </p>
            <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Date du retour</p>
            <p className="mt-1 text-sm font-medium text-slate-700">{formatDate(row.date)}</p>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Scores</p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-3">
                <p className="text-[11px] font-semibold uppercase text-emerald-700">Score final</p>
                <p className="mt-1 text-lg font-bold text-emerald-700">{finalScore ?? "—"}</p>
              </div>
              <div className="rounded-xl border border-violet-100 bg-violet-50/60 p-3">
                <p className="text-[11px] font-semibold uppercase text-violet-700">Score IA</p>
                <p className="mt-1 text-lg font-bold text-violet-700">{aiScore ?? "—"}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-5 pb-6 sm:px-7">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Feedback complet</p>
          <div className="mt-3 rounded-2xl border border-slate-100 bg-white px-4 py-4 text-sm leading-relaxed text-slate-700 shadow-sm">
            {row.subtitle ? row.subtitle : "Aucun feedback disponible."}
          </div>
        </div>
      </div>
    </div>
  );

  if (typeof document === "undefined") return content;
  return createPortal(content, document.body);
}

export function DataTableCard({ table }: { table: DashboardTable }) {
  const empty = emptyMessages[table.key];
  const hasSubtitleColumn = table.columns.some((column) => column.key === "subtitle");
  const isFeedbackTable = table.key === "feedback";
  const [activeRow, setActiveRow] = useState<DashboardTableRow | null>(null);

  if (isFeedbackTable) {
    const rows = table.rows.slice(0, 8);
    return (
      <article className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm shadow-slate-200/60">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-950">{table.title}</h3>
            {table.description ? <p className="mt-1 text-xs leading-relaxed text-slate-500">{table.description}</p> : null}
          </div>
        </div>

        {rows.length > 0 ? (
          <>
            <div className="hidden overflow-hidden rounded-2xl border border-slate-100 md:block">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    <th className="px-4 py-3">Activité</th>
                    <th className="px-4 py-3">Feedback</th>
                    <th className="px-4 py-3">Statut</th>
                    <th className="px-4 py-3">Scores</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const finalScore = getScoreValue(row, "score", row.primaryValue ?? null);
                    const aiScore = getScoreValue(row, "aiScore", row.secondaryValue ?? null);
                    return (
                      <tr key={`${row.id}-${row.title}`} className="border-b border-slate-50 last:border-0 hover:bg-violet-50/40">
                        <td className="px-4 py-4 align-top">
                          <p className="font-medium text-slate-900">{row.title || "—"}</p>
                        </td>
                        <td className="px-4 py-4 align-top">
                          <p className="line-clamp-2 max-w-sm text-xs text-slate-600">{row.subtitle || "—"}</p>
                        </td>
                        <td className="px-4 py-4 align-top">
                          <StatusBadge value={row.status ?? undefined} type="status" />
                        </td>
                        <td className="px-4 py-4 align-top">
                          <div className="space-y-1 text-xs">
                            <div className="flex items-center justify-between gap-4">
                              <span className="text-slate-400">Final</span>
                              <span className="font-semibold text-slate-700">{finalScore ?? "—"}</span>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                              <span className="text-slate-400">IA</span>
                              <span className="font-semibold text-slate-700">{aiScore ?? "—"}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 align-top">
                          <span className="whitespace-nowrap text-xs font-medium text-slate-500">{formatDate(row.date)}</span>
                        </td>
                        <td className="px-4 py-4 align-top text-right">
                          <button
                            type="button"
                            onClick={() => setActiveRow(row)}
                            className="inline-flex items-center justify-center rounded-full border border-violet-200 bg-white p-2 text-violet-700 transition hover:border-violet-300 hover:bg-violet-50"
                            aria-label="Voir détail"
                            title="Voir détail"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="space-y-3 md:hidden">
              {rows.map((row) => (
                <div key={`${row.id}-${row.title}-card`} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900">{row.title || "—"}</p>
                      <p className="mt-1 line-clamp-2 text-xs text-slate-500">{row.subtitle || "—"}</p>
                    </div>
                    <StatusBadge value={row.status ?? undefined} type="status" />
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                    <span>{formatDate(row.date)}</span>
                    <button
                      type="button"
                      onClick={() => setActiveRow(row)}
                      className="inline-flex items-center justify-center rounded-full border border-violet-200 px-3 py-1 text-violet-700"
                      aria-label="Voir détail"
                      title="Voir détail"
                    >
                      <EyeIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {activeRow ? <FeedbackDetailModal row={activeRow} onClose={() => setActiveRow(null)} /> : null}
          </>
        ) : (
          <EmptyState title={empty?.title} description={empty?.description} />
        )}
      </article>
    );
  }

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
