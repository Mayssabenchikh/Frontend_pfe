import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronLeft, faChevronRight } from "@fortawesome/free-solid-svg-icons";

type Props = {
  page: number;
  totalPages: number;
  pageSize?: number;
  disabled?: boolean;
  summary?: string;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
};

const PAGE_SIZE_OPTIONS = [10, 15, 20, 30];

function visiblePages(current: number, total: number): Array<number | "..."> {
  const pages = new Set<number>([0, total - 1]);
  for (let i = current - 2; i <= current + 2; i += 1) {
    if (i > 0 && i < total - 1) pages.add(i);
  }
  const sorted = Array.from(pages).sort((a, b) => a - b);
  const result: Array<number | "..."> = [];
  sorted.forEach((p, index) => {
    result.push(p);
    if (index < sorted.length - 1 && sorted[index + 1] > p + 1) result.push("...");
  });
  return result;
}

export function ForumPagination({ page, totalPages, pageSize, disabled = false, summary, onPageChange, onPageSizeChange }: Props) {
  const displayTotalPages = Math.max(1, totalPages);
  const safePage = Math.min(Math.max(0, page), displayTotalPages - 1);

  const previousDisabled = disabled || safePage <= 0 || displayTotalPages <= 1;
  const nextDisabled = disabled || safePage >= displayTotalPages - 1 || displayTotalPages <= 1;

  return (
    <div className="mt-4 mb-2 flex shrink-0 flex-col gap-3 border-t border-violet-500/10 bg-white px-3.5 pb-2 pt-1.5 shadow-[0_-8px_18px_rgba(109,40,217,0.035)] sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-sm text-slate-400">
          Page {safePage + 1} sur {displayTotalPages}
          {summary ? <span className="ml-2 text-slate-400">{summary}</span> : null}
        </p>
        {pageSize && onPageSizeChange ? (
          <label className="flex items-center gap-2 text-sm font-medium text-slate-500">
            Afficher
            <select
              value={pageSize}
              disabled={disabled}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 shadow-sm outline-none transition focus:border-violet-300 focus:ring-2 focus:ring-violet-300 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
            par page
          </label>
        ) : null}
      </div>

      <div className="flex max-w-full items-center gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(0, safePage - 1))}
          disabled={previousDisabled}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-500 shadow-sm transition-all duration-150 hover:border-violet-300 hover:text-violet-600 focus:outline-none focus:ring-2 focus:ring-violet-300 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:text-slate-500"
        >
          <FontAwesomeIcon icon={faChevronLeft} className="h-4 w-4" />
          Précédent
        </button>

        <div className="flex items-center gap-2 px-0.5">
          {visiblePages(safePage, displayTotalPages).map((item, index) =>
            item === "..." ? (
              <span key={`forum-page-sep-${index}`} className="px-1 text-sm font-semibold text-slate-400">
                …
              </span>
            ) : (
              <button
                key={`forum-page-${item}`}
                type="button"
                onClick={() => onPageChange(item)}
                disabled={disabled}
                aria-current={item === safePage ? "page" : undefined}
                className={[
                  "inline-flex h-9 min-w-9 items-center justify-center rounded-[14px] border px-2.5 text-sm font-bold transition-colors",
                  item === safePage
                    ? "border-violet-700 bg-violet-700 text-white"
                    : "border-[#E6E6F0] bg-white text-slate-600 hover:border-violet-300 hover:text-violet-700",
                  disabled ? "cursor-not-allowed opacity-45" : "",
                ].join(" ")}
                title={`Aller à la page ${item + 1}`}
              >
                {item + 1}
              </button>
            ),
          )}
        </div>

        <button
          type="button"
          onClick={() => onPageChange(Math.min(displayTotalPages - 1, safePage + 1))}
          disabled={nextDisabled}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(124,58,237,0.35)] transition-all duration-150 active:scale-[0.97] focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Suivant
          <FontAwesomeIcon icon={faChevronRight} className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
