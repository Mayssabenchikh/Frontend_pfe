import type React from "react";
import { useId, useState } from "react";
import { FunnelIcon, ArrowPathIcon, ChevronUpIcon, ChevronDownIcon } from "../icons/heroicons/outline";

type Props = {
  title?: string;
  resultsLabel?: string;
  onReset?: () => void;
  defaultOpen?: boolean;
  rightSlot?: React.ReactNode;
  children: React.ReactNode;
};

export function FiltersPanel({
  title = "Filtres",
  resultsLabel,
  onReset,
  defaultOpen = true,
  rightSlot,
  children,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const regionId = useId();

  return (
    <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls={regionId}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600">
            <FunnelIcon className="h-4 w-4" />
          </span>
          {title}
          {open ? <ChevronUpIcon className="h-4 w-4 text-slate-400" /> : <ChevronDownIcon className="h-4 w-4 text-slate-400" />}
        </button>

        <div className="ml-auto flex items-center gap-2">
          {resultsLabel ? (
            <span className="rounded-full border border-violet-500/15 bg-violet-500/10 px-3 py-1.5 text-xs font-semibold text-violet-800">
              {resultsLabel}
            </span>
          ) : null}

          {rightSlot}

          {onReset ? (
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              title="Réinitialiser"
            >
              <ArrowPathIcon className="h-4 w-4" />
              Réinitialiser
            </button>
          ) : null}
        </div>
      </div>

      {open ? (
        <div id={regionId} className="border-t border-slate-100 px-4 pb-4 pt-3">
          {children}
        </div>
      ) : null}
    </div>
  );
}

