import type { NavId } from "./types";
import type { ReactNode } from "react";
import {
  ArchiveBoxIcon,
  BookOpenIcon,
  BriefcaseIcon,
  ClipboardDocumentListIcon,
  FolderIcon,
  InboxStackIcon,
  Squares2X2Icon,
  UsersIcon,
} from "../../icons/heroicons/outline";
import { DashboardSidebar, DashboardSidebarNavItem } from "../../components/DashboardSidebar";

type NavItem = { id: NavId; label: string; icon: ReactNode };
type Props = {
  currentView: NavId;
  onNavChange: (view: NavId) => void;
  displayName: string;
  roleLabel: string;
  avatarUrl: string | null;
  initials: string;
  mobileOpen?: boolean;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
};

const NAV: NavItem[] = [
  { id: "dashboard", label: "Tableau de bord", icon: <Squares2X2Icon className="h-5 w-5" /> },
  { id: "users", label: "Utilisateurs", icon: <UsersIcon className="h-5 w-5" /> },
  { id: "archives", label: "Archives", icon: <ArchiveBoxIcon className="h-5 w-5" /> },
  { id: "projects", label: "Projets", icon: <ClipboardDocumentListIcon className="h-5 w-5" /> },
  { id: "skills", label: "Référentiel compétences", icon: <BookOpenIcon className="h-5 w-5" /> },
  { id: "skillRequests", label: "Demandes compétences", icon: <InboxStackIcon className="h-5 w-5" /> },
  { id: "skillCategories", label: "Catégories", icon: <FolderIcon className="h-5 w-5" /> },
  { id: "assignments", label: "Affectations", icon: <BriefcaseIcon className="h-5 w-5" /> },
];

export function AdminSidebar({ currentView, onNavChange, mobileOpen, collapsed = false, onToggleCollapse }: Props) {
  return (
    <DashboardSidebar mobileOpen={mobileOpen} collapsed={collapsed} onToggleCollapse={onToggleCollapse}>
      {NAV.map((item) => (
        <DashboardSidebarNavItem
          key={item.id}
          label={item.label}
          icon={item.icon}
          collapsed={collapsed}
          active={currentView === item.id}
          onClick={() => onNavChange(item.id)}
        />
      ))}
    </DashboardSidebar>
  );
}
