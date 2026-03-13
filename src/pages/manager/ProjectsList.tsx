import { useEffect, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { toast } from "sonner";
import { createPortal } from "react-dom";
import { PlusIcon, MagnifyingGlassIcon, TrashIcon, ArrowPathIcon, PencilSquareIcon, EyeIcon, XMarkIcon, EllipsisVerticalIcon } from "@heroicons/react/24/outline";
import { projectsApi, type ProjectDto, type ProjectPage } from "../../api/projectsApi";
import { CreateProjectModal } from "./CreateProjectModal";
import { ConfirmModal } from "../../components/ConfirmModal";
import { useKeycloak } from "@react-keycloak/web";
import { getPrimaryRole } from "../../auth/roles";

type ManagerOutletContext = {
  managerAvatarUrl: string | null;
  managerName: string;
  managerEmail: string | null;
  currentPath: string;
};

/* ─── colonnes identiques header + rows ──────────────────────────────────── */
const COLS = "grid-cols-[minmax(0,2fr)_minmax(0,1.5fr)_120px_110px_160px_90px_100px_44px]";

export function ProjectsList() {
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
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [createModal, setCreateModal] = useState(false);
  const [editProject, setEditProject] = useState<ProjectDto | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<ProjectDto | null>(null);
  const [detailProject, setDetailProject] = useState<ProjectDto | null>(null);
  const [actionsProjectId, setActionsProjectId] = useState<number | null>(null);

  const load = () => {
    setLoading(true);
    projectsApi
      .list({
        search: search || undefined,
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
        page,
        size: 8,
      })
      .then((res) => {
        const data = res.data as ProjectPage;
        setProjects(data.content ?? []);
        setTotalPages(data.totalPages ?? 0);
      })
      .catch(() => {
        setProjects([]);
        setTotalPages(0);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [search, statusFilter, priorityFilter, page]);

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

  const total = projects.length;
  const inProgress = projects.filter((p) => p.status === "ACTIVE").length;
  const completed = projects.filter((p) => p.status === "CLOSED").length;
  const critical = projects.filter((p) => p.status === "CRITICAL").length;

  /* ── helpers ────────────────────────────────────────────────────────────── */
  const statusLabel = (s?: string | null) =>
    s === "ACTIVE" ? "En cours" : s === "CLOSED" ? "Terminé" : s === "CRITICAL" ? "Critique" : "Brouillon";

  const statusCls = (s?: string | null) =>
    s === "ACTIVE" ? "bg-sky-50 text-sky-600 ring-sky-200"
    : s === "CLOSED" ? "bg-emerald-50 text-emerald-600 ring-emerald-200"
    : s === "CRITICAL" ? "bg-rose-50 text-rose-600 ring-rose-200"
    : "bg-slate-50 text-slate-600 ring-slate-200";

  const priorityLabel = (p?: string | null) =>
    p === "HIGH" ? "Haute" : p === "LOW" ? "Basse" : "Moyenne";

  const priorityCls = (p?: string | null) =>
    p === "HIGH" ? "bg-amber-50 text-amber-600 ring-amber-200"
    : p === "LOW" ? "bg-slate-50 text-slate-600 ring-slate-200"
    : "bg-indigo-50 text-indigo-600 ring-indigo-200";

  const initials = (name?: string | null, email?: string | null) =>
    (name || email || "?").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  const progress = (v?: number | null) => Math.max(0, Math.min(100, v ?? 0));

  return (
    <div className="w-full space-y-6">

      {/* Titre + bouton */}
      <div className="flex items-center justify-between gap-4">
        <div />
        {role === "MANAGER" && (
          <button
            type="button"
            onClick={() => setCreateModal(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-700 to-violet-700 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:shadow-lg active:scale-[0.98] transition"
          >
            <PlusIcon className="w-4 h-4" />
            Nouveau projet
          </button>
        )}
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total", value: total, sub: "Projets au total", cls: "text-slate-400" },
          { label: "En cours", value: inProgress, sub: "Projets actifs", cls: "text-sky-500" },
          { label: "Terminés", value: completed, sub: "Projets clôturés", cls: "text-emerald-500" },
          { label: "Critiques", value: critical, sub: "Priorité haute", cls: "text-rose-500" },
        ].map(({ label, value, sub, cls }) => (
          <div key={label} className="rounded-2xl bg-white shadow-sm border border-slate-100 px-4 py-3">
            <p className={`text-xs font-medium uppercase tracking-wide ${cls}`}>{label}</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">{value}</p>
            <p className="mt-1 text-xs text-slate-500">{sub}</p>
          </div>
        ))}
      </div>

      {/* Barre de recherche + filtres */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-violet-100 bg-white px-4 py-3 shadow-sm">
        <div className="relative flex-1 min-w-[220px]">
          <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un projet..."
            className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2.5 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => { setPage(0); setStatusFilter(e.target.value); }}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-200"
          >
            <option value="">Tous les statuts</option>
            <option value="ACTIVE">En cours</option>
            <option value="DRAFT">Brouillon</option>
            <option value="CLOSED">Clôturé</option>
            <option value="CRITICAL">Critique</option>
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => { setPage(0); setPriorityFilter(e.target.value); }}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-200"
          >
            <option value="">Toutes les priorités</option>
            <option value="HIGH">Haute</option>
            <option value="MEDIUM">Moyenne</option>
            <option value="LOW">Basse</option>
          </select>
        </div>
      </div>

      {/* ── Tableau ────────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-visible">

        {/* Header */}
        <div className={`grid ${COLS} items-center gap-x-4 border-b border-slate-100 bg-slate-50/80 px-5 py-2.5 text-[10.5px] font-semibold uppercase tracking-widest text-slate-400`}>
          <div>Projet</div>
          <div>Lead</div>
          <div>Statut</div>
          <div>Priorité</div>
          <div>Progression</div>
          <div>Équipe</div>
          <div>Échéance</div>
          <div />
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center gap-2 px-5 py-6 text-sm text-slate-500">
            <ArrowPathIcon className="h-5 w-5 animate-spin" />
            Chargement des projets…
          </div>
        )}

        {/* Empty */}
        {!loading && projects.length === 0 && (
          <div className="px-5 py-6 text-sm text-slate-400">
            Aucun projet. Créez-en un pour commencer.
          </div>
        )}

        {/* Rows */}
        {!loading && projects.length > 0 && (
          <div className="divide-y divide-slate-100">
            {projects.map((p) => (
              <div
                key={p.id}
                className={`grid ${COLS} items-center gap-x-4 px-5 py-3 hover:bg-violet-50/60 transition-colors min-h-[56px]`}
              >
                {/* Projet */}
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900 leading-tight">{p.name}</p>
                  {p.description && (
                    <p className="truncate text-[11px] text-slate-400 mt-0.5 leading-tight">{p.description}</p>
                  )}
                </div>

                {/* Lead */}
                <div className="min-w-0 flex items-center gap-2">
                  {managerAvatarUrl ? (
                    <img
                      src={managerAvatarUrl}
                      alt={p.leadName || p.leadEmail || managerName || managerEmail || ""}
                      className="h-7 w-7 flex-shrink-0 rounded-full object-cover ring-1 ring-slate-200"
                    />
                  ) : (
                    <div className="h-7 w-7 flex-shrink-0 rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-[10px] font-semibold text-white ring-1 ring-indigo-200">
                      {initials(p.leadName ?? managerName, p.leadEmail ?? managerEmail)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium text-slate-700 leading-tight">{p.leadName || "—"}</p>
                    {p.leadEmail && (
                      <p className="truncate text-[10px] text-slate-400 leading-tight">{p.leadEmail}</p>
                    )}
                  </div>
                </div>

                {/* Statut */}
                <div>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ring-inset ${statusCls(p.status)}`}>
                    {statusLabel(p.status)}
                  </span>
                </div>

                {/* Priorité */}
                <div>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ring-inset ${priorityCls(p.priority)}`}>
                    {priorityLabel(p.priority)}
                  </span>
                </div>

                {/* Progression */}
                <div className="flex items-center gap-2.5">
                  <div className="relative h-1.5 flex-1 max-w-[96px] rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-indigo-500 to-violet-600 transition-all"
                      style={{ width: `${progress(p.progressPercent)}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-[11px] tabular-nums text-slate-500">
                    {progress(p.progressPercent)}%
                  </span>
                </div>

                {/* Équipe */}
                <div className="text-xs text-slate-600 tabular-nums">
                  {p.teamSize ?? 1} <span className="text-slate-400">membre{(p.teamSize ?? 1) > 1 ? "s" : ""}</span>
                </div>

                {/* Échéance */}
                <div className="text-xs text-slate-500 tabular-nums">
                  {p.dueDate ? new Date(p.dueDate).toLocaleDateString("fr-FR") : "—"}
                </div>

                {/* Actions */}
                <div className="relative flex justify-end">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActionsProjectId((cur) => (cur === p.id ? null : p.id));
                    }}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-violet-600 transition focus:outline-none"
                    title="Actions"
                  >
                    <EllipsisVerticalIcon className="h-4 w-4" />
                  </button>

                  {actionsProjectId === p.id && (
                    <div className="absolute right-0 top-9 z-[60] min-w-[160px] rounded-2xl border border-slate-100 bg-white shadow-xl py-1.5">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setDetailProject(p); setActionsProjectId(null); }}
                        className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
                      >
                        <EyeIcon className="h-4 w-4 text-slate-400" />
                        Voir les détails
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleEdit(p); setActionsProjectId(null); }}
                        className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
                      >
                        <PencilSquareIcon className="h-4 w-4 text-slate-400" />
                        Modifier
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleDeleteClick(p); setActionsProjectId(null); }}
                        disabled={deletingId === p.id}
                        className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50"
                      >
                        {deletingId === p.id
                          ? <ArrowPathIcon className="h-4 w-4 animate-spin" />
                          : <TrashIcon className="h-4 w-4 text-red-400" />}
                        Supprimer
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Overlay fermeture menu */}
      {actionsProjectId !== null && (
        <div className="fixed inset-0 z-[40]" onClick={() => setActionsProjectId(null)} />
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            disabled={page === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 disabled:opacity-40"
          >
            Précédent
          </button>
          <span className="text-xs text-slate-500">Page {page + 1} / {totalPages}</span>
          <button
            type="button"
            disabled={page + 1 >= totalPages}
            onClick={() => setPage((p) => (p + 1 < totalPages ? p + 1 : p))}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 disabled:opacity-40"
          >
            Suivant
          </button>
        </div>
      )}

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

                <div className="mb-5">
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                    <span>Progression</span>
                    <span>{progress(detailProject.progressPercent)}%</span>
                  </div>
                  <div className="relative h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-indigo-500 to-violet-600"
                      style={{ width: `${progress(detailProject.progressPercent)}%` }}
                    />
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