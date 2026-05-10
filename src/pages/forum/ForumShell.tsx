import { useEffect, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useKeycloak } from "@react-keycloak/web";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faComments,
  faFileLines,
  faBookmark,
  faFlag,
} from "@fortawesome/free-solid-svg-icons";
import { getPrimaryRole, type AppRole } from "../../auth/roles";
import { DashboardShell } from "../../components/DashboardShell";
import { DashboardSidebar, DashboardSidebarLogout, DashboardSidebarNavItem } from "../../components/DashboardSidebar";
import { AdminHeader } from "../admin/AdminHeader";
import { ChevronRightIcon, HomeIcon } from "../../icons/heroicons/outline";

function homePathForRole(role: AppRole | null): string {
  switch (role) {
    case "ADMIN":
      return "/admin/dashboard";
    case "MANAGER":
      return "/manager/dashboard";
    case "TRAINING_MANAGER":
      return "/training-manager/dashboard";
    case "EMPLOYEE":
      return "/employee/dashboard";
    default:
      return "/";
  }
}

function roleLabel(role: AppRole | null): string {
  switch (role) {
    case "ADMIN":
      return "Administrateur";
    case "MANAGER":
      return "Manager";
    case "TRAINING_MANAGER":
      return "Responsable formation";
    case "EMPLOYEE":
      return "Employé";
    default:
      return "Utilisateur";
  }
}

function getForumBreadcrumbs(pathname: string): { label: string; to?: string }[] {
  const parts = pathname.replace(/^\/+/, "").split("/");

  if (parts.length === 1) {
    return [];
  }

  if (parts[1] === "post") {
    return [{ label: "Publication" }];
  }

  if (parts[1] === "my-posts") {
    return [{ label: "Mes publications" }];
  }

  if (parts[1] === "saved") {
    return [{ label: "Publications enregistrées" }];
  }

  if (parts[1] === "reports") {
    return [{ label: "Signalements" }];
  }

  return [];
}

export default function ForumShell() {
  const { keycloak } = useKeycloak();
  const navigate = useNavigate();
  const location = useLocation();
  const token = keycloak.tokenParsed as { given_name?: string; family_name?: string; email?: string; picture?: string } | undefined;
  const displayName = [token?.given_name, token?.family_name].filter(Boolean).join(" ") || token?.email || "Utilisateur";
  const email = token?.email ?? null;
  const avatarSeed = email || keycloak.subject || displayName;
  const primary = getPrimaryRole(keycloak.tokenParsed ?? undefined);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(token?.picture ?? null);

  useEffect(() => {
    setAvatarUrl(token?.picture ?? null);
  }, [token?.picture]);

  const isAdmin = primary === "ADMIN";
  const backHref = homePathForRole(primary);
  const crumbs = getForumBreadcrumbs(location.pathname);

  return (
    <DashboardShell
      dashboardPage={false}
      renderSidebar={({ sidebarOpen, sidebarCollapsed, toggleSidebarCollapsed }) => (
        <DashboardSidebar
          mobileOpen={sidebarOpen}
          collapsed={sidebarCollapsed}
          onToggleCollapse={toggleSidebarCollapsed}
          footer={
            <DashboardSidebarLogout
              collapsed={sidebarCollapsed}
              onLogout={() => keycloak.logout({ redirectUri: `${window.location.origin}/` })}
            />
          }
        >
          <DashboardSidebarNavItem
            label="Retour au tableau de bord"
            icon={<FontAwesomeIcon icon={faArrowLeft} className="h-4 w-4" />}
            to={backHref}
            collapsed={sidebarCollapsed}
          />
          <DashboardSidebarNavItem
            label="Fil du forum"
            icon={<FontAwesomeIcon icon={faComments} className="h-4 w-4" />}
            to="/forum"
            end
            collapsed={sidebarCollapsed}
          />
          <DashboardSidebarNavItem
            label="Mes publications"
            icon={<FontAwesomeIcon icon={faFileLines} className="h-4 w-4" />}
            to="/forum/my-posts"
            collapsed={sidebarCollapsed}
          />
          <DashboardSidebarNavItem
            label="Enregistrés"
            icon={<FontAwesomeIcon icon={faBookmark} className="h-4 w-4" />}
            to="/forum/saved"
            collapsed={sidebarCollapsed}
          />
          {isAdmin ? (
            <DashboardSidebarNavItem
              label="Signalements"
              icon={<FontAwesomeIcon icon={faFlag} className="h-4 w-4" />}
              to="/forum/reports"
              collapsed={sidebarCollapsed}
            />
          ) : null}
        </DashboardSidebar>
      )}
      renderHeader={({ toggleSidebar }) => (
        <AdminHeader
          displayName={displayName}
          initials={null}
          avatarUrl={avatarUrl}
          avatarSeed={avatarSeed}
          roleLabel={`${roleLabel(primary)} · Forum`}
          onMenuToggle={toggleSidebar}
          onProfile={() => {
            switch (primary) {
              case "ADMIN":
                navigate("/admin", { state: { view: "profile" } });
                break;
              case "MANAGER":
                navigate("/manager/profile");
                break;
              case "EMPLOYEE":
                navigate("/employee/profile");
                break;
              case "TRAINING_MANAGER":
                navigate("/training-manager/profile");
                break;
              default:
                navigate(backHref);
            }
          }}
          onLogout={() => keycloak.logout({ redirectUri: `${window.location.origin}/` })}
        />
      )}
    >
      <main className="flex min-h-0 flex-1 flex-col overflow-hidden bg-slate-50">
        <nav
          className="admin-breadcrumbs flex h-10 min-w-0 shrink-0 items-center gap-1.5 overflow-x-auto overflow-y-hidden whitespace-nowrap px-3 pt-1 text-xs text-slate-500 sm:gap-2 sm:px-6 sm:text-sm md:px-8"
          aria-label="Fil d'Ariane forum"
        >
          <Link to={backHref} className="flex items-center gap-1.5 text-slate-400 hover:text-violet-600 transition-colors">
            <HomeIcon className="h-4 w-4" />
            <span>Accueil</span>
          </Link>

          <span className="inline-flex items-center gap-2">
            <ChevronRightIcon className="h-3.5 w-3.5 text-slate-300" />
            <Link to="/forum" className="font-medium text-slate-700 hover:text-violet-700 transition-colors">
              Forum
            </Link>
          </span>

          {crumbs.map((c, idx) => (
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
        <div className="flex min-h-0 w-full flex-1 flex-col overflow-auto px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </main>
    </DashboardShell>
  );
}
