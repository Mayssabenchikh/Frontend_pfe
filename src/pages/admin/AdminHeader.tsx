import type { NavId } from "./types";
import { IconLogout } from "./icons";

type Props = {
  currentView: NavId;
  onLogout: () => void;
};

const TITLES: Record<NavId, string> = {
  dashboard: "Tableau de bord",
  users: "Gestion des utilisateurs",
};

export function AdminHeader({ currentView, onLogout }: Props) {
  return (
    <header className="admin-dashboard__header">
      <h1 className="admin-dashboard__header-title">{TITLES[currentView]}</h1>
      <div className="admin-dashboard__header-actions">
        <button
          type="button"
          className="admin-dashboard__btn admin-dashboard__btn--secondary"
          onClick={onLogout}
        >
          <IconLogout />
          <span>Déconnexion</span>
        </button>
      </div>
    </header>
  );
}
