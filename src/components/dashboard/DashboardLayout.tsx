import type { ReactNode } from "react";
import "../../styles/dashboard.css";

export function DashboardLayout({ children }: { children: ReactNode }) {
  return <section className="dashboard-shell">{children}</section>;
}
