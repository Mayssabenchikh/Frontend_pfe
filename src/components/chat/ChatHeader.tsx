import type { ProjectConversation } from "../../types/chat";
import { ChatPresenceBar } from "./ChatPresenceBar";

export function ChatHeader({ project, onlineCount }: { project: ProjectConversation; onlineCount: number }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
      <div>
        <h2 className="text-base font-semibold text-slate-900">{project.name}</h2>
        <p className="text-xs text-slate-500">{project.status || "Statut non défini"}</p>
      </div>
      <ChatPresenceBar onlineCount={onlineCount} />
    </div>
  );
}
