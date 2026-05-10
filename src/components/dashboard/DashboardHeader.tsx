import type { ReactNode } from "react";
import { translateDashboardText } from "./dashboardText";

export function DashboardHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle: string;
  actions?: ReactNode;
}) {
  return (
    <div className="dashboard-header">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-violet-500">Analyse Skillify</p>
        <h1 className="mt-2 text-2xl font-bold tracking-normal text-slate-950 sm:text-3xl">{translateDashboardText(title)}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">{translateDashboardText(subtitle)}</p>
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
