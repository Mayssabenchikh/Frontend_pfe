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
import { DashboardSidebar, DashboardSidebarNavItem } from "../../components/DashboardSidebar";
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
  const isSubmissionsSection = location.pathname.startsWith("/training-manager/submissions");

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
        <DashboardSidebarNavItem label="Mes formations" icon={<ClipboardDocumentListIcon className="h-5 w-5" />} to="/training-manager/programs" active={isProgramsSection} collapsed={sidebarCollapsed} />
        <DashboardSidebarNavItem label="Soumissions" icon={<ClipboardDocumentCheckIcon className="h-5 w-5" />} to="/training-manager/submissions" active={isSubmissionsSection} collapsed={sidebarCollapsed} />
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
          <TrainingManagerBreadcrumbs />
          <div className="dashboard-padding training-manager-app flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="tm-scroll-area relative flex min-h-0 flex-1 flex-col overflow-auto">
              <Outlet context={{ onAvatarUpdate: setAvatarUrl }} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
