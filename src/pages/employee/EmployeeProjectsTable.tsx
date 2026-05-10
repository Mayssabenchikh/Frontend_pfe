import { useEffect, useMemo, useRef } from "react";
import { ModuleRegistry, AllCommunityModule, type ColDef, type ICellRendererParams } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";
import { AG_GRID_LOCALE_FR } from "@ag-grid-community/locale";
import { EyeIcon, FolderIcon, SparklesIcon, UserGroupIcon } from "../../icons/heroicons/outline";
import type { ProjectDto } from "../../api/projectsApi";
import { PROJECTS_AG_THEME } from "../../components/projectsAgTheme";
import { syncAgGridColumnSizing } from "../../utils/agGridResponsive";

ModuleRegistry.registerModules([AllCommunityModule]);

type Props = {
  rows: ProjectDto[];
  loading: boolean;
  onOpen: (p: ProjectDto) => void;
};

function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 border-b border-violet-100/60 px-6 py-4 animate-pulse">
      <div className="h-9 w-9 shrink-0 rounded-2xl bg-violet-100" />
      <div className="flex flex-1 flex-col gap-2">
        <div className="h-3 w-40 rounded-full bg-violet-100" />
        <div className="h-2.5 w-56 rounded-full bg-violet-50" />
      </div>
      <div className="h-8 w-24 rounded-xl bg-violet-50" />
    </div>
  );
}

function statusLabel(s?: string | null) {
  return s === "ACTIVE" ? "En cours" : s === "CLOSED" ? "Terminé" : "Brouillon";
}

function statusCls(s?: string | null) {
  return s === "ACTIVE"
    ? "border-violet-200 bg-violet-50 text-violet-700"
    : s === "CLOSED"
      ? "border-emerald-200 bg-emerald-50 text-emerald-600"
      : "border-slate-200 bg-slate-50 text-slate-600";
}

function priorityLabel(p?: string | null) {
  return p === "HIGH" ? "Haute" : p === "LOW" ? "Basse" : p === "MEDIUM" ? "Moyenne" : "—";
}

function priorityCls(p?: string | null) {
  return p === "HIGH"
    ? "border-orange-200 bg-orange-50 text-orange-700"
    : p === "LOW"
      ? "border-blue-200 bg-blue-50 text-blue-700"
      : p === "MEDIUM"
        ? "border-violet-200 bg-violet-50 text-violet-700"
        : "border-slate-200 bg-slate-50 text-slate-500";
}

export function EmployeeProjectsTable({ rows, loading, onOpen }: Props) {
  const gridRef = useRef<AgGridReact<ProjectDto> | null>(null);

  useEffect(() => {
    const onResize = () => syncAgGridColumnSizing(gridRef.current?.api);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (loading) return;
    const t = window.setTimeout(() => syncAgGridColumnSizing(gridRef.current?.api), 150);
    return () => window.clearTimeout(t);
  }, [loading, rows.length]);

  const columnDefs = useMemo<ColDef<ProjectDto>[]>(
    () => [
      {
        headerName: "Projet",
        field: "name",
        flex: 1.8,
        minWidth: 260,
        cellRenderer: (p: ICellRendererParams<ProjectDto>) => {
          const row = p.data;
          if (!row) return null;
          return (
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="truncate text-sm font-semibold text-slate-800">{row.name}</span>
              {row.description ? <span className="truncate text-xs text-slate-500">{row.description}</span> : <span className="text-xs text-slate-300">—</span>}
            </div>
          );
        },
      },
      {
        headerName: "Statut",
        field: "status",
        flex: 0.75,
        minWidth: 130,
        cellRenderer: (p: ICellRendererParams<ProjectDto>) => (
          <span className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold ${statusCls(p.data?.status)}`}>
            {statusLabel(p.data?.status)}
          </span>
        ),
      },
      {
        headerName: "Priorité",
        field: "priority",
        flex: 0.75,
        minWidth: 130,
        cellRenderer: (p: ICellRendererParams<ProjectDto>) => (
          <span className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold ${priorityCls(p.data?.priority)}`}>
            {priorityLabel(p.data?.priority)}
          </span>
        ),
      },
      {
        headerName: "Compétences",
        flex: 0.8,
        minWidth: 140,
        sortable: false,
        cellRenderer: (p: ICellRendererParams<ProjectDto>) => (
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-700">
            <SparklesIcon className="h-4 w-4 text-violet-600" />
            {p.data?.requirements?.length ?? 0}
          </span>
        ),
      },
      {
        headerName: "Équipe",
        field: "teamSize",
        flex: 0.65,
        minWidth: 110,
        cellRenderer: (p: ICellRendererParams<ProjectDto>) => (
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-700">
            <UserGroupIcon className="h-4 w-4 text-blue-600" />
            {p.data?.teamSize ?? "—"}
          </span>
        ),
      },
      {
        headerName: "Dates",
        flex: 1,
        minWidth: 210,
        valueGetter: (p) => {
          const s = p.data?.startDate ?? null;
          const d = p.data?.dueDate ?? null;
          return `${s ?? "—"} → ${d ?? "—"}`;
        },
      },
      {
        headerName: "",
        flex: 0.7,
        minWidth: 150,
        sortable: false,
        filter: false,
        cellRenderer: (p: ICellRendererParams<ProjectDto>) => {
          const row = p.data;
          if (!row) return null;
          return (
            <div className="flex w-full items-center justify-center">
              <button
                type="button"
                onClick={() => onOpen(row)}
                className="inline-flex items-center gap-2 rounded-xl border border-violet-200 bg-white px-3 py-2 text-xs font-bold text-violet-700 shadow-sm transition hover:bg-violet-50 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
              >
                <EyeIcon className="h-4 w-4" />
                Détails
              </button>
            </div>
          );
        },
      },
    ],
    [onOpen],
  );

  const defaultColDef: ColDef = useMemo(
    () => ({
      resizable: false,
      sortable: true,
      flex: 1,
      minWidth: 100,
      suppressHeaderMenuButton: true,
    }),
    [],
  );

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <style>{PROJECTS_AG_THEME}</style>
      <style>{`.ag-theme-projects .ag-row { cursor: pointer; }`}</style>
      {loading ? (
        <div className="flex-1  pt-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonRow key={i} />
          ))}
        </div>
      ) : (
        <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-white">
          <div className="ag-theme-quartz ag-theme-projects absolute inset-0 w-full overflow-hidden">
            <AgGridReact<ProjectDto>
              ref={gridRef}
              theme="legacy"
              localeText={AG_GRID_LOCALE_FR}
              rowData={rows}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              onRowClicked={(event) => {
                if (event.data) onOpen(event.data);
              }}
              onGridReady={(e) => syncAgGridColumnSizing(e.api)}
              onGridSizeChanged={(e) => syncAgGridColumnSizing(e.api)}
              pagination
              paginationPageSize={8}
              paginationPageSizeSelector={false}
              suppressCellFocus
              rowHeight={58}
              headerHeight={44}
              domLayout="normal"
              noRowsOverlayComponent={() => (
                <div className="flex flex-col items-center gap-3 py-20">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-violet-500/15 bg-violet-500/10 shadow-sm">
                    <FolderIcon className="h-8 w-8 text-violet-700" />
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <p className="text-sm font-semibold text-violet-900">Aucun projet</p>
                    <p className="text-xs text-violet-400">Les projets auxquels vous êtes affecté apparaîtront ici</p>
                  </div>
                </div>
              )}
            />
          </div>
        </div>
      )}
    </div>
  );
}
