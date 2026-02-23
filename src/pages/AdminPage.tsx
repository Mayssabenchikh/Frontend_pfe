import { useEffect, useState, useMemo, useCallback } from "react";
import { useKeycloak } from "@react-keycloak/web";
import { http } from "../api/http";
import { getPrimaryRole } from "../auth/roles";
import "../styles/AdminDashboard.css";

import type { UserListDto, NavId, AdminRole, FlashMessage, TokenParsed } from "./admin/types";
import { ROLE_LABELS, MESSAGES } from "./admin/constants";
import { getDisplayName, getInitials, getApiError, ensureArray } from "./admin/utils";
import { IconPlus } from "./admin/icons";
import { AdminSidebar } from "./admin/AdminSidebar";
import { AdminHeader } from "./admin/AdminHeader";
import { AdminStats } from "./admin/AdminStats";
import { UsersTable } from "./admin/UsersTable";
import { CreateUserModal } from "./admin/CreateUserModal";
import { EditUserModal } from "./admin/EditUserModal";

const USERS_API = "/api/admin/users";

export default function AdminPage() {
  const { keycloak } = useKeycloak();
  const token = keycloak.tokenParsed as TokenParsed | undefined;

  const [currentView, setCurrentView] = useState<NavId>("dashboard");
  const [users, setUsers] = useState<UserListDto[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState<string | null>(null);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createEmail, setCreateEmail] = useState("");
  const [createFirstName, setCreateFirstName] = useState("");
  const [createLastName, setCreateLastName] = useState("");
  const [createRole, setCreateRole] = useState<AdminRole>("EMPLOYEE");
  const [createMessage, setCreateMessage] = useState<FlashMessage | null>(null);
  const [createLoading, setCreateLoading] = useState(false);

  const [editingUser, setEditingUser] = useState<UserListDto | null>(null);
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editRole, setEditRole] = useState<AdminRole>("EMPLOYEE");
  const [editMessage, setEditMessage] = useState<FlashMessage | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const usersList = useMemo(() => ensureArray(users), [users]);
  const stats = useMemo(
    () => ({
      total: usersList.length,
      actifs: usersList.filter((u) => u.enabled).length,
      inactifs: usersList.filter((u) => !u.enabled).length,
    }),
    [usersList]
  );

  const loadUsers = useCallback(() => {
    setUsersLoading(true);
    http
      .get<UserListDto[]>(USERS_API)
      .then((res) => {
        setUsers(ensureArray(res?.data));
        setUsersError(null);
      })
      .catch((err) => {
        setUsersError(getApiError(err, MESSAGES.errorLoad));
        setUsers([]);
      })
      .finally(() => setUsersLoading(false));
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleToggleEnabled = useCallback(
    (u: UserListDto) => {
      setTogglingId(u.id);
      http
        .patch(`${USERS_API}/${u.id}/enabled`, { enabled: !u.enabled })
        .then(loadUsers)
        .catch((err) => alert(getApiError(err, MESSAGES.errorGeneric)))
        .finally(() => setTogglingId(null));
    },
    [loadUsers]
  );

  const startEdit = useCallback((u: UserListDto) => {
    setEditingUser(u);
    setEditFirstName(u.firstName);
    setEditLastName(u.lastName);
    setEditRole((u.role === "MANAGER" ? "MANAGER" : "EMPLOYEE") as AdminRole);
    setEditMessage(null);
  }, []);

  const handleUpdateUser = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!editingUser) return;
      setEditMessage(null);
      setEditLoading(true);
      http
        .put(`${USERS_API}/${editingUser.id}`, {
          firstName: editFirstName,
          lastName: editLastName,
          role: editRole,
        })
        .then(() => {
          setEditMessage({ type: "success", text: MESSAGES.userUpdated });
          loadUsers();
          setTimeout(() => setEditingUser(null), 1500);
        })
        .catch((err) => setEditMessage({ type: "error", text: getApiError(err, MESSAGES.errorGeneric) }))
        .finally(() => setEditLoading(false));
    },
    [editingUser, editFirstName, editLastName, editRole, loadUsers]
  );

  const handleCreateUser = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setCreateMessage(null);
      setCreateLoading(true);
      http
        .post(USERS_API, {
          email: createEmail,
          firstName: createFirstName,
          lastName: createLastName,
          role: createRole,
        })
        .then(() => {
          setCreateMessage({ type: "success", text: MESSAGES.userCreated });
          setCreateEmail("");
          setCreateFirstName("");
          setCreateLastName("");
          setCreateRole("EMPLOYEE");
          loadUsers();
          setCreateModalOpen(false);
        })
        .catch((err) => setCreateMessage({ type: "error", text: getApiError(err, MESSAGES.errorGeneric) }))
        .finally(() => setCreateLoading(false));
    },
    [createEmail, createFirstName, createLastName, createRole, loadUsers]
  );

  const roleLabel = ROLE_LABELS[getPrimaryRole(token ?? undefined) ?? ""] ?? "—";

  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard__layout">
        <AdminSidebar
          currentView={currentView}
          onNavChange={setCurrentView}
          displayName={getDisplayName(token)}
          roleLabel={roleLabel}
          avatarUrl={token?.picture ?? null}
          initials={getInitials(token)}
        />

        <div className="admin-dashboard__main-wrap">
          <AdminHeader
            currentView={currentView}
            onLogout={() => keycloak.logout({ redirectUri: `${window.location.origin}/` })}
          />

          <main className="admin-dashboard__content">
            <div className="admin-dashboard__container">
              {currentView === "dashboard" && (
                <AdminStats total={stats.total} actifs={stats.actifs} inactifs={stats.inactifs} />
              )}

              {currentView === "users" && (
                <section className="admin-dashboard__section">
                  <div className="admin-dashboard__section-actions">
                    <h2 className="admin-dashboard__section-title">Liste des utilisateurs</h2>
                    <button
                      type="button"
                      className="admin-dashboard__btn admin-dashboard__btn--primary"
                      onClick={() => setCreateModalOpen(true)}
                    >
                      <IconPlus />
                      <span>Nouvel utilisateur</span>
                    </button>
                  </div>
                  <UsersTable
                    users={usersList}
                    loading={usersLoading}
                    error={usersError}
                    togglingId={togglingId}
                    onEdit={startEdit}
                    onToggleEnabled={handleToggleEnabled}
                  />
                </section>
              )}
            </div>
          </main>
        </div>
      </div>

      <CreateUserModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        email={createEmail}
        firstName={createFirstName}
        lastName={createLastName}
        role={createRole}
        onEmailChange={setCreateEmail}
        onFirstNameChange={setCreateFirstName}
        onLastNameChange={setCreateLastName}
        onRoleChange={setCreateRole}
        message={createMessage}
        loading={createLoading}
        onSubmit={handleCreateUser}
      />

      {editingUser && (
        <EditUserModal
          user={editingUser}
          firstName={editFirstName}
          lastName={editLastName}
          role={editRole}
          onFirstNameChange={setEditFirstName}
          onLastNameChange={setEditLastName}
          onRoleChange={setEditRole}
          message={editMessage}
          loading={editLoading}
          onClose={() => setEditingUser(null)}
          onSubmit={handleUpdateUser}
        />
      )}
    </div>
  );
}
