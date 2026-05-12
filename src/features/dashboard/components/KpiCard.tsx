import type { DashboardKpi } from "../types/dashboard";
import { formatNumber } from "../utils/format";

const toneClasses: Record<
  string,
  { card: string; orb: string; ring: string }
> = {
  violet: {
    card: "from-violet-50/80 via-white to-white",
    orb: "from-violet-200/80 to-fuchsia-200/70",
    ring: "ring-violet-200/50",
  },
  blue: {
    card: "from-sky-50/80 via-white to-white",
    orb: "from-sky-200/80 to-indigo-200/70",
    ring: "ring-sky-200/50",
  },
  green: {
    card: "from-emerald-50/80 via-white to-white",
    orb: "from-emerald-200/80 to-lime-200/70",
    ring: "ring-emerald-200/50",
  },
  orange: {
    card: "from-amber-50/80 via-white to-white",
    orb: "from-amber-200/80 to-orange-200/70",
    ring: "ring-amber-200/50",
  },
  red: {
    card: "from-rose-50/80 via-white to-white",
    orb: "from-rose-200/80 to-pink-200/70",
    ring: "ring-rose-200/50",
  },
  cyan: {
    card: "from-cyan-50/80 via-white to-white",
    orb: "from-cyan-200/80 to-teal-200/70",
    ring: "ring-cyan-200/50",
  },
  indigo: {
    card: "from-indigo-50/80 via-white to-white",
    orb: "from-indigo-200/80 to-violet-200/70",
    ring: "ring-indigo-200/50",
  },
  gray: {
    card: "from-slate-50/80 via-white to-white",
    orb: "from-slate-200/70 to-slate-100/70",
    ring: "ring-slate-200/50",
  },
};

export function KpiCard({ kpi }: { kpi: DashboardKpi }) {
  const tone = toneClasses[kpi.tone ?? "violet"] ?? toneClasses.violet;

  return (
    <article className={`relative overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-br ${tone.card} p-4 shadow-[0_10px_30px_-20px_rgba(15,23,42,0.45)]`}
    >
      <span className={`pointer-events-none absolute -right-6 -top-8 h-24 w-24 rounded-full bg-gradient-to-br ${tone.orb} blur-2xl`} />
      <span className={`pointer-events-none absolute -left-10 -bottom-10 h-24 w-24 rounded-full bg-gradient-to-br ${tone.orb} opacity-60 blur-3xl`} />
      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold uppercase tracking-wide text-slate-500">{kpi.label}</p>
          <p className="mt-3 text-3xl font-bold tracking-tight text-slate-950">{formatNumber(kpi.value, kpi.unit)}</p>
          {kpi.description ? <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-slate-500">{kpi.description}</p> : null}
        </div>
        <span className={`mt-1 h-11 w-11 shrink-0 rounded-2xl bg-gradient-to-br ${tone.orb} ring-1 ${tone.ring}`} />
      </div>
    </article>
  );
}
