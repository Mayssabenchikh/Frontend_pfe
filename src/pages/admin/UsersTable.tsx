import { useMemo, useRef, useEffect } from "react";
import {
  ModuleRegistry, AllCommunityModule,
  type ColDef, type ICellRendererParams,
} from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";
import { AG_GRID_LOCALE_FR } from "@ag-grid-community/locale";
import {
  PencilSquareIcon,
  ArchiveBoxIcon,
  NoSymbolIcon,
  PowerIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";

import type { UserListDto } from "./types";
import { MESSAGES } from "./constants";
import { getAvatarColor } from "./utils";

ModuleRegistry.registerModules([AllCommunityModule]);

type Props = {
  users: UserListDto[]; loading: boolean; error: string | null;
  togglingId: string | null;
  archivingId: string | null;
  onEdit: (user: UserListDto) => void;
  onView: (user: UserListDto) => void;
  onToggleEnabled: (user: UserListDto) => void;
  onArchive: (user: UserListDto) => void;
};

const ROLE_LABELS: Record<string, string> = { MANAGER: "Manager", ADMIN: "Admin", EMPLOYEE: "Employé" };
const ROLE_CLASSES: Record<string, string> = {
  MANAGER: "bg-orange-50 text-orange-800 border-orange-200",
  ADMIN: "bg-violet-50 text-violet-900 border-violet-200",
  EMPLOYEE: "bg-blue-50 text-blue-800 border-blue-200",
};

function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 border-b border-slate-100 px-6 py-3.5 animate-pulse">
      <div className="h-9 w-9 shrink-0 rounded-full bg-slate-200" />
      <div className="flex flex-1 flex-col gap-1.5">
        <div className="h-3 w-[120px] rounded-md bg-slate-200" />
        <div className="h-2.5 w-[180px] rounded-md bg-slate-100" />
      </div>
      <div className="h-5 w-[60px] rounded-lg bg-slate-200" />
      <div className="h-5 w-[50px] rounded-lg bg-slate-200" />
      <div className="flex gap-2">
        <div className="h-7 w-20 rounded-lg bg-slate-200" />
        <div className="h-7 w-[88px] rounded-lg bg-slate-200" />
      </div>
    </div>
  );
}

export function UsersTable({ users, loading, error, togglingId, archivingId, onEdit, onView, onToggleEnabled, onArchive }: Props) {
  const gridRef = useRef<AgGridReact<UserListDto> | null>(null);

  const columnDefs = useMemo<ColDef<UserListDto>[]>(() => [
    {
      headerName: "Utilisateur", field: "firstName", flex: 1.6, minWidth: 140,
      cellRenderer: (p: ICellRendererParams<UserListDto>) => {
        const u = p.data; if (!u) return null;
        const fullName = `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || u.email;
        const initials = `${u.firstName?.[0] ?? ""}${u.lastName?.[0] ?? ""}`.trim().toUpperCase() || u.email?.[0]?.toUpperCase() || "U";
        const gradient = getAvatarColor(u.email);
        return (
          <div className="flex items-center gap-3">
            {u.avatarUrl ? (
              <img src={u.avatarUrl} alt={fullName} className="h-8 w-8 shrink-0 rounded-full object-cover shadow-md" />
            ) : (
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white shadow-md"
                style={{ background: `linear-gradient(135deg,${gradient[0]},${gradient[1]})`, boxShadow: `0 2px 8px ${gradient[0]}40` }}
              >
                {initials}
              </div>
            )}
            <span className="text-sm font-semibold text-slate-800">{fullName}</span>
          </div>
        );
      },
    },
    {
      headerName: "Contact", field: "email", flex: 1.4, minWidth: 160,
      cellRenderer: (p: ICellRendererParams<UserListDto>) => {
        const u = p.data; if (!u) return null;
        return (
          <div className="flex flex-col gap-0.5">
            <span className="text-sm text-slate-700">{u.email}</span>
            {u.phone && <span className="text-xs text-slate-500">{u.phone}</span>}
          </div>
        );
      },
    },
    {
      headerName: "Département / Poste", field: "department", flex: 1.2, minWidth: 120,
      cellRenderer: (p: ICellRendererParams<UserListDto>) => {
        const u = p.data; if (!u) return null;
        if (!u.department && !u.jobTitle) return <span className="text-xs text-slate-300">—</span>;
        return (
          <div className="flex flex-col gap-0.5">
            {u.department && <span className="text-sm font-semibold text-slate-800">{u.department}</span>}
            {u.jobTitle && <span className="text-xs text-slate-500">{u.jobTitle}</span>}
          </div>
        );
      },
    },
    {
      headerName: "Rôle", field: "role", flex: 0.8, minWidth: 90,
      cellRenderer: (p: ICellRendererParams<UserListDto>) => {
        const role = (p.value as string) ?? "";
        const dotCls = role === "MANAGER" ? "bg-orange-500" : role === "ADMIN" ? "bg-violet-600" : "bg-blue-600";
        return (
          <span className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-0.5 text-[11px] font-semibold ${ROLE_CLASSES[role] ?? ROLE_CLASSES.EMPLOYEE}`}>
            <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dotCls}`} />
            {ROLE_LABELS[role] ?? role}
          </span>
        );
      },
    },
    {
      headerName: "Statut", field: "enabled", flex: 0.6, minWidth: 80,
      cellRenderer: (p: ICellRendererParams<UserListDto>) => {
        const on = Boolean(p.data?.enabled);
        return (
          <span className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-0.5 text-[11px] font-semibold ${on ? "border-green-200 bg-green-50 text-green-700" : "border-slate-200 bg-slate-50 text-slate-500"}`}>
            <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${on ? "bg-green-500" : "bg-slate-300"}`} />
            {on ? "Actif" : "Inactif"}
          </span>
        );
      },
    },
    {
      headerName: "Actions", flex: 0.9, minWidth: 130, sortable: false, filter: false,
      cellRenderer: (p: ICellRendererParams<UserListDto>) => {
        const u = p.data; if (!u) return null;
        const isTog = togglingId === u.id;
        const isArch = archivingId === u.id;

        const btnCls = "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-violet-500/25 bg-transparent transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-45";
        const loadingSpan = <span className="text-[10px]">…</span>;

        return (
          <div className="flex items-center justify-end gap-1">
            <button type="button" title="Voir les détails" onClick={() => onView(u)} className={`${btnCls} text-slate-600 hover:bg-slate-100 hover:border-slate-200 hover:text-slate-900 hover:-translate-y-px hover:shadow-md`}>
              <EyeIcon className="w-3.5 h-3.5" />
            </button>
            <button type="button" title="Modifier" onClick={() => onEdit(u)} disabled={false} className={`${btnCls} text-indigo-700 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-900 hover:-translate-y-px hover:shadow-md`}>
              {isTog ? loadingSpan : <PencilSquareIcon className="w-3.5 h-3.5" />}
            </button>
            {u.enabled ? (
              <button type="button" title="Désactiver" onClick={() => onToggleEnabled(u)} disabled={isTog} className={`${btnCls} text-red-600 hover:bg-red-50 hover:border-red-200 hover:text-red-700 hover:-translate-y-px hover:shadow-md`}>
                {isTog ? loadingSpan : <NoSymbolIcon className="w-3.5 h-3.5" />}
              </button>
            ) : (
              <button type="button" title="Activer" onClick={() => onToggleEnabled(u)} disabled={isTog} className={`${btnCls} text-green-700 hover:bg-green-50 hover:border-green-200 hover:text-green-800 hover:-translate-y-px hover:shadow-md`}>
                {isTog ? loadingSpan : <PowerIcon className="w-3.5 h-3.5" />}
              </button>
            )}
            <button type="button" title="Archiver" onClick={() => onArchive(u)} disabled={isArch} className={`${btnCls} text-amber-700 hover:bg-amber-50 hover:border-amber-200 hover:text-amber-800 hover:-translate-y-px hover:shadow-md`}>
              {isArch ? loadingSpan : <ArchiveBoxIcon className="w-3.5 h-3.5" />}
            </button>
          </div>
        );
      },
    },
  ], [onEdit, onView, onToggleEnabled, onArchive, togglingId, archivingId]);

  const defaultColDef: ColDef = useMemo(() => ({ resizable: true, sortable: true, flex: 1, minWidth: 100, suppressHeaderMenuButton: true }), []);

  useEffect(() => {
    if (loading) return;
    const t = setTimeout(() => gridRef.current?.api?.sizeColumnsToFit(), 150);
    return () => clearTimeout(t);
  }, [loading, users.length]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-red-200 bg-red-50 text-xl text-red-500">⚠</div>
        <p className="text-sm font-semibold text-red-900">{error}</p>
      </div>
    );
  }

  return (
    /*
     * Conteneur racine : flex colonne, prend toute la hauteur disponible.
     * Le parent DOIT avoir une hauteur définie (h-full / flex-1) pour que
     * la cascade height:100% fonctionne jusqu'à AG Grid.
     */
    <div className="flex h-full w-full flex-col overflow-hidden">

      {/* ── Zone tableau (flex-1 = tout l'espace restant) ── */}
      {loading ? (
        <div className="flex-1 overflow-auto bg-transparent pt-4">
          {Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)}
        </div>
      ) : (
        /*
         * flex-1 + min-h-0 : occupe tout l'espace vertical restant après
         * la barre de filtres, sans jamais déborder du parent.
         * overflow-hidden évite tout scrollbar parasite sur ce conteneur.
         */
        <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-white">
          <style>{`
            .ag-theme-quartz {
              --ag-background-color: #ffffff;
              --ag-header-background-color: rgba(109,40,217,0.06);
              --ag-odd-row-background-color: #ffffff;
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
              font-size: 10.5px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.08em;
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
              color: #5b21b6;
              font-size: 12px;
              font-weight: 500;
            }
          `}</style>

          {/*
           * Technique "absolute fill" : le div parent est relative + flex-1,
           * l'ag-theme est absolute inset-0 → il reçoit des dimensions pixel
           * concrètes, ce qu'AG Grid exige pour calculer sizeColumnsToFit()
           * et positionner sa pagination en bas.
           * Le padding-bottom réserve l'espace du compteur d'utilisateurs.
           */}
          <div
            className="ag-theme-quartz absolute inset-0"
            style={{ paddingBottom: "36px" }}
          >
            <AgGridReact<UserListDto>
              ref={gridRef}
              theme="legacy"
              localeText={AG_GRID_LOCALE_FR}
              rowData={users}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              onGridReady={(e) => { e.api.sizeColumnsToFit(); }}
              onGridSizeChanged={(e) => e.api.sizeColumnsToFit()}
              pagination
              paginationPageSize={8}
              paginationPageSizeSelector={false}
              suppressCellFocus
              rowHeight={52}
              headerHeight={42}
              noRowsOverlayComponent={() => (
                <div className="flex flex-col items-center gap-2 py-16">
                  <span className="text-4xl">👥</span>
                  <p className="text-sm font-medium text-violet-800">{MESSAGES.noUsers}</p>
                </div>
              )}
            />
          </div>

          {/* Compteur collé en bas, au-dessus de la pagination AG Grid */}
          <div className="absolute bottom-0 right-0 z-10 border-t border-violet-500/10 bg-white px-6 py-2 text-right text-xs font-medium text-violet-600">
            {users.length} utilisateur{users.length !== 1 ? "s" : ""} affiché{users.length !== 1 ? "s" : ""} sur {users.length}
          </div>
        </div>
      )}
    </div>
  );
}