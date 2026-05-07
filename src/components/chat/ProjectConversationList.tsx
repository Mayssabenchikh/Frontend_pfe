import { MagnifyingGlassIcon } from "../../icons/heroicons/outline";
import type { ProjectConversation } from "../../types/chat";

function priorityMeta(priority: string | null) {
  const normalized = priority?.trim().toUpperCase();
  if (!normalized) {
    return {
      label: "Priorité non définie",
      tone: "bg-slate-100 text-slate-600 ring-slate-200",
      hint: "Aucun niveau renseigné",
    };
  }

  if (["HIGH", "HAUTE", "URGENT", "URGENTE", "CRITICAL", "CRITIQUE"].includes(normalized)) {
    return {
      label: "Priorité haute",
      tone: "bg-rose-100 text-rose-700 ring-rose-200",
      hint: "À traiter en premier",
    };
  }

  if (["LOW", "FAIBLE", "BASSE"].includes(normalized)) {
    return {
      label: "Priorité faible",
      tone: "bg-emerald-100 text-emerald-700 ring-emerald-200",
      hint: "Peut attendre",
    };
  }

  return {
    label: "Priorité normale",
    tone: "bg-amber-100 text-amber-800 ring-amber-200",
    hint: "À traiter prochainement",
  };
}

export function ProjectConversationList({
  projects,
  activeProjectUuid,
  query,
  onQueryChange,
  onSelect,
}: {
  projects: ProjectConversation[];
  activeProjectUuid: string | null;
  query: string;
  onQueryChange: (q: string) => void;
  onSelect: (projectUuid: string) => void;
}) {
  return (
    <aside className="flex h-full w-full flex-col border-r border-slate-200/80 bg-gradient-to-b from-slate-50/90 via-white to-violet-50/40 backdrop-blur-sm md:w-[360px]">
      <div className="border-b border-slate-200/80 px-3 py-3">
        <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 shadow-[0_10px_28px_rgba(15,23,42,0.06)] transition focus-within:border-violet-200 focus-within:ring-2 focus-within:ring-violet-100">
          <MagnifyingGlassIcon className="h-4 w-4 text-slate-400" />
          <input
            className="h-11 w-full bg-transparent text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Rechercher un projet"
          />
        </div>
        <p className="mt-2 px-1 text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">
          Projets accessibles au chat
        </p>
      </div>
      <div className="flex-1 overflow-auto px-2 py-3">
        {projects.map((project) => {
          const active = project.projectUuid === activeProjectUuid;
          const priority = priorityMeta(project.priority);
          return (
            <button
              key={project.projectUuid}
              onClick={() => onSelect(project.projectUuid)}
              className={`group mb-2 w-full rounded-2xl border px-3 py-3 text-left transition-all duration-200 ${active ? "border-violet-200 bg-gradient-to-br from-violet-50 to-white shadow-[0_12px_24px_rgba(124,58,237,0.10)]" : "border-slate-200/90 bg-white hover:-translate-y-0.5 hover:border-violet-100 hover:bg-violet-50/40 hover:shadow-[0_10px_20px_rgba(15,23,42,0.06)]"}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-semibold leading-6 text-slate-900">
                    {project.name}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">
                    Cliquez pour ouvrir la conversation du projet.
                  </p>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${priority.tone}`}>
                  {priority.label}
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between gap-2">
                <p className="truncate text-xs font-medium text-slate-500">
                  {priority.hint}
                </p>
                <span className={`h-2.5 w-2.5 rounded-full ${active ? "bg-violet-500" : "bg-slate-300 group-hover:bg-violet-400"}`} />
              </div>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
