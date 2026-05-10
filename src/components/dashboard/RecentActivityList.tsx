import type { RecentActivityDto, TableRowDto } from "../../api/dashboardService";
import { EmptyState } from "./EmptyState";
import { StatusBadge } from "./StatusBadge";
import { translateDashboardText } from "./dashboardText";

type Item = RecentActivityDto | TableRowDto;

export function RecentActivityList({ title, items }: { title: string; items?: Item[] }) {
  const uniqueItems = Array.from(new Map((items ?? []).slice(0, 8).map((item) => [item.id, item])).values());

  return (
    <article className="dashboard-card dashboard-fade-up">
      <h2 className="mb-4 text-base font-semibold text-slate-900">{translateDashboardText(title)}</h2>
      {uniqueItems.length ? (
        <div className="space-y-3">
          {uniqueItems.map((item) => (
            <div key={item.id} className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3 transition hover:-translate-y-0.5 hover:border-violet-100 hover:bg-violet-50/40">
              <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-violet-400 shadow-[0_0_0_4px_rgba(167,139,250,.18)]" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-slate-800">{translateDashboardText(item.title)}</p>
                  <StatusBadge status={item.status} />
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs font-medium text-slate-400">
                  {"type" in item && item.type ? <span>Type: {translateDashboardText(item.type)}</span> : null}
                  {("type" in item && item.type && item.date) ? <span>•</span> : null}
                  <span>{formatDate(item.date)}</span>
                </div>
                {"description" in item && item.description ? (
                  <p className="mt-2 text-xs leading-relaxed text-slate-600">{translateDashboardText(item.description)}</p>
                ) : null}
                {"subtitle" in item && item.subtitle ? (
                  <p className="mt-2 text-xs leading-relaxed text-slate-600">{translateDashboardText(item.subtitle)}</p>
                ) : null}
                <p className="mt-2 text-xs leading-relaxed text-slate-500">{buildActivitySummary(item)}</p>
              </div>
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
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

function buildActivitySummary(item: Item) {
  const subject = translateDashboardText(item.title);
  const status = (item.status ?? "").toLowerCase();
  const type = ("type" in item ? item.type : null) ?? "";
  const formattedDate = formatDate(item.date);

  if (type === "assignment") {
    if (status === "accepted") return `Affectation acceptée sur ${subject} (${formattedDate}).`;
    if (status === "removed") return `Affectation retirée pour ${subject} (${formattedDate}).`;
    return `Mise à jour d'affectation sur ${subject} (${formattedDate}).`;
  }

  if (type === "progress") {
    if (status === "terminé" || status === "completed") return `Progression terminée sur ${subject} (${formattedDate}).`;
    if (status === "in progress") return `Progression en cours sur ${subject} (${formattedDate}).`;
    return `Mise à jour de progression sur ${subject} (${formattedDate}).`;
  }

  if (status === "risk" || status === "risque") {
    return `Un suivi prioritaire est recommandé pour ${subject} (${formattedDate}).`;
  }

  return `Action enregistrée sur ${subject} (${formattedDate}).`;
}
