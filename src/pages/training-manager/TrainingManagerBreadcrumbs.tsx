import { ChevronRightIcon, HomeIcon } from "../../icons/heroicons/outline";
import { Link, useLocation } from "react-router-dom";

function getTrainingManagerBreadcrumbs(pathname: string): { label: string; to?: string }[] {
  const parts = pathname.replace(/^\/+/, "").split("/");

  // /training-manager
  if (parts.length === 1) return [];

  if (parts[1] === "programs" && parts.length === 2) {
    return [{ label: "Mes formations" }];
  }

  if (parts[1] === "programs" && parts[2] === "new") {
    return [{ label: "Mes formations", to: "/training-manager/programs" }, { label: "Nouvelle formation" }];
  }

  if (parts[1] === "programs" && parts.length >= 3) {
    return [{ label: "Mes formations", to: "/training-manager/programs" }, { label: "Éditeur" }];
  }

  if (parts[1] === "submissions") {
    return [{ label: "Soumissions" }];
  }

  if (parts[1] === "profile") {
    return [{ label: "Mon profil" }];
  }

  return [];
}

export function TrainingManagerBreadcrumbs() {
  const location = useLocation();
  const crumbs = getTrainingManagerBreadcrumbs(location.pathname);
  const isHome = crumbs.length === 0;

  return (
    <nav
      className="admin-breadcrumbs flex min-w-0 shrink-0 items-center gap-1.5 overflow-x-auto overflow-y-hidden whitespace-nowrap px-3 text-xs text-slate-500 sm:gap-2 sm:px-6 sm:text-sm md:px-8 h-10 pt-1"
      aria-label="Fil d'Ariane responsable formation"
    >
      <Link to="/training-manager" className="flex items-center gap-1.5 text-slate-400 hover:text-violet-600 transition-colors">
        <HomeIcon className="h-4 w-4" />
        <span>Accueil</span>
      </Link>

      {!isHome &&
        crumbs.map((c, idx) => (
          <span key={`${c.label}-${idx}`} className="inline-flex items-center gap-2">
            <ChevronRightIcon className="h-3.5 w-3.5 text-slate-300" />
            {c.to ? (
              <Link to={c.to} className="font-medium text-slate-700 hover:text-violet-700 transition-colors">
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

