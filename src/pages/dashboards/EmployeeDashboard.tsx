import { useCallback, useEffect, useState } from "react";
import { useKeycloak } from "@react-keycloak/web";
import { dashboardService, type DashboardFilters, type EmployeeDashboardDto } from "../../api/dashboardService";
import { ChartCard } from "../../components/dashboard/ChartCard";
import { DashboardFilter } from "../../components/dashboard/DashboardFilter";
import { DashboardHeader } from "../../components/dashboard/DashboardHeader";
import { DashboardLayout } from "../../components/dashboard/DashboardLayout";
import { ErrorState } from "../../components/dashboard/ErrorState";
import { KpiCard } from "../../components/dashboard/KpiCard";
import { LoadingState } from "../../components/dashboard/LoadingState";
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
    if (!employeeId) return;
    setLoading(true);
    dashboardService.getEmployeeDashboard(employeeId, filters)
      .then((res) => { setData(res.data); setError(null); })
      .catch((err) => setError(err?.response?.data?.error ?? "Erreur de chargement"))
      .finally(() => setLoading(false));
  }, [employeeId, filters]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadingState />;
  if (error) return <DashboardLayout><ErrorState message={error} onRetry={load} /></DashboardLayout>;

  return (
    <DashboardLayout>
      <DashboardHeader title="Mon tableau de bord" subtitle="Progression personnelle" actions={<DashboardFilter filters={filters} options={data?.filterOptions} onChange={setFilters} />} />
      <div className="dashboard-kpi-grid">{(data?.kpis ?? []).slice(0, 4).map((item) => <KpiCard key={item.key} item={item} />)}</div>
      <article className="dashboard-card">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-extrabold text-slate-900">Progression globale</h2>
            <p className="mt-1 text-xs text-slate-500">Prochain quiz: {data?.nextQuiz}</p>
          </div>
          <StatusBadge status="en cours" />
        </div>
        <div className="mt-5"><ProgressBar value={data?.globalProgress} /></div>
      </article>
      <div className="dashboard-chart-grid">
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
      <ProjectOverviewCard title="Projets" data={data?.projects} mode="employee" />
    </DashboardLayout>
  );
}
