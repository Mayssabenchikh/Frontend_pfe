import { useEffect, useState } from "react";
import { useKeycloak } from "@react-keycloak/web";
import { Outlet, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ClipboardDocumentCheckIcon,
  Squares2X2Icon,
  BriefcaseIcon,
  ClipboardDocumentListIcon,
  AcademicCapIcon,
  ChartBarSquareIcon,
} from "../icons/heroicons/outline";
import { meApi } from "../api/meApi";
import { ManagerBreadcrumbs } from "./manager/ManagerBreadcrumbs";
import { AdminHeader } from "./admin/AdminHeader";

const ROOT_REDIRECT_URI = `${window.location.origin}/`;

export default function ManagerPage() {
  const { keycloak } = useKeycloak();
  const token = keycloak.tokenParsed as { given_name?: string; family_name?: string; email?: string; picture?: string } | undefined;
  const displayName = [token?.given_name, token?.family_name].filter(Boolean).join(" ") || token?.email || "Manager";
  const email = token?.email ?? null;
  const avatarSeed = email || keycloak.subject || displayName;
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(token?.picture ?? null);

  const location = useLocation();
  const isTalentRoute = /^\/manager\/matching(\/|$)/.test(location.pathname);
  const isFullBleed =
    location.pathname.startsWith("/manager/projects") ||
    location.pathname.startsWith("/manager/quiz") ||
    isTalentRoute;

  useEffect(() => {
    meApi
      .manager()
      .then((res) => {
        if (res.data?.avatarUrl) setAvatarUrl(res.data.avatarUrl);
      })
      .catch(() => {
        // keep existing avatar (token picture or initials)
      });
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const onChange = () => {
      if (mq.matches) setSidebarCollapsed(false);
    };
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="admin-layout" data-sidebar-collapsed={sidebarCollapsed || undefined}>
      {/* Backdrop mobile (meme comportement que l'admin) */}
      <div
        className={`sidebar-backdrop transition-opacity duration-200 ease-in-out${sidebarOpen ? " open" : ""}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar manager avec le meme style que l'admin */}
      <aside
        className={`admin-sidebar flex flex-col ${
          sidebarOpen ? " open" : ""
        }${sidebarCollapsed ? " collapsed" : ""}`}
      >
        {/* Header sidebar : logo + fleche */}
        <div
          className={`admin-sidebar-header h-16 shrink-0 ${
            sidebarCollapsed ? "justify-center px-0" : "justify-between px-3"
          } flex items-center`}
        >
          <div className="admin-sidebar-logo flex items-center justify-center overflow-hidden min-w-0 flex-1">
            <img src="/logo.png" alt="Logo" className="h-9 w-auto object-contain" />
          </div>
          <button
            type="button"
            onClick={() => setSidebarCollapsed((c) => !c)}
            className="admin-sidebar-toggle flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-transparent text-slate-500 transition-all duration-200 ease-in-out hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700"
            aria-label={sidebarCollapsed ? "Ouvrir le menu" : "Reduire le menu"}
          >
            {sidebarCollapsed ? (
              <ChevronRightIcon className="w-5 h-5" strokeWidth={2} />
            ) : (
              <ChevronLeftIcon className="w-5 h-5" strokeWidth={2} />
            )}
          </button>
        </div>

        {/* Navigation manager : tableau de bord + quiz + projets + correspondances */}
        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto overflow-x-hidden px-2.5 py-5">
          <NavLink
            to="/manager"
            end
            className={({ isActive }) =>
              [
                "admin-nav-item group relative flex w-full items-center rounded-xl border py-2.5 text-sm font-medium transition-all duration-200 ease-in-out",
                sidebarCollapsed ? "justify-center px-0" : "gap-3 px-3.5 text-left",
                isActive
                  ? "border-violet-200 bg-violet-100 text-violet-800 shadow-md shadow-violet-100/60"
                  : "border-transparent text-slate-600 hover:bg-violet-50 hover:text-violet-700",
              ].join(" ")
            }
          >
            {({ isActive }) => (
              <>
                {!sidebarCollapsed && isActive && (
                  <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-violet-600" />
                )}
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center ${
                    isActive ? "text-violet-700" : "text-slate-400 group-hover:text-violet-600"
                  }`}
                >
                  <Squares2X2Icon className="h-5 w-5" />
                </span>
                {!sidebarCollapsed && <span className="truncate">Tableau de bord</span>}
              </>
            )}
          </NavLink>

          <NavLink
            to="/manager/quiz"
            className={({ isActive }) =>
              [
                "admin-nav-item group relative flex w-full items-center rounded-xl border py-2.5 text-sm font-medium transition-all duration-200 ease-in-out",
                sidebarCollapsed ? "justify-center px-0" : "gap-3 px-3.5 text-left",
                isActive
                  ? "border-violet-200 bg-violet-100 text-violet-800 shadow-md shadow-violet-100/60"
                  : "border-transparent text-slate-600 hover:bg-violet-50 hover:text-violet-700",
              ].join(" ")
            }
          >
            {({ isActive }) => (
              <>
                {!sidebarCollapsed && isActive && (
                  <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-violet-600" />
                )}
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center ${
                    isActive ? "text-violet-700" : "text-slate-400 group-hover:text-violet-600"
                  }`}
                >
                  <ClipboardDocumentCheckIcon className="h-5 w-5" />
                </span>
                {!sidebarCollapsed && <span className="truncate">Quiz</span>}
              </>
            )}
          </NavLink>

          <NavLink
            to="/manager/projects"
            className={({ isActive }) =>
              [
                "admin-nav-item group relative flex w-full items-center rounded-xl border py-2.5 text-sm font-medium transition-all duration-200 ease-in-out",
                sidebarCollapsed ? "justify-center px-0" : "gap-3 px-3.5 text-left",
                isActive
                  ? "border-violet-200 bg-violet-100 text-violet-800 shadow-md shadow-violet-100/60"
                  : "border-transparent text-slate-600 hover:bg-violet-50 hover:text-violet-700",
              ].join(" ")
            }
          >
            {({ isActive }) => (
              <>
                {!sidebarCollapsed && isActive && (
                  <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-violet-600" />
                )}
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center ${
                    isActive ? "text-violet-700" : "text-slate-400 group-hover:text-violet-600"
                  }`}
                >
                  <ClipboardDocumentListIcon className="h-5 w-5" />
                </span>
                {!sidebarCollapsed && <span className="truncate">Projets</span>}
              </>
            )}
          </NavLink>

          <NavLink
            to="/manager/matching"
            className={() =>
              [
                "admin-nav-item group relative flex w-full items-center rounded-xl border py-2.5 text-sm font-medium transition-all duration-200 ease-in-out",
                sidebarCollapsed ? "justify-center px-0" : "gap-3 px-3.5 text-left",
                isTalentRoute
                  ? "border-violet-200 bg-violet-100 text-violet-800 shadow-md shadow-violet-100/60"
                  : "border-transparent text-slate-600 hover:bg-violet-50 hover:text-violet-700",
              ].join(" ")
            }
          >
            {() => (
              <>
                {!sidebarCollapsed && isTalentRoute && (
                  <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-violet-600" />
                )}
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center ${
                    isTalentRoute ? "text-violet-700" : "text-slate-400 group-hover:text-violet-600"
                  }`}
                >
                  <ChartBarSquareIcon className="h-5 w-5" />
                </span>
                {!sidebarCollapsed && <span className="truncate">Correspondances</span>}
              </>
            )}
          </NavLink>

          <NavLink
            to="/manager/assignments"
            className={({ isActive }) =>
              [
                "admin-nav-item group relative flex w-full items-center rounded-xl border py-2.5 text-sm font-medium transition-all duration-200 ease-in-out",
                sidebarCollapsed ? "justify-center px-0" : "gap-3 px-3.5 text-left",
                isActive
                  ? "border-violet-200 bg-violet-100 text-violet-800 shadow-md shadow-violet-100/60"
                  : "border-transparent text-slate-600 hover:bg-violet-50 hover:text-violet-700",
              ].join(" ")
            }
          >
            {({ isActive }) => (
              <>
                {!sidebarCollapsed && isActive && (
                  <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-violet-600" />
                )}
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center ${
                    isActive ? "text-violet-700" : "text-slate-400 group-hover:text-violet-600"
                  }`}
                >
                  <BriefcaseIcon className="h-5 w-5" />
                </span>
                {!sidebarCollapsed && <span className="truncate">Affectations</span>}
              </>
            )}
          </NavLink>

          <NavLink
            to="/manager/learning"
            className={({ isActive }) =>
              [
                "admin-nav-item group relative flex w-full items-center rounded-xl border py-2.5 text-sm font-medium transition-all duration-200 ease-in-out",
                sidebarCollapsed ? "justify-center px-0" : "gap-3 px-3.5 text-left",
                isActive
                  ? "border-violet-200 bg-violet-100 text-violet-800 shadow-md shadow-violet-100/60"
                  : "border-transparent text-slate-600 hover:bg-violet-50 hover:text-violet-700",
              ].join(" ")
            }
          >
            {({ isActive }) => (
              <>
                {!sidebarCollapsed && isActive && (
                  <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-violet-600" />
                )}
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center ${
                    isActive ? "text-violet-700" : "text-slate-400 group-hover:text-violet-600"
                  }`}
                >
                  <AcademicCapIcon className="h-5 w-5" />
                </span>
                {!sidebarCollapsed && <span className="truncate">Formations</span>}
              </>
            )}
          </NavLink>
        </nav>
      </aside>

      {/* Contenu : meme header fixe et meme padding que l'admin */}
      <div className="admin-content">
        <AdminHeader
          displayName={displayName}
          initials={null}
          avatarUrl={avatarUrl}
          avatarSeed={avatarSeed}
          roleLabel="Manager"
          onMenuToggle={() => setSidebarOpen((o) => !o)}
          onProfile={() => navigate("/manager/profile")}
          onLogout={() => keycloak.logout({ redirectUri: ROOT_REDIRECT_URI })}
        />

        <main className="flex flex-1 flex-col overflow-hidden">
          <ManagerBreadcrumbs />
          <div className={`${isFullBleed ? "" : "dashboard-padding "}flex min-w-0 flex-1 flex-col overflow-hidden`}>
            <Outlet
              context={{
                managerAvatarUrl: avatarUrl,
                managerName: displayName,
                managerEmail: email,
                currentPath: location.pathname,
                onAvatarUpdate: setAvatarUrl,
              }}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
