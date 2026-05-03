import { useEffect, useState } from "react";
import { useKeycloak } from "@react-keycloak/web";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  ClipboardDocumentCheckIcon,
  DocumentTextIcon,
  Squares2X2Icon,
  UserCircleIcon,
  BriefcaseIcon,
  ClipboardDocumentListIcon,
  SparklesIcon,
} from "../icons/heroicons/outline";
import { meApi } from "../api/meApi";
import { EmployeeBreadcrumbs } from "./employee/EmployeeBreadcrumbs";
import { AdminHeader } from "./admin/AdminHeader";
import { DashboardSidebar, DashboardSidebarNavItem } from "../components/DashboardSidebar";

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
  const isCvExtractionPage = location.pathname.startsWith("/employee/cv-extraction");
  const isQuizPage = location.pathname.startsWith("/employee/quiz");
  const isAssignmentsPage = location.pathname.startsWith("/employee/assignments");
  const isLearningPage = location.pathname.startsWith("/employee/learning");
  const isRecommendationsPage = location.pathname.startsWith("/employee/training-recommendations");
  const isProjectsPage = location.pathname.startsWith("/employee/projects");
  useEffect(() => {
    meApi
      .employee()
      .then((res) => {
        if (res.data?.avatarUrl) setAvatarUrl(res.data.avatarUrl);
      })
      .catch(() => {
        // on garde simplement l'avatar existant (picture ou initiales)
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
      {/* Backdrop mobile */}
      <div
        className={`sidebar-backdrop${sidebarOpen ? " open" : ""}`}
        onClick={() => setSidebarOpen(false)}
      />

      <DashboardSidebar mobileOpen={sidebarOpen} collapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed((c) => !c)}>
        <DashboardSidebarNavItem label="Tableau de bord" icon={<Squares2X2Icon className="h-5 w-5" />} to="/employee" end collapsed={sidebarCollapsed} />
        <DashboardSidebarNavItem label="Extraction CV" icon={<DocumentTextIcon className="h-5 w-5" />} to="/employee/cv-extraction" collapsed={sidebarCollapsed} />
        <DashboardSidebarNavItem label="Quiz" icon={<ClipboardDocumentCheckIcon className="h-5 w-5" />} to="/employee/quiz" collapsed={sidebarCollapsed} />
        <DashboardSidebarNavItem label="Affectations" icon={<BriefcaseIcon className="h-5 w-5" />} to="/employee/assignments" collapsed={sidebarCollapsed} />
        <DashboardSidebarNavItem label="Formations" icon={<SparklesIcon className="h-5 w-5" />} to="/employee/training-recommendations" collapsed={sidebarCollapsed} />
        <DashboardSidebarNavItem label="Mes projets" icon={<ClipboardDocumentListIcon className="h-5 w-5" />} to="/employee/projects" collapsed={sidebarCollapsed} />
        <DashboardSidebarNavItem label="Mon profil" icon={<UserCircleIcon className="h-5 w-5" />} to="/employee/profile" collapsed={sidebarCollapsed} />
      </DashboardSidebar>

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

        <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <EmployeeBreadcrumbs />
          <div
            className={
              isProfilePage
                ? "flex min-h-0 w-full flex-1 flex-col overflow-hidden bg-[#f8f7ff] px-4 pb-4 pt-6 md:px-6 md:pb-6 md:pt-8"
                : isCvExtractionPage || isQuizPage
                ? "flex min-h-0 w-full flex-1 flex-col overflow-hidden bg-[#f8f7ff] px-0 py-0"
                : isAssignmentsPage
                  ? "flex min-h-0 w-full flex-1 flex-col overflow-hidden bg-[#f8f7ff] px-0 py-0"
                : isLearningPage || isRecommendationsPage
                  ? "flex min-h-0 w-full flex-1 flex-col overflow-hidden bg-[#f8f7ff] px-4 py-4 sm:px-6 sm:py-6"
                : isProjectsPage
                  ? "flex min-h-0 w-full flex-1 flex-col overflow-hidden bg-[#f8f7ff] px-0 py-0"
                : "dashboard-padding bg-[#f8f7ff]"
            }
          >
            <Outlet context={{ employeeAvatarUrl: avatarUrl, employeeName: displayName, employeeEmail: email, currentPath: location.pathname, onAvatarUpdate: setAvatarUrl }} />
          </div>
        </main>
      </div>
    </div>
  );
}
