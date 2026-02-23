import type { UserListDto } from "./types";
import { MESSAGES } from "./constants";

type Props = {
  users: UserListDto[];
  loading: boolean;
  error: string | null;
  togglingId: string | null;
  onEdit: (user: UserListDto) => void;
  onToggleEnabled: (user: UserListDto) => void;
};

export function UsersTable({
  users,
  loading,
  error,
  togglingId,
  onEdit,
  onToggleEnabled,
}: Props) {
  if (loading) return <p className="admin-dashboard__loading">{MESSAGES.loading}</p>;
  if (error) return <p className="admin-dashboard__error">{error}</p>;
  if (users.length === 0) return <p className="admin-dashboard__empty">{MESSAGES.noUsers}</p>;

  return (
    <div className="admin-dashboard__table-wrap">
      <table className="admin-dashboard__table">
        <thead>
          <tr>
            <th>Email</th>
            <th>Prénom</th>
            <th>Nom</th>
            <th>Rôle</th>
            <th>Statut</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td>{u.email}</td>
              <td>{u.firstName}</td>
              <td>{u.lastName}</td>
              <td>{u.role}</td>
              <td>
                <span className={`admin-dashboard__badge admin-dashboard__badge--${u.enabled ? "active" : "inactive"}`}>
                  {u.enabled ? "Actif" : "Inactif"}
                </span>
              </td>
              <td>
                <div className="admin-dashboard__btn-group">
                  <button
                    type="button"
                    className="admin-dashboard__btn admin-dashboard__btn--ghost"
                    onClick={() => onEdit(u)}
                  >
                    Modifier
                  </button>
                  <button
                    type="button"
                    className="admin-dashboard__btn admin-dashboard__btn--danger"
                    onClick={() => onToggleEnabled(u)}
                    disabled={togglingId === u.id}
                  >
                    {togglingId === u.id ? "..." : u.enabled ? "Désactiver" : "Activer"}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
