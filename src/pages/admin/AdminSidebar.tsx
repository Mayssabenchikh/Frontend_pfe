import type { NavId } from "./types";
import { IconDashboard, IconUsers } from "./icons";

type Props = {
  currentView: NavId;
  onNavChange: (view: NavId) => void;
  displayName: string;
  roleLabel: string;
  avatarUrl: string | null;
  initials: string;
};

export function AdminSidebar({
  currentView,
  onNavChange,
  displayName,
  roleLabel,
  avatarUrl,
  initials,
}: Props) {
  return (
    <aside className="admin-dashboard__sidebar">
      <div className="admin-dashboard__logo">
        <img src="/logo.png" alt="Skilify" className="admin-dashboard__logo-img" />
      </div>
      <nav className="admin-dashboard__nav">
        <button
          type="button"
          className={`admin-dashboard__nav-item ${currentView === "dashboard" ? "admin-dashboard__nav-item--active" : ""}`}
          onClick={() => onNavChange("dashboard")}
        >
          <IconDashboard />
          <span>Tableau de bord</span>
        </button>
        <button
          type="button"
          className={`admin-dashboard__nav-item ${currentView === "users" ? "admin-dashboard__nav-item--active" : ""}`}
          onClick={() => onNavChange("users")}
        >
          <IconUsers />
          <span>Utilisateurs</span>
        </button>
      </nav>
      <div className="admin-dashboard__user">
        <div className="admin-dashboard__user-avatar" aria-hidden>
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="admin-dashboard__user-avatar-img" />
          ) : (
            <span className="admin-dashboard__user-avatar-initials">{initials}</span>
          )}
        </div>
        <div className="admin-dashboard__user-info">
          <span className="admin-dashboard__user-name">{displayName}</span>
          <span className="admin-dashboard__user-role">{roleLabel}</span>
        </div>
      </div>
    </aside>
  );
}
