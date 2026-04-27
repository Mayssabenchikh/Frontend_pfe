import { ChevronRightIcon, HomeIcon } from "../../icons/heroicons/outline";
import type { NavId } from "./types";

const LABELS: Record<NavId, string> = {
  dashboard: "Tableau de bord",
  users: "Utilisateurs",
  archives: "Archives",
  projects: "Projets",
  trainings: "Formations",
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
      className="admin-breadcrumbs flex h-10 min-w-0 shrink-0 items-center gap-1.5 overflow-x-auto overflow-y-hidden whitespace-nowrap px-3 pt-1 text-xs text-slate-500 sm:gap-2 sm:px-6 sm:text-sm md:px-8"
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
