import { ChevronRightIcon, HomeIcon } from "../../icons/heroicons/outline";
import type { NavId } from "./types";

const LABELS: Record<NavId, string> = {
  dashboard: "Tableau de bord",
  users: "Utilisateurs",
  archives: "Archives",
  projects: "Projets",
  skills: "Référentiel compétences",
  skillRequests: "Demandes compétences",
  skillCategories: "Catégories",
  assignments: "Affectations",
  profile: "Mon profil",
};

type Props = {
  currentView: NavId;
  onNavigate: (view: NavId) => void;
};

export function AdminBreadcrumbs({ currentView, onNavigate }: Props) {
  const label = LABELS[currentView];
  const isHome = currentView === "dashboard";

  return (
    <nav
      className="admin-breadcrumbs flex items-center gap-2 px-6 md:px-8 h-10 shrink-0 pt-1
        text-sm text-slate-500"
      aria-label="Fil d'Ariane"
    >
      <button
        type="button"
        onClick={() => onNavigate("dashboard")}
        className="flex items-center gap-1.5 text-slate-400 hover:text-violet-600 transition-colors"
      >
        <HomeIcon className="w-4 h-4" />
        <span>Accueil</span>
      </button>
      {!isHome && (
        <>
          <ChevronRightIcon className="w-3.5 h-3.5 text-slate-300" />
          <span className="font-medium text-slate-700">{label}</span>
        </>
      )}
    </nav>
  );
}
