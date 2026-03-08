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
import { MagnifyingGlassIcon, PencilSquareIcon, ArchiveBoxIcon, NoSymbolIcon, PowerIcon } from "@heroicons/react/24/outline";

import type { UserListDto } from "./types";
import { MESSAGES } from "./constants";
import { getAvatarColor } from "./utils";

ModuleRegistry.registerModules([AllCommunityModule]);

type Props = {
  users: UserListDto[]; loading: boolean; error: string | null;
  togglingId: string | null;
  archivingId: string | null;
  onEdit: (user: UserListDto) => void;
  onToggleEnabled: (user: UserListDto) => void;
  onArchive: (user: UserListDto) => void;
};

const ROLE_LABELS: Record<string, string> = { MANAGER: "Manager", ADMIN: "Admin", EMPLOYEE: "Employé" };
const ROLE_STYLES: Record<string, React.CSSProperties> = {
  MANAGER:  { background: "#fff7ed", color: "#9a3412", border: "1px solid #fed7aa" },
  ADMIN:    { background: "#f5f3ff", color: "#4c1d95", border: "1px solid #ddd6fe" },
  EMPLOYEE: { background: "#eff6ff", color: "#1e40af", border: "1px solid #bfdbfe" },
};

const statuses = ["Tous", "Actif", "Inactif"] as const;

function SkeletonRow() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16, borderBottom: "1px solid #f1f5f9", padding: "14px 24px", animation: "pulse 1.5s ease-in-out infinite" }}>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
      <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#e8edf5", flexShrink: 0 }} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ height: 12, width: 120, borderRadius: 6, background: "#e8edf5" }} />
        <div style={{ height: 10, width: 180, borderRadius: 6, background: "#f1f5f9" }} />
      </div>
      <div style={{ height: 20, width: 60, borderRadius: 8, background: "#e8edf5" }} />
      <div style={{ height: 20, width: 50, borderRadius: 8, background: "#e8edf5" }} />
      <div style={{ display: "flex", gap: 8 }}>
        <div style={{ height: 28, width: 80, borderRadius: 8, background: "#e8edf5" }} />
        <div style={{ height: 28, width: 88, borderRadius: 8, background: "#e8edf5" }} />
      </div>
    </div>
  );
}

export function UsersTable({ users, loading, error, togglingId, archivingId, onEdit, onToggleEnabled, onArchive }: Props) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<(typeof statuses)[number]>("Tous");
  const [searchFocused, setSearchFocused] = useState(false);

  const filtered = useMemo(() =>
    users.filter((u) => {
      const fullName = `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim();
      const haystack = [fullName, u.email, u.role, u.department ?? "", u.jobTitle ?? ""].join(" ").toLowerCase();
      const matchSearch = haystack.includes(search.toLowerCase());
      const matchStatus = statusFilter === "Tous" || (statusFilter === "Actif" ? u.enabled : !u.enabled);
      return matchSearch && matchStatus;
    }),
    [users, search, statusFilter]
  );

  const columnDefs = useMemo<ColDef<UserListDto>[]>(() => [
    {
      headerName: "Utilisateur", field: "firstName", flex: 1.6, minWidth: 200,
      cellRenderer: (p: ICellRendererParams<UserListDto>) => {
        const u = p.data; if (!u) return null;
        const fullName = `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || u.email;
        const initials = `${u.firstName?.[0] ?? ""}${u.lastName?.[0] ?? ""}`.trim().toUpperCase() || u.email?.[0]?.toUpperCase() || "U";
        const gradient = getAvatarColor(u.email);
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {u.avatarUrl ? (
              <img src={u.avatarUrl} alt={fullName} style={{ width: 34, height: 34, borderRadius: "50%", objectFit: "cover", flexShrink: 0, boxShadow: "0 2px 8px rgba(0,0,0,0.12)" }} />
            ) : (
              <div style={{ width: 34, height: 34, borderRadius: "50%", background: `linear-gradient(135deg,${gradient[0]},${gradient[1]})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#fff", flexShrink: 0, boxShadow: `0 2px 8px ${gradient[0]}40` }}>
                {initials}
              </div>
            )}
            {/* darker name: #0f172a instead of #1e293b */}
            <span style={{ fontSize: 14, fontWeight: 600, color: "#1e293b" }}>{fullName}</span>
          </div>
        );
      },
    },
    {
      headerName: "Contact", field: "email", flex: 1.4, minWidth: 200,
      cellRenderer: (p: ICellRendererParams<UserListDto>) => {
        const u = p.data; if (!u) return null;
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{ fontSize: 14, color: "#334155" }}>{u.email}</span>
            {u.phone && <span style={{ fontSize: 12, color: "#64748b" }}>{u.phone}</span>}
          </div>
        );
      },
    },
    {
      headerName: "Département / Poste", field: "department", flex: 1.2, minWidth: 160,
      cellRenderer: (p: ICellRendererParams<UserListDto>) => {
        const u = p.data; if (!u) return null;
        if (!u.department && !u.jobTitle) return <span style={{ fontSize: 12, color: "#cbd5e1" }}>—</span>;
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {/* darker department: #1e293b instead of #475569 */}
            {u.department && <span style={{ fontSize: 14, fontWeight: 600, color: "#1e293b" }}>{u.department}</span>}
            {u.jobTitle && <span style={{ fontSize: 12, color: "#64748b" }}>{u.jobTitle}</span>}
          </div>
        );
      },
    },
    {
      headerName: "Rôle", field: "role", flex: 0.8, minWidth: 120,
      cellRenderer: (p: ICellRendererParams<UserListDto>) => {
        const role = (p.value as string) ?? "";
        return (
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            borderRadius: 6, padding: "3px 9px", fontSize: 11, fontWeight: 600,
            ...(ROLE_STYLES[role] ?? ROLE_STYLES.EMPLOYEE),
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", flexShrink: 0, background: role === "MANAGER" ? "#ea580c" : role === "ADMIN" ? "#6d28d9" : "#2563eb" }} />
            {ROLE_LABELS[role] ?? role}
          </span>
        );
      },
    },
    {
      headerName: "Statut", field: "enabled", flex: 0.6, minWidth: 100,
      cellRenderer: (p: ICellRendererParams<UserListDto>) => {
        const on = Boolean(p.data?.enabled);
        return (
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            borderRadius: 6, padding: "3px 9px", fontSize: 11, fontWeight: 600,
            border: `1px solid ${on ? "#86efac" : "#e2e8f0"}`,
            background: on ? "#f0fdf4" : "#f8fafc",
            // darker status text
            color: on ? "#15803d" : "#64748b",
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", flexShrink: 0, background: on ? "#22c55e" : "#cbd5e1" }} />
            {on ? "Actif" : "Inactif"}
          </span>
        );
      },
    },
    {
      headerName: "Actions", flex: 0.7, minWidth: 140, sortable: false, filter: false,
      cellRenderer: (p: ICellRendererParams<UserListDto>) => {
        const u = p.data; if (!u) return null;
        const isTog = togglingId === u.id;
        const isArch = archivingId === u.id;

        const iconBtn = (
          color: string, hoverBg: string, hoverColor: string,
          title: string, disabled: boolean,
          onClick: () => void,
          children: React.ReactNode
        ) => (
          <button
            type="button"
            title={title}
            onClick={onClick}
            disabled={disabled}
            style={{
              width: 32, height: 32, borderRadius: 8,
              border: "1px solid rgba(109,40,217,0.25)",
              background: "transparent",
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              cursor: disabled ? "not-allowed" : "pointer",
              opacity: disabled ? 0.45 : 1,
              color,
              transition: "all 0.15s",
              flexShrink: 0,
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
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.borderColor = "rgba(109,40,217,0.25)";
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
            {/* Edit - darker indigo */}
            {iconBtn("#4338ca", "#ede9fe", "#3730a3", "Modifier", false, () => onEdit(u),
              isTog ? <span style={{ fontSize: 10 }}>…</span> : <PencilSquareIcon className="w-3.5 h-3.5" />
            )}
            {/* Toggle - darker green/red */}
            {u.enabled
              ? iconBtn("#dc2626", "#fee2e2", "#b91c1c", "Désactiver", isTog, () => onToggleEnabled(u),
                  isTog ? <span style={{ fontSize: 10 }}>…</span> : <NoSymbolIcon className="w-3.5 h-3.5" />
                )
              : iconBtn("#15803d", "#dcfce7", "#166534", "Activer", isTog, () => onToggleEnabled(u),
                  isTog ? <span style={{ fontSize: 10 }}>…</span> : <PowerIcon className="w-3.5 h-3.5" />
                )
            }
            {/* Archive - darker amber */}
            {iconBtn("#b45309", "#fffbeb", "#92400e", "Archiver", isArch, () => onArchive(u),
              isArch ? <span style={{ fontSize: 10 }}>…</span> : <ArchiveBoxIcon className="w-3.5 h-3.5" />
            )}
          </div>
        );
      },
    },
  ], [onEdit, onToggleEnabled, onArchive, togglingId, archivingId]);

  const defaultColDef: ColDef = useMemo(() => ({ resizable: true, sortable: true, flex: 1, minWidth: 100, suppressHeaderMenuButton: true }), []);

  if (error) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "64px 24px", textAlign: "center" }}>
        <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#fef2f2", border: "1px solid #fecaca", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12, color: "#ef4444", fontSize: 20 }}>⚠</div>
        <p style={{ fontSize: 13, fontWeight: 600, color: "#7f1d1d" }}>{error}</p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
      {/* Filter bar */}
      <div style={{
        display: "flex", gap: 12, flexWrap: "wrap",
        padding: "8px 24px 16px 24px",
        borderBottom: "1px solid rgba(139,92,246,0.1)",
      }}>
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#a78bfa", pointerEvents: "none" }}>
            <MagnifyingGlassIcon className="w-4 h-4" />
          </span>
          <input
            type="search" placeholder="Rechercher par nom, email, rôle…"
            value={search} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            onFocus={() => setSearchFocused(true)} onBlur={() => setSearchFocused(false)}
            style={{
              width: "100%", borderRadius: 12,
              border: `1px solid ${searchFocused ? "#7c3aed" : "rgba(139,92,246,0.2)"}`,
              background: "#fff",
              padding: "10px 14px 10px 36px", fontSize: 14,
              color: "#4c1d95",
              outline: "none", boxShadow: searchFocused ? "0 0 0 3px rgba(109,40,217,0.12)" : "none",
              transition: "all 0.15s", boxSizing: "border-box",
            }}
          />
        </div>
        <select
          value={statusFilter} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStatusFilter(e.target.value as (typeof statuses)[number])}
          style={{
            borderRadius: 12,
            border: "1px solid rgba(139,92,246,0.2)",
            background: "#fff",
            padding: "10px 14px", fontSize: 14,
            color: "#4c1d95",
            outline: "none", cursor: "pointer",
          }}
        >
          {statuses.map((s) => <option key={s} value={s}>{s === "Tous" ? "Tous les statuts" : s}</option>)}
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ flex: 1, padding: "0 24px" }}>
          {Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)}
        </div>
      ) : (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", padding: "12px 24px 0 24px" }}>
          <style>{`
            .ag-theme-quartz {
              --ag-background-color: #f8f7ff;
              --ag-header-background-color: rgba(109,40,217,0.06);
              --ag-odd-row-background-color: #f8f7ff;
              --ag-row-hover-color: #f0f0ff;
              --ag-border-color: #e8edf5;
              --ag-header-foreground-color: #4c1d95;
              --ag-foreground-color: #0f172a;
              --ag-font-size: 14px;
              --ag-cell-horizontal-padding: 16px;
              --ag-row-height: 52px;
              --ag-header-height: 42px;
            }
            .ag-theme-quartz .ag-header-cell-label {
              font-size: 10.5px; font-weight: 700;
              text-transform: uppercase; letter-spacing: 0.08em;
              /* darker header labels */
              color: #5b21b6;
            }
            .ag-theme-quartz .ag-row { border-bottom: 1px solid #ede9fe; }
            .ag-theme-quartz .ag-cell {
              display: flex !important;
              align-items: center !important;
              line-height: normal !important;
            }
            .ag-theme-quartz .ag-cell-wrapper {
              width: 100%;
              display: flex;
              align-items: center;
            }
            .ag-theme-quartz .ag-paging-panel {
              border-top: 1px solid rgba(109,40,217,0.12);
              background: rgba(109,40,217,0.04);
              /* darker pagination text */
              color: #5b21b6;
              font-size: 12px;
              font-weight: 500;
            }
          `}</style>
          <div className="ag-theme-quartz" style={{ flex: 1, width: "100%", overflow: "hidden" }}>
            <AgGridReact<UserListDto>
              theme="legacy"
              localeText={AG_GRID_LOCALE_FR}
              rowData={filtered}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              pagination
              paginationPageSize={15}
              paginationPageSizeSelector={false}
              suppressCellFocus
              rowHeight={52}
              headerHeight={42}
              noRowsOverlayComponent={() => (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "60px 0" }}>
                  <span style={{ fontSize: 40 }}>👥</span>
                  <p style={{ fontSize: 14, margin: 0, color: "#5b21b6", fontWeight: 500 }}>{MESSAGES.noUsers}</p>
                </div>
              )}
            />
          </div>
          {/* darker footer count */}
          <div style={{ padding: "8px 24px", textAlign: "right", fontSize: 12, color: "#7c3aed", fontWeight: 500, borderTop: "1px solid rgba(139,92,246,0.1)", flexShrink: 0 }}>
            {filtered.length} utilisateur{filtered.length !== 1 ? "s" : ""} affiché{filtered.length !== 1 ? "s" : ""} sur {users.length}
          </div>
        </div>
      )}
    </div>
  );
}