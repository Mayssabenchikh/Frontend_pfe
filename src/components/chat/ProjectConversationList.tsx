import { MagnifyingGlassIcon } from "../../icons/heroicons/outline";
import type { ProjectConversation } from "../../types/chat";

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
    <aside className="flex h-full w-full flex-col border-r border-slate-200/80 bg-slate-50/65 backdrop-blur-sm md:w-[340px]">
      <div className="border-b border-slate-200/80 p-3">
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 shadow-sm">
          <MagnifyingGlassIcon className="h-4 w-4 text-slate-400" />
          <input
            className="h-10 w-full bg-transparent text-base text-slate-700 placeholder:text-slate-400 focus:outline-none"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Rechercher un projet"
          />
        </div>
      </div>
      <div className="flex-1 overflow-auto p-2">
        {projects.map((project) => {
          const active = project.projectUuid === activeProjectUuid;
          return (
            <button
              key={project.projectUuid}
              onClick={() => onSelect(project.projectUuid)}
              className={`mb-2 w-full rounded-2xl border px-3 py-3 text-left transition ${active ? "border-violet-200 bg-violet-50/80 shadow-sm" : "border-slate-200/90 bg-white hover:border-slate-300 hover:bg-slate-50"}`}
            >
              <p className="truncate text-base font-semibold text-slate-900">{project.name}</p>
              <p className="truncate text-sm text-slate-500">{project.priority || "Priorité non définie"}</p>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
