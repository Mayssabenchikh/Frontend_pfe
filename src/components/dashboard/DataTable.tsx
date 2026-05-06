import { useMemo, useState } from "react";
import type { TableRowDto } from "../../api/dashboardService";
import { EmptyState } from "./EmptyState";
import { ProgressBar } from "./ProgressBar";
import { StatusBadge } from "./StatusBadge";
import { translateDashboardText } from "./dashboardText";

export function DataTable({ title, rows, valueLabel = "Valeur" }: { title: string; rows?: TableRowDto[]; valueLabel?: string }) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const pageSize = 6;
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows ?? [];
    return (rows ?? []).filter((row) => `${row.title} ${row.subtitle ?? ""} ${row.status ?? ""}`.toLowerCase().includes(q));
  }, [query, rows]);
  const pageRows = filtered.slice(page * pageSize, page * pageSize + pageSize);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  return (
    <article className="dashboard-card dashboard-fade-up">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-sm font-extrabold text-slate-900">{translateDashboardText(title)}</h2>
        <input value={query} onChange={(e) => { setQuery(e.target.value); setPage(0); }} placeholder="Rechercher..." className="dashboard-input w-full sm:w-64" />
      </div>
      {filtered.length ? (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-400">
                  <th className="px-3 py-3">Nom</th>
                  <th className="px-3 py-3">Statut</th>
                  <th className="px-3 py-3">{valueLabel}</th>
                  <th className="px-3 py-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((row) => (
                  <tr key={`${row.id}-${row.title}`} className="border-b border-slate-50 transition hover:bg-violet-50/50">
                    <td className="px-3 py-3">
                      <p className="font-bold text-slate-800">{translateDashboardText(row.title)}</p>
                      {row.subtitle ? <p className="mt-0.5 text-xs text-slate-500">{translateDashboardText(row.subtitle)}</p> : null}
                    </td>
                    <td className="px-3 py-3"><StatusBadge status={row.status} /></td>
                    <td className="px-3 py-3">
                      {typeof row.primaryValue === "number" ? <ProgressBar value={row.primaryValue} label="" /> : <span className="text-xs text-slate-400">—</span>}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-xs font-semibold text-slate-500">{formatDate(row.date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs font-bold text-slate-500">
            <span>{filtered.length} résultat{filtered.length > 1 ? "s" : ""}</span>
            <div className="flex items-center gap-2">
              <button type="button" disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))} className="dashboard-page-button">Précédent</button>
              <span>{page + 1}/{totalPages}</span>
              <button type="button" disabled={page + 1 >= totalPages} onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} className="dashboard-page-button">Suivant</button>
            </div>
          </div>
        </>
      ) : (
        <EmptyState />
      )}
    </article>
  );
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}
