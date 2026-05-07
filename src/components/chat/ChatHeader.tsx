import type { ProjectConversation } from "../../types/chat";
import { ChatPresenceBar } from "./ChatPresenceBar";

export function ChatHeader({ project, onlineCount }: { project: ProjectConversation; onlineCount: number }) {
  const { label: statusLabel, classes: statusClasses } = getProjectStatusMeta(project.status);

  return (
    <div className="flex items-center justify-between border-b border-slate-200/80 bg-gradient-to-r from-white to-slate-50 px-4 py-3 shadow-sm">
      <div className="min-w-0">
        <h2 className="truncate text-lg font-bold tracking-tight text-slate-900">{project.name}</h2>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Statut</span>
          <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold leading-none ${statusClasses}`}>
            {statusLabel}
          </span>
        </div>
      </div>
      <div className="ml-3 shrink-0">
        <ChatPresenceBar onlineCount={onlineCount} />
      </div>
    </div>
  );
}

function getProjectStatusMeta(status?: string | null) {
  const normalized = String(status ?? "").trim().toLowerCase().replaceAll("_", " ").replaceAll("-", " ");

  if (!normalized) {
    return {
      label: "Non défini",
      classes: "border-slate-200 bg-slate-50 text-slate-600",
    };
  }

  if (["active", "in progress", "inprogress", "en cours", "ongoing"].includes(normalized)) {
    return {
      label: "En cours",
      classes: "border-blue-200 bg-blue-50 text-blue-700",
    };
  }

  if (["completed", "done", "finished", "terminé", "termine", "closed"].includes(normalized)) {
    return {
      label: "Terminé",
      classes: "border-emerald-200 bg-emerald-50 text-emerald-700",
    };
  }

  if (["draft", "brouillon", "pending", "todo", "to do"].includes(normalized)) {
    return {
      label: "Brouillon",
      classes: "border-amber-200 bg-amber-50 text-amber-700",
    };
  }

  return {
    label: status ?? "Non défini",
    classes: "border-slate-200 bg-slate-50 text-slate-700",
  };
}
