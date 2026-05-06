import type { ProjectDashboardDto } from "../../api/dashboardService";
import { ChartCard } from "./ChartCard";
import { EmptyState } from "./EmptyState";
import { KpiCard } from "./KpiCard";
import { ProgressBar } from "./ProgressBar";
import { RecentActivityList } from "./RecentActivityList";
import { StatusBadge } from "./StatusBadge";
import { translateDashboardText } from "./dashboardText";

export function ProjectOverviewCard({ title, data, mode = "admin" }: { title?: string; data?: ProjectDashboardDto; mode?: "admin" | "manager" | "employee" | "training" }) {
  if (!data) return null;
  const showManagerChart = mode === "admin";
  const projectItems = (data.projects ?? []).map((project) => ({
    id: project.projectId,
    title: project.projectName,
    subtitle: `${project.assignedEmployees} employé${project.assignedEmployees > 1 ? "s" : ""} affecté${project.assignedEmployees > 1 ? "s" : ""}`,
    status: project.status,
    primaryValue: project.progress,
    date: project.date,
  }));
  const recommendationItems = (data.recommendations ?? []).map((item) => ({
    id: `${item.projectId}-${item.title}`,
    title: item.title,
    description: item.description,
    status: item.status,
    date: null,
  }));

  return (
    <section className="dashboard-project-section dashboard-fade-up">
      {title ? <div className="dashboard-section-title">{translateDashboardText(title)}</div> : null}

      <div className="dashboard-project-kpi-grid">
        {(data.kpis ?? []).slice(0, 4).map((item) => (
          <KpiCard key={item.key} item={{ ...item, trend: null }} />
        ))}
      </div>

      <div className="dashboard-chart-grid">
        <ChartCard title="Évolution des projets" data={data.projectsEvolution} type="line" />
        <ChartCard title="Répartition par statut" data={data.projectsByStatus} type="doughnut" />
        {showManagerChart ? <ChartCard title="Projets par responsable" data={data.projectsByManager} type="horizontalBar" /> : null}
        <ChartCard title="Compétences projet demandées" data={data.projectSkillsDemand} type="bar" />
        <ChartCard title="Couverture par projet" data={data.projectCoverage} type="horizontalBar" />
      </div>

      <div className="dashboard-chart-grid">
        <article className="dashboard-card">
          <h3 className="mb-4 text-sm font-extrabold text-slate-900">Projets et couverture</h3>
          {data.projects?.length ? (
            <div className="space-y-3">
              {data.projects.slice(0, 6).map((project) => (
                <div key={project.projectId} className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 transition hover:border-violet-100 hover:bg-violet-50/40">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-slate-800">{project.projectName}</p>
                      <p className="text-xs text-slate-500">{project.assignedEmployees} employé(s) affecté(s)</p>
                    </div>
                    <StatusBadge status={project.status} />
                  </div>
                  <ProgressBar value={project.progress} />
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="Aucun projet" description="Les projets liés au rôle apparaîtront ici." />
          )}
        </article>

        <article className="dashboard-card">
          <h3 className="mb-4 text-sm font-extrabold text-slate-900">Écarts critiques</h3>
          {data.criticalSkillGaps?.length ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-400">
                    <th className="px-3 py-3">Projet</th>
                    <th className="px-3 py-3">Compétence</th>
                    <th className="px-3 py-3">Niveau</th>
                    <th className="px-3 py-3">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {data.criticalSkillGaps.slice(0, 6).map((gap) => (
                    <tr key={`${gap.projectId}-${gap.skillName}`} className="border-b border-slate-50 transition hover:bg-violet-50/50">
                      <td className="px-3 py-3 font-bold text-slate-800">{gap.projectName}</td>
                      <td className="px-3 py-3 text-slate-600">{gap.skillName}</td>
                      <td className="px-3 py-3 text-xs font-bold text-slate-500">{gap.bestAvailableLevel}/{gap.requiredLevel}</td>
                      <td className="px-3 py-3"><StatusBadge status={gap.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="Aucun gap critique" description="La couverture projet est suffisante sur ce périmètre." />
          )}
        </article>
      </div>

      <div className="dashboard-chart-grid">
        <RecentActivityList title="Recommandations liées aux projets" items={recommendationItems} />
        <RecentActivityList title="Projets récents" items={projectItems} />
      </div>
    </section>
  );
}
