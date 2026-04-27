import { ChevronRightIcon, HomeIcon } from "../../icons/heroicons/outline";
import { useLocation, Link } from "react-router-dom";

function getManagerBreadcrumbs(pathname: string): { label: string; to?: string }[] {
  const parts = pathname.replace(/^\/+/, "").split("/");

  // /manager
  if (parts.length === 1) {
    return [];
  }

  // /manager/projects
  if (parts[1] === "projects" && parts.length === 2) {
    return [{ label: "Projets", to: "/manager/projects" }];
  }

  // /manager/quiz
  if (parts[1] === "quiz") {
    return [{ label: "Quiz" }];
  }

  // /manager/assignments
  if (parts[1] === "assignments") {
    return [{ label: "Affectations" }];
  }

  // /manager/learning
  if (parts[1] === "learning" && parts.length === 2) {
    return [{ label: "Formations" }];
  }

  // /manager/learning/course/:progressUuid
  if (parts[1] === "learning" && parts[2] === "course") {
    return [
      { label: "Formations", to: "/manager/learning" },
      { label: "Lecture du cours" },
    ];
  }

  // /manager/matching (hub)
  if (parts[1] === "matching" && parts.length === 2) {
    return [{ label: "Correspondances" }];
  }

  // /manager/matching/:id/workspace | /manager/matching/:id/matches | /manager/matching/:id/team
  if (parts[1] === "matching" && parts.length >= 4) {
    const sub = parts[3];
    if (sub === "workspace") {
      return [
        { label: "Correspondances", to: "/manager/matching" },
        { label: "Gestion des correspondances" },
      ];
    }
    if (sub === "matches") {
      return [
        { label: "Correspondances", to: "/manager/matching" },
        { label: "Classement" },
      ];
    }
    if (sub === "team") {
      return [
        { label: "Correspondances", to: "/manager/matching" },
        { label: "Équipe" },
      ];
    }
  }

  // Anciennes URLs (redirigées)
  if (parts[1] === "projects" && parts.length >= 4) {
    const sub = parts[3];
    if (sub === "workspace") {
      return [
        { label: "Correspondances", to: "/manager/matching" },
        { label: "Gestion des correspondances" },
      ];
    }
    if (sub === "matches") {
      return [
        { label: "Correspondances", to: "/manager/matching" },
        { label: "Classement" },
      ];
    }
    if (sub === "team") {
      return [
        { label: "Correspondances", to: "/manager/matching" },
        { label: "Équipe" },
      ];
    }
  }

  // /manager/projects/:id
  if (parts[1] === "projects" && parts.length >= 3) {
    return [
      { label: "Projets", to: "/manager/projects" },
      { label: "Détail du projet" },
    ];
  }

  return [];
}

export function ManagerBreadcrumbs() {
  const location = useLocation();
  const crumbs = getManagerBreadcrumbs(location.pathname);
  const isHome = crumbs.length === 0;

  return (
    <nav
      className="admin-breadcrumbs flex h-10 min-w-0 shrink-0 items-center gap-1.5 overflow-x-auto overflow-y-hidden whitespace-nowrap px-3 pt-1 text-xs text-slate-500 sm:gap-2 sm:px-6 sm:text-sm md:px-8"
      aria-label="Fil d'Ariane manager"
    >
      <Link
        to="/manager"
        className="flex items-center gap-1.5 text-slate-400 hover:text-violet-600 transition-colors"
      >
        <HomeIcon className="w-4 h-4" />
        <span>Accueil</span>
      </Link>

      {!isHome &&
        crumbs.map((c, idx) => (
          <span key={`${c.label}-${idx}`} className="inline-flex items-center gap-2">
            <ChevronRightIcon className="w-3.5 h-3.5 text-slate-300" />
            {c.to ? (
              <Link
                to={c.to}
                className="font-medium text-slate-700 hover:text-violet-700 transition-colors"
              >
                {c.label}
              </Link>
            ) : (
              <span className="font-medium text-slate-700">{c.label}</span>
            )}
          </span>
        ))}
    </nav>
  );
}

