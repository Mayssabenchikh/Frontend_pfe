import { useCallback, useEffect, useState } from "react";
import { useKeycloak } from "@react-keycloak/web";
import { dashboardService, type DashboardFilters, type EmployeeDashboardDto } from "../../api/dashboardService";
import { ChartCard } from "../../components/dashboard/ChartCard";
import { DashboardKpiGrid } from "../../components/dashboard/DashboardKpiGrid";
import { DashboardFilter } from "../../components/dashboard/DashboardFilter";
import { DashboardHeader } from "../../components/dashboard/DashboardHeader";
import { DashboardLayout } from "../../components/dashboard/DashboardLayout";
import { ErrorState } from "../../components/dashboard/ErrorState";
import { LoadingState } from "../../components/dashboard/LoadingState";
import { PriorityActionsCard, type PriorityActionItem } from "../../components/dashboard/PriorityActionsCard";
import { ProgressBar } from "../../components/dashboard/ProgressBar";
import { ProjectOverviewCard } from "../../components/dashboard/ProjectOverviewCard";
import { RecentActivityList } from "../../components/dashboard/RecentActivityList";
import { StatusBadge } from "../../components/dashboard/StatusBadge";

export function EmployeeDashboard() {
  const { keycloak } = useKeycloak();
  const employeeId = keycloak.subject ?? "";
  const [data, setData] = useState<EmployeeDashboardDto | null>(null);
  const [filters, setFilters] = useState<DashboardFilters>({ period: "month" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!employeeId) {
      setLoading(false);
      setError("Identifiant employé introuvable.");
      return;
    }
    setLoading(true);
    dashboardService.getEmployeeDashboard(employeeId, filters)
      .then((res) => { setData(res.data); setError(null); })
      .catch((err) => setError(err?.response?.data?.error ?? "Erreur de chargement"))
      .finally(() => setLoading(false));
  }, [employeeId, filters]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadingState />;
  if (error) return <DashboardLayout><ErrorState message={error} onRetry={load} /></DashboardLayout>;

  const priorityItems: PriorityActionItem[] = [
    ...(data?.pendingActivities ?? []).slice(0, 2).map((row) => ({
      id: `todo-${row.id}`,
      title: row.title,
      description: row.subtitle ?? "Activité à terminer.",
      status: row.status ?? "pending",
    })),
    ...(data?.recommendedTrainings ?? []).slice(0, 2).map((row) => ({
      id: `rec-${row.id}`,
      title: row.title,
      description: row.subtitle ?? "Formation recommandée selon vos gaps.",
      status: row.status ?? "recommandé",
    })),
  ].slice(0, 4);

  return (
    <DashboardLayout>
      <DashboardHeader title="Mon tableau de bord" subtitle="Progression personnelle" actions={<DashboardFilter filters={filters} options={data?.filterOptions} onChange={setFilters} />} />
      <div className="dashboard-section-title">Vue personnelle</div>
      <DashboardKpiGrid items={data?.kpis} />
      <PriorityActionsCard title="Mes prochaines actions" items={priorityItems} />
      <article className="dashboard-card">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-extrabold text-slate-900">Progression globale</h2>
            <p className="mt-1 text-xs text-slate-500">Prochain quiz: {data?.nextQuiz?.trim() ? data.nextQuiz : "Non planifié"}</p>
          </div>
          <StatusBadge status={progressStatus(data?.globalProgress)} />
        </div>
        <div className="mt-5"><ProgressBar value={data?.globalProgress} /></div>
      </article>
      <div className="dashboard-section-title">Compétences, quiz et formation</div>
      <div className="dashboard-chart-grid dashboard-chart-grid-3">
        <ChartCard title="Compétences actuelles vs cibles" data={data?.currentVsTargetSkills} type="radar" />
        <ChartCard title="Évolution des scores quiz" data={data?.quizScoreEvolution} type="line" />
        <ChartCard title="Progression par formation" data={data?.trainingProgressByProgram} type="bar" />
        <ChartCard title="Compétences par niveau" data={data?.skillsByLevel} type="doughnut" />
      </div>
      <div className="dashboard-chart-grid">
        <RecentActivityList title="Formations recommandées" items={data?.recommendedTrainings} />
        <RecentActivityList title="Activités / exercices à faire" items={data?.pendingActivities} />
      </div>
      <div className="dashboard-chart-grid">
        <RecentActivityList title="Derniers résultats quiz" items={(data?.recentQuizResults ?? []).map((q) => ({ id: q.label, title: q.label, description: `${q.score}%`, status: q.status, date: q.date }))} />
        <RecentActivityList title="Retours récents" items={data?.feedback} />
      </div>
      <div className="dashboard-section-title">Mes projets</div>
      <ProjectOverviewCard title="Projets" data={data?.projects} mode="employee" />
    </DashboardLayout>
  );
}

function progressStatus(progress?: number | null) {
  const value = Number(progress ?? 0);
  if (value >= 100) return "terminé";
  if (value >= 70) return "en cours";
  if (value >= 40) return "à renforcer";
  return "démarrage";
}
