import { useEffect, useState, type ReactNode } from "react";
import { useLocation } from "react-router-dom";

type DashboardShellContext = {
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  toggleSidebarCollapsed: () => void;
};

type DashboardShellProps = {
  children: ReactNode;
  className?: string;
  dashboardPage?: boolean;
  renderSidebar: (context: DashboardShellContext) => ReactNode;
  renderHeader: (context: DashboardShellContext) => ReactNode;
};

export function DashboardShell({
  children,
  className = "",
  dashboardPage = false,
  renderSidebar,
  renderHeader,
}: DashboardShellProps) {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpenState] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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
    setSidebarOpenState(false);
  }, [location.pathname]);

  const context: DashboardShellContext = {
    sidebarOpen,
    sidebarCollapsed,
    setSidebarOpen: setSidebarOpenState,
    toggleSidebar: () => setSidebarOpenState((open) => !open),
    toggleSidebarCollapsed: () => setSidebarCollapsed((collapsed) => !collapsed),
  };

  return (
    <div
      className={[
        "admin-layout",
        className,
        dashboardPage ? "dashboard-page" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      data-sidebar-collapsed={sidebarCollapsed || undefined}
    >
      <div
        className={`sidebar-backdrop${sidebarOpen ? " open" : ""}`}
        onClick={() => setSidebarOpenState(false)}
      />

      {renderSidebar(context)}

      <div className="admin-content">
        {renderHeader(context)}
        {children}
      </div>
    </div>
  );
}
