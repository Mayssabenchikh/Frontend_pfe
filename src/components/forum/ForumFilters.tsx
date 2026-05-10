import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass, faTags } from "@fortawesome/free-solid-svg-icons";
import type { ForumPostsSort } from "../../types/forum";

const SORT_OPTIONS: { value: ForumPostsSort; label: string }[] = [
  { value: "new", label: "Récent" },
  { value: "top", label: "Top score" },
  { value: "popular", label: "Populaire" },
  { value: "hot", label: "Tendance" },
];

type Props = {
  q: string;
  onQChange: (v: string) => void;
  tag: string;
  onTagChange: (v: string) => void;
  sort: ForumPostsSort;
  onSortChange: (s: ForumPostsSort) => void;
  onApply: () => void;
};

export function ForumFilters({ q, onQChange, tag, onTagChange, sort, onSortChange, onApply }: Props) {
  return (
    <div className="space-y-3">
      {/* Search bar */}
      <div className="relative">
        <FontAwesomeIcon
          icon={faMagnifyingGlass}
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
        />
        <input
          value={q}
          onChange={(e) => onQChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onApply()}
          placeholder="Rechercher une discussion, question, ressource…"
          className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-800 placeholder:text-slate-400 shadow-sm outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-300/30"
        />
      </div>

      {/* Tag + Sort + Apply */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[160px] flex-1">
          <FontAwesomeIcon
            icon={faTags}
            className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
          />
          <input
            value={tag}
            onChange={(e) => onTagChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onApply()}
            placeholder="Filtrer par tag…"
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-800 placeholder:text-slate-400 shadow-sm outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-300/30"
          />
        </div>

        {/* Sort pills */}
        <div className="flex gap-1.5">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onSortChange(opt.value); onApply(); }}
              className={[
                "rounded-lg px-3 py-2 text-xs font-medium transition-colors",
                sort === opt.value
                  ? "bg-violet-600 text-white shadow-sm"
                  : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50",
              ].join(" ")}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={onApply}
          className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-violet-700 transition-colors"
        >
          Rechercher
        </button>
      </div>
    </div>
  );
}
