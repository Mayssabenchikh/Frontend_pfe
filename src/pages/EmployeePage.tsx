import { useEffect, useState } from "react";
import { useKeycloak } from "@react-keycloak/web";
import { Outlet, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Bars3Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Squares2X2Icon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import { http } from "../api/http";
import { EmployeeBreadcrumbs } from "./employee/EmployeeBreadcrumbs";

export default function EmployeePage() {
  const { keycloak } = useKeycloak();
  const token = keycloak.tokenParsed as { given_name?: string; family_name?: string; email?: string; picture?: string } | undefined;
  const displayName = [token?.given_name, token?.family_name].filter(Boolean).join(" ") || token?.email || "Employé";
  const email = token?.email ?? null;
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(token?.picture ?? null);

  const location = useLocation();
  const isProfilePage = location.pathname.startsWith("/employee/profile");

  useEffect(() => {
    http
      .get<{ avatarUrl: string | null }>("/api/employee/me")
      .then((res) => {
        if (res.data?.avatarUrl) setAvatarUrl(res.data.avatarUrl);
      })
      .catch(() => {
        // on garde simplement l'avatar existant (picture ou initiales)
      });
  }, []);

  return (
    <div className="admin-layout" data-sidebar-collapsed={sidebarCollapsed || undefined}>
      {/* Backdrop mobile */}
      <div
        className={`sidebar-backdrop${sidebarOpen ? " open" : ""}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar employee avec le même style que manager/admin */}
      <aside
        className={`admin-sidebar bg-white border-r border-slate-100 h-screen flex flex-col shadow-sm${
          sidebarOpen ? " open" : ""
        }${sidebarCollapsed ? " collapsed" : ""}`}
      >
        {/* Header sidebar : logo + flèche */}
        <div
          className={`h-16 flex items-center shrink-0 admin-sidebar-header border-b border-slate-100 ${
            sidebarCollapsed ? "justify-center px-0" : "justify-between px-3"
          }`}
        >
          <div className="admin-sidebar-logo flex items-center justify-center overflow-hidden min-w-0 flex-1">
            <img src="/logo.png" alt="Logo" className="h-9 w-auto object-contain" />
          </div>
          <button
            type="button"
            onClick={() => setSidebarCollapsed((c) => !c)}
            className="admin-sidebar-toggle flex items-center justify-center w-8 h-8 flex-shrink-0 text-slate-400 hover:text-violet-600 transition-colors duration-200"
            aria-label={sidebarCollapsed ? "Ouvrir le menu" : "Réduire le menu"}
          >
            {sidebarCollapsed ? (
              <ChevronRightIcon className="w-5 h-5" strokeWidth={2} />
            ) : (
              <ChevronLeftIcon className="w-5 h-5" strokeWidth={2} />
            )}
          </button>
        </div>

        {/* Navigation employee : tableau de bord + compétences + profil */}
        <nav className="flex-1 overflow-y-auto px-2.5 py-5 flex flex-col gap-0.5">
          <NavLink
            to="/employee"
            end
            className={({ isActive }) =>
              [
                "relative flex items-center w-full rounded-xl py-2.5 text-sm font-medium transition-all admin-nav-item group",
                sidebarCollapsed ? "justify-center px-0" : "gap-3 px-3.5 text-left",
                isActive
                  ? "bg-indigo-50 text-indigo-800 font-semibold"
                  : "text-slate-500 hover:bg-slate-50 hover:text-indigo-600",
              ].join(" ")
            }
          >
            {({ isActive }) => (
              <>
                {!sidebarCollapsed && isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r bg-gradient-to-b from-indigo-700 to-violet-700" />
                )}
                <span className={`shrink-0 flex items-center justify-center ${isActive ? "text-indigo-600" : "text-slate-300 group-hover:text-indigo-400"}`}>
                  <Squares2X2Icon className="w-5 h-5" />
                </span>
                {!sidebarCollapsed && <span className="truncate">Tableau de bord</span>}
              </>
            )}
          </NavLink>

          <NavLink
            to="/employee/profile"
            className={({ isActive }) =>
              [
                "relative flex items-center w-full rounded-xl py-2.5 text-sm font-medium transition-all admin-nav-item group",
                sidebarCollapsed ? "justify-center px-0" : "gap-3 px-3.5 text-left",
                isActive
                  ? "bg-indigo-50 text-indigo-800 font-semibold"
                  : "text-slate-500 hover:bg-slate-50 hover:text-indigo-600",
              ].join(" ")
            }
          >
            {({ isActive }) => (
              <>
                {!sidebarCollapsed && isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r bg-gradient-to-b from-indigo-700 to-violet-700" />
                )}
                <span className={`shrink-0 flex items-center justify-center ${isActive ? "text-indigo-600" : "text-slate-300 group-hover:text-indigo-400"}`}>
                  <UserCircleIcon className="w-5 h-5" />
                </span>
                {!sidebarCollapsed && <span className="truncate">Mon profil</span>}
              </>
            )}
          </NavLink>
        </nav>
      </aside>

      {/* Contenu : même header fixe et même padding que manager/admin */}
      <div className="admin-content">
        <header className="admin-header-fixed flex items-center justify-between px-4 md:px-6 bg-white border-b border-slate-100 shadow-sm z-30">
          <div className="flex items-center gap-3 min-w-0">
            {/* Hamburger visible sur mobile pour ouvrir la sidebar */}
            <button
              type="button"
              className="hamburger-btn flex items-center justify-center w-8 h-8 rounded-lg border border-slate-200 bg-slate-50 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 transition"
              onClick={() => setSidebarOpen((o) => !o)}
              aria-label="Menu"
            >
              <Bars3Icon className="w-5 h-5" />
            </button>
          </div>

          {/* Menu utilisateur avec photo de profil et dropdown */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="flex items-center justify-center rounded-full border border-slate-200 bg-slate-50 p-1 cursor-pointer hover:bg-violet-50 hover:border-indigo-200 transition"
              aria-label="Menu utilisateur"
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="w-8 h-8 rounded-full object-cover shadow shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-700 to-violet-700 flex items-center justify-center text-xs font-bold text-white shadow shrink-0">
                  {displayName
                    .split(" ")
                    .map((p) => p[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
              )}
            </button>

            {menuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-12 z-50 min-w-[180px] rounded-2xl border border-slate-100 bg-white shadow-xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-100">
                    <p className="text-sm font-semibold text-slate-800 truncate">{displayName}</p>
                    <p className="text-xs text-slate-400">Employé</p>
                  </div>
                  <div className="p-1.5 flex flex-col gap-0.5">
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        navigate("/employee/profile");
                      }}
                      className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition"
                    >
                      Mon profil
                    </button>
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        keycloak.logout({ redirectUri: `${window.location.origin}/` });
                      }}
                      className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition"
                    >
                      Déconnexion
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </header>

        <main className="flex min-h-0 flex-1 flex-col overflow-hidden pt-16">
          <EmployeeBreadcrumbs />
          <div
            className={
              isProfilePage
                ? "flex min-h-0 w-full flex-1 flex-col overflow-hidden px-4 pb-4 pt-6 md:px-6 md:pb-6 md:pt-8"
                : "dashboard-padding"
            }
          >
            <Outlet context={{ employeeAvatarUrl: avatarUrl, employeeName: displayName, employeeEmail: email, currentPath: location.pathname, onAvatarUpdate: setAvatarUrl }} />
          </div>
        </main>
      </div>
    </div>
  );
}
