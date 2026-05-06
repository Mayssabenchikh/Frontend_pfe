import { useCallback, useEffect, useState } from "react";
import { useKeycloak } from "@react-keycloak/web";
import { dashboardService, type DashboardFilters, type ManagerDashboardDto } from "../../api/dashboardService";
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

export function ManagerDashboard() {
  const { keycloak } = useKeycloak();
  const managerId = keycloak.subject ?? "";
  const [data, setData] = useState<ManagerDashboardDto | null>(null);
  const [filters, setFilters] = useState<DashboardFilters>({ period: "month" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!managerId) return;
    setLoading(true);
    dashboardService.getManagerDashboard(managerId, filters)
      .then((res) => { setData(res.data); setError(null); })
      .catch((err) => setError(err?.response?.data?.error ?? "Erreur de chargement"))
      .finally(() => setLoading(false));
  }, [filters, managerId]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadingState />;
  if (error) return <DashboardLayout><ErrorState message={error} onRetry={load} /></DashboardLayout>;

  return (
    <DashboardLayout>
      <DashboardHeader title="Tableau de bord manager" subtitle="Suivi de l'équipe" actions={<DashboardFilter filters={filters} options={data?.filterOptions} onChange={setFilters} extraStatus />} />
      <div className="dashboard-kpi-grid">{(data?.kpis ?? []).slice(0, 4).map((item) => <KpiCard key={item.key} item={item} />)}</div>
      <div className="dashboard-chart-grid">
        <ChartCard title="Niveaux des employés par compétence" data={data?.skillLevelsByEmployee} type="bar" />
        <ChartCard title="Progression des employés" data={data?.employeeProgress} type="line" />
        <ChartCard title="Résultats quiz par employé" data={data?.quizResultsByEmployee} type="bar" />
        <ChartCard title="Écarts de compétences par compétence" data={data?.skillGapsBySkill} type="horizontalBar" />
      </div>
      <DataTable title="Employés de l'équipe" rows={data?.employees} valueLabel="Progression" />
      <div className="dashboard-chart-grid">
        <RecentActivityList title="Employés en difficulté" items={data?.employeesAtRisk} />
        <RecentActivityList title="Formations recommandées" items={data?.recommendedTrainings} />
      </div>
      <ProjectOverviewCard title="Projets" data={data?.projects} mode="manager" />
      <RecentActivityList title="Activités récentes de l'équipe" items={data?.recentActivities} />
    </DashboardLayout>
  );
}
