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
    <div className="flex flex-wrap gap-2">
      {TYPES.map((t) => {
        const active = t.id === "ALL" ? value === null : value === t.id;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id === "ALL" ? null : t.id)}
            className={[
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
              active
                ? "bg-violet-600 text-white shadow-sm"
                : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50",
            ].join(" ")}
          >
            <FontAwesomeIcon icon={t.icon} className="h-3 w-3" />
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
