import { useEffect, useState, useMemo, useCallback } from "react";
import { useKeycloak } from "@react-keycloak/web";
import { toast } from "sonner";
import { http } from "../api/http";
import { getPrimaryRole } from "../auth/roles";
import { PlusIcon } from "@heroicons/react/24/outline";

import type { UserListDto, ArchivedUserDto, NavId, AdminRole, TokenParsed } from "./admin/types";
import { ROLE_LABELS, MESSAGES } from "./admin/constants";
import { getDisplayName, getInitials, getApiError, ensureArray } from "./admin/utils";
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

        <main style={{ flex: 1, display: "flex", flexDirection: "column", paddingTop: 64, overflow: "hidden" }}>
          <AdminBreadcrumbs currentView={currentView} onNavigate={handleNavChange} />

          {currentView === "dashboard" && (
            <div className="dashboard-padding">
              <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", flexDirection: "column", gap: 28 }}>
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
            <section style={{ flex: 1, display: "flex", flexDirection: "column", background: "#f8f7ff", overflow: "hidden" }}>
              <SkillsCatalog />
            </section>
          )}

          {currentView === "skillCategories" && (
            <section style={{ flex: 1, display: "flex", flexDirection: "column", background: "#f8f7ff", overflow: "hidden" }}>
              <SkillCategories />
            </section>
          )}

          {currentView === "archives" && (
            <section style={{ flex: 1, display: "flex", flexDirection: "column", background: "#f8f7ff", overflow: "hidden" }}>
              <ArchivedUsersTable
                users={archivedUsers} loading={archivedLoading} error={archivedError}
                restoringId={restoringId} deletingId={deletingId}
                onRestore={handleRestoreUser} onRequestDelete={setDeleteConfirmUser}
              />
            </section>
          )}

          {currentView === "users" && (
            <section style={{ flex: 1, display: "flex", flexDirection: "column", background: "#f8f7ff", overflow: "hidden" }}>
              <div className="users-toolbar" style={{
                display: "flex", alignItems: "center", justifyContent: "flex-end",
                padding: "14px 24px", borderBottom: "1px solid rgba(139,92,246,0.1)",
              }}>
                <button
                  type="button"
                  onClick={() => { resetCreateForm(); setCreateModalOpen(true); }}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 8,
                    borderRadius: 10, border: "none", padding: "9px 18px",
                    fontSize: 13, fontWeight: 600, color: "#fff",
                    background: "linear-gradient(135deg,#4338ca,#6d28d9)",
                    cursor: "pointer", boxShadow: "0 4px 16px rgba(67,56,202,0.4)",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 6px 24px rgba(67,56,202,0.55)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 4px 16px rgba(67,56,202,0.4)"; e.currentTarget.style.transform = "translateY(0)"; }}
                >
                  <PlusIcon className="w-4 h-4" />
                  Nouvel utilisateur
                </button>
              </div>

              <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
                <UsersTable
                  users={usersList} loading={usersLoading} error={usersError}
                  togglingId={togglingId} archivingId={archivingId}
                  onEdit={startEdit} onToggleEnabled={handleToggleEnabled} onArchive={handleArchiveUser}
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
