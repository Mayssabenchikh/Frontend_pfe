import { useEffect, useState } from "react";
import { useKeycloak } from "@react-keycloak/web";
import { Outlet, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ClipboardDocumentCheckIcon,
  Squares2X2Icon,
  UserCircleIcon,
  BriefcaseIcon,
  ClipboardDocumentListIcon,
} from "../icons/heroicons/outline";
import { http } from "../api/http";
import { EmployeeBreadcrumbs } from "./employee/EmployeeBreadcrumbs";
import { AdminHeader } from "./admin/AdminHeader";

export default function EmployeePage() {
  const { keycloak } = useKeycloak();
  const token = keycloak.tokenParsed as { given_name?: string; family_name?: string; email?: string; picture?: string } | undefined;
  const displayName = [token?.given_name, token?.family_name].filter(Boolean).join(" ") || token?.email || "Employé";
  const email = token?.email ?? null;
  const avatarSeed = email || keycloak.subject || displayName;
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(token?.picture ?? null);

  const location = useLocation();
  const isProfilePage = location.pathname.startsWith("/employee/profile");
  const isQuizPage = location.pathname.startsWith("/employee/quiz");
  const isAssignmentsPage = location.pathname.startsWith("/employee/assignments");
  const isProjectsPage = location.pathname.startsWith("/employee/projects");

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
        className={`admin-sidebar flex flex-col${
          sidebarOpen ? " open" : ""
        }${sidebarCollapsed ? " collapsed" : ""}`}
      >
        {/* Header sidebar : logo + flèche */}
        <div
          className={`h-16 flex items-center shrink-0 admin-sidebar-header ${
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
        <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2.5 py-5 flex flex-col gap-0.5">
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
            to="/employee/quiz"
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
                  <ClipboardDocumentCheckIcon className="w-5 h-5" />
                </span>
                {!sidebarCollapsed && <span className="truncate">Quiz</span>}
              </>
            )}
          </NavLink>

          <NavLink
            to="/employee/assignments"
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
                  <BriefcaseIcon className="w-5 h-5" />
                </span>
                {!sidebarCollapsed && <span className="truncate">Affectations</span>}
              </>
            )}
          </NavLink>

          <NavLink
            to="/employee/projects"
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
                  <ClipboardDocumentListIcon className="w-5 h-5" />
                </span>
                {!sidebarCollapsed && <span className="truncate">Mes projets</span>}
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
        <AdminHeader
          displayName={displayName}
          initials={null}
          avatarUrl={avatarUrl}
          avatarSeed={avatarSeed}
          roleLabel="Employé"
          onMenuToggle={() => setSidebarOpen((o) => !o)}
          onProfile={() => navigate("/employee/profile")}
          onLogout={() => keycloak.logout({ redirectUri: `${window.location.origin}/` })}
        />

        <main className="flex min-h-0 flex-1 flex-col overflow-hidden pt-16">
          <EmployeeBreadcrumbs />
          <div
            className={
              isProfilePage
                ? "flex min-h-0 w-full flex-1 flex-col overflow-hidden px-4 pb-4 pt-6 md:px-6 md:pb-6 md:pt-8"
                : isQuizPage
                  ? "flex min-h-0 w-full flex-1 flex-col overflow-hidden px-0 py-0"
                : isAssignmentsPage
                  ? "flex min-h-0 w-full flex-1 flex-col overflow-hidden px-0 py-0"
                : isProjectsPage
                  ? "flex min-h-0 w-full flex-1 flex-col overflow-hidden px-0 py-0"
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
