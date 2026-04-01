import { useEffect, useState } from "react";
import { useKeycloak } from "@react-keycloak/web";
import { Outlet, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Bars3Icon,
  ChevronLeftIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  Squares2X2Icon,
  ClipboardDocumentListIcon,
} from "@heroicons/react/24/outline";
import { http } from "../api/http";
import { ManagerBreadcrumbs } from "./manager/ManagerBreadcrumbs";
import { getAvatarColor, getDisplayNameInitials } from "./admin/utils";

const ROOT_REDIRECT_URI = `${window.location.origin}/`;
const MANAGER_ME_ENDPOINT = "/api/manager/me";

export default function ManagerPage() {
  const { keycloak } = useKeycloak();
  const token = keycloak.tokenParsed as { given_name?: string; family_name?: string; email?: string; picture?: string } | undefined;
  const displayName = [token?.given_name, token?.family_name].filter(Boolean).join(" ") || token?.email || "Manager";
  const email = token?.email ?? null;
  const avatarSeed = email || keycloak.subject || displayName;
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(token?.picture ?? null);

  const location = useLocation();
  const isFullBleed = location.pathname.startsWith("/manager/projects");

  useEffect(() => {
    http
      .get<{ avatarUrl: string | null }>(MANAGER_ME_ENDPOINT)
      .then((res) => {
        if (res.data?.avatarUrl) setAvatarUrl(res.data.avatarUrl);
      })
      .catch(() => {
        // on garde simplement l'avatar existant (picture ou initiales)
      });
  }, []);

  return (
    <div
      className="admin-layout bg-gradient-to-br from-violet-50/80 via-slate-50 to-white"
      data-sidebar-collapsed={sidebarCollapsed || undefined}
    >
      {/* Backdrop mobile (même comportement que l'admin) */}
      <div
        className={`sidebar-backdrop transition-opacity duration-200 ease-in-out${sidebarOpen ? " open" : ""}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar manager avec le même style que l'admin */}
      <aside
        className={`admin-sidebar h-screen flex flex-col border-r border-violet-100/70 bg-white/80 shadow-lg shadow-violet-100/40 backdrop-blur-xl transition-all duration-200 ease-in-out ${
          sidebarOpen ? " open" : ""
        }${sidebarCollapsed ? " collapsed" : ""}`}
      >
        {/* Header sidebar : logo + flèche */}
        <div
          className={`admin-sidebar-header h-16 shrink-0 border-b border-violet-100/70 ${
            sidebarCollapsed ? "justify-center px-0" : "justify-between px-3"
          } flex items-center bg-white/70 backdrop-blur`}
        >
          <div className="admin-sidebar-logo flex items-center justify-center overflow-hidden min-w-0 flex-1">
            <img src="/logo.png" alt="Logo" className="h-9 w-auto object-contain" />
          </div>
          <button
            type="button"
            onClick={() => setSidebarCollapsed((c) => !c)}
            className="admin-sidebar-toggle flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-transparent text-slate-500 transition-all duration-200 ease-in-out hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700"
            aria-label={sidebarCollapsed ? "Ouvrir le menu" : "Réduire le menu"}
          >
            {sidebarCollapsed ? (
              <ChevronRightIcon className="w-5 h-5" strokeWidth={2} />
            ) : (
              <ChevronLeftIcon className="w-5 h-5" strokeWidth={2} />
            )}
          </button>
        </div>

        {/* Navigation manager : tableau de bord + projets */}
        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-2.5 py-5">
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
                <span className={`flex h-5 w-5 shrink-0 items-center justify-center ${isActive ? "text-violet-700" : "text-slate-400 group-hover:text-violet-600"}`}>
                  <Squares2X2Icon className="h-5 w-5" />
                </span>
                {!sidebarCollapsed && <span className="truncate">Tableau de bord</span>}
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
            {/* Marqueur actif comme dans l'admin */}
            {({ isActive }) =>
              <>
                {!sidebarCollapsed && isActive && (
                  <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-violet-600" />
                )}
                <span className={`flex h-5 w-5 shrink-0 items-center justify-center ${isActive ? "text-violet-700" : "text-slate-400 group-hover:text-violet-600"}`}>
                  <ClipboardDocumentListIcon className="h-5 w-5" />
                </span>
                {!sidebarCollapsed && <span className="truncate">Projets</span>}
              </>
            }
          </NavLink>
        </nav>
      </aside>

      {/* Contenu : même header fixe et même padding que l'admin */}
      <div className="admin-content">
        <header className="admin-header-fixed z-30 flex items-center justify-between border-b border-violet-100/70 bg-white/70 px-4 shadow-md shadow-slate-200/50 backdrop-blur-xl md:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-2 md:gap-3">
            {/* Hamburger visible sur mobile pour ouvrir la sidebar */}
            <button
              type="button"
              className="hamburger-btn flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/80 bg-white text-slate-500 shadow-sm transition-all duration-200 ease-in-out hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700"
              onClick={() => setSidebarOpen((o) => !o)}
              aria-label="Menu"
            >
              <Bars3Icon className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            {/* Menu utilisateur avec photo de profil et dropdown */}
            <div className="relative">
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="group flex cursor-pointer items-center gap-2 rounded-2xl border border-slate-200/80 bg-white px-1.5 py-1 pr-2 shadow-sm transition-all duration-200 ease-in-out hover:border-violet-200 hover:bg-violet-50"
              aria-label="Menu utilisateur"
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="h-8 w-8 shrink-0 rounded-full object-cover shadow-md"
                />
              ) : (
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white shadow-md"
                  style={{
                    background: `linear-gradient(135deg, ${getAvatarColor(avatarSeed)[0]}, ${getAvatarColor(avatarSeed)[1]})`,
                  }}
                >
                  {getDisplayNameInitials(displayName)}
                </div>
              )}

              <div className="hidden min-w-0 text-left lg:block">
                <p className="max-w-[140px] truncate text-sm font-semibold text-slate-700">{displayName}</p>
                <p className="text-[11px] text-slate-400">Manager</p>
              </div>
              <ChevronDownIcon className={`hidden h-4 w-4 text-slate-400 transition-transform duration-200 ease-in-out lg:block ${menuOpen ? "rotate-180" : ""}`} />
            </button>

            {menuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-14 z-50 min-w-[220px] overflow-hidden rounded-2xl border border-slate-100/90 bg-white/95 shadow-lg shadow-slate-300/40 backdrop-blur-xl">
                  <div className="flex flex-col gap-1 p-1.5">
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        navigate("/manager/profile");
                      }}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition-all duration-200 ease-in-out hover:bg-violet-50 hover:text-violet-700"
                    >
                      Mon profil
                    </button>
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        keycloak.logout({ redirectUri: ROOT_REDIRECT_URI });
                      }}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-red-500 transition-all duration-200 ease-in-out hover:bg-red-50"
                    >
                      Déconnexion
                    </button>
                  </div>
                </div>
              </>
            )}
            </div>
          </div>
        </header>

        <main className="flex flex-1 flex-col overflow-hidden pt-16">
          <ManagerBreadcrumbs />
          <div className={`${isFullBleed ? "" : "dashboard-padding "}flex min-w-0 flex-1 flex-col overflow-hidden`}>
            <Outlet context={{ managerAvatarUrl: avatarUrl, managerName: displayName, managerEmail: email, currentPath: location.pathname, onAvatarUpdate: setAvatarUrl }} />
          </div>
        </main>
      </div>
    </div>
  );
}
