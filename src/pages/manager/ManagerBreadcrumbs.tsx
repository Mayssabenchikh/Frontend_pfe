import { ChevronRightIcon, HomeIcon } from "@heroicons/react/24/outline";
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
      className="admin-breadcrumbs flex items-center gap-2 px-6 md:px-8 h-10 shrink-0 pt-1 text-sm text-slate-500"
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

