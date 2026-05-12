import { useEffect, useState } from "react";
import { useKeycloak } from "@react-keycloak/web";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Squares2X2Icon,
  ClipboardDocumentCheckIcon,
  ClipboardDocumentListIcon,
} from "../../icons/heroicons/outline";
import { AdminHeader } from "../admin/AdminHeader";
import { trainingManagerApi } from "../../api/trainingManagerApi";
import { DashboardShell } from "../../components/DashboardShell";
import { DashboardSidebar, DashboardSidebarForumGroup, DashboardSidebarLogout, DashboardSidebarNavItem } from "../../components/DashboardSidebar";
import { TrainingManagerBreadcrumbs } from "./TrainingManagerBreadcrumbs";

const ROOT = `${window.location.origin}/`;
export default function TrainingManagerPage() {
  const { keycloak } = useKeycloak();
  const token = keycloak.tokenParsed as { given_name?: string; family_name?: string; email?: string; picture?: string } | undefined;
  const displayName = [token?.given_name, token?.family_name].filter(Boolean).join(" ") || token?.email || "Responsable formation";
  const email = token?.email ?? null;
  const avatarSeed = email || keycloak.subject || displayName;
  const navigate = useNavigate();
  const location = useLocation();
  const isProgramsSection = location.pathname.startsWith("/training-manager/programs");
  const isProgramsListRoute = location.pathname === "/training-manager/programs";
  const isSubmissionsSection = location.pathname.startsWith("/training-manager/submissions");
  const isDashboardRoute = location.pathname === "/training-manager" || location.pathname === "/training-manager/dashboard";

  const [avatarUrl, setAvatarUrl] = useState<string | null>(token?.picture ?? null);

  useEffect(() => {
    trainingManagerApi
      .me()
      .then((res) => {
        if (res.data?.avatarUrl) setAvatarUrl(res.data.avatarUrl);
      })
      .catch(() => {});
  }, []);

  return (
    <DashboardShell
      className="tm-layout"
      dashboardPage={isDashboardRoute}
      renderSidebar={({ sidebarOpen, sidebarCollapsed, toggleSidebarCollapsed }) => (
        <DashboardSidebar
          mobileOpen={sidebarOpen}
          collapsed={sidebarCollapsed}
          onToggleCollapse={toggleSidebarCollapsed}
          footer={<DashboardSidebarLogout collapsed={sidebarCollapsed} onLogout={() => keycloak.logout({ redirectUri: ROOT })} />}
        >
          <DashboardSidebarNavItem label="Tableau de bord" icon={<Squares2X2Icon className="h-5 w-5" />} to="/training-manager" end collapsed={sidebarCollapsed} />
          <DashboardSidebarNavItem label="Mes formations" icon={<ClipboardDocumentListIcon className="h-5 w-5" />} to="/training-manager/programs" active={isProgramsSection} collapsed={sidebarCollapsed} />
          <DashboardSidebarForumGroup collapsed={sidebarCollapsed} />
          <DashboardSidebarNavItem label="Soumissions" icon={<ClipboardDocumentCheckIcon className="h-5 w-5" />} to="/training-manager/submissions" active={isSubmissionsSection} collapsed={sidebarCollapsed} />
        </DashboardSidebar>
      )}
      renderHeader={({ toggleSidebar }) => (
        <AdminHeader
          displayName={displayName}
          initials={null}
          avatarUrl={avatarUrl}
          avatarSeed={avatarSeed}
          roleLabel="Responsable formation"
          onMenuToggle={toggleSidebar}
          onProfile={() => navigate("/training-manager/profile")}
          onLogout={() => keycloak.logout({ redirectUri: ROOT })}
        />
      )}
    >
        <main className="flex min-w-0 flex-1 flex-col overflow-visible">
          <TrainingManagerBreadcrumbs />
          <div className={`${isDashboardRoute || isProgramsListRoute ? "" : "dashboard-padding "}training-manager-app flex w-full flex-col ${isProgramsListRoute ? "overflow-hidden" : "overflow-visible"}`}>
            <div className={`tm-scroll-area relative flex w-full flex-col ${isProgramsListRoute ? "overflow-hidden" : "overflow-visible"}`}>
              <Outlet context={{ onAvatarUpdate: setAvatarUrl }} />
            </div>
          </div>
        </main>
    </DashboardShell>
  );
}
