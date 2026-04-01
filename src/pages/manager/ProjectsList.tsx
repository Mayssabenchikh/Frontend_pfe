import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { toast } from "sonner";
import { createPortal } from "react-dom";
import {
  PlusIcon,
  MagnifyingGlassIcon,
  TrashIcon,
  ArrowPathIcon,
  PencilSquareIcon,
  EyeIcon,
  XMarkIcon,
  Squares2X2Icon,
  Bars3Icon,
  EllipsisHorizontalIcon,
} from "@heroicons/react/24/outline";
import {
  ModuleRegistry,
  AllCommunityModule,
  type ColDef,
  type ICellRendererParams,
} from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";
import { AG_GRID_LOCALE_FR } from "@ag-grid-community/locale";
import { projectsApi, type ProjectDto, type ProjectPage } from "../../api/projectsApi";
import { CreateProjectModal } from "./CreateProjectModal";
import { ConfirmModal } from "../../components/ConfirmModal";
import { useKeycloak } from "@react-keycloak/web";
import { getPrimaryRole } from "../../auth/roles";
import { getAvatarColor } from "../admin/utils";
import { FiltersPanel } from "../../components/FiltersPanel";

type ManagerOutletContext = {
  managerAvatarUrl: string | null;
  managerName: string;
  managerEmail: string | null;
  currentPath: string;
};

ModuleRegistry.registerModules([AllCommunityModule]);

export function ProjectsList() {
  const GRID_PAGE_SIZE = 12;
  const navigate = useNavigate();
  const { keycloak } = useKeycloak();
  const role = getPrimaryRole(keycloak.tokenParsed ?? undefined);
  const outletCtx = useOutletContext<ManagerOutletContext | null>();
  const managerAvatarUrl = outletCtx?.managerAvatarUrl ?? null;
  const managerName = outletCtx?.managerName ?? "";
  const managerEmail = outletCtx?.managerEmail ?? null;
  const [projects, setProjects] = useState<ProjectDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [priorityFilter, setPriorityFilter] = useState<string>("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [order, setOrder] = useState<"recent" | "oldest">("recent");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [gridPage, setGridPage] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [createModal, setCreateModal] = useState(false);
  const [editProject, setEditProject] = useState<ProjectDto | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<ProjectDto | null>(null);
  const [detailProject, setDetailProject] = useState<ProjectDto | null>(null);
  const gridRef = useRef<AgGridReact<ProjectDto> | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    const isGridMode = viewMode === "grid";
    projectsApi
      .list({
        search: search || undefined,
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
        from: from || undefined,
        to: to || undefined,
        order,
        page: isGridMode ? gridPage : 0,
        size: isGridMode ? GRID_PAGE_SIZE : 500,
      })
      .then((res) => {
        const data = res.data as ProjectPage;
        setProjects(data.content ?? []);
        setTotalElements(data.totalElements ?? 0);
        setTotalPages(data.totalPages ?? 0);
      })
      .catch(() => {
        setProjects([]);
        setTotalElements(0);
        setTotalPages(0);
      })
      .finally(() => setLoading(false));
  }, [search, statusFilter, priorityFilter, from, to, order, viewMode, gridPage]);

  useEffect(() => {
    setGridPage(0);
  }, [search, statusFilter, priorityFilter, from, to, order, viewMode]);

  useEffect(() => {
    const t = setTimeout(() => load(), 250);
    return () => clearTimeout(t);
  }, [load]);

  const handleCreate = (data: { name: string; description?: string; status?: string; requirements?: { skillId: number; levelMin: number }[] }) => {
    return projectsApi.create(data)
      .then((res) => {
        setCreateModal(false);
        load();
        toast.success("Projet créé");
        if (res.data?.id) navigate(`/manager/projects/${res.data.id}`);
      });
  };

  const handleEdit = (p: ProjectDto) => setEditProject(p);

  const handleUpdate = (data: { name: string; description?: string; status?: string; requirements?: { skillId: number; levelMin: number }[] }) => {
    if (!editProject) return Promise.resolve();
    return projectsApi.update(editProject.id, data).then((res) => {
      toast.success("Projet mis à jour");
      setEditProject(null);
      setProjects((prev) => prev.map((proj) => (proj.id === res.data.id ? res.data : proj)));
    });
  };

  const handleDeleteClick = (p: ProjectDto) => setDeleteConfirm(p);

  const confirmDelete = () => {
    if (!deleteConfirm) return;
    const p = deleteConfirm;
    setDeleteConfirm(null);
    setDeletingId(p.id);
    projectsApi.delete(p.id)
      .then(() => { load(); toast.success("Projet supprimé"); })
      .catch((err) => toast.error(err.response?.data?.error ?? "Erreur"))
      .finally(() => setDeletingId(null));
  };

  const closeDetail = () => setDetailProject(null);

  /* ── helpers ────────────────────────────────────────────────────────────── */
  const statusLabel = (s?: string | null) =>
    s === "ACTIVE" ? "En cours" : s === "CLOSED" ? "Terminé" : "Brouillon";

  const statusCls = (s?: string | null) =>
    s === "ACTIVE" ? "bg-violet-50 text-violet-700 ring-violet-200"
    : s === "CLOSED" ? "bg-emerald-50 text-emerald-600 ring-emerald-200"
    : "bg-slate-50 text-slate-600 ring-slate-200";

  const priorityLabel = (p?: string | null) =>
    p === "HIGH" ? "Haute" : p === "LOW" ? "Basse" : "Moyenne";

  const priorityCls = (p?: string | null) =>
    p === "HIGH" ? "bg-amber-50 text-amber-600 ring-amber-200"
    : p === "LOW" ? "bg-slate-50 text-slate-600 ring-slate-200"
    : "bg-indigo-50 text-indigo-600 ring-indigo-200";

  const initials = (name?: string | null, email?: string | null) =>
    (name || email || "?").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  const filtered = useMemo(() => projects, [projects]);
  const safeTotalPages = Math.max(totalPages, 1);

  const columnDefs = useMemo<ColDef<ProjectDto>[]>(() => {
    const badgeBase = "inline-flex items-center rounded-md border px-2.5 py-0.5 text-[11px] font-semibold";
    const btnCls =
      "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-violet-500/25 bg-transparent transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-45";
    const loadingSpan = <span className="text-[10px]">…</span>;

    return [
      {
        headerName: "Projet",
        field: "name",
        flex: 1.8,
        minWidth: 200,
        cellRenderer: (params: ICellRendererParams<ProjectDto>) => {
          const p = params.data;
          if (!p) return null;
          return (
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="text-sm font-semibold text-slate-800 truncate">{p.name}</span>
              {p.description ? (
                <span className="text-xs text-slate-500 truncate">{p.description}</span>
              ) : (
                <span className="text-xs text-slate-300">—</span>
              )}
            </div>
          );
        },
      },
      {
        headerName: "Lead",
        field: "leadName",
        flex: 1.2,
        minWidth: 180,
        cellRenderer: (params: ICellRendererParams<ProjectDto>) => {
          const p = params.data;
          if (!p) return null;
          const fullName = p.leadName || p.leadEmail || managerName || managerEmail || "Lead";
          const seed = p.leadEmail || managerEmail || fullName;
          const gradient = getAvatarColor(seed);
          const avatarAlt = p.leadName || p.leadEmail || managerName || managerEmail || "";
          return (
            <div className="flex items-center gap-3 min-w-0">
              {managerAvatarUrl ? (
                <img
                  src={managerAvatarUrl}
                  alt={avatarAlt}
                  className="h-8 w-8 shrink-0 rounded-full object-cover shadow-md"
                />
              ) : (
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white shadow-md"
                  style={{
                    background: `linear-gradient(135deg,${gradient[0]},${gradient[1]})`,
                    boxShadow: `0 2px 8px ${gradient[0]}40`,
                  }}
                >
                  {initials(p.leadName ?? managerName, p.leadEmail ?? managerEmail)}
                </div>
              )}
              <div className="min-w-0 flex flex-col gap-0.5">
                <span className="text-sm font-semibold text-slate-800 truncate">
                  {p.leadName || "—"}
                </span>
                {p.leadEmail ? (
                  <span className="text-xs text-slate-500 truncate">{p.leadEmail}</span>
                ) : (
                  <span className="text-xs text-slate-300">—</span>
                )}
              </div>
            </div>
          );
        },
      },
      {
        headerName: "Statut",
        field: "status",
        flex: 0.7,
        minWidth: 110,
        cellRenderer: (params: ICellRendererParams<ProjectDto>) => (
          <span className={`${badgeBase} ${statusCls(params.data?.status)}`}>
            {statusLabel(params.data?.status)}
          </span>
        ),
      },
      {
        headerName: "Priorité",
        field: "priority",
        flex: 0.7,
        minWidth: 110,
        cellRenderer: (params: ICellRendererParams<ProjectDto>) => (
          <span className={`${badgeBase} ${priorityCls(params.data?.priority)}`}>
            {priorityLabel(params.data?.priority)}
          </span>
        ),
      },
      {
        headerName: "Équipe",
        field: "teamSize",
        flex: 0.6,
        minWidth: 90,
        valueFormatter: (p) => String(p.value ?? 1),
      },
      {
        headerName: "Échéance",
        field: "dueDate",
        flex: 0.8,
        minWidth: 120,
        valueFormatter: (p) =>
          p.value ? new Date(String(p.value)).toLocaleDateString("fr-FR") : "—",
      },
      {
        headerName: "Actions",
        flex: 0.9,
        minWidth: 130,
        sortable: false,
        filter: false,
        cellRenderer: (params: ICellRendererParams<ProjectDto>) => {
          const p = params.data;
          if (!p) return null;
          const isDel = deletingId === p.id;
          return (
            <div className="flex items-center justify-end gap-1">
              <button
                type="button"
                title="Voir les détails"
                onClick={() => setDetailProject(p)}
                className={`${btnCls} text-slate-600 hover:bg-slate-100 hover:border-slate-200 hover:text-slate-900 hover:-translate-y-px hover:shadow-md`}
              >
                <EyeIcon className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                title="Modifier"
                onClick={() => handleEdit(p)}
                className={`${btnCls} text-indigo-700 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-900 hover:-translate-y-px hover:shadow-md`}
              >
                <PencilSquareIcon className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                title="Supprimer"
                onClick={() => handleDeleteClick(p)}
                disabled={isDel}
                className={`${btnCls} text-red-600 hover:bg-red-50 hover:border-red-200 hover:text-red-700 hover:-translate-y-px hover:shadow-md`}
              >
                {isDel ? loadingSpan : <TrashIcon className="w-3.5 h-3.5" />}
              </button>
            </div>
          );
        },
      },
    ];
  }, [
    deletingId,
    handleDeleteClick,
    handleEdit,
    initials,
    managerAvatarUrl,
    managerEmail,
    managerName,
    priorityCls,
    priorityLabel,
    statusCls,
    statusLabel,
  ]);

  const defaultColDef: ColDef = useMemo(
    () => ({
      resizable: true,
      sortable: true,
      flex: 1,
      minWidth: 100,
      suppressHeaderMenuButton: true,
    }),
    []
  );

  
  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-[#f8f7ff]">
      <div className="shrink-0 border-b border-slate-200/80 bg-[#f8f7ff] px-6 py-4">
        <div className="flex flex-wrap items-center justify-end gap-3">
          <div className="inline-flex items-center rounded-2xl border border-slate-300 bg-slate-100/80 p-1 shadow-sm">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition ${
                viewMode === "grid"
                  ? "bg-violet-600 text-white shadow-[0_4px_12px_rgba(124,58,237,0.35)]"
                  : "text-slate-600 hover:bg-white/80"
              }`}
            >
              <Squares2X2Icon className="h-3.5 w-3.5" />
              Grid
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition ${
                viewMode === "list"
                  ? "bg-violet-600 text-white shadow-[0_4px_12px_rgba(124,58,237,0.35)]"
                  : "text-slate-600 hover:bg-white/80"
              }`}
            >
              <Bars3Icon className="h-3.5 w-3.5" />
              List
            </button>
          </div>

          {role === "MANAGER" && (
            <button
              type="button"
              onClick={() => setCreateModal(true)}
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-violet-300/40 bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2.5 text-[13px] font-semibold text-white shadow-[0_10px_24px_rgba(124,58,237,0.35)] transition-all duration-150 hover:-translate-y-px hover:shadow-[0_14px_28px_rgba(124,58,237,0.45)]"
            >
              <PlusIcon className="w-4 h-4" />
              Nouveau projet
            </button>
          )}
        </div>
      </div>

      

      {/* ── Zone page (filtres + table) ── */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[#f8f7ff] px-6 py-4">
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
          {/* ── Barre de filtres (design comme capture) ── */}
        <FiltersPanel
          title="Filtres"
          resultsLabel={`${totalElements} resultat${totalElements !== 1 ? "s" : ""}`}
          onReset={() => {
            setSearch("");
            setStatusFilter("");
            setPriorityFilter("");
            setFrom("");
            setTo("");
            setOrder("recent");
          }}
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-7">
            <div className="lg:col-span-2">
              <label className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">Rechercher</label>
              <div className="relative mt-1">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <MagnifyingGlassIcon className="w-4 h-4" />
                </span>
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Projet, description…"
                  className="w-full rounded-xl border border-slate-300/80 bg-white py-2.5 pl-9 pr-3.5 text-sm text-slate-800 shadow-sm outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/15"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">Statut</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="mt-1 w-full cursor-pointer rounded-xl border border-slate-300/80 bg-white px-3 py-2.5 text-sm text-slate-800 shadow-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/15"
              >
                <option value="">Tous les statuts</option>
                <option value="ACTIVE">En cours</option>
                <option value="DRAFT">Brouillon</option>
                <option value="CLOSED">Clôturé</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">Priorite</label>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="mt-1 w-full cursor-pointer rounded-xl border border-slate-300/80 bg-white px-3 py-2.5 text-sm text-slate-800 shadow-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/15"
              >
                <option value="">Toutes les priorités</option>
                <option value="HIGH">Haute</option>
                <option value="MEDIUM">Moyenne</option>
                <option value="LOW">Basse</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">Du</label>
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300/80 bg-white px-3 py-2.5 text-sm text-slate-800 shadow-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/15"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">Au</label>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300/80 bg-white px-3 py-2.5 text-sm text-slate-800 shadow-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/15"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">Ordre</label>
              <select
                value={order}
                onChange={(e) => setOrder(e.target.value as any)}
                className="mt-1 w-full cursor-pointer rounded-xl border border-slate-300/80 bg-white px-3 py-2.5 text-sm text-slate-800 shadow-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/15"
              >
                <option value="recent">Plus récent</option>
                <option value="oldest">Plus ancien</option>
              </select>
            </div>
          </div>
        </FiltersPanel>

        {/* ── Tableau AG Grid / Cards Grid ────────────────────────────────── */}
        {loading ? (
          <div className="flex items-center gap-2 rounded-2xl border border-slate-100 bg-white px-5 py-6 text-sm text-slate-500 shadow-sm">
            <ArrowPathIcon className="h-5 w-5 animate-spin" />
            Chargement des projets…
          </div>
        ) : viewMode === "list" ? (
          <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_10px_28px_rgba(15,23,42,0.06)]">
            <style>{`
              .ag-theme-quartz {
                --ag-background-color: #ffffff;
                --ag-header-background-color: #f8fafc;
                --ag-odd-row-background-color: #ffffff;
                --ag-row-hover-color: #f1f5f9;
                --ag-border-color: #e2e8f0;
                --ag-header-foreground-color: #334155;
                --ag-foreground-color: #0f172a;
                --ag-font-size: 14px;
                --ag-cell-horizontal-padding: 16px;
                --ag-row-height: 56px;
                --ag-header-height: 42px;
              }
              .ag-theme-quartz .ag-header-cell-label {
                font-size: 10.5px;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.08em;
                color: #334155;
              }
              .ag-theme-quartz .ag-row { border-bottom: 1px solid #f1f5f9; }
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
                border-top: 1px solid #e2e8f0;
                background: #f8fafc;
                color: #475569;
                font-size: 12px;
                font-weight: 500;
              }
            `}</style>

            <div className="ag-theme-quartz absolute inset-0">
              <AgGridReact<ProjectDto>
                ref={gridRef}
                theme="legacy"
                localeText={AG_GRID_LOCALE_FR}
                rowData={filtered}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                onGridReady={(e) => e.api.sizeColumnsToFit()}
                onGridSizeChanged={(e) => e.api.sizeColumnsToFit()}
                pagination
                paginationPageSize={8}
                paginationPageSizeSelector={false}
                suppressCellFocus
                rowHeight={56}
                headerHeight={42}
                noRowsOverlayComponent={() => (
                  <div className="flex flex-col items-center gap-3 py-20">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-violet-500/15 bg-violet-500/10 text-3xl">
                      📁
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <p className="text-sm font-bold text-slate-800">Aucun projet</p>
                      <p className="text-xs text-slate-500">
                        {search || statusFilter || priorityFilter ? "Aucun résultat pour ces filtres" : "Créez un projet pour commencer"}
                      </p>
                    </div>
                  </div>
                )}
              />
            </div>

          </div>
        ) : (
          <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_10px_28px_rgba(15,23,42,0.06)]">
            {filtered.length === 0 ? (
              <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 px-5 py-10 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-violet-500/15 bg-violet-500/10 text-3xl">
                  📁
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-slate-800">Aucun projet</p>
                  <p className="text-xs text-slate-500">
                    {search || statusFilter || priorityFilter ? "Aucun résultat pour ces filtres" : "Créez un projet pour commencer"}
                  </p>
                </div>
              </div>
            ) : (
              <div className="min-h-0 flex-1 overflow-auto px-5 py-5">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-3">
                  {filtered.map((p) => {
                    const leadFullName = p.leadName || p.leadEmail || managerName || managerEmail || "Lead";
                    const avatarSeed = p.leadEmail || managerEmail || leadFullName;
                    const gradient = getAvatarColor(avatarSeed);
                    const isDel = deletingId === p.id;

                    return (
                      <article
                        key={p.id}
                        className="group flex min-h-[390px] flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_5px_16px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-[0_12px_20px_rgba(15,23,42,0.1)]"
                      >
                        <div className="mb-4 flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h3 className="truncate text-sm font-semibold text-slate-800">{p.name}</h3>
                            <div className="mt-1.5 flex items-center gap-1.5">
                              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${statusCls(p.status)}`}>
                                {statusLabel(p.status)}
                              </span>
                              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${priorityCls(p.priority)}`}>
                                {priorityLabel(p.priority)}
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            title="Voir les détails"
                            onClick={() => setDetailProject(p)}
                            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                          >
                            <EllipsisHorizontalIcon className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="mb-4 rounded-xl border border-slate-100 bg-slate-50/80 p-3.5">
                          <div className="grid grid-cols-2 gap-x-2 gap-y-2 text-[10px]">
                            <div>
                              <p className="text-slate-400">Equipe</p>
                              <p className="font-semibold text-slate-700 text-[11px]">{p.teamSize ?? 1} membre(s)</p>
                            </div>
                            <div>
                              <p className="text-slate-400">Competences</p>
                              <p className="font-semibold text-slate-700 text-[11px]">{p.requirements?.length ?? 0}</p>
                            </div>
                            <div>
                              <p className="text-slate-400">Debut</p>
                              <p className="font-semibold text-slate-700 text-[11px] truncate">
                                {p.startDate
                                  ? new Date(p.startDate).toLocaleDateString("fr-FR")
                                  : "—"}
                              </p>
                            </div>
                            <div>
                              <p className="text-slate-400">Echeance</p>
                              <p className="font-semibold text-slate-700 text-[11px] truncate">
                                {p.dueDate
                                  ? new Date(p.dueDate).toLocaleDateString("fr-FR")
                                  : "—"}
                              </p>
                            </div>
                          </div>
                        </div>

                        <p className="mb-4 line-clamp-3 text-xs leading-relaxed text-slate-500">
                          {p.description || "Aucune description fournie pour ce projet."}
                        </p>

                        <div className="mb-4 flex items-center gap-2.5 border-t border-slate-100 pt-3.5">
                          {managerAvatarUrl ? (
                            <img
                              src={managerAvatarUrl}
                              alt={leadFullName}
                              className="h-7 w-7 shrink-0 rounded-full object-cover"
                            />
                          ) : (
                            <div
                              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                              style={{
                                background: `linear-gradient(135deg,${gradient[0]},${gradient[1]})`,
                                boxShadow: `0 2px 7px ${gradient[0]}40`,
                              }}
                            >
                              {initials(p.leadName ?? managerName, p.leadEmail ?? managerEmail)}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="truncate text-xs font-medium text-slate-700">{p.leadName || "—"}</p>
                            <p className="truncate text-[11px] text-slate-400">{p.leadEmail || "Lead"}</p>
                          </div>
                        </div>

                        <div className="mt-auto flex items-center justify-end gap-1.5 border-t border-slate-100 pt-3">
                          <button
                            type="button"
                            title="Voir les détails"
                            onClick={() => setDetailProject(p)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-100"
                          >
                            <EyeIcon className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            title="Modifier"
                            onClick={() => handleEdit(p)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-indigo-200 text-indigo-700 transition hover:bg-indigo-50"
                          >
                            <PencilSquareIcon className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            title="Supprimer"
                            onClick={() => handleDeleteClick(p)}
                            disabled={isDel}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-45"
                          >
                            {isDel ? <span className="text-[10px]">…</span> : <TrashIcon className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="shrink-0 border-t border-slate-200/90 bg-white px-5 py-2.5">
              <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="text-xs text-slate-500">
                  Page {Math.min(gridPage + 1, safeTotalPages)} sur {safeTotalPages}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setGridPage((prev) => Math.max(prev - 1, 0))}
                    disabled={gridPage <= 0 || loading || totalPages <= 1}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    Precedent
                  </button>
                  <button
                    type="button"
                    onClick={() => setGridPage((prev) => (prev + 1 < safeTotalPages ? prev + 1 : prev))}
                    disabled={loading || gridPage + 1 >= safeTotalPages || totalPages <= 1}
                    className="rounded-lg border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700 transition hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    Suivant
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>

      {/* Modals */}
      {createModal && (
        <CreateProjectModal
          onClose={() => setCreateModal(false)}
          onSubmit={handleCreate}
          leadAvatarUrl={managerAvatarUrl}
          leadName={managerName}
          leadEmail={managerEmail}
        />
      )}
      {editProject && (
        <CreateProjectModal
          initialProject={editProject}
          onClose={() => setEditProject(null)}
          onSubmit={handleUpdate}
          leadAvatarUrl={managerAvatarUrl}
          leadName={managerName}
          leadEmail={managerEmail}
        />
      )}

      <ConfirmModal
        open={!!deleteConfirm}
        title="Confirmer la suppression"
        message={deleteConfirm ? `Supprimer le projet « ${deleteConfirm.name} » ?` : ""}
        confirmLabel="Supprimer"
        variant="danger"
        loading={deletingId !== null}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm(null)}
      />

      {/* Popup détails */}
      {detailProject &&
        (typeof document === "undefined"
          ? <div className="fixed inset-0 z-[75] flex items-center justify-center bg-slate-900/40 px-4"><div className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl p-6" /></div>
          : createPortal(
            <div className="fixed inset-0 z-[75] flex items-center justify-center bg-slate-900/40 px-4">
              <div className="w-full max-w-xl rounded-3xl bg-white shadow-2xl p-5">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="min-w-0">
                    <h2 className="text-base font-semibold text-slate-900 truncate">{detailProject.name}</h2>
                    {detailProject.description && (
                      <p className="mt-0.5 text-xs text-slate-500 line-clamp-2">{detailProject.description}</p>
                    )}
                  </div>
                  <button type="button" onClick={closeDetail}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition"
                    aria-label="Fermer">
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5 text-sm">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Lead</p>
                    <div className="mt-1 flex items-center gap-2">
                      {managerAvatarUrl ? (
                        <img src={managerAvatarUrl} alt={detailProject.leadName || managerName || ""} className="h-7 w-7 rounded-full object-cover flex-shrink-0" />
                      ) : (
                        <div className="h-7 w-7 rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-[10px] font-semibold text-white flex-shrink-0">
                          {initials(detailProject.leadName ?? managerName, detailProject.leadEmail ?? managerEmail)}
                        </div>
                      )}
                      <span className="text-slate-900 truncate">{detailProject.leadName || "—"}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Priorité</p>
                    <p className="mt-1">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ring-inset ${priorityCls(detailProject.priority)}`}>
                        {priorityLabel(detailProject.priority)}
                      </span>
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Statut</p>
                    <p className="mt-1">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ring-inset ${statusCls(detailProject.status)}`}>
                        {statusLabel(detailProject.status)}
                      </span>
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Équipe</p>
                    <p className="mt-1 text-slate-900">{detailProject.teamSize ?? 1} membre(s)</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm mb-5">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Début</p>
                    <p className="mt-1 text-slate-900">
                      {detailProject.startDate
                        ? new Date(detailProject.startDate).toLocaleDateString("fr-FR", { year: "numeric", month: "short" })
                        : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Échéance</p>
                    <p className="mt-1 text-slate-900">
                      {detailProject.dueDate
                        ? new Date(detailProject.dueDate).toLocaleDateString("fr-FR", { year: "numeric", month: "short", day: "2-digit" })
                        : "—"}
                    </p>
                  </div>
                </div>

                <div className="mt-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-2">
                    Compétences requises
                  </p>
                  {!detailProject.requirements || detailProject.requirements.length === 0 ? (
                    <p className="text-xs text-slate-400">
                      Aucune compétence requise définie pour ce projet.
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {detailProject.requirements.map((r) => (
                        <div
                          key={r.id}
                          className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2 text-xs"
                        >
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900 truncate">{r.skillName}</p>
                            <p className="text-[11px] text-slate-400 truncate">
                              {r.categoryName || "—"}
                            </p>
                          </div>
                          <div className="ml-3 text-[11px] font-medium text-slate-600 whitespace-nowrap">
                            Niveau min&nbsp;: {r.levelMin}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>,
            document.body,
          ))}
    </div>
  );
}