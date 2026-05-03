import { useEffect, useState } from "react";
import { useKeycloak } from "@react-keycloak/web";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Squares2X2Icon,
  ClipboardDocumentListIcon,
  FolderIcon,
  UserCircleIcon,
} from "../../icons/heroicons/outline";
import { AdminHeader } from "../admin/AdminHeader";
import { trainingManagerApi } from "../../api/trainingManagerApi";
import { DashboardSidebar, DashboardSidebarNavItem } from "../../components/DashboardSidebar";

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

      <DashboardSidebar mobileOpen={sidebarOpen} collapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed((c) => !c)}>
        <DashboardSidebarNavItem label="Tableau de bord" icon={<Squares2X2Icon className="h-5 w-5" />} to="/training-manager" end collapsed={sidebarCollapsed} />
        <DashboardSidebarNavItem label="Mes parcours" icon={<ClipboardDocumentListIcon className="h-5 w-5" />} to="/training-manager/programs" end active={isProgramsListPage} collapsed={sidebarCollapsed} />
        <DashboardSidebarNavItem
          label="Modules"
          icon={<FolderIcon className="h-5 w-5" />}
          to={modulesTargetPath}
          active={isModulesPage}
          subtitle={hasLastEditedProgram ? "Édition du module actif" : "Choisir un parcours à éditer"}
          collapsed={sidebarCollapsed}
        />
        <DashboardSidebarNavItem label="Profil" icon={<UserCircleIcon className="h-5 w-5" />} to="/training-manager/profile" collapsed={sidebarCollapsed} />
      </DashboardSidebar>

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
