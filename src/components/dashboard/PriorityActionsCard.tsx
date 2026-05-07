import { EmptyState } from "./EmptyState";
import { StatusBadge } from "./StatusBadge";
import { translateDashboardText } from "./dashboardText";

export type PriorityActionItem = {
  id: string;
  title: string;
  description?: string | null;
  status?: string | null;
};

export function PriorityActionsCard({ title = "Actions prioritaires", items }: { title?: string; items?: PriorityActionItem[] }) {
  const rows = (items ?? []).slice(0, 6);

  return (
    <article className="dashboard-card dashboard-fade-up">
      <h2 className="mb-4 text-sm font-extrabold text-slate-900">{translateDashboardText(title)}</h2>
      {rows.length ? (
        <div className="space-y-3">
          {rows.map((item) => (
            <div key={item.id} className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
              <div className="flex items-start justify-between gap-2">
                <p className="font-bold text-slate-800">{translateDashboardText(item.title)}</p>
                <StatusBadge status={item.status} />
              </div>
              {item.description ? <p className="mt-1 text-xs text-slate-500">{translateDashboardText(item.description)}</p> : null}
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title="Aucune action prioritaire" description="Les prochaines actions à lancer apparaîtront ici." />
      )}
    </article>
  );
}

