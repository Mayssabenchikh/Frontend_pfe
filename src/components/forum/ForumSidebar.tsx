import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faGraduationCap,
  faBookOpen,
  faCircleQuestion,
  faBullseye,
  faBriefcase,
  faComments,
  faBullhorn,
  faLayerGroup,
} from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/free-solid-svg-icons";
import type { ForumCategoryDto } from "../../types/forum";

type Props = {
  categories: ForumCategoryDto[];
  selectedUuid: string | null;
  onSelectCategory: (uuid: string | null) => void;
};

function getCategoryIcon(name: string): IconDefinition {
  const n = name.toLowerCase();
  if (n.includes("formation") || n.includes("training")) return faGraduationCap;
  if (n.includes("ressource")) return faBookOpen;
  if (n.includes("question") || n.includes("technique")) return faCircleQuestion;
  if (n.includes("compétence") || n.includes("competence")) return faBullseye;
  if (n.includes("projet") || n.includes("project")) return faBriefcase;
  if (n.includes("discussion") || n.includes("général") || n.includes("general")) return faComments;
  if (n.includes("annonce") || n.includes("announcement")) return faBullhorn;
  return faLayerGroup;
}

function getCategoryColor(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("formation") || n.includes("training")) return "text-violet-600";
  if (n.includes("ressource")) return "text-blue-600";
  if (n.includes("question") || n.includes("technique")) return "text-amber-600";
  if (n.includes("compétence") || n.includes("competence")) return "text-emerald-600";
  if (n.includes("projet") || n.includes("project")) return "text-indigo-600";
  if (n.includes("discussion") || n.includes("général") || n.includes("general")) return "text-slate-600";
  if (n.includes("annonce") || n.includes("announcement")) return "text-rose-500";
  return "text-slate-500";
}

export function ForumSidebar({ categories, selectedUuid, onSelectCategory }: Props) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-4 py-3">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500">Catégories</h2>
      </div>
      <ul className="flex flex-col p-2">
        <li>
          <button
            type="button"
            onClick={() => onSelectCategory(null)}
            className={[
              "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors",
              selectedUuid === null
                ? "bg-violet-50 text-violet-900 ring-1 ring-violet-200"
                : "text-slate-600 hover:bg-slate-50",
            ].join(" ")}
          >
            <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${selectedUuid === null ? "bg-violet-100" : "bg-slate-100"}`}>
              <FontAwesomeIcon icon={faLayerGroup} className={`h-3.5 w-3.5 ${selectedUuid === null ? "text-violet-600" : "text-slate-500"}`} />
            </span>
            <span>Toutes les catégories</span>
          </button>
        </li>
        {categories.map((c) => {
          const icon = getCategoryIcon(c.name);
          const iconColor = getCategoryColor(c.name);
          const active = selectedUuid === c.uuid;
          return (
            <li key={c.uuid}>
              <button
                type="button"
                onClick={() => onSelectCategory(c.uuid)}
                className={[
                  "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors",
                  active
                    ? "bg-violet-50 text-violet-900 ring-1 ring-violet-200"
                    : "text-slate-600 hover:bg-slate-50",
                ].join(" ")}
              >
                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${active ? "bg-violet-100" : "bg-slate-100"}`}>
                  <FontAwesomeIcon
                    icon={icon}
                    className={`h-3.5 w-3.5 ${active ? "text-violet-600" : iconColor}`}
                  />
                </span>
                <span className="min-w-0 truncate">{c.name}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
