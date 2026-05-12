import type { ReactNode } from "react";

export function DashboardGrid({ children, columns = "two" }: { children: ReactNode; columns?: "two" | "three" }) {
  return (
    <div className={`grid grid-cols-1 gap-4 ${columns === "three" ? "xl:grid-cols-3" : "xl:grid-cols-2"}`}>
      {children}
    </div>
  );
}
