import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faLayerGroup,
  faCircleQuestion,
  faBookOpen,
  faComments,
  faGraduationCap,
  faBullhorn,
} from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/free-solid-svg-icons";
import type { ForumPostType } from "../../types/forum";

const TYPES: { id: ForumPostType | "ALL"; label: string; icon: IconDefinition }[] = [
  { id: "ALL", label: "Tous", icon: faLayerGroup },
  { id: "QUESTION", label: "Questions", icon: faCircleQuestion },
  { id: "RESOURCE", label: "Ressources", icon: faBookOpen },
  { id: "DISCUSSION", label: "Discussions", icon: faComments },
  { id: "TRAINING_FEEDBACK", label: "Retours formation", icon: faGraduationCap },
  { id: "ANNOUNCEMENT", label: "Annonces", icon: faBullhorn },
];

type Props = {
  value: ForumPostType | null;
  onChange: (t: ForumPostType | null) => void;
};

export function ForumCategoryTabs({ value, onChange }: Props) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500">Types de contenu</h2>
          <p className="mt-1 text-xs text-slate-500">Affinez le fil par nature de publication.</p>
        </div>
      </div>
      <div className="flex max-w-full gap-2 overflow-x-auto pb-1">
      {TYPES.map((t) => {
        const active = t.id === "ALL" ? value === null : value === t.id;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id === "ALL" ? null : t.id)}
            className={[
              "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
              active
                ? "bg-violet-600 text-white shadow-sm"
                : "bg-slate-50 text-slate-600 ring-1 ring-slate-200 hover:bg-violet-50 hover:text-violet-700",
            ].join(" ")}
          >
            <FontAwesomeIcon icon={t.icon} className="h-3 w-3" />
            {t.label}
          </button>
        );
      })}
      </div>
    </div>
  );
}
