import type React from "react";
import { useMemo, useState } from "react";
import {
  ModuleRegistry, AllCommunityModule,
  type ColDef, type ICellRendererParams,
} from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";
import { Search, RotateCcw, Trash2, X, ArchiveIcon } from "lucide-react";

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
  onDeletePermanently: (user: ArchivedUserDto) => void;
};

function SkeletonRow() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16, borderBottom: "1px solid #f1f5f9", padding: "14px 24px", animation: "pulse 1.5s ease-in-out infinite" }}>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
      <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#e8edf5", flexShrink: 0 }} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ height: 12, width: 120, borderRadius: 6, background: "#e8edf5" }} />
        <div style={{ height: 10, width: 180, borderRadius: 6, background: "#f1f5f9" }} />
      </div>
      <div style={{ height: 20, width: 80, borderRadius: 8, background: "#e8edf5" }} />
      <div style={{ display: "flex", gap: 8 }}>
        <div style={{ height: 28, width: 80, borderRadius: 8, background: "#e8edf5" }} />
        <div style={{ height: 28, width: 100, borderRadius: 8, background: "#e8edf5" }} />
      </div>
    </div>
  );
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("fr-TN", { day: "2-digit", month: "short", year: "numeric" });
}

export function ArchivedUsersTable({ users, loading, error, restoringId, deletingId, onRestore, onDeletePermanently }: Props) {
  const [search, setSearch] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

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
      headerName: "Utilisateur", field: "firstName", flex: 1.4, minWidth: 200,
      cellRenderer: (p: ICellRendererParams<ArchivedUserDto>) => {
        const u = p.data; if (!u) return null;
        const fullName = `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || u.email;
        const initials = `${u.firstName?.[0] ?? ""}${u.lastName?.[0] ?? ""}`.trim().toUpperCase() || u.email?.[0]?.toUpperCase() || "U";
        const gradient = getAvatarColor(u.email);
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {u.avatarUrl ? (
              <img src={u.avatarUrl} alt={fullName} style={{ width: 34, height: 34, borderRadius: "50%", objectFit: "cover", flexShrink: 0, opacity: 0.7, boxShadow: "0 2px 8px rgba(0,0,0,0.10)" }} />
            ) : (
              <div style={{ width: 34, height: 34, borderRadius: "50%", background: `linear-gradient(135deg,${gradient[0]},${gradient[1]})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#fff", flexShrink: 0, opacity: 0.7 }}>
                {initials}
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#64748b" }}>{fullName}</span>
              <span style={{ fontSize: 11, color: "#94a3b8" }}>{u.email}</span>
            </div>
          </div>
        );
      },
    },
    {
      headerName: "Département / Poste", field: "department", flex: 1.2, minWidth: 160,
      cellRenderer: (p: ICellRendererParams<ArchivedUserDto>) => {
        const u = p.data; if (!u) return null;
        if (!u.department && !u.jobTitle) return <span style={{ fontSize: 12, color: "#cbd5e1" }}>—</span>;
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {u.department && <span style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8" }}>{u.department}</span>}
            {u.jobTitle && <span style={{ fontSize: 11, color: "#b0b8cc" }}>{u.jobTitle}</span>}
          </div>
        );
      },
    },
    {
      headerName: "Archivé le", field: "archivedAt", flex: 0.9, minWidth: 130,
      cellRenderer: (p: ICellRendererParams<ArchivedUserDto>) => (
        <span style={{ fontSize: 12, color: "#94a3b8" }}>{formatDate(p.data?.archivedAt)}</span>
      ),
    },
    {
      headerName: "Actions", flex: 0.8, minWidth: 160, sortable: false, filter: false,
      cellRenderer: (p: ICellRendererParams<ArchivedUserDto>) => {
        const u = p.data; if (!u) return null;
        const isRes = restoringId === u.id;
        const isDel = deletingId === u.id;
        const isConfirming = confirmDeleteId === u.id;

        const iconBtn = (
          color: string, hoverBg: string, hoverColor: string,
          title: string, disabled: boolean,
          onClick: () => void,
          children: React.ReactNode
        ) => (
          <button
            type="button" title={title} onClick={onClick} disabled={disabled}
            style={{
              width: 32, height: 32, borderRadius: 8,
              border: "1px solid #e8edf5", background: "#fff",
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              cursor: disabled ? "not-allowed" : "pointer",
              opacity: disabled ? 0.45 : 1,
              color, transition: "all 0.15s", flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              if (!disabled) {
                e.currentTarget.style.background = hoverBg;
                e.currentTarget.style.borderColor = hoverBg;
                e.currentTarget.style.color = hoverColor;
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow = `0 3px 8px ${hoverBg}80`;
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#fff";
              e.currentTarget.style.borderColor = "#e8edf5";
              e.currentTarget.style.color = color;
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            {children}
          </button>
        );

        return (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 4 }}>
            {iconBtn("#22c55e", "#dcfce7", "#15803d", "Restaurer", isRes, () => onRestore(u),
              isRes ? <span style={{ fontSize: 10 }}>…</span> : <RotateCcw size={13} strokeWidth={2} />
            )}

            {isConfirming ? (
              <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                <button
                  type="button"
                  onClick={() => { setConfirmDeleteId(null); onDeletePermanently(u); }}
                  disabled={isDel}
                  style={{
                    height: 32, borderRadius: 8, border: "none",
                    background: "linear-gradient(135deg,#ef4444,#dc2626)",
                    padding: "0 12px", fontSize: 11, fontWeight: 700, color: "#fff",
                    cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 5,
                    boxShadow: "0 2px 8px rgba(239,68,68,0.4)",
                  }}
                >
                  <Trash2 size={11} strokeWidth={2.5} /> Confirmer
                </button>
                <button
                  type="button" onClick={() => setConfirmDeleteId(null)}
                  style={{
                    width: 32, height: 32, borderRadius: 8,
                    border: "1px solid #e8edf5", background: "#fff",
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer", color: "#94a3b8",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#f1f5f9"; e.currentTarget.style.color = "#475569"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.color = "#94a3b8"; }}
                >
                  <X size={13} strokeWidth={2} />
                </button>
              </div>
            ) : (
              iconBtn("#ef4444", "#fee2e2", "#dc2626", "Supprimer définitivement", isDel, () => setConfirmDeleteId(u.id),
                isDel ? <span style={{ fontSize: 10 }}>…</span> : <Trash2 size={13} strokeWidth={2} />
              )
            )}
          </div>
        );
      },
    },
  ], [onRestore, onDeletePermanently, restoringId, deletingId, confirmDeleteId]);

  const defaultColDef: ColDef = useMemo(() => ({ resizable: true, sortable: true, flex: 1, minWidth: 100, suppressHeaderMenuButton: true }), []);

  if (error) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "64px 24px", textAlign: "center" }}>
        <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#fef2f2", border: "1px solid #fecaca", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12, color: "#ef4444", fontSize: 20 }}>⚠</div>
        <p style={{ fontSize: 13, fontWeight: 600, color: "#991b1b" }}>{error}</p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
      {/* Banner info */}
      <div style={{ padding: "10px 24px", background: "#fffbeb", borderBottom: "1px solid #fde68a", display: "flex", alignItems: "center", gap: 10 }}>
        <ArchiveIcon size={15} strokeWidth={2} color="#b45309" style={{ flexShrink: 0 }} />
        <span style={{ fontSize: 12, color: "#92400e" }}>
          Les utilisateurs archivés ne peuvent plus se connecter. Vous pouvez les restaurer à tout moment ou les supprimer définitivement.
        </span>
      </div>

      {/* Filter bar */}
      <div style={{ display: "flex", gap: 12, padding: "14px 24px", background: "#fafbff", borderBottom: "1px solid #e8edf5" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#b0b8cc", pointerEvents: "none" }}>
            <Search size={14} />
          </span>
          <input
            type="search" placeholder="Rechercher dans les archives…"
            value={search} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            onFocus={() => setSearchFocused(true)} onBlur={() => setSearchFocused(false)}
            style={{
              width: "100%", borderRadius: 10,
              border: `1.5px solid ${searchFocused ? "#818cf8" : "#e2e8f0"}`,
              background: searchFocused ? "#fff" : "#f8faff",
              padding: "9px 14px 9px 36px", fontSize: 13, color: "#1e293b",
              outline: "none", boxShadow: searchFocused ? "0 0 0 3px rgba(67,56,202,0.12)" : "none",
              transition: "all 0.15s", boxSizing: "border-box",
            }}
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ flex: 1, background: "#fff" }}>
          {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}
        </div>
      ) : (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <style>{`
            .ag-theme-quartz {
              --ag-background-color: #ffffff;
              --ag-header-background-color: #fafbff;
              --ag-odd-row-background-color: #fcfcff;
              --ag-row-hover-color: #f0f0ff;
              --ag-border-color: #e8edf5;
              --ag-header-foreground-color: #64748b;
              --ag-font-size: 13px;
              --ag-cell-horizontal-padding: 16px;
              --ag-row-height: 56px;
              --ag-header-height: 42px;
            }
            .ag-theme-quartz .ag-header-cell-label {
              font-size: 11px; font-weight: 700;
              text-transform: uppercase; letter-spacing: 0.08em; color: #94a3b8;
            }
            .ag-theme-quartz .ag-row { border-bottom: 1px solid #f1f5f9; }
            .ag-theme-quartz .ag-cell {
              display: flex !important; align-items: center !important; line-height: normal !important;
            }
            .ag-theme-quartz .ag-cell-wrapper { width: 100%; display: flex; align-items: center; }
            .ag-theme-quartz .ag-paging-panel { border-top: 1px solid #e8edf5; background: #fafbff; color: #94a3b8; font-size: 12px; }
          `}</style>
          <div className="ag-theme-quartz" style={{ flex: 1, width: "100%", overflow: "hidden" }}>
            <AgGridReact<ArchivedUserDto>
              theme="legacy"
              rowData={filtered}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              pagination
              paginationPageSize={15}
              paginationPageSizeSelector={false}
              suppressCellFocus
              rowHeight={56}
              headerHeight={42}
              noRowsOverlayComponent={() => (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "60px 0", color: "#94a3b8" }}>
                  <span style={{ fontSize: 40 }}>📭</span>
                  <p style={{ fontSize: 13, margin: 0 }}>Aucun utilisateur archivé</p>
                </div>
              )}
            />
          </div>
          <div style={{ padding: "8px 24px", textAlign: "right", fontSize: 11, color: "#b0b8cc", borderTop: "1px solid #e8edf5", background: "#fafbff", flexShrink: 0 }}>
            {filtered.length} utilisateur{filtered.length !== 1 ? "s" : ""} archivé{filtered.length !== 1 ? "s" : ""}
          </div>
        </div>
      )}
    </div>
  );
}
