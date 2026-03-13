import { useEffect, useState, useMemo, useCallback } from "react";
import { useKeycloak } from "@react-keycloak/web";
import { toast } from "sonner";
import { http } from "../api/http";
import { getPrimaryRole } from "../auth/roles";
import {
  PlusIcon,
  XMarkIcon,
  EnvelopeIcon,
  PhoneIcon,
  BuildingOffice2Icon,
  BriefcaseIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  NoSymbolIcon,
} from "@heroicons/react/24/outline";

import type { UserListDto, ArchivedUserDto, NavId, AdminRole, TokenParsed } from "./admin/types";
import { ROLE_LABELS, MESSAGES } from "./admin/constants";
import { getDisplayName, getInitials, getApiError, ensureArray, getAvatarColor } from "./admin/utils";
import { ConfirmModal } from "../components/ConfirmModal";
import { AdminSidebar } from "./admin/AdminSidebar";
import { AdminHeader } from "./admin/AdminHeader";
import { AdminBreadcrumbs } from "./admin/AdminBreadcrumbs";
import { AdminStats } from "./admin/AdminStats";
import { UsersTable } from "./admin/UsersTable";
import { ArchivedUsersTable } from "./admin/ArchivedUsersTable";
import { SkillsCatalog } from "./admin/SkillsCatalog";
import { SkillCategories } from "./admin/SkillCategories";
import { AdminProfile } from "./admin/AdminProfile";
import { CreateUserModal } from "./admin/CreateUserModal";
import { EditUserModal } from "./admin/EditUserModal";

const USERS_API = "/api/admin/users";

export default function AdminPage() {
  const { keycloak } = useKeycloak();
  const token = keycloak.tokenParsed as TokenParsed | undefined;

  const [currentView, setCurrentView] = useState<NavId>("dashboard");
  const adminAvatarKey = keycloak.subject ? `admin_avatar_${keycloak.subject}` : null;
  const [adminAvatarUrl, setAdminAvatarUrl] = useState<string | null>(
    adminAvatarKey ? (localStorage.getItem(adminAvatarKey) ?? null) : null
  );
  const [users, setUsers] = useState<UserListDto[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState<string | null>(null);

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

  const [editingUser, setEditingUser] = useState<UserListDto | null>(null);
  const [editEmail, setEditEmail] = useState("");
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editRole, setEditRole] = useState<AdminRole>("EMPLOYEE");
  const [editDepartment, setEditDepartment] = useState("");
  const [editJobTitle, setEditJobTitle] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editHireDate, setEditHireDate] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [archivingId, setArchivingId] = useState<string | null>(null);
  const [archivedUsers, setArchivedUsers] = useState<ArchivedUserDto[]>([]);
  const [archivedLoading, setArchivedLoading] = useState(false);
  const [archivedError, setArchivedError] = useState<string | null>(null);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<ArchivedUserDto | null>(null);
  const [viewUser, setViewUser] = useState<UserListDto | null>(null);

  const usersList = useMemo(() => ensureArray(users), [users]);
  const stats = useMemo(() => ({
    total: usersList.length,
    actifs: usersList.filter((u) => u.enabled).length,
    inactifs: usersList.filter((u) => !u.enabled).length,
  }), [usersList]);

  const loadUsers = useCallback(() => {
    setUsersLoading(true);
    http.get<UserListDto[]>(USERS_API)
      .then((res) => { setUsers(ensureArray(res?.data)); setUsersError(null); })
      .catch((err) => { setUsersError(getApiError(err, MESSAGES.errorLoad)); setUsers([]); })
      .finally(() => setUsersLoading(false));
  }, []);

  const loadArchivedUsers = useCallback(() => {
    setArchivedLoading(true);
    http.get<ArchivedUserDto[]>(`${USERS_API}/archived`)
      .then((res) => { setArchivedUsers(ensureArray(res?.data)); setArchivedError(null); })
      .catch((err) => { setArchivedError(getApiError(err, MESSAGES.errorLoad)); setArchivedUsers([]); })
      .finally(() => setArchivedLoading(false));
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const handleToggleEnabled = useCallback((u: UserListDto) => {
    setTogglingId(u.id);
    const action = u.enabled ? "désactivé" : "activé";
    http.patch(`${USERS_API}/${u.id}/enabled`, { enabled: !u.enabled })
      .then(() => {
        loadUsers();
        toast.success(`Compte ${action} avec succès`, {
          description: `${u.firstName} ${u.lastName} a été ${action}.`,
        });
      })
      .catch((err) => toast.error("Échec de l'opération", { description: getApiError(err, MESSAGES.errorGeneric) }))
      .finally(() => setTogglingId(null));
  }, [loadUsers]);

  const startEdit = useCallback((u: UserListDto) => {
    setEditingUser(u);
    setEditEmail(u.email);
    setEditFirstName(u.firstName);
    setEditLastName(u.lastName);
    setEditRole((u.role === "MANAGER" ? "MANAGER" : "EMPLOYEE") as AdminRole);
    setEditDepartment(u.department ?? "");
    setEditJobTitle(u.jobTitle ?? "");
    setEditPhone(u.phone ?? "");
    setEditHireDate(u.hireDate ?? "");
  }, []);

  const handleUpdateUser = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setEditLoading(true);
    http.put(`${USERS_API}/${editingUser.id}`, {
      email: editEmail, firstName: editFirstName, lastName: editLastName, role: editRole,
      department: editDepartment || null, jobTitle: editJobTitle || null,
      phone: editPhone || null, hireDate: editHireDate || null,
    })
      .then(() => {
        loadUsers();
        setEditingUser(null);
        toast.success("Modifications enregistrées", {
          description: `Le profil de ${editFirstName} ${editLastName} a été mis à jour.`,
        });
      })
      .catch((err) => toast.error("Échec de la mise à jour", { description: getApiError(err, MESSAGES.errorGeneric) }))
      .finally(() => setEditLoading(false));
  }, [editingUser, editEmail, editFirstName, editLastName, editRole, editDepartment, editJobTitle, editPhone, editHireDate, loadUsers]);

  const handleArchiveUser = useCallback((u: UserListDto) => {
    setArchivingId(u.id);
    http.patch(`${USERS_API}/${u.id}/archive`, {})
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
    setRestoringId(u.id);
    http.patch(`${USERS_API}/${u.id}/restore`, {})
      .then(() => {
        loadUsers();
        loadArchivedUsers();
        toast.success("Utilisateur restauré", {
          description: `${u.firstName} ${u.lastName} peut à nouveau se connecter.`,
        });
      })
      .catch((err) => toast.error("Échec de la restauration", { description: getApiError(err, MESSAGES.errorGeneric) }))
      .finally(() => setRestoringId(null));
  }, [loadUsers, loadArchivedUsers]);

  const handleDeletePermanently = useCallback((u: ArchivedUserDto) => {
    setDeletingId(u.id);
    http.delete(`${USERS_API}/${u.id}`)
      .then(() => {
        loadArchivedUsers();
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

  const handleNavChange = (view: NavId) => {
    setCurrentView(view);
    setSidebarOpen(false);
    if (view === "archives") loadArchivedUsers();
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
          onLogout={() => keycloak.logout({ redirectUri: `${window.location.origin}/` })}
          onNavigate={setCurrentView}
          onMenuToggle={() => setSidebarOpen((o) => !o)}
        />

        <main className="flex min-w-0 flex-1 flex-col overflow-hidden pt-16">
          <AdminBreadcrumbs currentView={currentView} onNavigate={handleNavChange} />

          {currentView === "dashboard" && (
            <div className="dashboard-padding">
              <div className="mx-auto flex max-w-[1100px] flex-col gap-7">
                <AdminStats total={stats.total} actifs={stats.actifs} inactifs={stats.inactifs} />
              </div>
            </div>
          )}

          {currentView === "profile" && (
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

          {currentView === "skills" && (
            <section className="flex flex-1 flex-col overflow-hidden bg-[#f8f7ff]">
              <SkillsCatalog />
            </section>
          )}

          {currentView === "skillCategories" && (
            <section className="flex flex-1 flex-col overflow-hidden bg-[#f8f7ff]">
              <SkillCategories />
            </section>
          )}

          {currentView === "archives" && (
            <section className="flex flex-1 flex-col overflow-hidden bg-[#f8f7ff]">
              <ArchivedUsersTable
                users={archivedUsers} loading={archivedLoading} error={archivedError}
                restoringId={restoringId} deletingId={deletingId}
                onRestore={handleRestoreUser} onRequestDelete={setDeleteConfirmUser}
              />
            </section>
          )}

          {currentView === "users" && (
            <section className="flex min-h-0 w-full flex-1 flex-col overflow-hidden bg-[#f8f7ff]">
              <div className="users-toolbar flex w-full shrink-0 items-center justify-end border-b border-violet-500/10 px-6 py-3.5">
                <button
                  type="button"
                  onClick={() => { resetCreateForm(); setCreateModalOpen(true); }}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-xl border-none bg-gradient-to-br from-indigo-600 to-violet-600 px-[18px] py-2.5 text-[13px] font-semibold text-white shadow-[0_4px_16px_rgba(67,56,202,0.4)] transition-all duration-150 hover:-translate-y-px hover:shadow-[0_6px_24px_rgba(67,56,202,0.55)]"
                >
                  <PlusIcon className="w-4 h-4" />
                  Nouvel utilisateur
                </button>
              </div>

              <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
                <UsersTable
                  users={usersList}
                  loading={usersLoading}
                  error={usersError}
                  togglingId={togglingId}
                  archivingId={archivingId}
                  onEdit={startEdit}
                  onView={setViewUser}
                  onToggleEnabled={handleToggleEnabled}
                  onArchive={handleArchiveUser}
                />
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

      {editingUser && (
        <EditUserModal
          user={editingUser} email={editEmail} firstName={editFirstName} lastName={editLastName} role={editRole}
          department={editDepartment} jobTitle={editJobTitle} phone={editPhone} hireDate={editHireDate}
          onEmailChange={setEditEmail} onFirstNameChange={setEditFirstName} onLastNameChange={setEditLastName} onRoleChange={setEditRole}
          onDepartmentChange={setEditDepartment} onJobTitleChange={setEditJobTitle}
          onPhoneChange={setEditPhone} onHireDateChange={setEditHireDate}
          loading={editLoading} onClose={() => setEditingUser(null)} onSubmit={handleUpdateUser}
        />
      )}

      {viewUser && (
        <div
          onClick={() => setViewUser(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md overflow-hidden rounded-2xl border border-violet-500/20 bg-white shadow-[0_32px_80px_rgba(109,40,217,0.15)] max-h-[90vh] flex flex-col animate-[modalIn_0.25s_cubic-bezier(0.16,1,0.3,1)_both]"
          >
            <style>{`@keyframes modalIn{from{opacity:0;transform:scale(0.96) translateY(12px)}to{opacity:1;transform:scale(1) translateY(0)}}`}</style>

            {/* Bandeau gradient + en-tête */}
            <div className="shrink-0 border-b border-slate-100 bg-gradient-to-br from-violet-50 to-white">
              <div className="flex items-start justify-between gap-3 px-6 pt-6 pb-4">
                <div className="flex min-w-0 flex-1 items-start gap-4">
                  <div className="relative shrink-0">
                    {viewUser.avatarUrl ? (
                      <img
                        src={viewUser.avatarUrl}
                        alt={`${viewUser.firstName} ${viewUser.lastName}`}
                        className="h-16 w-16 rounded-2xl border-2 border-violet-100 object-cover shadow-lg"
                      />
                    ) : (
                      <div
                        className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-violet-100 text-2xl font-bold text-white shadow-lg"
                        style={{
                          background: `linear-gradient(135deg, ${getAvatarColor(viewUser.email)[0]}, ${getAvatarColor(viewUser.email)[1]})`,
                        }}
                      >
                        {((viewUser.firstName?.[0] ?? "") + (viewUser.lastName?.[0] ?? "")).trim().toUpperCase() || "U"}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-lg font-bold text-slate-900 truncate">
                      {`${viewUser.firstName} ${viewUser.lastName}`.trim() || viewUser.email}
                    </h2>
                    <p className="mt-0.5 flex items-center gap-1.5 text-sm text-slate-500">
                      <EnvelopeIcon className="h-4 w-4 shrink-0 text-violet-400" />
                      <span className="truncate">{viewUser.email}</span>
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center rounded-lg border border-violet-200 bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-800">
                        {ROLE_LABELS[viewUser.role] ?? viewUser.role}
                      </span>
                      {viewUser.enabled ? (
                        <span className="inline-flex items-center gap-1 rounded-lg border border-green-200 bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
                          <CheckCircleIcon className="h-3.5 w-3.5" />
                          Actif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                          <NoSymbolIcon className="h-3.5 w-3.5" />
                          Inactif
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setViewUser(null)}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 transition hover:bg-slate-50 hover:text-slate-600"
                  aria-label="Fermer"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Corps : champs avec icônes */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <p className="mb-4 text-[11px] font-bold uppercase tracking-widest text-slate-400">
                Informations professionnelles
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-600">
                    <BuildingOffice2Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Département</p>
                    <p className="mt-0.5 text-sm font-medium text-slate-800">{viewUser.department || "—"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-600">
                    <BriefcaseIcon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Poste</p>
                    <p className="mt-0.5 text-sm font-medium text-slate-800">{viewUser.jobTitle || "—"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-600">
                    <PhoneIcon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Téléphone</p>
                    <p className="mt-0.5 text-sm font-medium text-slate-800">{viewUser.phone || "—"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-600">
                    <CalendarDaysIcon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Date d&apos;embauche</p>
                    <p className="mt-0.5 text-sm font-medium text-slate-800">
                      {viewUser.hireDate
                        ? new Date(viewUser.hireDate).toLocaleDateString("fr-FR", {
                            year: "numeric",
                            month: "long",
                            day: "2-digit",
                          })
                        : "—"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

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
