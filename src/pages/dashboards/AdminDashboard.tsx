import { useCallback, useEffect, useState } from "react";
import { dashboardService, type AdminDashboardDto, type DashboardFilters } from "../../api/dashboardService";
import { ChartCard } from "../../components/dashboard/ChartCard";
import { DashboardFilter } from "../../components/dashboard/DashboardFilter";
import { DashboardHeader } from "../../components/dashboard/DashboardHeader";
import { DashboardLayout } from "../../components/dashboard/DashboardLayout";
import { DataTable } from "../../components/dashboard/DataTable";
import { ErrorState } from "../../components/dashboard/ErrorState";
import { KpiCard } from "../../components/dashboard/KpiCard";
import { LoadingState } from "../../components/dashboard/LoadingState";
import { ProjectOverviewCard } from "../../components/dashboard/ProjectOverviewCard";
import { RecentActivityList } from "../../components/dashboard/RecentActivityList";

export function AdminDashboard() {
  const [data, setData] = useState<AdminDashboardDto | null>(null);
  const [filters, setFilters] = useState<DashboardFilters>({ period: "month" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    dashboardService.getAdminDashboard(filters)
      .then((res) => { setData(res.data); setError(null); })
      .catch((err) => setError(err?.response?.data?.error ?? "Erreur de chargement"))
      .finally(() => setLoading(false));
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadingState />;
  if (error) return <DashboardLayout><ErrorState message={error} onRetry={load} /></DashboardLayout>;

  return (
    <DashboardLayout>
      <DashboardHeader title="Tableau de bord admin" subtitle="Vue globale de la plateforme" actions={<DashboardFilter filters={filters} options={data?.filterOptions} onChange={setFilters} extraStatus />} />
      <div className="dashboard-kpi-grid">{(data?.kpis ?? []).slice(0, 4).map((item) => <KpiCard key={item.key} item={item} />)}</div>

      <div className="dashboard-chart-grid">
        <ChartCard title="Évolution des employés" subtitle="Ajouts par mois" data={data?.employeesEvolution} type="line" />
        <ChartCard title="Répartition utilisateurs" subtitle="Distribution par rôle" data={data?.usersByRole} type="doughnut" />
      </div>

      <div className="dashboard-section-title">Compétences et formations</div>
      <div className="dashboard-chart-grid">
        <ChartCard title="Compétences les plus demandées" data={data?.topSkills} type="bar" />
        <ChartCard title="Formations les plus suivies" data={data?.topTrainings} type="horizontalBar" />
      </div>

      <div className="dashboard-section-title">Performance des quiz</div>
      <ChartCard title="Taux de réussite quiz par mois" data={data?.quizSuccessByMonth} type="line" />

      <div className="dashboard-chart-grid">
        <DataTable title="Derniers employés ajoutés" rows={data?.latestEmployees} valueLabel="Niveau" />
        <DataTable title="Dernières formations créées" rows={data?.latestTrainings} valueLabel="Modules" />
      </div>
      <ProjectOverviewCard title="Projets" data={data?.projects} mode="admin" />
      <RecentActivityList title="Activités récentes" items={data?.recentActivities} />
    </DashboardLayout>
  );
}
