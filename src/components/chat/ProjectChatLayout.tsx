import type { ReactNode } from "react";

export function ProjectChatLayout({
  sidebar,
  content,
  sidebarOpen,
  onCloseSidebar,
}: {
  sidebar: ReactNode;
  content: ReactNode;
  sidebarOpen: boolean;
  onCloseSidebar: () => void;
}) {
  return (
    <div className="relative flex min-h-0 flex-1 overflow-hidden rounded-none border border-slate-200/80 bg-white/95 shadow-[0_16px_40px_-24px_rgba(15,23,42,0.35)] ring-1 ring-white sm:rounded-2xl lg:rounded-3xl">
      <button
        type="button"
        aria-label="Fermer la liste des projets"
        className={`absolute inset-0 z-20 bg-slate-950/25 transition md:hidden ${sidebarOpen ? "opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={onCloseSidebar}
      />
      <div
        className={`absolute inset-y-0 left-0 z-30 w-[min(88vw,22rem)] min-w-0 transition-transform duration-200 md:static md:z-auto md:block md:w-80 md:translate-x-0 lg:w-[360px] ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {sidebar}
      </div>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        {content}
      </div>
    </div>
  );
}
