import { useEffect, useMemo, useRef } from "react";
import { ModuleRegistry, AllCommunityModule, type ColDef, type ICellRendererParams } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";
import { AG_GRID_LOCALE_FR } from "@ag-grid-community/locale";
import { FolderIcon, EyeIcon } from "../../icons/heroicons/outline";
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
    <div className="flex items-center gap-4 px-6 py-4 border-b border-violet-100/60 animate-pulse">
      <div className="w-9 h-9 rounded-2xl bg-violet-100 shrink-0" />
      <div className="flex-1 flex flex-col gap-2">
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
    ? "bg-violet-50 text-violet-700 ring-violet-200"
    : s === "CLOSED"
      ? "bg-emerald-50 text-emerald-600 ring-emerald-200"
      : "bg-slate-50 text-slate-600 ring-slate-200";
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
        minWidth: 240,
        cellRenderer: (p: ICellRendererParams<ProjectDto>) => {
          const row = p.data;
          if (!row) return null;
          return (
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="text-sm font-semibold text-slate-800 truncate">{row.name}</span>
              {row.description ? (
                <span className="text-xs text-slate-500 truncate">{row.description}</span>
              ) : (
                <span className="text-xs text-slate-300">—</span>
              )}
            </div>
          );
        },
      },
      {
        headerName: "Statut",
        field: "status",
        flex: 0.7,
        minWidth: 120,
        cellRenderer: (p: ICellRendererParams<ProjectDto>) => {
          const badgeBase = "inline-flex items-center rounded-md border px-2.5 py-0.5 text-[11px] font-semibold";
          return (
            <span className={`${badgeBase} ${statusCls(p.data?.status)}`}>
              {statusLabel(p.data?.status)}
            </span>
          );
        },
      },
      {
        headerName: "Dates",
        flex: 0.9,
        minWidth: 200,
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
                className="inline-flex items-center gap-2 rounded-xl border border-violet-200 bg-white px-3 py-2 text-xs font-bold text-violet-700 shadow-sm transition hover:bg-violet-50"
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
    <div className="flex flex-col flex-1 overflow-hidden">
      <style>{PROJECTS_AG_THEME}</style>
      {loading ? (
        <div className="flex-1 bg-transparent pt-3">
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
              onGridReady={(e) => syncAgGridColumnSizing(e.api)}
              onGridSizeChanged={(e) => syncAgGridColumnSizing(e.api)}
              pagination
              paginationPageSize={8}
              paginationPageSizeSelector={false}
              suppressCellFocus
              rowHeight={56}
              headerHeight={42}
              domLayout="normal"
              noRowsOverlayComponent={() => (
                <div className="flex flex-col items-center gap-3 py-20">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-violet-500/15 bg-violet-500/10 shadow-sm">
                    <FolderIcon className="h-8 w-8 text-violet-700" />
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <p className="text-sm font-bold text-violet-900">Aucun projet</p>
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

