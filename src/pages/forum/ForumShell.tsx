import { useEffect, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useKeycloak } from "@react-keycloak/web";
import {
  ArchiveBoxIcon,
  BookOpenIcon,
  BriefcaseIcon,
  ChatBubbleLeftRightIcon,
  ClipboardDocumentCheckIcon,
  ClipboardDocumentListIcon,
  DocumentTextIcon,
  FolderIcon,
  InboxStackIcon,
  SparklesIcon,
  Squares2X2Icon,
  UsersIcon,
} from "../../icons/heroicons/outline";
import { meApi } from "../../api/meApi";
import { trainingManagerApi } from "../../api/trainingManagerApi";
import { getPrimaryRole, type AppRole } from "../../auth/roles";
import { DashboardShell } from "../../components/DashboardShell";
import { DashboardSidebar, DashboardSidebarForumGroup, DashboardSidebarLogout, DashboardSidebarNavItem } from "../../components/DashboardSidebar";
import { AdminHeader } from "../admin/AdminHeader";
import { ChevronRightIcon, HomeIcon } from "../../icons/heroicons/outline";

function homePathForRole(role: AppRole | null): string {
  switch (role) {
    case "ADMIN":
      return "/admin/dashboard";
    case "MANAGER":
      return "/manager/dashboard";
    case "TRAINING_MANAGER":
      return "/training-manager/dashboard";
    case "EMPLOYEE":
      return "/employee/dashboard";
    default:
      return "/";
  }
}

function roleLabel(role: AppRole | null): string {
  switch (role) {
    case "ADMIN":
      return "Administrateur";
    case "MANAGER":
      return "Manager";
    case "TRAINING_MANAGER":
      return "Responsable formation";
    case "EMPLOYEE":
      return "Employé";
    default:
      return "Utilisateur";
  }
}

function projectChatPath(role: AppRole | null): string | null {
  if (role === "MANAGER") return "/manager/chat";
  if (role === "EMPLOYEE") return "/employee/chat";
  return null;
}

function getForumBreadcrumbs(pathname: string): { label: string; to?: string }[] {
  const parts = pathname.replace(/^\/+/, "").split("/");

  if (parts.length === 1) {
    return [];
  }

  if (parts[1] === "post") {
    return [{ label: "Publication" }];
  }

  if (parts[1] === "my-posts") {
    return [{ label: "Mes publications" }];
  }

  if (parts[1] === "saved") {
    return [{ label: "Publications enregistrées" }];
  }

  return [];
}

export default function ForumShell() {
  const { keycloak } = useKeycloak();
  const navigate = useNavigate();
  const location = useLocation();
  const token = keycloak.tokenParsed as { given_name?: string; family_name?: string; email?: string; picture?: string } | undefined;
  const displayName = [token?.given_name, token?.family_name].filter(Boolean).join(" ") || token?.email || "Utilisateur";
  const email = token?.email ?? null;
  const avatarSeed = email || keycloak.subject || displayName;
  const primary = getPrimaryRole(keycloak.tokenParsed ?? undefined);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(token?.picture ?? null);

  useEffect(() => {
    if (primary === "MANAGER") {
      meApi
        .manager()
        .then((res) => setAvatarUrl(res.data?.avatarUrl ?? token?.picture ?? null))
        .catch(() => setAvatarUrl(token?.picture ?? null));
      return;
    }

    if (primary === "EMPLOYEE") {
      meApi
        .employee()
        .then((res) => setAvatarUrl(res.data?.avatarUrl ?? token?.picture ?? null))
        .catch(() => setAvatarUrl(token?.picture ?? null));
      return;
    }

    if (primary === "TRAINING_MANAGER") {
      trainingManagerApi
        .me()
        .then((res) => setAvatarUrl(res.data?.avatarUrl ?? token?.picture ?? null))
        .catch(() => setAvatarUrl(token?.picture ?? null));
      return;
    }

    if (primary === "ADMIN") {
      const adminAvatarKey = keycloak.subject ? `admin_avatar_${keycloak.subject}` : null;
      setAvatarUrl(adminAvatarKey ? (localStorage.getItem(adminAvatarKey) ?? token?.picture ?? null) : token?.picture ?? null);
      return;
    }

    setAvatarUrl(token?.picture ?? null);
  }, [keycloak.subject, primary, token?.picture]);

  const backHref = homePathForRole(primary);
  const chatHref = projectChatPath(primary);
  const crumbs = getForumBreadcrumbs(location.pathname);
  const renderRoleNav = (collapsed: boolean) => {
    switch (primary) {
      case "ADMIN":
        return (
          <>
            <DashboardSidebarNavItem label="Tableau de bord" icon={<Squares2X2Icon className="h-5 w-5" />} to="/admin/dashboard" collapsed={collapsed} />
            <DashboardSidebarNavItem label="Utilisateurs" icon={<UsersIcon className="h-5 w-5" />} onClick={() => navigate("/admin", { state: { view: "users" } })} collapsed={collapsed} />
            <DashboardSidebarNavItem label="Archives" icon={<ArchiveBoxIcon className="h-5 w-5" />} onClick={() => navigate("/admin", { state: { view: "archives" } })} collapsed={collapsed} />
            <DashboardSidebarNavItem label="Projets" icon={<ClipboardDocumentListIcon className="h-5 w-5" />} onClick={() => navigate("/admin", { state: { view: "projects" } })} collapsed={collapsed} />
            <DashboardSidebarNavItem label="Référentiel compétences" icon={<BookOpenIcon className="h-5 w-5" />} onClick={() => navigate("/admin", { state: { view: "skills" } })} collapsed={collapsed} />
            <DashboardSidebarNavItem label="Demandes compétences" icon={<InboxStackIcon className="h-5 w-5" />} onClick={() => navigate("/admin", { state: { view: "skillRequests" } })} collapsed={collapsed} />
            <DashboardSidebarNavItem label="Catégories" icon={<FolderIcon className="h-5 w-5" />} onClick={() => navigate("/admin", { state: { view: "skillCategories" } })} collapsed={collapsed} />
            <DashboardSidebarNavItem label="Affectations" icon={<BriefcaseIcon className="h-5 w-5" />} onClick={() => navigate("/admin", { state: { view: "assignments" } })} collapsed={collapsed} />
            <DashboardSidebarForumGroup collapsed={collapsed} />
          </>
        );
      case "MANAGER":
        return (
          <>
            <DashboardSidebarNavItem label="Tableau de bord" icon={<Squares2X2Icon className="h-5 w-5" />} to="/manager" end collapsed={collapsed} />
            <DashboardSidebarNavItem label="Extraction CV" icon={<DocumentTextIcon className="h-5 w-5" />} to="/manager/cv-extraction" collapsed={collapsed} />
            <DashboardSidebarNavItem label="Quiz" icon={<ClipboardDocumentCheckIcon className="h-5 w-5" />} to="/manager/quiz" collapsed={collapsed} />
            <DashboardSidebarNavItem label="Projets" icon={<ClipboardDocumentListIcon className="h-5 w-5" />} to="/manager/projects" collapsed={collapsed} />
            <DashboardSidebarNavItem label="Affectations" icon={<BriefcaseIcon className="h-5 w-5" />} to="/manager/assignments" collapsed={collapsed} />
            <DashboardSidebarNavItem label="Chat projets" icon={<ChatBubbleLeftRightIcon className="h-5 w-5" />} to="/manager/chat" collapsed={collapsed} />
            <DashboardSidebarForumGroup collapsed={collapsed} />
            <DashboardSidebarNavItem label="Formations" icon={<SparklesIcon className="h-5 w-5" />} to="/manager/training-recommendations" collapsed={collapsed} />
          </>
        );
      case "TRAINING_MANAGER":
        return (
          <>
            <DashboardSidebarNavItem label="Tableau de bord" icon={<Squares2X2Icon className="h-5 w-5" />} to="/training-manager" end collapsed={collapsed} />
            <DashboardSidebarNavItem label="Mes formations" icon={<ClipboardDocumentListIcon className="h-5 w-5" />} to="/training-manager/programs" collapsed={collapsed} />
            <DashboardSidebarForumGroup collapsed={collapsed} />
            <DashboardSidebarNavItem label="Soumissions" icon={<ClipboardDocumentCheckIcon className="h-5 w-5" />} to="/training-manager/submissions" collapsed={collapsed} />
          </>
        );
      case "EMPLOYEE":
      default:
        return (
          <>
            <DashboardSidebarNavItem label="Tableau de bord" icon={<Squares2X2Icon className="h-5 w-5" />} to="/employee" end collapsed={collapsed} />
            <DashboardSidebarNavItem label="Analyse du CV" icon={<DocumentTextIcon className="h-5 w-5" />} to="/employee/cv-extraction" collapsed={collapsed} />
            <DashboardSidebarNavItem label="Quiz" icon={<ClipboardDocumentCheckIcon className="h-5 w-5" />} to="/employee/quiz" collapsed={collapsed} />
            <DashboardSidebarNavItem label="Affectations" icon={<BriefcaseIcon className="h-5 w-5" />} to="/employee/assignments" collapsed={collapsed} />
            <DashboardSidebarNavItem label="Formations" icon={<SparklesIcon className="h-5 w-5" />} to="/employee/training-recommendations" collapsed={collapsed} />
            <DashboardSidebarNavItem label="Chat projets" icon={<ChatBubbleLeftRightIcon className="h-5 w-5" />} to="/employee/chat" collapsed={collapsed} />
            <DashboardSidebarForumGroup collapsed={collapsed} />
            <DashboardSidebarNavItem label="Mes projets" icon={<ClipboardDocumentListIcon className="h-5 w-5" />} to="/employee/projects" collapsed={collapsed} />
          </>
        );
    }
  };

  return (
    <DashboardShell
      dashboardPage={false}
      renderSidebar={({ sidebarOpen, sidebarCollapsed, toggleSidebarCollapsed }) => (
        <DashboardSidebar
          mobileOpen={sidebarOpen}
          collapsed={sidebarCollapsed}
          onToggleCollapse={toggleSidebarCollapsed}
          footer={
            <DashboardSidebarLogout
              collapsed={sidebarCollapsed}
              onLogout={() => keycloak.logout({ redirectUri: `${window.location.origin}/` })}
            />
          }
        >
          {renderRoleNav(sidebarCollapsed)}
        </DashboardSidebar>
      )}
      renderHeader={({ toggleSidebar }) => (
        <AdminHeader
          displayName={displayName}
          initials={null}
          avatarUrl={avatarUrl}
          avatarSeed={avatarSeed}
          roleLabel={roleLabel(primary)}
          onMenuToggle={toggleSidebar}
          onProfile={() => {
            switch (primary) {
              case "ADMIN":
                navigate("/admin", { state: { view: "profile" } });
                break;
              case "MANAGER":
                navigate("/manager/profile");
                break;
              case "EMPLOYEE":
                navigate("/employee/profile");
                break;
              case "TRAINING_MANAGER":
                navigate("/training-manager/profile");
                break;
              default:
                navigate(backHref);
            }
          }}
          onProjectChat={chatHref ? () => navigate(chatHref) : undefined}
          projectChatActive={chatHref ? location.pathname.startsWith(chatHref) : false}
          onLogout={() => keycloak.logout({ redirectUri: `${window.location.origin}/` })}
        />
      )}
    >
      <main className="flex min-w-0 flex-1 flex-col overflow-visible bg-slate-50">
        <nav
          className="admin-breadcrumbs flex h-10 min-w-0 shrink-0 items-center gap-1.5 overflow-x-auto overflow-y-hidden whitespace-nowrap px-3 pt-1 text-xs text-slate-500 sm:gap-2 sm:px-6 sm:text-sm md:px-8"
          aria-label="Fil d'Ariane forum"
        >
          <Link to={backHref} className="flex items-center gap-1.5 text-slate-400 hover:text-violet-600 transition-colors">
            <HomeIcon className="h-4 w-4" />
            <span>Accueil</span>
          </Link>

          <span className="inline-flex items-center gap-2">
            <ChevronRightIcon className="h-3.5 w-3.5 text-slate-300" />
            <Link to="/forum" className="font-medium text-slate-700 hover:text-violet-700 transition-colors">
              Forum
            </Link>
          </span>

          {crumbs.map((c, idx) => (
            <span key={`${c.label}-${idx}`} className="inline-flex items-center gap-2">
              <ChevronRightIcon className="h-3.5 w-3.5 text-slate-300" />
              {c.to ? (
                <Link to={c.to} className="font-medium text-slate-700 hover:text-violet-700 transition-colors">
                  {c.label}
                </Link>
              ) : (
                <span className="font-medium text-slate-700">{c.label}</span>
              )}
            </span>
          ))}
        </nav>
        <div className="flex w-full flex-col overflow-visible px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </main>
    </DashboardShell>
  );
}
