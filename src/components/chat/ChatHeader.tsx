import type { ProjectConversation } from "../../types/chat";
import { ChatPresenceBar } from "./ChatPresenceBar";
import { Bars3Icon } from "../../icons/heroicons/outline";

export function ChatHeader({
  project,
  onlineCount,
  onOpenConversations,
}: {
  project: ProjectConversation;
  onlineCount: number;
  onOpenConversations?: () => void;
}) {
  const { label: statusLabel, classes: statusClasses } = getProjectStatusMeta(project.status);

  return (
    <div className="flex min-w-0 items-center justify-between gap-3 border-b border-slate-200/80 bg-white px-3 py-3 shadow-sm sm:px-4">
      <button
        type="button"
        onClick={onOpenConversations}
        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-violet-50 hover:text-violet-700 md:hidden"
        aria-label="Ouvrir les conversations"
        title="Conversations"
      >
        <Bars3Icon className="h-5 w-5" />
      </button>
      <div className="min-w-0 flex-1">
        <h2 className="truncate text-base font-semibold text-slate-900">{project.name}</h2>
        <div className="mt-1 flex min-w-0 flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Statut</span>
          <span className={`inline-flex max-w-full items-center truncate rounded-full border px-2.5 py-1 text-xs font-semibold leading-none ${statusClasses}`}>
            {statusLabel}
          </span>
        </div>
      </div>
      <div className="shrink-0">
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
