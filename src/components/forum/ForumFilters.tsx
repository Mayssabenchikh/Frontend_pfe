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
  onClear: () => void;
};

export function ForumFilters({ q, onQChange, tag, onTagChange, sort, onSortChange, onApply, onClear }: Props) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div className="relative">
          <FontAwesomeIcon
            icon={faMagnifyingGlass}
            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          />
          <input
            value={q}
            onChange={(e) => onQChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onApply()}
            placeholder="Rechercher une discussion, question, ressource…"
            className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-3 pl-11 pr-4 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-violet-400 focus:bg-white focus:ring-2 focus:ring-violet-300/30"
          />
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={onClear}
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 sm:min-w-[96px]"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={onApply}
            className="rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-violet-700 lg:min-w-[132px]"
          >
            Rechercher
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
          Tag
          <div className="relative mt-1.5">
            <FontAwesomeIcon
              icon={faTags}
              className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
            />
            <input
              value={tag}
              onChange={(e) => onTagChange(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onApply()}
              placeholder="Filtrer par tag…"
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-300/30"
            />
          </div>
        </label>

        <div className="min-w-0">
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Tri</p>
          <div className="flex max-w-full gap-1.5 overflow-x-auto pb-1">
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onSortChange(opt.value);
                  onApply();
                }}
                className={[
                  "shrink-0 rounded-lg px-3 py-2 text-xs font-semibold transition-colors",
                  sort === opt.value
                    ? "bg-violet-600 text-white shadow-sm"
                    : "bg-slate-50 text-slate-600 ring-1 ring-slate-200 hover:bg-violet-50 hover:text-violet-700",
                ].join(" ")}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
