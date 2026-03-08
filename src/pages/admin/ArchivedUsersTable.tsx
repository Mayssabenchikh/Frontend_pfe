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
                className="w-9 h-9 rounded-full object-cover shrink-0 ring-2 ring-violet-100"
                style={{ opacity: 0.8 }}
              />
            ) : (
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ring-2 ring-white shadow-sm"
                style={{
                  background: `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})`,
                  opacity: 0.85,
                }}
              >
                {initials}
              </div>
            )}
            <div className="flex flex-col gap-0.5 min-w-0">
              {/* darker: #2e1065 instead of #3b1f6e */}
              <span
                className="text-sm font-semibold truncate"
                style={{ color: "#1e293b", fontSize: 14 }}
              >
                {fullName}
              </span>
              <span
                className="text-xs truncate"
                style={{ color: "#64748b", fontSize: 12 }}
              >
                {u.email}
              </span>
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
          return <span style={{ color: "#94a3b8", fontSize: 12 }}>—</span>;
        return (
          <div className="flex flex-col gap-0.5">
            {u.department && (
              <span style={{ fontSize: 14, fontWeight: 600, color: "#1e293b" }}>
                {u.department}
              </span>
            )}
            {u.jobTitle && (
              <span style={{ fontSize: 12, color: "#64748b" }}>
                {u.jobTitle}
              </span>
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
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
          style={{
            background: "rgba(109,40,217,0.1)",
            // darker date text
            color: "#4c1d95",
            border: "1px solid rgba(109,40,217,0.2)",
          }}
        >
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
              className="group relative w-8 h-8 rounded-lg inline-flex items-center justify-center transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: isRes ? "rgba(34,197,94,0.1)" : "rgba(34,197,94,0.08)",
                border: "1px solid rgba(34,197,94,0.25)",
                // darker green icon
                color: "#15803d",
              }}
              onMouseEnter={e => {
                if (!isRes) {
                  (e.currentTarget as HTMLButtonElement).style.background = "rgba(34,197,94,0.15)";
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(34,197,94,0.4)";
                  (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 2px 8px rgba(34,197,94,0.2)";
                }
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.background = "rgba(34,197,94,0.08)";
                (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(34,197,94,0.25)";
                (e.currentTarget as HTMLButtonElement).style.transform = "";
                (e.currentTarget as HTMLButtonElement).style.boxShadow = "";
              }}
            >
              {isRes
                ? <span style={{ fontSize: 10, fontWeight: 700, color: "#15803d" }}>···</span>
                : <ArrowPathIcon className="w-3.5 h-3.5" />
              }
            </button>

            {/* Delete button */}
            <button
              type="button"
              title="Supprimer définitivement"
              disabled={isDel}
              onClick={() => onRequestDelete(u)}
              className="w-8 h-8 rounded-lg inline-flex items-center justify-center transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: isDel ? "rgba(239,68,68,0.1)" : "rgba(239,68,68,0.07)",
                border: "1px solid rgba(239,68,68,0.2)",
                // darker red icon
                color: "#b91c1c",
              }}
              onMouseEnter={e => {
                if (!isDel) {
                  (e.currentTarget as HTMLButtonElement).style.background = "rgba(239,68,68,0.14)";
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(239,68,68,0.35)";
                  (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 2px 8px rgba(239,68,68,0.18)";
                }
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.background = "rgba(239,68,68,0.07)";
                (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(239,68,68,0.2)";
                (e.currentTarget as HTMLButtonElement).style.transform = "";
                (e.currentTarget as HTMLButtonElement).style.boxShadow = "";
              }}
            >
              {isDel
                ? <span style={{ fontSize: 10, fontWeight: 700, color: "#b91c1c" }}>···</span>
                : <TrashIcon className="w-3.5 h-3.5" />
              }
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
      <div className="flex flex-col items-center justify-center py-20 px-6 text-center"
        style={{ background: "#f8f7ff" }}
      >
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 text-2xl shadow-sm"
          style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}
        >
          ⚠
        </div>
        <p className="text-sm font-semibold" style={{ color: "#7f1d1d" }}>{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <style>{AG_THEME}</style>

      {/* Top banner */}
      <div
        className="flex items-center gap-3 px-6 py-3"
        style={{
          background: "linear-gradient(90deg, rgba(251,191,36,0.12) 0%, rgba(251,191,36,0.06) 100%)",
          borderBottom: "1px solid rgba(251,191,36,0.3)",
        }}
      >
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: "rgba(251,191,36,0.18)", border: "1px solid rgba(251,191,36,0.3)" }}
        >
          <ArchiveBoxIcon className="w-3.5 h-3.5" style={{ color: "#92400e" }} />
        </div>
        {/* darker amber text in banner */}
        <span className="text-xs font-medium" style={{ color: "#78350f" }}>
          Les utilisateurs archivés ne peuvent plus se connecter.
          Vous pouvez les restaurer à tout moment ou les supprimer définitivement.
        </span>
      </div>

      {/* Search bar */}
      <div
        className="flex items-center gap-3 px-6 py-3 pb-5"
        style={{ borderBottom: "1px solid rgba(139,92,246,0.1)" }}
      >
        <div className="relative flex-1 max-w-sm">
          <MagnifyingGlassIcon
            className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-violet-400"
          />
          <input
            type="search"
            placeholder="Rechercher dans les archives…"
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            className="w-full rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none transition-all duration-150"
            style={{
              border: "1px solid rgba(139,92,246,0.2)",
              background: "#fff",
              color: "#4c1d95",
            }}
            onFocus={e => {
              e.currentTarget.style.borderColor = "#7c3aed";
              e.currentTarget.style.boxShadow = "0 0 0 3px rgba(139,92,246,0.12)";
            }}
            onBlur={e => {
              e.currentTarget.style.borderColor = "rgba(139,92,246,0.3)";
              e.currentTarget.style.boxShadow = "0 1px 3px rgba(139,92,246,0.08)";
            }}
          />
        </div>

        {/* Count badge */}
        <span
          className="ml-auto text-xs font-semibold px-3 py-1.5 rounded-full"
          style={{
            background: "rgba(139,92,246,0.08)",
            color: "#5b21b6",
            border: "1px solid rgba(139,92,246,0.12)",
          }}
        >
          {filtered.length} archivé{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex-1 px-6 pt-4" style={{ background: "#f8f7ff" }}>
          {Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)}
        </div>
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden px-6 pt-4" style={{ background: "#f8f7ff" }}>
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
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
                    style={{
                      background: "rgba(109,40,217,0.07)",
                      border: "1px solid rgba(109,40,217,0.15)",
                    }}
                  >
                    📭
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <p className="text-sm font-bold" style={{ color: "#4c1d95" }}>Aucun utilisateur archivé</p>
                    <p className="text-xs" style={{ color: "#a78bfa" }}>
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