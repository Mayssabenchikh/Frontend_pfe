import { useEffect, useState } from "react";
import { useKeycloak } from "@react-keycloak/web";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  Squares2X2Icon,
  ClipboardDocumentListIcon,
  FolderIcon,
  UserCircleIcon,
} from "../../icons/heroicons/outline";
import { AdminHeader } from "../admin/AdminHeader";
import { trainingManagerApi } from "../../api/trainingManagerApi";

const ROOT = `${window.location.origin}/`;
const LAST_EDITED_PROGRAM_KEY = "tm:lastEditedProgramUuid";

export default function TrainingManagerPage() {
  const { keycloak } = useKeycloak();
  const token = keycloak.tokenParsed as { given_name?: string; family_name?: string; email?: string; picture?: string } | undefined;
  const displayName = [token?.given_name, token?.family_name].filter(Boolean).join(" ") || token?.email || "Responsable formation";
  const email = token?.email ?? null;
  const avatarSeed = email || keycloak.subject || displayName;
  const navigate = useNavigate();
  const location = useLocation();
  const isProgramsListPage = location.pathname === "/training-manager/programs";
  const isModulesPage = location.pathname.startsWith("/training-manager/programs/");
  const hasLastEditedProgram = Boolean(window.localStorage.getItem(LAST_EDITED_PROGRAM_KEY));
  const modulesTargetPath = (() => {
    const lastEditedProgramUuid = window.localStorage.getItem(LAST_EDITED_PROGRAM_KEY);
    return lastEditedProgramUuid ? `/training-manager/programs/${lastEditedProgramUuid}` : "/training-manager/programs";
  })();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(token?.picture ?? null);

  useEffect(() => {
    trainingManagerApi
      .me()
      .then((res) => {
        if (res.data?.avatarUrl) setAvatarUrl(res.data.avatarUrl);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="admin-layout tm-layout" data-sidebar-collapsed={sidebarCollapsed || undefined}>
      <div
        className={`sidebar-backdrop${sidebarOpen ? " open" : ""}`}
        onClick={() => setSidebarOpen(false)}
      />

      <aside className={`admin-sidebar flex flex-col${sidebarOpen ? " open" : ""}${sidebarCollapsed ? " collapsed" : ""}`}>
        <div className="h-16 flex items-center shrink-0 admin-sidebar-header justify-between px-3">
          <div className="admin-sidebar-logo flex items-center justify-center overflow-hidden min-w-0 flex-1">
            <img src="/logo.png" alt="Logo" className="h-9 w-auto object-contain" />
          </div>
          <button
            type="button"
            onClick={() => setSidebarCollapsed((c) => !c)}
            className="admin-sidebar-toggle flex items-center justify-center w-8 h-8 flex-shrink-0 text-slate-400 hover:text-violet-600"
            aria-label={sidebarCollapsed ? "Ouvrir le menu" : "Réduire le menu"}
          >
            {sidebarCollapsed ? <ChevronRightIcon className="w-5 h-5" strokeWidth={2} /> : <ChevronLeftIcon className="w-5 h-5" strokeWidth={2} />}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-2.5 py-5 flex flex-col gap-0.5">
          <NavLink
            to="/training-manager"
            end
            className={({ isActive }) =>
              [
                "relative flex items-center w-full rounded-xl py-2.5 text-sm font-medium transition-all admin-nav-item group",
                sidebarCollapsed ? "justify-center px-0" : "gap-3 px-3.5 text-left",
                isActive
                  ? "bg-gradient-to-r from-violet-100/95 to-indigo-50/90 text-violet-950 font-semibold shadow-sm ring-1 ring-violet-200/70"
                  : "text-slate-500 hover:bg-white/80 hover:text-violet-800 hover:shadow-sm",
              ].join(" ")
            }
          >
            {({ isActive }) => (
              <>
                {!sidebarCollapsed && isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r bg-gradient-to-b from-violet-700 to-indigo-700" />
                )}
                <span className={`shrink-0 ${isActive ? "text-violet-700" : "text-slate-400"}`}>
                  <Squares2X2Icon className="w-5 h-5" />
                </span>
                {!sidebarCollapsed && <span className="truncate">Tableau de bord</span>}
              </>
            )}
          </NavLink>

          <NavLink
            to="/training-manager/programs"
            end
            className={({ isActive }) =>
              [
                "relative flex items-center w-full rounded-xl py-2.5 text-sm font-medium transition-all admin-nav-item group",
                sidebarCollapsed ? "justify-center px-0" : "gap-3 px-3.5 text-left",
                isActive && isProgramsListPage
                  ? "bg-gradient-to-r from-violet-100/95 to-indigo-50/90 text-violet-950 font-semibold shadow-sm ring-1 ring-violet-200/70"
                  : "text-slate-500 hover:bg-white/80 hover:text-violet-800 hover:shadow-sm",
              ].join(" ")
            }
          >
            {({ isActive }) => (
              <>
                {!sidebarCollapsed && isActive && isProgramsListPage && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r bg-gradient-to-b from-violet-700 to-indigo-700" />
                )}
                <span className={`shrink-0 ${isActive && isProgramsListPage ? "text-violet-700" : "text-slate-400"}`}>
                  <ClipboardDocumentListIcon className="w-5 h-5" />
                </span>
                {!sidebarCollapsed && <span className="truncate">Mes parcours</span>}
              </>
            )}
          </NavLink>

          <NavLink
            to={modulesTargetPath}
            className={() =>
              [
                "relative flex items-center w-full rounded-xl py-2.5 text-sm font-medium transition-all admin-nav-item group",
                sidebarCollapsed ? "justify-center px-0" : "gap-3 px-3.5 text-left",
                isModulesPage
                  ? "bg-gradient-to-r from-violet-100/95 to-indigo-50/90 text-violet-950 font-semibold shadow-sm ring-1 ring-violet-200/70"
                  : "text-slate-500 hover:bg-white/80 hover:text-violet-800 hover:shadow-sm",
              ].join(" ")
            }
          >
            <>
              {!sidebarCollapsed && isModulesPage && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r bg-gradient-to-b from-violet-700 to-indigo-700" />
              )}
              <span className={`shrink-0 ${isModulesPage ? "text-violet-700" : "text-slate-400"}`}>
                <FolderIcon className="w-5 h-5" />
              </span>
              {!sidebarCollapsed && (
                <span className="flex min-w-0 flex-col leading-tight">
                  <span className="truncate">Modules</span>
                  <span className={`truncate text-[11px] font-medium ${isModulesPage ? "text-violet-700/85" : "text-slate-400"}`}>
                    {hasLastEditedProgram ? "Édition du module actif" : "Choisir un parcours à éditer"}
                  </span>
                </span>
              )}
            </>
          </NavLink>

          <NavLink
            to="/training-manager/profile"
            className={({ isActive }) =>
              [
                "relative flex items-center w-full rounded-xl py-2.5 text-sm font-medium transition-all admin-nav-item group",
                sidebarCollapsed ? "justify-center px-0" : "gap-3 px-3.5 text-left",
                isActive
                  ? "bg-gradient-to-r from-violet-100/95 to-indigo-50/90 text-violet-950 font-semibold shadow-sm ring-1 ring-violet-200/70"
                  : "text-slate-500 hover:bg-white/80 hover:text-violet-800 hover:shadow-sm",
              ].join(" ")
            }
          >
            {({ isActive }) => (
              <>
                {!sidebarCollapsed && isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r bg-gradient-to-b from-violet-700 to-indigo-700" />
                )}
                <span className={`shrink-0 ${isActive ? "text-violet-700" : "text-slate-400"}`}>
                  <UserCircleIcon className="w-5 h-5" />
                </span>
                {!sidebarCollapsed && <span className="truncate">Profil</span>}
              </>
            )}
          </NavLink>
        </nav>
      </aside>

      <div className="admin-content">
        <AdminHeader
          displayName={displayName}
          initials={null}
          avatarUrl={avatarUrl}
          avatarSeed={avatarSeed}
          roleLabel="Responsable formation"
          onMenuToggle={() => setSidebarOpen((o) => !o)}
          onProfile={() => navigate("/training-manager/profile")}
          onLogout={() => keycloak.logout({ redirectUri: ROOT })}
        />
        <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="dashboard-padding training-manager-app flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="tm-scroll-area relative z-[1] flex min-h-0 flex-1 flex-col overflow-auto">
              <Outlet context={{ onAvatarUpdate: setAvatarUrl }} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
