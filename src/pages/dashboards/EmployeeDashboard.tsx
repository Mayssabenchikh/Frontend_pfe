import { useCallback, useEffect, useState } from "react";
import { useKeycloak } from "@react-keycloak/web";
import { dashboardService, type DashboardFilters, type EmployeeDashboardDto, type TableRowDto } from "../../api/dashboardService";
import { trainingRecommendationApi } from "../../api/trainingRecommendationApi";
import { ChartCard } from "../../components/dashboard/ChartCard";
import { DashboardKpiGrid } from "../../components/dashboard/DashboardKpiGrid";
import { DashboardFilter } from "../../components/dashboard/DashboardFilter";
import { DashboardHeader } from "../../components/dashboard/DashboardHeader";
import { DashboardLayout } from "../../components/dashboard/DashboardLayout";
import { ErrorState } from "../../components/dashboard/ErrorState";
import { LoadingState } from "../../components/dashboard/LoadingState";
import { PriorityActionsCard, type PriorityActionItem } from "../../components/dashboard/PriorityActionsCard";
import { ProjectOverviewCard } from "../../components/dashboard/ProjectOverviewCard";
import { RecentActivityList } from "../../components/dashboard/RecentActivityList";
import { employeeDashboardExplanations } from "../../components/dashboard/dashboardExplanations";

export function EmployeeDashboard() {
  const { keycloak } = useKeycloak();
  const employeeId = keycloak.subject ?? "";
  const [data, setData] = useState<EmployeeDashboardDto | null>(null);
  const [filters, setFilters] = useState<DashboardFilters>({ period: "year" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fallbackRecommendedTrainings, setFallbackRecommendedTrainings] = useState<TableRowDto[]>([]);

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

  useEffect(() => {
    if (!employeeId) return;
    trainingRecommendationApi.getRecommendations()
      .then((res) => {
        const rows: TableRowDto[] = (res.data ?? []).slice(0, 8).map((rec) => ({
          id: `${rec.trainingUuid}-${rec.skillName}-${rec.contextName ?? ""}`,
          title: rec.trainingTitle,
          subtitle: rec.skillName,
          status: "recommandé",
          primaryValue: rec.targetLevel,
          secondaryValue: rec.currentLevel,
          date: null,
        }));
        setFallbackRecommendedTrainings(rows);
      })
      .catch(() => setFallbackRecommendedTrainings([]));
  }, [employeeId]);

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
  const displayedRecommendedTrainings =
    (data?.recommendedTrainings?.length ?? 0) > 0 ? (data?.recommendedTrainings ?? []) : fallbackRecommendedTrainings;

  return (
    <DashboardLayout>
      <DashboardHeader title="Mon tableau de bord" subtitle="Progression personnelle" actions={<DashboardFilter filters={filters} onChange={setFilters} />} />
      <div className="dashboard-section-title">Vue personnelle</div>
      <DashboardKpiGrid items={data?.kpis} explanationMap={employeeDashboardExplanations} />
      <PriorityActionsCard title="Mes prochaines actions" items={priorityItems} />
      <div className="dashboard-section-title">Compétences, quiz et formation</div>
      <div className="dashboard-chart-grid dashboard-chart-grid-3">
        <ChartCard 
          title="Compétences actuelles vs cibles" 
          data={data?.currentVsTargetSkills} 
          type="radar"
          explanation={employeeDashboardExplanations.chart_current_vs_target}
        />
        <ChartCard 
          title="Évolution des scores quiz" 
          data={data?.quizScoreEvolution} 
          type="line"
          xAxisTitle="Tentatives / périodes"
          yAxisTitle="Score quiz (%)"
          explanation={employeeDashboardExplanations.chart_quiz_score_evolution}
        />
        <ChartCard 
          title="Progression par formation" 
          data={data?.trainingProgressByProgram} 
          type="bar"
          xAxisTitle="Formations"
          yAxisTitle="Progression (%)"
          explanation={employeeDashboardExplanations.chart_training_progress}
        />
        <ChartCard 
          title="Compétences par niveau" 
          data={data?.skillsByLevel} 
          type="doughnut"
          explanation={employeeDashboardExplanations.chart_skills_by_level}
        />
      </div>
      <div className="dashboard-chart-grid">
        <RecentActivityList title="Formations recommandées" items={displayedRecommendedTrainings} />
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
