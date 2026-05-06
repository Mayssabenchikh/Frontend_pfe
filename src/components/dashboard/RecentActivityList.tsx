import type { RecentActivityDto, TableRowDto } from "../../api/dashboardService";
import { EmptyState } from "./EmptyState";
import { StatusBadge } from "./StatusBadge";
import { translateDashboardText } from "./dashboardText";

type Item = RecentActivityDto | TableRowDto;

export function RecentActivityList({ title, items }: { title: string; items?: Item[] }) {
  return (
    <article className="dashboard-card dashboard-fade-up">
      <h2 className="mb-4 text-sm font-extrabold text-slate-900">{translateDashboardText(title)}</h2>
      {items?.length ? (
        <div className="space-y-3">
          {items.slice(0, 8).map((item) => (
            <div key={`${item.id}-${item.title}`} className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3 transition hover:-translate-y-0.5 hover:border-violet-100 hover:bg-violet-50/40">
              <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-violet-400 shadow-[0_0_0_4px_rgba(167,139,250,.18)]" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-bold text-slate-800">{translateDashboardText(item.title)}</p>
                  <StatusBadge status={item.status} />
                </div>
                {"description" in item && item.description ? <p className="mt-1 text-xs leading-relaxed text-slate-500">{translateDashboardText(item.description)}</p> : null}
                {"subtitle" in item && item.subtitle ? <p className="mt-1 text-xs leading-relaxed text-slate-500">{translateDashboardText(item.subtitle)}</p> : null}
              </div>
              <span className="whitespace-nowrap text-[11px] font-bold text-slate-400">{formatDate(item.date)}</span>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title="Rien de récent" description="L'activité récente apparaîtra ici." />
      )}
    </article>
  );
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short" }).format(new Date(value));
}
