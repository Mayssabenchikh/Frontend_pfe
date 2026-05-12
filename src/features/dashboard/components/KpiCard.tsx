import type { DashboardKpi } from "../types/dashboard";
import { formatNumber } from "../utils/format";

const toneClasses: Record<string, string> = {
  violet: "border-violet-100 bg-violet-50/70 text-violet-700",
  blue: "border-blue-100 bg-blue-50/70 text-blue-700",
  green: "border-emerald-100 bg-emerald-50/70 text-emerald-700",
  orange: "border-amber-100 bg-amber-50/70 text-amber-700",
  red: "border-rose-100 bg-rose-50/70 text-rose-700",
  cyan: "border-cyan-100 bg-cyan-50/70 text-cyan-700",
  indigo: "border-indigo-100 bg-indigo-50/70 text-indigo-700",
  gray: "border-slate-100 bg-slate-50 text-slate-600",
};

export function KpiCard({ kpi }: { kpi: DashboardKpi }) {
  const tone = toneClasses[kpi.tone ?? "violet"] ?? toneClasses.violet;

  return (
    <article className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm shadow-slate-200/60">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold uppercase tracking-wide text-slate-500">{kpi.label}</p>
          <p className="mt-3 text-3xl font-bold tracking-tight text-slate-950">{formatNumber(kpi.value, kpi.unit)}</p>
          {kpi.description ? <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-slate-500">{kpi.description}</p> : null}
        </div>
        <span className={`mt-1 h-10 w-10 shrink-0 rounded-xl border ${tone}`} />
      </div>
    </article>
  );
}
