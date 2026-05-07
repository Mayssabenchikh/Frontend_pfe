import type { ReactNode } from "react";

export function ProjectChatLayout({ sidebar, content }: { sidebar: ReactNode; content: ReactNode }) {
  return <div className="flex h-[calc(100vh-9.5rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">{sidebar}{content}</div>;
}
