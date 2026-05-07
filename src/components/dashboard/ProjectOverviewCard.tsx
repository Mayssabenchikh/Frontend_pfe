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
  const isAdmin = mode === "admin";
  const isManager = mode === "manager";
  const isEmployee = mode === "employee";
  const isTraining = mode === "training";
  const showOperationalProjects = isAdmin || isManager || isEmployee;
  const showSkillDemand = isAdmin || isManager || isTraining;
  const showCoverageChart = isAdmin || isManager || isEmployee;
  const showStatusChart = isAdmin || isManager;
  const showEvolutionChart = isAdmin;
  const kpiPriority: Record<typeof mode, string[]> = {
    admin: ["projectsTotal", "projectsActive", "projectsCompleted", "coverage"],
    manager: ["projectsTotal", "projectsActive", "projectsWithGaps", "coverage"],
    employee: ["projectsTotal", "projectsActive", "coverage"],
    training: ["projectTrainings", "trainingNeeds", "projectsWithGaps", "coverage"],
  };
  const selectedKpis = selectKpis(data.kpis ?? [], kpiPriority[mode], isEmployee ? 3 : 4);
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
  const projectStatusCounts = data.projectStatusCounts ?? [];

  return (
    <section className="dashboard-project-section dashboard-fade-up">
      {title ? <div className="dashboard-section-title">{translateDashboardText(title)}</div> : null}

      {selectedKpis.length ? (
        <div className="dashboard-project-kpi-grid">
          {selectedKpis.map((item) => (
            <KpiCard key={item.key} item={{ ...item, trend: null }} />
          ))}
        </div>
      ) : null}

      <div className="dashboard-chart-grid">
        {showEvolutionChart ? (
          <ChartCard
            title="Évolution des projets"
            data={data.projectsEvolution}
            type="line"
            xAxisTitle="Mois"
            yAxisTitle="Nombre de projets"
          />
        ) : null}
        {showStatusChart ? (
          <article className="dashboard-card dashboard-fade-up">
            <h2 className="mb-4 text-sm font-extrabold text-slate-900">Nombre de projets par statut</h2>
            {projectStatusCounts.length ? (
              <div className="space-y-2">
                {projectStatusCounts.map((item) => (
                  <div key={item.status} className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/70 px-3 py-2">
                    <span className="text-sm font-semibold text-slate-700">{translateDashboardText(item.status)}</span>
                    <span className="text-sm font-extrabold tabular-nums text-slate-900">{item.count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="Aucun statut" description="Les statuts projets apparaîtront ici." />
            )}
          </article>
        ) : null}
        {isAdmin ? (
          <ChartCard
            title="Projets par responsable"
            data={data.projectsByManager}
            type="horizontalBar"
            xAxisTitle="Nombre de projets"
            yAxisTitle="Responsables"
          />
        ) : null}
        {showSkillDemand ? (
          <ChartCard
            title={isTraining ? "Compétences projet à couvrir" : "Compétences projet demandées"}
            data={data.projectSkillsDemand}
            type="bar"
            xAxisTitle="Compétences"
            yAxisTitle="Nombre de projets"
          />
        ) : null}
        {showCoverageChart ? (
          <ChartCard
            title={isEmployee ? "Couverture de mes projets" : "Couverture par projet"}
            data={data.projectCoverage}
            type="horizontalBar"
            xAxisTitle="Couverture (%)"
            yAxisTitle="Projets"
          />
        ) : null}
      </div>

      <div className="dashboard-chart-grid">
        {showOperationalProjects ? (
          <article className="dashboard-card">
            <h3 className="mb-4 text-sm font-extrabold text-slate-900">{isEmployee ? "Mes projets affectés" : "Détails des projets (statut et avancement)"}</h3>
            {data.projects?.length ? (
              <div className="space-y-3">
                {data.projects.slice(0, isEmployee ? 4 : 6).map((project) => (
                  <div key={project.projectId} className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 transition hover:border-violet-100 hover:bg-violet-50/40">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-slate-800">{project.projectName}</p>
                        <p className="text-xs text-slate-500">{project.assignedEmployees} employé(s) affecté(s)</p>
                      </div>
                      <StatusBadge status={project.status} />
                    </div>
                    <ProgressBar value={project.progress} label="Avancement du projet" />
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="Aucun projet" description={isEmployee ? "Vos projets affectés apparaîtront ici." : "Les projets liés au rôle apparaîtront ici."} />
            )}
          </article>
        ) : null}

        <article className="dashboard-card">
          <h3 className="mb-4 text-sm font-extrabold text-slate-900">{isTraining ? "Besoins de formation prioritaires" : "Écarts critiques"}</h3>
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
            <EmptyState title="Aucun écart critique" description={isTraining ? "Aucun besoin de formation prioritaire n'est détecté depuis les projets." : "La couverture projet est suffisante sur ce périmètre."} />
          )}
        </article>
      </div>

      <div className="dashboard-chart-grid">
        <RecentActivityList title={isTraining ? "Actions formation suggérées" : "Recommandations liées aux projets"} items={recommendationItems} />
        {showOperationalProjects ? <RecentActivityList title={isEmployee ? "Mes projets récents" : "Projets récents"} items={projectItems} /> : null}
      </div>
    </section>
  );
}

function selectKpis<T extends { key: string }>(items: T[], priority: string[], limit: number) {
  const byKey = new Map(items.map((item) => [item.key, item]));
  const selected = priority.map((key) => byKey.get(key)).filter((item): item is T => Boolean(item));
  const selectedKeys = new Set(selected.map((item) => item.key));
  const fallback = items.filter((item) => !selectedKeys.has(item.key));
  return [...selected, ...fallback].slice(0, limit);
}
