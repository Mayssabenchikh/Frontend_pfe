import { useEffect, useMemo, useRef } from "react";
import { ModuleRegistry, AllCommunityModule, type ColDef, type ICellRendererParams } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";
import { AG_GRID_LOCALE_FR } from "@ag-grid-community/locale";
import { InboxStackIcon } from "../../icons/heroicons/outline";
import type { AssignmentDto } from "../../api/assignmentsApi";
import { PROJECTS_AG_THEME } from "../../components/projectsAgTheme";
import { syncAgGridColumnSizing } from "../../utils/agGridResponsive";

ModuleRegistry.registerModules([AllCommunityModule]);

type Props = {
  rows: AssignmentDto[];
  loading: boolean;
};

function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 px-6 py-4 border-b border-violet-100/60 animate-pulse">
      <div className="w-9 h-9 rounded-full bg-violet-100 shrink-0" />
      <div className="flex-1 flex flex-col gap-2">
        <div className="h-3 w-40 rounded-full bg-violet-100" />
        <div className="h-2.5 w-56 rounded-full bg-violet-50" />
      </div>
    </div>
  );
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("fr-FR");
}

export function EmployeeAssignmentsTable({ rows, loading }: Props) {
  const gridRef = useRef<AgGridReact<AssignmentDto> | null>(null);

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

  const columnDefs = useMemo<ColDef<AssignmentDto>[]>(
    () => [
      {
        headerName: "Date d'affectation",
        field: "invitedAt",
        flex: 1,
        minWidth: 180,
        valueFormatter: (p) => (p.value ? formatDateTime(String(p.value)) : "—"),
      },
      {
        headerName: "Projet",
        field: "projectName",
        flex: 1.8,
        minWidth: 240,
        cellRenderer: (p: ICellRendererParams<AssignmentDto>) => {
          const a = p.data;
          if (!a) return null;
          return (
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="text-sm font-semibold text-slate-800 truncate">{a.projectName}</span>
              <span className="text-xs text-slate-500 truncate">#{a.projectUuid}</span>
            </div>
          );
        },
      },
      {
        headerName: "Début — fin",
        flex: 1.2,
        minWidth: 160,
        sortable: false,
        valueGetter: (p) => {
          const a = p.data;
          if (!a) return "";
          const s = a.projectStartDate ?? "—";
          const e = a.projectDueDate ?? "—";
          return `${s} → ${e}`;
        },
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
            <AgGridReact<AssignmentDto>
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
                    <p className="text-sm font-bold text-violet-900">Aucune affectation</p>
                    <p className="text-xs text-violet-400">Vos projets affectés apparaîtront ici</p>
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
