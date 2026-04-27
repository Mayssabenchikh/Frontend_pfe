import { useEffect, useMemo, useRef } from "react";
import { ModuleRegistry, AllCommunityModule, type ColDef, type ICellRendererParams } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";
import { AG_GRID_LOCALE_FR } from "@ag-grid-community/locale";
import { InboxStackIcon, ExclamationTriangleIcon } from "../../icons/heroicons/outline";
import type { AssignmentEventDto } from "../../api/assignmentsApi";
import { PROJECTS_AG_THEME } from "../../components/projectsAgTheme";
import { syncAgGridColumnSizing } from "../../utils/agGridResponsive";

ModuleRegistry.registerModules([AllCommunityModule]);

type Props = {
  rows: AssignmentEventDto[];
  loading: boolean;
  error: string | null;
};

function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 px-6 py-4 border-b border-violet-100/60 animate-pulse">
      <div className="w-9 h-9 rounded-full bg-violet-100 shrink-0" />
      <div className="flex-1 flex flex-col gap-2">
        <div className="h-3 w-32 rounded-full bg-violet-100" />
        <div className="h-2.5 w-48 rounded-full bg-violet-50" />
      </div>
      <div className="h-5 w-24 rounded-full bg-violet-100" />
      <div className="flex gap-2">
        <div className="h-8 w-20 rounded-lg bg-violet-100" />
        <div className="h-8 w-20 rounded-lg bg-violet-50" />
      </div>
    </div>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("fr-FR");
}

function actionToFrench(action: unknown): string {
  const value = String(action ?? "").toUpperCase();
  if (value === "ASSIGNED") return "Affecté";
  if (value === "ACCEPTED") return "Affectation confirmée";
  if (value === "REFUSED") return "Refusé";
  if (value === "REMOVED") return "Retiré";
  return String(action ?? "—");
}

export function AssignmentEventsTable({ rows, loading, error }: Props) {
  const gridRef = useRef<AgGridReact<AssignmentEventDto> | null>(null);

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

  const columnDefs = useMemo<ColDef<AssignmentEventDto>[]>(
    () => [
      {
        headerName: "Date",
        field: "createdAt",
        flex: 1,
        minWidth: 170,
        valueFormatter: (p) => (p.value ? formatDate(String(p.value)) : "—"),
      },
      {
        headerName: "Projet",
        field: "projectName",
        flex: 1.4,
        minWidth: 200,
        cellRenderer: (p: ICellRendererParams<AssignmentEventDto>) => {
          const e = p.data;
          if (!e) return null;
          return (
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="text-sm font-semibold text-slate-800 truncate">{e.projectName || `#${e.projectUuid}`}</span>
              <span className="text-xs text-slate-500 truncate">#{e.projectUuid}</span>
            </div>
          );
        },
      },
      {
        headerName: "Employé",
        field: "employeeName",
        flex: 1.5,
        minWidth: 240,
        cellRenderer: (p: ICellRendererParams<AssignmentEventDto>) => {
          const e = p.data;
          if (!e) return null;
          return (
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="text-sm font-semibold text-slate-800 truncate">{e.employeeName}</span>
              <span className="text-xs text-slate-500 truncate">{e.employeeEmail}</span>
            </div>
          );
        },
      },
      {
        headerName: "Action",
        field: "action",
        flex: 0.9,
        minWidth: 140,
        cellRenderer: (p: ICellRendererParams<AssignmentEventDto>) => (
          <span className="inline-flex items-center rounded-full border border-violet-500/20 bg-violet-500/10 px-2.5 py-1 text-xs font-semibold text-violet-900">
            {actionToFrench(p.value)}
          </span>
        ),
      },
      {
        headerName: "Actor",
        field: "actorRole",
        flex: 0.7,
        minWidth: 120,
        valueFormatter: (p) => String(p.value ?? "—"),
      },
      {
        headerName: "Motif",
        field: "reason",
        flex: 1.4,
        minWidth: 220,
        valueFormatter: (p) => String(p.value ?? "—"),
      },
      {
        headerName: "Rang",
        field: "snapshotRank",
        flex: 0.7,
        minWidth: 120,
        valueFormatter: (p) => (p.value ? `Rang ${p.value}` : "—"),
      },
    ],
    [],
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

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center bg-[#f8f7ff] px-6 py-20 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 text-2xl shadow-sm">
          <ExclamationTriangleIcon className="h-7 w-7 text-red-600" />
        </div>
        <p className="text-sm font-semibold text-red-900">{error}</p>
      </div>
    );
  }

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
            <AgGridReact<AssignmentEventDto>
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
                    <InboxStackIcon className="h-8 w-8 text-violet-700" />
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <p className="text-sm font-bold text-violet-900">Aucun historique</p>
                    <p className="text-xs text-violet-400">Les événements apparaîtront ici</p>
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

