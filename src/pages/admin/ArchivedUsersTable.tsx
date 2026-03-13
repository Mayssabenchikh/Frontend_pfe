import type React from "react";
import { useMemo, useState } from "react";
import {
  ModuleRegistry, AllCommunityModule,
  type ColDef, type ICellRendererParams,
} from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";
import { AG_GRID_LOCALE_FR } from "@ag-grid-community/locale";
import { MagnifyingGlassIcon, ArrowPathIcon, TrashIcon, ArchiveBoxIcon } from "@heroicons/react/24/outline";

import type { ArchivedUserDto } from "./types";
import { getAvatarColor } from "./utils";

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

const AG_THEME = `
  .ag-theme-archived {
    --ag-background-color: #f8f7ff;
    --ag-header-background-color: rgba(139,92,246,0.06);
    --ag-odd-row-background-color: #f8f7ff;
    --ag-even-row-background-color: #f8f7ff;
    --ag-row-hover-color: #ede9fe;
    --ag-selected-row-background-color: #ede9fe;
    --ag-border-color: #e5e1f8;
    --ag-header-foreground-color: #4c1d95;
    --ag-font-size: 14px;
    --ag-cell-horizontal-padding: 20px;
    --ag-row-height: 60px;
    --ag-header-height: 44px;
    --ag-borders: none;
    --ag-row-border-style: solid;
    --ag-row-border-width: 1px;
    --ag-row-border-color: #ede9fe;
    --ag-header-column-separator-display: none;
  }

  .ag-theme-archived .ag-root-wrapper {
    border: none;
    border-radius: 0;
  }

  .ag-theme-archived .ag-header {
    border-bottom: 1px solid #ddd6fe;
  }

  .ag-theme-archived .ag-header-cell-label {
    font-size: 10.5px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: #5b21b6;
  }

  .ag-theme-archived .ag-header-cell:hover .ag-header-cell-label {
    color: #3b0764;
  }

  .ag-theme-archived .ag-row {
    transition: background 0.15s ease;
  }

  .ag-theme-archived .ag-row:last-child {
    border-bottom: none;
  }

  .ag-theme-archived .ag-cell {
    display: flex !important;
    align-items: center !important;
    line-height: normal !important;
  }

  .ag-theme-archived .ag-cell-wrapper {
    width: 100%;
    display: flex;
    align-items: center;
  }

  .ag-theme-archived .ag-paging-panel {
    border-top: 1px solid rgba(139,92,246,0.1);
    background: rgba(139,92,246,0.04);
    color: #5b21b6;
    font-size: 12px;
    font-weight: 500;
    padding: 0 20px;
    height: 44px;
  }

  .ag-theme-archived .ag-paging-button {
    color: #5b21b6;
  }

  .ag-theme-archived .ag-paging-button:hover:not(:disabled) {
    color: #3b0764;
    background: #ede9fe;
    border-radius: 6px;
  }

  .ag-theme-archived .ag-sort-indicator-icon {
    color: #7c3aed;
  }
`;

export function ArchivedUsersTable({ users, loading, error, restoringId, deletingId, onRestore, onRequestDelete }: Props) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() =>
    users.filter((u) => {
      const fullName = `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim();
      const haystack = [fullName, u.email, u.role, u.department ?? "", u.jobTitle ?? ""].join(" ").toLowerCase();
      return haystack.includes(search.toLowerCase());
    }),
    [users, search]
  );

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
        const isRes = restoringId === u.id;
        const isDel = deletingId === u.id;

        return (
          <div className="flex items-center gap-1.5">
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
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 text-2xl shadow-sm">
          ⚠
        </div>
        <p className="text-sm font-semibold text-red-900">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <style>{AG_THEME}</style>

      {/* Top banner */}
      <div className="flex items-center gap-3 border-b border-amber-400/30 bg-gradient-to-r from-amber-400/10 to-amber-400/5 px-6 py-3">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-amber-400/30 bg-amber-400/20">
          <ArchiveBoxIcon className="w-3.5 h-3.5 text-amber-800" />
        </div>
        <span className="text-xs font-medium text-amber-900">
          Les utilisateurs archivés ne peuvent plus se connecter.
          Vous pouvez les restaurer à tout moment ou les supprimer définitivement.
        </span>
      </div>

      {/* Search bar */}
      <div className="flex items-center gap-3 border-b border-violet-500/10 px-6 py-3 pb-5">
        <div className="relative max-w-sm flex-1">
          <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-violet-400" />
          <input
            type="search"
            placeholder="Rechercher dans les archives…"
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-violet-500/20 bg-white py-2.5 pl-9 pr-4 text-sm text-violet-900 outline-none transition-all duration-150 focus:border-violet-600 focus:ring-2 focus:ring-violet-500/20"
          />
        </div>

        {/* Count badge */}
        <span className="ml-auto rounded-full border border-violet-500/15 bg-violet-500/10 px-3 py-1.5 text-xs font-semibold text-violet-800">
          {filtered.length} archivé{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex-1 bg-[#f8f7ff] px-6 pt-4">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)}
        </div>
      ) : (
        <div className="flex flex-1 flex-col overflow-hidden bg-[#f8f7ff] px-6 pt-4">
          <div className="ag-theme-quartz ag-theme-archived flex-1 w-full overflow-hidden">
            <AgGridReact<ArchivedUserDto>
              theme="legacy"
              localeText={AG_GRID_LOCALE_FR}
              rowData={filtered}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              pagination
              paginationPageSize={15}
              paginationPageSizeSelector={false}
              suppressCellFocus
              rowHeight={56}
              headerHeight={44}
              domLayout="normal"
              noRowsOverlayComponent={() => (
                <div className="flex flex-col items-center gap-3 py-20">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-violet-500/15 bg-violet-500/10 text-3xl">
                    📭
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <p className="text-sm font-bold text-violet-900">Aucun utilisateur archivé</p>
                    <p className="text-xs text-violet-400">
                      {search ? "Aucun résultat pour cette recherche" : "Les utilisateurs archivés apparaîtront ici"}
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