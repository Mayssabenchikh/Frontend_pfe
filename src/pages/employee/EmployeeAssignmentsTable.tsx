import { useMemo } from "react";
import { ModuleRegistry, AllCommunityModule, type ColDef, type ICellRendererParams } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";
import { AG_GRID_LOCALE_FR } from "@ag-grid-community/locale";
import { InboxStackIcon } from "../../icons/heroicons/outline";
import type { AssignmentDto } from "../../api/assignmentsApi";
import { PROJECTS_AG_THEME } from "../../components/projectsAgTheme";

ModuleRegistry.registerModules([AllCommunityModule]);

type Props = {
  rows: AssignmentDto[];
  loading: boolean;
  actingId: number | null;
  onAccept: (a: AssignmentDto) => void;
  onRefuse: (a: AssignmentDto) => void;
};

function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 px-6 py-4 border-b border-violet-100/60 animate-pulse">
      <div className="w-9 h-9 rounded-full bg-violet-100 shrink-0" />
      <div className="flex-1 flex flex-col gap-2">
        <div className="h-3 w-40 rounded-full bg-violet-100" />
        <div className="h-2.5 w-56 rounded-full bg-violet-50" />
      </div>
      <div className="h-8 w-20 rounded-lg bg-violet-100" />
      <div className="h-8 w-20 rounded-lg bg-violet-50" />
    </div>
  );
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("fr-FR");
}

export function EmployeeAssignmentsTable({ rows, loading, actingId, onAccept, onRefuse }: Props) {
  const columnDefs = useMemo<ColDef<AssignmentDto>[]>(
    () => [
      {
        headerName: "Invitation",
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
              <span className="text-xs text-slate-500 truncate">#{a.projectId}</span>
            </div>
          );
        },
      },
      {
        headerName: "Actions",
        flex: 1,
        minWidth: 220,
        sortable: false,
        filter: false,
        cellRenderer: (p: ICellRendererParams<AssignmentDto>) => {
          const a = p.data;
          if (!a) return null;
          const busy = actingId === a.id;
          return (
            <div className="flex items-center justify-center gap-2 w-full">
              <button
                type="button"
                disabled={busy}
                onClick={() => onAccept(a)}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
              >
                {busy ? "…" : "Accepter"}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => onRefuse(a)}
                className="rounded-xl border border-red-200 bg-white px-4 py-2 text-xs font-bold text-red-700 shadow-sm transition hover:bg-red-50 disabled:opacity-50"
              >
                Refuser
              </button>
            </div>
          );
        },
      },
    ],
    [actingId, onAccept, onRefuse],
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
              theme="legacy"
              localeText={AG_GRID_LOCALE_FR}
              rowData={rows}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
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
                    <p className="text-sm font-bold text-violet-900">Aucune invitation</p>
                    <p className="text-xs text-violet-400">Les invitations apparaîtront ici</p>
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

