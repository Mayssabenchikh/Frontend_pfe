import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { ChevronLeftIcon, ChevronRightIcon } from "../icons/heroicons/outline";

type DashboardSidebarProps = {
  mobileOpen?: boolean;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  children: ReactNode;
};

type DashboardSidebarNavItemProps = {
  label: string;
  icon: ReactNode;
  collapsed?: boolean;
  to?: string;
  end?: boolean;
  active?: boolean;
  subtitle?: string;
  onClick?: () => void;
};

function itemClasses(active: boolean, collapsed?: boolean) {
  return [
    "admin-nav-item group relative flex min-h-12 w-full items-center rounded-xl border text-sm font-bold transition-all duration-200 ease-out",
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/30 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
    collapsed ? "justify-center px-0" : "gap-3 px-3.5 text-left",
    active
      ? "border-violet-200 bg-gradient-to-r from-violet-100 to-indigo-50 text-violet-950 shadow-sm shadow-violet-100/80"
      : "border-transparent text-slate-600 hover:border-violet-100 hover:bg-violet-50/80 hover:text-violet-800",
  ].join(" ");
}

function DashboardSidebarNavContent({ label, icon, active, collapsed, subtitle }: DashboardSidebarNavItemProps & { active: boolean }) {
  return (
    <>
      {active && (
        <span
          className={[
            "absolute rounded-full bg-violet-700",
            collapsed ? "bottom-1 left-1/2 h-1 w-5 -translate-x-1/2" : "left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-l-none",
          ].join(" ")}
        />
      )}
      <span
        className={[
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors",
          active
            ? "text-violet-700 drop-shadow-[0_1px_6px_rgba(124,58,237,0.24)]"
            : "text-slate-400 group-hover:text-violet-700",
        ].join(" ")}
      >
        {icon}
      </span>
      {!collapsed && (
        <span className="flex min-w-0 flex-1 flex-col leading-tight">
          <span className="truncate">{label}</span>
          {subtitle ? <span className={`mt-0.5 truncate text-[11px] font-semibold ${active ? "text-violet-700/80" : "text-slate-400"}`}>{subtitle}</span> : null}
        </span>
      )}
    </>
  );
}

export function DashboardSidebar({ mobileOpen, collapsed = false, onToggleCollapse, children }: DashboardSidebarProps) {
  return (
    <aside className={`admin-sidebar flex flex-col${mobileOpen ? " open" : ""}${collapsed ? " collapsed" : ""}`}>
      <div className={`admin-sidebar-header flex h-20 shrink-0 items-center ${collapsed ? "justify-center px-0" : "justify-between px-4"}`}>
        <div className="admin-sidebar-logo flex min-w-0 flex-1 items-center justify-center overflow-hidden">
          <img src="/logo.png" alt="Logo" className="h-10 w-auto object-contain" />
        </div>
        {onToggleCollapse ? (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="admin-sidebar-toggle flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-violet-100 bg-white text-slate-500 shadow-sm transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/30"
            aria-label={collapsed ? "Ouvrir le menu" : "Réduire le menu"}
          >
            {collapsed ? <ChevronRightIcon className="h-5 w-5" strokeWidth={2} /> : <ChevronLeftIcon className="h-5 w-5" strokeWidth={2} />}
          </button>
        ) : null}
      </div>

      <nav className="flex flex-1 flex-col overflow-y-auto overflow-x-hidden px-3 pb-5 pt-7">
        <div className="flex flex-col gap-2">{children}</div>
      </nav>
    </aside>
  );
}

export function DashboardSidebarNavItem({ label, icon, collapsed = false, to, end, active, subtitle, onClick }: DashboardSidebarNavItemProps) {
  if (to) {
    return (
      <NavLink
        to={to}
        end={end}
        title={collapsed ? label : undefined}
        aria-label={collapsed ? label : undefined}
        className={({ isActive }) => itemClasses(active ?? isActive, collapsed)}
      >
        {({ isActive }) => <DashboardSidebarNavContent label={label} icon={icon} collapsed={collapsed} active={active ?? isActive} subtitle={subtitle} />}
      </NavLink>
    );
  }

  const isActive = Boolean(active);
  return (
    <button
      type="button"
      onClick={onClick}
      title={collapsed ? label : undefined}
      aria-label={collapsed ? label : undefined}
      className={itemClasses(isActive, collapsed)}
    >
      <DashboardSidebarNavContent label={label} icon={icon} collapsed={collapsed} active={isActive} subtitle={subtitle} />
    </button>
  );
}
