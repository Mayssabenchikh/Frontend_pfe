import type { ReactNode } from "react";

export function DashboardPageLayout({ children }: { children: ReactNode }) {
  return (
    <section className="w-full min-w-0 space-y-5 bg-transparent px-4 py-4 sm:px-6 sm:py-5 lg:px-8">
      {children}
    </section>
  );
}
