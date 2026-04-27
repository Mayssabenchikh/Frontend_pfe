import type { NavId } from "./types";
import { Squares2X2Icon, UsersIcon, ArchiveBoxIcon, BookOpenIcon, FolderIcon, ChevronLeftIcon, ChevronRightIcon, InboxStackIcon, BriefcaseIcon, ClipboardDocumentListIcon } from "../../icons/heroicons/outline";

type NavItem = { id: NavId; label: string; icon: React.ReactNode };
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
  { id: "dashboard",      label: "Tableau de bord",        icon: <Squares2X2Icon className="w-5 h-5" /> },
  { id: "users",          label: "Utilisateurs",           icon: <UsersIcon className="w-5 h-5" /> },
  { id: "archives",       label: "Archives",               icon: <ArchiveBoxIcon className="w-5 h-5" /> },
  { id: "projects",       label: "Projets",                icon: <ClipboardDocumentListIcon className="w-5 h-5" /> },
  { id: "trainings",      label: "Formations",             icon: <BookOpenIcon className="w-5 h-5" /> },
  { id: "skills",         label: "Référentiel compétences", icon: <BookOpenIcon className="w-5 h-5" /> },
  { id: "skillRequests",  label: "Demandes compétences",   icon: <InboxStackIcon className="w-5 h-5" /> },
  { id: "skillCategories", label: "Catégories",            icon: <FolderIcon className="w-5 h-5" /> },
  { id: "assignments",    label: "Affectations",           icon: <BriefcaseIcon className="w-5 h-5" /> },
];

export function AdminSidebar({ currentView, onNavChange, mobileOpen, collapsed = false, onToggleCollapse }: Props) {
  return (
    <aside className={`admin-sidebar flex flex-col${mobileOpen ? " open" : ""}${collapsed ? " collapsed" : ""}`}>
      {/* Header: logo + flèche (ou flèche seule centrée si collapsed) */}
      <div className={`h-16 flex items-center shrink-0 admin-sidebar-header
        ${collapsed ? "justify-center px-0" : "justify-between px-3"}`}
      >
        <div className="admin-sidebar-logo flex items-center justify-center overflow-hidden min-w-0 flex-1">
          <img src="/logo.png" alt="Logo" className="h-9 w-auto object-contain" />
        </div>
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="admin-sidebar-toggle flex items-center justify-center w-8 h-8 flex-shrink-0
              text-slate-400 hover:text-violet-600
              transition-colors duration-200"
            aria-label={collapsed ? "Ouvrir le menu" : "Réduire le menu"}
          >
            {collapsed ? (
              <ChevronRightIcon className="w-5 h-5" strokeWidth={2} />
            ) : (
              <ChevronLeftIcon className="w-5 h-5" strokeWidth={2} />
            )}
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2.5 py-5 flex flex-col gap-0.5">
        {NAV.map((item) => {
          const active = currentView === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavChange(item.id)}
              title={collapsed ? item.label : undefined}
              className={`relative flex items-center w-full rounded-xl py-2.5 text-sm font-medium transition-all admin-nav-item
                ${collapsed ? "justify-center px-0" : "gap-3 px-3.5 text-left"}
                ${active
                  ? "bg-indigo-50 text-indigo-800 font-semibold"
                  : "text-slate-500 hover:bg-slate-50 hover:text-indigo-600"
                }`}
            >
              {active && !collapsed && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r bg-gradient-to-b from-indigo-700 to-violet-700" />
              )}
              <span className={`shrink-0 flex items-center justify-center ${active ? "text-indigo-600" : "text-slate-300 group-hover:text-indigo-400"}`}>
                {item.icon}
              </span>
              {!collapsed && <span className="truncate">{item.label}</span>}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
