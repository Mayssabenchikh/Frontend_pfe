import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ModuleRegistry, AllCommunityModule, type ColDef, type ICellRendererParams } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";
import { AG_GRID_LOCALE_FR } from "@ag-grid-community/locale";
import { projectsApi, type ProjectDto, type ProjectPage } from "../../api/projectsApi";
import { FiltersPanel } from "../../components/FiltersPanel";
import { PROJECTS_AG_THEME } from "../../components/projectsAgTheme";
import { InboxStackIcon } from "../../icons/heroicons/outline";

ModuleRegistry.registerModules([AllCommunityModule]);

export function AdminProjectsReadonly() {
  const GRID_PAGE_SIZE = 12;
  const gridRef = useRef<AgGridReact<ProjectDto> | null>(null);

  const [items, setItems] = useState<ProjectDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [order, setOrder] = useState<"recent" | "oldest">("recent");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const load = useCallback(() => {
    setLoading(true);
    projectsApi
      .list({
        search: search || undefined,
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
        from: from || undefined,
        to: to || undefined,
        order,
        page,
        size: GRID_PAGE_SIZE,
      })
      .then((res) => {
        const data = res.data as ProjectPage;
        setItems(data.content ?? []);
        setTotalPages(data.totalPages ?? 0);
      })
      .catch(() => {
        setItems([]);
        setTotalPages(0);
      })
      .finally(() => setLoading(false));
  }, [search, statusFilter, priorityFilter, from, to, order, page]);

  useEffect(() => {
    setPage(0);
  }, [search, statusFilter, priorityFilter, from, to, order]);

  useEffect(() => {
    const t = window.setTimeout(() => load(), 250);
    return () => window.clearTimeout(t);
  }, [load]);

  const statusLabel = (s?: string | null) => (s === "ACTIVE" ? "En cours" : s === "CLOSED" ? "Terminé" : "Brouillon");
  const statusCls = (s?: string | null) =>
    s === "ACTIVE" ? "bg-violet-50 text-violet-700 ring-violet-200" : s === "CLOSED" ? "bg-emerald-50 text-emerald-600 ring-emerald-200" : "bg-slate-50 text-slate-600 ring-slate-200";

  const priorityLabel = (p?: string | null) => (p === "HIGH" ? "Haute" : p === "LOW" ? "Basse" : "Moyenne");
  const priorityCls = (p?: string | null) =>
    p === "HIGH" ? "bg-amber-50 text-amber-600 ring-amber-200" : p === "LOW" ? "bg-slate-50 text-slate-600 ring-slate-200" : "bg-indigo-50 text-indigo-600 ring-indigo-200";

  const safeTotalPages = Math.max(totalPages, 1);

  const columnDefs = useMemo<ColDef<ProjectDto>[]>(() => {
    const badgeBase = "inline-flex items-center rounded-md border px-2.5 py-0.5 text-[11px] font-semibold";
    return [
      {
        headerName: "Projet",
        field: "name",
        flex: 1.8,
        minWidth: 220,
        cellRenderer: (p: ICellRendererParams<ProjectDto>) => {
          const row = p.data;
          if (!row) return null;
          return (
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="text-sm font-semibold text-slate-800 truncate">{row.name}</span>
              {row.description ? <span className="text-xs text-slate-500 truncate">{row.description}</span> : <span className="text-xs text-slate-300">—</span>}
            </div>
          );
        },
      },
      {
        headerName: "Lead",
        field: "leadName",
        flex: 1.1,
        minWidth: 180,
        cellRenderer: (p: ICellRendererParams<ProjectDto>) => {
          const row = p.data;
          if (!row) return null;
          return (
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="text-sm font-semibold text-slate-800 truncate">{row.leadName || "—"}</span>
              <span className="text-xs text-slate-500 truncate">{row.leadEmail || "—"}</span>
            </div>
          );
        },
      },
      {
        headerName: "Statut",
        field: "status",
        flex: 0.7,
        minWidth: 120,
        cellRenderer: (p: ICellRendererParams<ProjectDto>) => (
          <span className={`${badgeBase} ${statusCls(p.data?.status)}`}>{statusLabel(p.data?.status)}</span>
        ),
      },
      {
        headerName: "Priorité",
        field: "priority",
        flex: 0.7,
        minWidth: 120,
        cellRenderer: (p: ICellRendererParams<ProjectDto>) => (
          <span className={`${badgeBase} ${priorityCls(p.data?.priority)}`}>{priorityLabel(p.data?.priority)}</span>
        ),
      },
      {
        headerName: "Créé le",
        field: "createdAt",
        flex: 0.8,
        minWidth: 120,
        valueFormatter: (p) => (p.value ? new Date(String(p.value)).toLocaleDateString("fr-FR") : "—"),
      },
    ];
  }, []);

  const defaultColDef: ColDef = useMemo(
    () => ({
      resizable: true,
      sortable: true,
      flex: 1,
      minWidth: 100,
      suppressHeaderMenuButton: true,
    }),
    [],
  );

  return (
    <section className="flex min-h-0 w-full flex-1 flex-col overflow-hidden bg-[#f8f7ff]">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[#f8f7ff] px-6 py-4">
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
          <FiltersPanel
            title="Projets"
            resultsLabel={loading ? "…" : `${items.length} résultat${items.length !== 1 ? "s" : ""}`}
            onReset={() => {
              setSearch("");
              setStatusFilter("");
              setPriorityFilter("");
              setFrom("");
              setTo("");
              setOrder("recent");
            }}
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
              <div className="lg:col-span-2">
                <label className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Recherche</label>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Nom ou description…"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/15"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Statut</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="mt-1 w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/15"
                >
                  <option value="">Tous</option>
                  <option value="DRAFT">Brouillon</option>
                  <option value="ACTIVE">En cours</option>
                  <option value="CLOSED">Terminé</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Priorité</label>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="mt-1 w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/15"
                >
                  <option value="">Toutes</option>
                  <option value="LOW">Basse</option>
                  <option value="MEDIUM">Moyenne</option>
                  <option value="HIGH">Haute</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Du</label>
                <input
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/15"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Au</label>
                <input
                  type="date"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/15"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Ordre</label>
                <select
                  value={order}
                  onChange={(e) => setOrder(e.target.value as any)}
                  className="mt-1 w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/15"
                >
                  <option value="recent">Plus récent</option>
                  <option value="oldest">Plus ancien</option>
                </select>
              </div>
            </div>
          </FiltersPanel>

          <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_10px_28px_rgba(15,23,42,0.06)]">
            <style>{PROJECTS_AG_THEME}</style>
            <div className="ag-theme-quartz ag-theme-projects absolute inset-0">
              <AgGridReact<ProjectDto>
                ref={gridRef}
                theme="legacy"
                localeText={AG_GRID_LOCALE_FR}
                rowData={items}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                onGridReady={(e) => e.api.sizeColumnsToFit()}
                onGridSizeChanged={(e) => e.api.sizeColumnsToFit()}
                pagination
                paginationPageSize={8}
                paginationPageSizeSelector={false}
                suppressCellFocus
                rowHeight={56}
                headerHeight={42}
                noRowsOverlayComponent={() => (
                  <div className="flex flex-col items-center gap-3 py-20">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-violet-500/15 bg-violet-500/10 shadow-sm">
                      <InboxStackIcon className="h-8 w-8 text-violet-700" />
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <p className="text-sm font-bold text-violet-900">Aucun projet</p>
                      <p className="text-xs text-violet-400">Les projets apparaîtront ici</p>
                    </div>
                  </div>
                )}
              />
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>
                Page <span className="font-semibold text-slate-700">{page + 1}</span> / {safeTotalPages}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page <= 0}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 font-semibold text-slate-700 shadow-sm disabled:opacity-50"
                >
                  Précédent
                </button>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(safeTotalPages - 1, p + 1))}
                  disabled={page >= safeTotalPages - 1}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 font-semibold text-slate-700 shadow-sm disabled:opacity-50"
                >
                  Suivant
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

