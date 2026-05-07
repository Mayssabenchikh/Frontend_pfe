import { useCallback, useEffect, useState } from "react";
import { useKeycloak } from "@react-keycloak/web";
import { dashboardService, type DashboardFilters, type TrainingManagerDashboardDto } from "../../api/dashboardService";
import { ChartCard } from "../../components/dashboard/ChartCard";
import { DashboardFilter } from "../../components/dashboard/DashboardFilter";
import { DashboardHeader } from "../../components/dashboard/DashboardHeader";
import { DashboardKpiGrid } from "../../components/dashboard/DashboardKpiGrid";
import { DashboardLayout } from "../../components/dashboard/DashboardLayout";
import { DataTable } from "../../components/dashboard/DataTable";
import { ErrorState } from "../../components/dashboard/ErrorState";
import { LoadingState } from "../../components/dashboard/LoadingState";
import { PriorityActionsCard, type PriorityActionItem } from "../../components/dashboard/PriorityActionsCard";
import { ProjectOverviewCard } from "../../components/dashboard/ProjectOverviewCard";
import { RecentActivityList } from "../../components/dashboard/RecentActivityList";

export function TrainingManagerDashboard() {
  const { keycloak } = useKeycloak();
  const trainingManagerId = keycloak.subject ?? "";
  const [data, setData] = useState<TrainingManagerDashboardDto | null>(null);
  const [filters, setFilters] = useState<DashboardFilters>({ period: "month" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!trainingManagerId) {
      setLoading(false);
      setError("Identifiant responsable formation introuvable.");
      return;
    }
    setLoading(true);
    dashboardService.getTrainingManagerDashboard(trainingManagerId, filters)
      .then((res) => { setData(res.data); setError(null); })
      .catch((err) => setError(err?.response?.data?.error ?? "Erreur de chargement"))
      .finally(() => setLoading(false));
  }, [filters, trainingManagerId]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadingState />;
  if (error) return <DashboardLayout><ErrorState message={error} onRetry={load} /></DashboardLayout>;

  const priorityItems: PriorityActionItem[] = (data?.pendingCorrections ?? []).slice(0, 4).map((row) => ({
    id: `corr-${row.id}`,
    title: row.title,
    description: row.subtitle ?? "Soumission en attente de correction.",
    status: row.status ?? "à corriger",
  }));

  return (
    <DashboardLayout>
      <DashboardHeader title="Tableau de bord responsable formation" subtitle="Gestion et performance des formations" actions={<DashboardFilter filters={filters} options={data?.filterOptions} onChange={setFilters} />} />
      <div className="dashboard-section-title">Vue formation</div>
      <DashboardKpiGrid items={data?.kpis} />
      <PriorityActionsCard items={priorityItems} />
      <div className="dashboard-section-title">Contenus, complétion et recommandations</div>
      <div className="dashboard-chart-grid dashboard-chart-grid-3">
        <ChartCard title="Répartition des contenus par type" data={data?.contentByType} type="doughnut" />
        <ChartCard title="Complétion par formation" data={data?.completionByTraining} type="bar" />
        <ChartCard title="Recommandations par formation" data={data?.recommendationsByTraining} type="horizontalBar" />
        <ChartCard title="Évolution des créations" data={data?.creationsEvolution} type="line" />
      </div>
      <div className="dashboard-chart-grid">
        <DataTable title="Formations" rows={data?.trainings} valueLabel="Progression" />
        <RecentActivityList title="Activités / exercices à valider" items={data?.pendingCorrections} />
      </div>
      <ProjectOverviewCard title="Besoins projets et formations" data={data?.projects} mode="training" />
      <div className="dashboard-chart-grid">
        <RecentActivityList title="Formations récemment créées" items={data?.recentTrainings} />
        <RecentActivityList title="Activités récentes" items={data?.recentActivities} />
      </div>
    </DashboardLayout>
  );
}
