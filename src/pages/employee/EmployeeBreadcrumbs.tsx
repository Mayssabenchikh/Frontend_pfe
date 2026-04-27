import { ChevronRightIcon, HomeIcon } from "../../icons/heroicons/outline";
import { useLocation, Link } from "react-router-dom";

function getEmployeeBreadcrumbs(pathname: string): { label: string; to?: string }[] {
  const parts = pathname.replace(/^\/+/, "").split("/");

  // /employee
  if (parts.length === 1) {
    return [];
  }

  // /employee/profile
  if (parts[1] === "profile") {
    return [{ label: "Mon profil" }];
  }

  if (parts[1] === "quiz") {
    return [{ label: "Quiz" }];
  }

  if (parts[1] === "assignments") {
    return [{ label: "Affectations" }];
  }

  if (parts[1] === "learning" && parts.length === 2) {
    return [{ label: "Formations" }];
  }

  if (parts[1] === "learning" && parts[2] === "course") {
    return [{ label: "Formations", to: "/employee/learning" }, { label: "Cours YouTube" }];
  }

  if (parts[1] === "projects" && parts.length === 2) {
    return [{ label: "Mes projets" }];
  }

  if (parts[1] === "projects" && parts.length >= 3) {
    return [{ label: "Mes projets", to: "/employee/projects" }, { label: "Détails du projet" }];
  }

  return [];
}

export function EmployeeBreadcrumbs() {
  const location = useLocation();
  const crumbs = getEmployeeBreadcrumbs(location.pathname);
  const isHome = crumbs.length === 0;
  const compact = location.pathname.endsWith("/employee/profile");

  return (
    <nav
      className={`admin-breadcrumbs flex min-w-0 shrink-0 items-center gap-1.5 overflow-x-auto overflow-y-hidden whitespace-nowrap px-3 text-xs text-slate-500 sm:gap-2 sm:px-6 sm:text-sm md:px-8 ${compact ? "h-8 py-0" : "h-10 pt-1"}`}
      aria-label="Fil d'Ariane employé"
    >
      <Link
        to="/employee"
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
