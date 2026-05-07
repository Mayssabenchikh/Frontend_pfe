import type { ReactNode } from "react";

export function ProjectChatLayout({ sidebar, content }: { sidebar: ReactNode; content: ReactNode }) {
  return (
    <div className="flex h-[calc(100vh-12.8rem)] overflow-hidden rounded-3xl border border-slate-200/80 bg-white/95 shadow-[0_16px_40px_-24px_rgba(15,23,42,0.35)] ring-1 ring-white">
      {sidebar}
      {content}
    </div>
  );
}
