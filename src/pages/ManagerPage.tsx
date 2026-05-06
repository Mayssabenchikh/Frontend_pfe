import { useEffect, useState } from "react";
import { useKeycloak } from "@react-keycloak/web";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  ClipboardDocumentCheckIcon,
  DocumentTextIcon,
  Squares2X2Icon,
  BriefcaseIcon,
  ClipboardDocumentListIcon,
  SparklesIcon,
} from "../icons/heroicons/outline";
import { meApi } from "../api/meApi";
import { ManagerBreadcrumbs } from "./manager/ManagerBreadcrumbs";
import { AdminHeader } from "./admin/AdminHeader";
import { DashboardSidebar, DashboardSidebarNavItem } from "../components/DashboardSidebar";

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
  const isCvExtractionPage = location.pathname.startsWith("/manager/cv-extraction");
  const isQuizPage = location.pathname.startsWith("/manager/quiz");
  const isFullBleed =
    location.pathname.startsWith("/manager/projects") ||
    isCvExtractionPage ||
    isQuizPage ||
    location.pathname.startsWith("/manager/matching");
  const isDashboardRoute = location.pathname === "/manager" || location.pathname === "/manager/dashboard";

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
    <div className={`admin-layout${isDashboardRoute ? " dashboard-page" : ""}`} data-sidebar-collapsed={sidebarCollapsed || undefined}>
      {/* Backdrop mobile (meme comportement que l'admin) */}
      <div
        className={`sidebar-backdrop transition-opacity duration-200 ease-in-out${sidebarOpen ? " open" : ""}`}
        onClick={() => setSidebarOpen(false)}
      />

      <DashboardSidebar mobileOpen={sidebarOpen} collapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed((c) => !c)}>
        <DashboardSidebarNavItem label="Tableau de bord" icon={<Squares2X2Icon className="h-5 w-5" />} to="/manager" end collapsed={sidebarCollapsed} />
        <DashboardSidebarNavItem label="Extraction CV" icon={<DocumentTextIcon className="h-5 w-5" />} to="/manager/cv-extraction" collapsed={sidebarCollapsed} />
        <DashboardSidebarNavItem label="Quiz" icon={<ClipboardDocumentCheckIcon className="h-5 w-5" />} to="/manager/quiz" collapsed={sidebarCollapsed} />
        <DashboardSidebarNavItem label="Projets" icon={<ClipboardDocumentListIcon className="h-5 w-5" />} to="/manager/projects" collapsed={sidebarCollapsed} />
        <DashboardSidebarNavItem label="Affectations" icon={<BriefcaseIcon className="h-5 w-5" />} to="/manager/assignments" collapsed={sidebarCollapsed} />
        <DashboardSidebarNavItem label="Formations" icon={<SparklesIcon className="h-5 w-5" />} to="/manager/training-recommendations" collapsed={sidebarCollapsed} />
      </DashboardSidebar>

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

        <main className={`flex min-h-0 flex-1 flex-col ${isDashboardRoute ? "overflow-visible" : "overflow-hidden"}`}>
          <ManagerBreadcrumbs />
          <div
            className={
              isQuizPage || isCvExtractionPage
                ? "flex min-h-0 w-full flex-1 flex-col overflow-hidden px-0 py-0"
                : `${isFullBleed || isDashboardRoute ? "" : "dashboard-padding "}${isDashboardRoute ? "flex min-w-0 flex-1 flex-col overflow-visible" : "flex min-w-0 flex-1 flex-col overflow-hidden"}`
            }
          >
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
