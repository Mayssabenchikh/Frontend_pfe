import { useEffect, useMemo, useRef } from "react";
import {
  ModuleRegistry, AllCommunityModule,
  type ColDef, type ICellRendererParams,
} from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";
import { AG_GRID_LOCALE_FR } from "@ag-grid-community/locale";
import { ArrowPathIcon, TrashIcon, ExclamationTriangleIcon, InboxStackIcon } from "../../icons/heroicons/outline";

import type { ArchivedUserDto } from "./types";
import { getAvatarColor } from "./utils";
import { PROJECTS_AG_THEME } from "../../components/projectsAgTheme";
import { syncAgGridColumnSizing } from "../../utils/agGridResponsive";

ModuleRegistry.registerModules([AllCommunityModule]);

type Props = {
  users: ArchivedUserDto[];
  loading: boolean;
  error: string | null;
  restoringId: string | null;
  deletingId: string | null;
  onRestore: (user: ArchivedUserDto) => void;
  onRequestDelete: (user: ArchivedUserDto) => void;
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
        <div className="h-8 w-8 rounded-lg bg-violet-100" />
        <div className="h-8 w-8 rounded-lg bg-violet-100" />
      </div>
    </div>
  );
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("fr-TN", { day: "2-digit", month: "short", year: "numeric" });
}

const AG_THEME = PROJECTS_AG_THEME;

export function ArchivedUsersTable({ users, loading, error, restoringId, deletingId, onRestore, onRequestDelete }: Props) {
  const gridRef = useRef<AgGridReact<ArchivedUserDto> | null>(null);
  const filtered = useMemo(() => users, [users]);

  useEffect(() => {
    const onResize = () => syncAgGridColumnSizing(gridRef.current?.api);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (loading) return;
    const t = window.setTimeout(() => syncAgGridColumnSizing(gridRef.current?.api), 150);
    return () => window.clearTimeout(t);
  }, [loading, users.length]);

  const columnDefs = useMemo<ColDef<ArchivedUserDto>[]>(() => [
    {
      headerName: "Utilisateur",
      field: "firstName",
      flex: 1.5,
      minWidth: 220,
      cellRenderer: (p: ICellRendererParams<ArchivedUserDto>) => {
        const u = p.data;
        if (!u) return null;
        const fullName = `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || u.email;
        const initials = `${u.firstName?.[0] ?? ""}${u.lastName?.[0] ?? ""}`.trim().toUpperCase() || u.email?.[0]?.toUpperCase() || "U";
        const gradient = getAvatarColor(u.email);
        return (
          <div className="flex items-center gap-3">
            {u.avatarUrl ? (
              <img
                src={u.avatarUrl}
                alt={fullName}
                className="w-9 h-9 rounded-full object-cover shrink-0 ring-2 ring-violet-100 opacity-80"
              />
            ) : (
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ring-2 ring-white shadow-sm opacity-90"
                style={{ background: `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})` }}
              >
                {initials}
              </div>
            )}
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="text-sm font-semibold text-slate-800 truncate">{fullName}</span>
              <span className="text-xs text-slate-500 truncate">{u.email}</span>
            </div>
          </div>
        );
      },
    },
    {
      headerName: "Département / Poste",
      field: "department",
      flex: 1.2,
      minWidth: 170,
      cellRenderer: (p: ICellRendererParams<ArchivedUserDto>) => {
        const u = p.data;
        if (!u) return null;
        if (!u.department && !u.jobTitle)
          return <span className="text-xs text-slate-400">—</span>;
        return (
          <div className="flex flex-col gap-0.5">
            {u.department && (
              <span className="text-sm font-semibold text-slate-800">{u.department}</span>
            )}
            {u.jobTitle && (
              <span className="text-xs text-slate-500">{u.jobTitle}</span>
            )}
          </div>
        );
      },
    },
    {
      headerName: "Archivé le",
      field: "archivedAt",
      flex: 0.9,
      minWidth: 140,
      cellRenderer: (p: ICellRendererParams<ArchivedUserDto>) => (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/20 bg-violet-500/10 px-2.5 py-1 text-xs font-medium text-violet-900">
          {formatDate(p.data?.archivedAt)}
        </span>
      ),
    },
    {
      headerName: "Actions",
      flex: 0.7,
      minWidth: 120,
      sortable: false,
      filter: false,
      cellRenderer: (p: ICellRendererParams<ArchivedUserDto>) => {
        const u = p.data;
        if (!u) return null;
        const isRes = restoringId === u.uuid;
        const isDel = deletingId === u.uuid;

        return (
          <div className="flex w-full items-center justify-center gap-1.5">
            {/* Restore button */}
            <button
              type="button"
              title="Restaurer"
              disabled={isRes}
              onClick={() => onRestore(u)}
              className={`inline-flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-40
                ${isRes ? "bg-green-500/10 text-green-700" : "border border-green-500/25 bg-green-500/[0.08] text-green-700 hover:-translate-y-px hover:bg-green-500/15 hover:border-green-500/40 hover:shadow-[0_2px_8px_rgba(34,197,94,0.2)]"}`}
            >
              {isRes ? <span className="text-[10px] font-bold">···</span> : <ArrowPathIcon className="w-3.5 h-3.5" />}
            </button>

            {/* Delete button */}
            <button
              type="button"
              title="Supprimer définitivement"
              disabled={isDel}
              onClick={() => onRequestDelete(u)}
              className={`inline-flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-40
                ${isDel ? "bg-red-500/10 text-red-800" : "border border-red-500/20 bg-red-500/[0.07] text-red-800 hover:-translate-y-px hover:bg-red-500/15 hover:border-red-500/35 hover:shadow-[0_2px_8px_rgba(239,68,68,0.18)]"}`}
            >
              {isDel ? <span className="text-[10px] font-bold">···</span> : <TrashIcon className="w-3.5 h-3.5" />}
            </button>
          </div>
        );
      },
    },
  ], [onRestore, onRequestDelete, restoringId, deletingId]);

  const defaultColDef: ColDef = useMemo(() => ({
    resizable: false,
    sortable: true,
    flex: 1,
    minWidth: 100,
    suppressHeaderMenuButton: true,
  }), []);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center bg-[#f8f7ff] px-6 py-20 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 shadow-sm">
          <ExclamationTriangleIcon className="h-7 w-7 text-red-600" />
        </div>
        <p className="text-sm font-semibold text-red-900">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <style>{AG_THEME}</style>

      {/* Content */}
      {loading ? (
        <div className="flex-1 bg-transparent pt-3">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)}
        </div>
      ) : (
        <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-white">
          <div className="ag-theme-quartz ag-theme-projects absolute inset-0 w-full overflow-hidden">
            <AgGridReact<ArchivedUserDto>
              ref={gridRef}
              theme="legacy"
              localeText={AG_GRID_LOCALE_FR}
              rowData={filtered}
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
                    <p className="text-sm font-bold text-violet-900">Aucun utilisateur archivé</p>
                    <p className="text-xs text-violet-400">
                      Les utilisateurs archivés apparaîtront ici
                    </p>
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