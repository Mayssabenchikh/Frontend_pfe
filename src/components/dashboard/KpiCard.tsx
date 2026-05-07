import { useEffect, useState, type ReactNode } from "react";
import type { KpiCardDto } from "../../api/dashboardService";
import { translateDashboardText } from "./dashboardText";
import { ExplanationTooltip } from "./ExplanationTooltip";
import type { ExplanationContent } from "./dashboardExplanations";

const colorClasses: Record<string, string> = {
  violet: "from-violet-400 to-indigo-400 text-violet-600 bg-violet-50 border-violet-100",
  blue: "from-blue-600 to-cyan-500 text-blue-700 bg-blue-50 border-blue-200",
  green: "from-emerald-600 to-green-500 text-emerald-700 bg-emerald-50 border-emerald-200",
  orange: "from-orange-500 to-amber-500 text-orange-700 bg-orange-50 border-orange-200",
  red: "from-rose-500 to-red-500 text-rose-700 bg-rose-50 border-rose-200",
  gray: "from-slate-500 to-slate-400 text-slate-600 bg-slate-50 border-slate-200",
};

export function KpiCard({ item, icon, explanation }: { item: KpiCardDto; icon?: ReactNode; explanation?: ExplanationContent | null }) {
  const classes = colorClasses[item.color ?? "violet"] ?? colorClasses.violet;
  const numericValue = Number(item.value ?? 0);
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion || numericValue <= 0) {
      setDisplayValue(numericValue);
      return;
    }
    let frame = 0;
    const totalFrames = 28;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / 720);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(numericValue * eased));
      frame += 1;
      if (progress < 1 && frame < totalFrames + 6) requestAnimationFrame(tick);
    };
    const id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [numericValue]);

  return (
    <article className={`dashboard-kpi-card ${classes}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1">
            <p className="truncate text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-500">{translateDashboardText(item.label)}</p>
            <ExplanationTooltip explanation={explanation ?? null} position="top" />
          </div>
          <div className="mt-3 flex items-end gap-1">
            <span className="text-3xl font-extrabold leading-none text-slate-950 tabular-nums">{displayValue}</span>
            {item.unit ? <span className="pb-0.5 text-sm font-bold text-slate-500">{item.unit}</span> : null}
          </div>
          {item.description ? <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-slate-500">{translateDashboardText(item.description)}</p> : null}
        </div>
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border bg-gradient-to-br text-white shadow-lg ${classes}`}>
          {icon ?? <span className="h-2.5 w-2.5 rounded-full bg-white" />}
        </div>
      </div>
    </article>
  );
}
