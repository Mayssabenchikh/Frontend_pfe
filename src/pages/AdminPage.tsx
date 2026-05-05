import { useEffect, useState, useMemo, useCallback } from "react";
import { useKeycloak } from "@react-keycloak/web";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { http } from "../api/http";
import { getPrimaryRole } from "../auth/roles";
import {
  PlusIcon,
} from "../icons/heroicons/outline";
import { UserDetailPage } from "./UserDetailPage";

import type { UserListDto, ArchivedUserDto, NavId, AdminRole, TokenParsed } from "./admin/types";
import { ROLE_LABELS, ROLE_OPTIONS, MESSAGES } from "./admin/constants";
import { getDisplayName, getInitials, getApiError, ensureArray } from "./admin/utils";
import { ConfirmModal } from "../components/ConfirmModal";
import { triggerTopLoadingBar } from "../components/TopLoadingBar";
import { AdminSidebar } from "./admin/AdminSidebar";
import { AdminHeader } from "./admin/AdminHeader";
import { AdminBreadcrumbs } from "./admin/AdminBreadcrumbs";
import { UsersTable } from "./admin/UsersTable";
import { ArchivedUsersTable } from "./admin/ArchivedUsersTable";
import { SkillsCatalog } from "./admin/SkillsCatalog";
import { SkillCategories } from "./admin/SkillCategories";
import { PendingSkillRequests } from "./admin/PendingSkillRequests";
import { AdminProfile } from "./admin/AdminProfile";
import { AdminAssignmentsAudit } from "./admin/AdminAssignmentsAudit";
import { AdminProjectsReadonly } from "./admin/AdminProjectsReadonly";
import { CreateUserModal } from "./admin/CreateUserModal";
import { FiltersPanel } from "../components/FiltersPanel";
import { ArchiveBoxIcon } from "../icons/heroicons/outline";

const USERS_API = "/api/admin/users";
const ROOT_REDIRECT_URI = `${window.location.origin}/`;
const ARCHIVED_DEDUPE_TTL_MS = 3000;
const ADMIN_LAST_VIEW_KEY = "skillify_admin_last_view";

let archivedUsersInFlight: Promise<ArchivedUserDto[]> | null = null;
let archivedUsersInFlightKey: string | null = null;
let archivedUsersCache: { key: string; at: number; value: ArchivedUserDto[] } | null = null;

function buildArchivedRequest(f: {
  search: string;
  role: string;
  from: string;
  to: string;
  order: "recent" | "oldest" | "name";
}) {
  const params = {
    search: f.search || undefined,
    role: f.role !== "ALL" ? f.role : undefined,
    from: f.from || undefined,
    to: f.to || undefined,
    order: f.order || undefined,
  };
  const key = JSON.stringify(params);
  return { params, key };
}

function fetchArchivedUsersDeduped(
  f: {
    search: string;
    role: string;
    from: string;
    to: string;
    order: "recent" | "oldest" | "name";
  },
  force = false,
): Promise<ArchivedUserDto[]> {
  const { params, key } = buildArchivedRequest(f);

  if (!force && archivedUsersCache && archivedUsersCache.key === key && Date.now() - archivedUsersCache.at < ARCHIVED_DEDUPE_TTL_MS) {
    return Promise.resolve(archivedUsersCache.value);
  }

  if (!force && archivedUsersInFlight && archivedUsersInFlightKey === key) {
    return archivedUsersInFlight;
  }

  archivedUsersInFlightKey = key;
  archivedUsersInFlight = http
    .get<ArchivedUserDto[]>(`${USERS_API}/archived`, { params })
    .then((res) => {
      const data = ensureArray(res?.data);
      archivedUsersCache = { key, at: Date.now(), value: data };
      return data;
    })
    .finally(() => {
      archivedUsersInFlight = null;
      archivedUsersInFlightKey = null;
    });

  return archivedUsersInFlight;
}

export default function AdminPage() {
  const { keycloak } = useKeycloak();
  const location = useLocation();
  const navigate = useNavigate();
  const token = keycloak.tokenParsed as TokenParsed | undefined;
  const isUserDetailRoute = /^\/admin\/users\/[^/]+\/?$/.test(location.pathname);

  const [currentView, setCurrentView] = useState<NavId>(() => {
    const requestedView = (location.state as { view?: NavId } | null)?.view;
    if (requestedView) return requestedView;
    try {
      const storedView = sessionStorage.getItem(ADMIN_LAST_VIEW_KEY) as NavId | null;
      return storedView ?? "dashboard";
    } catch {
      return "dashboard";
    }
  });
  const adminAvatarKey = keycloak.subject ? `admin_avatar_${keycloak.subject}` : null;
  const [adminAvatarUrl, setAdminAvatarUrl] = useState<string | null>(
    adminAvatarKey ? (localStorage.getItem(adminAvatarKey) ?? null) : null
  );
  const [users, setUsers] = useState<UserListDto[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState<string | null>(null);

  const [usersFilters, setUsersFilters] = useState<{
    search: string;
    role: string;
    status: "ALL" | "ACTIVE" | "INACTIVE";
    from: string;
    to: string;
    order: "recent" | "oldest" | "name";
  }>({ search: "", role: "ALL", status: "ALL", from: "", to: "", order: "recent" });

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createEmail, setCreateEmail] = useState("");
  const [createFirstName, setCreateFirstName] = useState("");
  const [createLastName, setCreateLastName] = useState("");
  const [createRole, setCreateRole] = useState<AdminRole>("EMPLOYEE");
  const [createDepartment, setCreateDepartment] = useState("");
  const [createJobTitle, setCreateJobTitle] = useState("");
  const [createPhone, setCreatePhone] = useState("");
  const [createHireDate, setCreateHireDate] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [userDetailRefreshKey, setUserDetailRefreshKey] = useState(0);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [archivingId, setArchivingId] = useState<string | null>(null);
  const [archivedUsers, setArchivedUsers] = useState<ArchivedUserDto[]>([]);
  const [archivedLoading, setArchivedLoading] = useState(false);
  const [archivedError, setArchivedError] = useState<string | null>(null);
  const [archivedFilters, setArchivedFilters] = useState<{
    search: string;
    role: string;
    from: string;
    to: string;
    order: "recent" | "oldest" | "name";
  }>({ search: "", role: "ALL", from: "", to: "", order: "recent" });
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<ArchivedUserDto | null>(null);

  const usersList = useMemo(() => ensureArray(users), [users]);

  const handleViewUser = useCallback((user: UserListDto) => {
    navigate(`/admin/users/${encodeURIComponent(user.uuid)}`);
  }, [navigate]);

  const loadUsers = useCallback((filters?: Partial<typeof usersFilters>) => {
    const f = { ...usersFilters, ...(filters ?? {}) };
    setUsersLoading(true);
    http.get<UserListDto[]>(USERS_API, {
      params: {
        search: f.search || undefined,
        role: f.role !== "ALL" ? f.role : undefined,
        enabled:
          f.status === "ACTIVE" ? true : f.status === "INACTIVE" ? false : undefined,
        from: f.from || undefined,
        to: f.to || undefined,
        order: f.order || undefined,
      },
    })
      .then((res) => { setUsers(ensureArray(res?.data)); setUsersError(null); })
      .catch((err) => { setUsersError(getApiError(err, MESSAGES.errorLoad)); setUsers([]); })
      .finally(() => setUsersLoading(false));
  }, [usersFilters]);

  const loadArchivedUsers = useCallback((filters?: Partial<typeof archivedFilters>, options?: { force?: boolean }) => {
    const f = { ...archivedFilters, ...(filters ?? {}) };
    const force = options?.force ?? false;
    setArchivedLoading(true);
    fetchArchivedUsersDeduped(f, force)
      .then((data) => { setArchivedUsers(data); setArchivedError(null); })
      .catch((err) => { setArchivedError(getApiError(err, MESSAGES.errorLoad)); setArchivedUsers([]); })
      .finally(() => setArchivedLoading(false));
  }, [archivedFilters]);

  useEffect(() => {
    const t = setTimeout(() => loadUsers(), 250);
    return () => clearTimeout(t);
  }, [loadUsers, usersFilters]);

  useEffect(() => {
    if (currentView !== "archives") return;
    const t = setTimeout(() => loadArchivedUsers(), 250);
    return () => clearTimeout(t);
  }, [currentView, loadArchivedUsers, archivedFilters]);

  const handleToggleEnabled = useCallback((u: UserListDto) => {
    setTogglingId(u.uuid);
    const action = u.enabled ? "désactivé" : "activé";
    http.patch(`${USERS_API}/${u.uuid}/enabled`, { enabled: !u.enabled })
      .then(() => {
        loadUsers();
        toast.success(`Compte ${action} avec succès`, {
          description: `${u.firstName} ${u.lastName} a été ${action}.`,
        });
      })
      .catch((err) => toast.error("Échec de l'opération", { description: getApiError(err, MESSAGES.errorGeneric) }))
      .finally(() => setTogglingId(null));
  }, [loadUsers]);

  const handleArchiveUser = useCallback((u: UserListDto) => {
    setArchivingId(u.uuid);
    http.patch(`${USERS_API}/${u.uuid}/archive`, {})
      .then(() => {
        loadUsers();
        toast.success("Utilisateur archivé", {
          description: `${u.firstName} ${u.lastName} a été archivé et ne peut plus se connecter.`,
        });
      })
      .catch((err) => toast.error("Échec de l'archivage", { description: getApiError(err, MESSAGES.errorGeneric) }))
      .finally(() => setArchivingId(null));
  }, [loadUsers]);

  const handleRestoreUser = useCallback((u: ArchivedUserDto) => {
    setRestoringId(u.uuid);
    http.patch(`${USERS_API}/${u.uuid}/restore`, {})
      .then(() => {
        loadUsers();
        loadArchivedUsers(undefined, { force: true });
        toast.success("Utilisateur restauré", {
          description: `${u.firstName} ${u.lastName} peut à nouveau se connecter.`,
        });
      })
      .catch((err) => toast.error("Échec de la restauration", { description: getApiError(err, MESSAGES.errorGeneric) }))
      .finally(() => setRestoringId(null));
  }, [loadUsers, loadArchivedUsers]);

  const handleDeletePermanently = useCallback((u: ArchivedUserDto) => {
    setDeletingId(u.uuid);
    http.delete(`${USERS_API}/${u.uuid}`)
      .then(() => {
        loadArchivedUsers(undefined, { force: true });
        toast.success("Utilisateur supprimé définitivement", {
          description: `${u.firstName} ${u.lastName} a été supprimé de Keycloak et de la base de données.`,
        });
      })
      .catch((err) => toast.error("Échec de la suppression", { description: getApiError(err, MESSAGES.errorGeneric) }))
      .finally(() => setDeletingId(null));
  }, [loadArchivedUsers]);

  const resetCreateForm = useCallback(() => {
    setCreateEmail(""); setCreateFirstName(""); setCreateLastName(""); setCreateRole("EMPLOYEE");
    setCreateDepartment(""); setCreateJobTitle(""); setCreatePhone(""); setCreateHireDate("");
  }, []);

  const handleCreateUser = useCallback((e: React.FormEvent, avatarFile: File | null) => {
    e.preventDefault();
    setCreateLoading(true);
    http.post<{ keycloakUserId: string }>(USERS_API, {
      email: createEmail, firstName: createFirstName, lastName: createLastName, role: createRole,
      department: createDepartment || null, jobTitle: createJobTitle || null,
      phone: createPhone || null, hireDate: createHireDate || null,
    })
      .then(async (res) => {
        const newUserId = res.data?.keycloakUserId;
        if (avatarFile && newUserId) {
          try {
            const formData = new FormData();
            formData.append("file", avatarFile);
            await http.post(`${USERS_API}/${newUserId}/avatar`, formData, {
              headers: { "Content-Type": "multipart/form-data" },
            });
          } catch {
            toast.warning("Utilisateur créé, mais l'upload de la photo a échoué.");
          }
        }
        loadUsers();
        setCreateModalOpen(false);
        resetCreateForm();
        toast.success("Utilisateur créé avec succès", {
          description: `Un email d'activation a été envoyé à ${createEmail}.`,
        });
      })
      .catch((err) => {
        const msg = getApiError(err, MESSAGES.errorGeneric);
        const isConflict = msg.toLowerCase().includes("already exists") || msg.toLowerCase().includes("existe");
        toast.error(isConflict ? "Email déjà utilisé" : "Échec de la création", { description: msg });
      })
      .finally(() => setCreateLoading(false));
  }, [createEmail, createFirstName, createLastName, createRole, createDepartment, createJobTitle, createPhone, createHireDate, loadUsers, resetCreateForm]);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const handler = () => { if (mq.matches) setSidebarCollapsed(false); };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  const roleLabel = ROLE_LABELS[getPrimaryRole(token ?? undefined) ?? ""] ?? "—";

  const handleUserDetailSaved = useCallback(() => {
    loadUsers();
    setUserDetailRefreshKey((key) => key + 1);
  }, [loadUsers]);

  useEffect(() => {
    const requestedView = (location.state as { view?: NavId } | null)?.view;
    if (!isUserDetailRoute && requestedView) {
      setCurrentView(requestedView);
    }
  }, [isUserDetailRoute, location.state]);

  useEffect(() => {
    if (isUserDetailRoute) return;
    try {
      sessionStorage.setItem(ADMIN_LAST_VIEW_KEY, currentView);
    } catch {
      // ignore storage errors
    }
  }, [currentView, isUserDetailRoute]);

  const handleNavChange = (view: NavId) => {
    triggerTopLoadingBar();
    if (isUserDetailRoute) navigate("/admin", { state: { view } });
    setCurrentView(view);
    setSidebarOpen(false);
  };

  return (
    <div className="admin-layout" data-sidebar-collapsed={sidebarCollapsed || undefined}>
      {/* Mobile backdrop */}
      <div
        className={`sidebar-backdrop${sidebarOpen ? " open" : ""}`}
        onClick={() => setSidebarOpen(false)}
      />

      <AdminSidebar
        currentView={currentView}
        onNavChange={handleNavChange}
        displayName={getDisplayName(token)} roleLabel={roleLabel}
        avatarUrl={token?.picture ?? null} initials={getInitials(token)}
        mobileOpen={sidebarOpen}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
      />

      <div className="admin-content">
        <AdminHeader
          displayName={getDisplayName(token)}
          initials={getInitials(token)} avatarUrl={adminAvatarUrl}
          avatarSeed={(token?.email ?? keycloak.subject ?? getDisplayName(token)) || null}
          roleLabel={roleLabel}
          onLogout={() => keycloak.logout({ redirectUri: ROOT_REDIRECT_URI })}
          onNavigate={handleNavChange}
          onMenuToggle={() => setSidebarOpen((o) => !o)}
        />

        <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <AdminBreadcrumbs
            currentView={isUserDetailRoute ? "users" : currentView}
            detailLabel={isUserDetailRoute ? "Détail utilisateur" : undefined}
            onNavigate={handleNavChange}
          />

          {isUserDetailRoute ? (
            <UserDetailPage
              source="admin"
              refreshKey={userDetailRefreshKey}
              onAdminSaved={handleUserDetailSaved}
            />
          ) : currentView === "dashboard" && <div className="dashboard-padding" />}

          {!isUserDetailRoute && currentView === "profile" && (
            <AdminProfile
              token={token}
              adminKeycloakId={keycloak.subject}
              initialAvatarUrl={adminAvatarUrl}
              onAvatarUpdate={(url) => {
                setAdminAvatarUrl(url);
                if (adminAvatarKey) localStorage.setItem(adminAvatarKey, url);
              }}
            />
          )}

          {!isUserDetailRoute && currentView === "skills" && (
            <section className="flex flex-1 flex-col overflow-hidden bg-[#f8f7ff]">
              <SkillsCatalog />
            </section>
          )}

          {!isUserDetailRoute && currentView === "skillCategories" && (
            <section className="flex flex-1 flex-col overflow-hidden bg-[#f8f7ff]">
              <SkillCategories />
            </section>
          )}

          {!isUserDetailRoute && currentView === "skillRequests" && (
            <section className="flex flex-1 flex-col overflow-hidden bg-[#f8f7ff]">
              <PendingSkillRequests />
            </section>
          )}

          {!isUserDetailRoute && currentView === "assignments" && (
            <AdminAssignmentsAudit />
          )}

          {!isUserDetailRoute && currentView === "projects" && (
            <AdminProjectsReadonly />
          )}

          {!isUserDetailRoute && currentView === "archives" && (
            <section className="flex flex-1 flex-col overflow-hidden bg-[#f8f7ff]">
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[#f8f7ff] px-3 py-3 sm:px-6 sm:py-4">
                <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
                  <div className="flex items-center gap-3 rounded-2xl border border-amber-400/20 bg-gradient-to-r from-amber-400/10 to-amber-400/5 px-4 py-3 text-amber-900 shadow-sm">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-amber-400/25 bg-amber-400/20">
                      <ArchiveBoxIcon className="h-4 w-4 text-amber-800" />
                    </div>
                    <p className="text-xs font-medium leading-relaxed">
                      Les utilisateurs archivés ne peuvent plus se connecter. Vous pouvez les restaurer à tout moment ou les supprimer définitivement.
                    </p>
                  </div>
                  <FiltersPanel
                    title="Filtres"
                    resultsLabel={`${archivedUsers.length} résultat${archivedUsers.length !== 1 ? "s" : ""}`}
                    onReset={() => setArchivedFilters({ search: "", role: "ALL", from: "", to: "", order: "recent" })}
                  >
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
                      <div className="lg:col-span-2">
                        <label className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                          Rechercher (nom, prénom, email)
                        </label>
                        <input
                          value={archivedFilters.search}
                          onChange={(e) => setArchivedFilters((p) => ({ ...p, search: e.target.value }))}
                          placeholder="Ex: maram khribich, maram@…"
                          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/15"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Rôle</label>
                        <select
                          value={archivedFilters.role}
                          onChange={(e) => setArchivedFilters((p) => ({ ...p, role: e.target.value }))}
                          className="mt-1 w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/15"
                        >
                          <option value="ALL">Tous les rôles</option>
                          {ROLE_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Du</label>
                        <input
                          type="date"
                          value={archivedFilters.from}
                          onChange={(e) => setArchivedFilters((p) => ({ ...p, from: e.target.value }))}
                          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/15"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Au</label>
                        <input
                          type="date"
                          value={archivedFilters.to}
                          onChange={(e) => setArchivedFilters((p) => ({ ...p, to: e.target.value }))}
                          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/15"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Ordre</label>
                        <select
                          value={archivedFilters.order}
                          onChange={(e) => setArchivedFilters((p) => ({ ...p, order: e.target.value as any }))}
                          className="mt-1 w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/15"
                        >
                          <option value="recent">Plus récent</option>
                          <option value="oldest">Plus ancien</option>
                          <option value="name">Nom</option>
                        </select>
                      </div>
                    </div>
                  </FiltersPanel>

                  <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
                    <ArchivedUsersTable
                      users={archivedUsers} loading={archivedLoading} error={archivedError}
                      restoringId={restoringId} deletingId={deletingId}
                      onRestore={handleRestoreUser} onRequestDelete={setDeleteConfirmUser}
                    />
                  </div>
                </div>
              </div>
            </section>
          )}

          {!isUserDetailRoute && currentView === "users" && (
            <section className="flex min-h-0 w-full flex-1 flex-col overflow-hidden bg-[#f8f7ff]">
              <div className="users-toolbar flex w-full shrink-0 items-center justify-end border-b border-violet-500/10 px-3 py-3 sm:px-6 sm:py-3.5">
                <button
                  type="button"
                  onClick={() => { resetCreateForm(); setCreateModalOpen(true); }}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-xl border-none bg-gradient-to-br from-indigo-600 to-violet-600 px-[18px] py-2.5 text-[13px] font-semibold text-white shadow-[0_4px_16px_rgba(67,56,202,0.4)] transition-all duration-150 hover:-translate-y-px hover:shadow-[0_6px_24px_rgba(67,56,202,0.55)]"
                >
                  <PlusIcon className="w-4 h-4" />
                  Nouvel utilisateur
                </button>
              </div>

              <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[#f8f7ff] px-3 py-3 sm:px-6 sm:py-4">
                <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
                  <FiltersPanel
                    title="Filtres"
                    resultsLabel={`${usersList.length} résultat${usersList.length !== 1 ? "s" : ""}`}
                    onReset={() => setUsersFilters({ search: "", role: "ALL", status: "ALL", from: "", to: "", order: "recent" })}
                  >
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-7">
                        <div className="lg:col-span-2">
                          <label className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                            Rechercher (nom, prénom, email)
                          </label>
                          <input
                            value={usersFilters.search}
                            onChange={(e) => setUsersFilters((p) => ({ ...p, search: e.target.value }))}
                            placeholder="Ex: maram khribich, maram@…"
                            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/15"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Statut</label>
                          <select
                            value={usersFilters.status}
                            onChange={(e) => setUsersFilters((p) => ({ ...p, status: e.target.value as any }))}
                            className="mt-1 w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/15"
                          >
                            <option value="ALL">Tous les statuts</option>
                            <option value="ACTIVE">Actif</option>
                            <option value="INACTIVE">Inactif</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Rôle</label>
                          <select
                            value={usersFilters.role}
                            onChange={(e) => setUsersFilters((p) => ({ ...p, role: e.target.value }))}
                            className="mt-1 w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/15"
                          >
                            <option value="ALL">Tous les rôles</option>
                            {ROLE_OPTIONS.map((o) => (
                              <option key={o.value} value={o.value}>
                                {o.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Du</label>
                          <input
                            type="date"
                            value={usersFilters.from}
                            onChange={(e) => setUsersFilters((p) => ({ ...p, from: e.target.value }))}
                            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/15"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Au</label>
                          <input
                            type="date"
                            value={usersFilters.to}
                            onChange={(e) => setUsersFilters((p) => ({ ...p, to: e.target.value }))}
                            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/15"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Ordre</label>
                          <select
                            value={usersFilters.order}
                            onChange={(e) => setUsersFilters((p) => ({ ...p, order: e.target.value as any }))}
                            className="mt-1 w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/15"
                          >
                            <option value="recent">Plus récent</option>
                            <option value="oldest">Plus ancien</option>
                            <option value="name">Nom</option>
                          </select>
                        </div>
                      </div>
                  </FiltersPanel>

                  <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
                    <UsersTable
                      users={usersList}
                      loading={usersLoading}
                      error={usersError}
                      togglingId={togglingId}
                      archivingId={archivingId}
                      onView={handleViewUser}
                      onToggleEnabled={handleToggleEnabled}
                      onArchive={handleArchiveUser}
                    />
                  </div>
                </div>
              </div>
            </section>
          )}
        </main>
      </div>

      <CreateUserModal
        open={createModalOpen} onClose={() => setCreateModalOpen(false)}
        email={createEmail} firstName={createFirstName} lastName={createLastName} role={createRole}
        department={createDepartment} jobTitle={createJobTitle} phone={createPhone} hireDate={createHireDate}
        onEmailChange={setCreateEmail} onFirstNameChange={setCreateFirstName}
        onLastNameChange={setCreateLastName} onRoleChange={setCreateRole}
        onDepartmentChange={setCreateDepartment} onJobTitleChange={setCreateJobTitle}
        onPhoneChange={setCreatePhone} onHireDateChange={setCreateHireDate}
        loading={createLoading} onSubmit={handleCreateUser}
      />

      <ConfirmModal
        open={!!deleteConfirmUser}
        title="Confirmer la suppression définitive"
        message={deleteConfirmUser ? `Supprimer définitivement « ${deleteConfirmUser.firstName} ${deleteConfirmUser.lastName} » ? Cette action est irréversible.` : ""}
        confirmLabel="Supprimer définitivement"
        variant="danger"
        loading={deletingId !== null}
        onConfirm={() => {
          if (deleteConfirmUser) {
            const u = deleteConfirmUser;
            setDeleteConfirmUser(null);
            handleDeletePermanently(u);
          }
        }}
        onCancel={() => setDeleteConfirmUser(null)}
      />
    </div>
  );
}
