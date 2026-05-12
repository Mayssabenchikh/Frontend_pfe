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
  ChatBubbleLeftRightIcon,
} from "../icons/heroicons/outline";
import { meApi } from "../api/meApi";
import { ManagerBreadcrumbs } from "./manager/ManagerBreadcrumbs";
import { AdminHeader } from "./admin/AdminHeader";
import { DashboardShell } from "../components/DashboardShell";
import { DashboardSidebar, DashboardSidebarForumGroup, DashboardSidebarLogout, DashboardSidebarNavItem } from "../components/DashboardSidebar";

const ROOT_REDIRECT_URI = `${window.location.origin}/`;

export default function ManagerPage() {
  const { keycloak } = useKeycloak();
  const token = keycloak.tokenParsed as { given_name?: string; family_name?: string; email?: string; picture?: string } | undefined;
  const displayName = [token?.given_name, token?.family_name].filter(Boolean).join(" ") || token?.email || "Manager";
  const email = token?.email ?? null;
  const avatarSeed = email || keycloak.subject || displayName;
  const navigate = useNavigate();

  const [avatarUrl, setAvatarUrl] = useState<string | null>(token?.picture ?? null);

  const location = useLocation();
  const isCvExtractionPage = location.pathname.startsWith("/manager/cv-extraction");
  const isQuizPage = location.pathname.startsWith("/manager/quiz");
  const isChatPage = location.pathname.startsWith("/manager/chat");
  const isFullBleed =
    location.pathname.startsWith("/manager/projects") ||
    location.pathname.startsWith("/manager/assignments") ||
    isCvExtractionPage ||
    isQuizPage ||
    isChatPage ||
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

  return (
    <DashboardShell
      dashboardPage={isDashboardRoute}
      renderSidebar={({ sidebarOpen, sidebarCollapsed, toggleSidebarCollapsed }) => (
        <DashboardSidebar
          mobileOpen={sidebarOpen}
          collapsed={sidebarCollapsed}
          onToggleCollapse={toggleSidebarCollapsed}
          footer={<DashboardSidebarLogout collapsed={sidebarCollapsed} onLogout={() => keycloak.logout({ redirectUri: ROOT_REDIRECT_URI })} />}
        >
          <DashboardSidebarNavItem label="Tableau de bord" icon={<Squares2X2Icon className="h-5 w-5" />} to="/manager" end collapsed={sidebarCollapsed} />
          <DashboardSidebarNavItem label="Extraction CV" icon={<DocumentTextIcon className="h-5 w-5" />} to="/manager/cv-extraction" collapsed={sidebarCollapsed} />
          <DashboardSidebarNavItem label="Quiz" icon={<ClipboardDocumentCheckIcon className="h-5 w-5" />} to="/manager/quiz" collapsed={sidebarCollapsed} />
          <DashboardSidebarNavItem label="Projets" icon={<ClipboardDocumentListIcon className="h-5 w-5" />} to="/manager/projects" collapsed={sidebarCollapsed} />
          <DashboardSidebarNavItem label="Affectations" icon={<BriefcaseIcon className="h-5 w-5" />} to="/manager/assignments" collapsed={sidebarCollapsed} />
          <DashboardSidebarNavItem label="Chat projets" icon={<ChatBubbleLeftRightIcon className="h-5 w-5" />} to="/manager/chat" collapsed={sidebarCollapsed} />
          <DashboardSidebarForumGroup collapsed={sidebarCollapsed} />
          <DashboardSidebarNavItem label="Formations" icon={<SparklesIcon className="h-5 w-5" />} to="/manager/training-recommendations" collapsed={sidebarCollapsed} />
        </DashboardSidebar>
      )}
      renderHeader={({ toggleSidebar }) => (
        <AdminHeader
          displayName={displayName}
          initials={null}
          avatarUrl={avatarUrl}
          avatarSeed={avatarSeed}
          roleLabel="Manager"
          onMenuToggle={toggleSidebar}
          onProfile={() => navigate("/manager/profile")}
          onProjectChat={() => navigate("/manager/chat")}
          projectChatActive={isChatPage}
          onLogout={() => keycloak.logout({ redirectUri: ROOT_REDIRECT_URI })}
        />
      )}
    >
        <main className="flex min-w-0 flex-1 flex-col overflow-visible">
          <ManagerBreadcrumbs />
          <div
            className={
              isQuizPage || isCvExtractionPage
                ? "flex w-full flex-col overflow-visible px-0 py-0"
                : `${isFullBleed || isDashboardRoute ? "" : "dashboard-padding "}${
                    "flex min-w-0 flex-col overflow-visible"
                  }`
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
    </DashboardShell>
  );
}
