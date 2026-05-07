import { useCallback, useEffect, useState } from "react";
import { dashboardService, type AdminDashboardDto, type ChartDataDto, type DashboardFilters, type KpiCardDto } from "../../api/dashboardService";
import { ChartCard } from "../../components/dashboard/ChartCard";
import { DashboardFilter } from "../../components/dashboard/DashboardFilter";
import { DashboardHeader } from "../../components/dashboard/DashboardHeader";
import { DashboardLayout } from "../../components/dashboard/DashboardLayout";
import { DataTable } from "../../components/dashboard/DataTable";
import { DashboardKpiGrid } from "../../components/dashboard/DashboardKpiGrid";
import { ErrorState } from "../../components/dashboard/ErrorState";
import { LoadingState } from "../../components/dashboard/LoadingState";
import { PriorityActionsCard, type PriorityActionItem } from "../../components/dashboard/PriorityActionsCard";
import { ProjectOverviewCard } from "../../components/dashboard/ProjectOverviewCard";
import { RecentActivityList } from "../../components/dashboard/RecentActivityList";
import { adminDashboardExplanations } from "../../components/dashboard/dashboardExplanations";

export function AdminDashboard() {
  const [data, setData] = useState<AdminDashboardDto | null>(null);
  const [filters, setFilters] = useState<DashboardFilters>({ period: "year" });
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

  const priorityItems: PriorityActionItem[] = [
    ...(data?.recentActivities ?? []).slice(0, 2).map((item) => ({
      id: `act-${item.id}`,
      title: item.title,
      description: item.description,
      status: item.status ?? "pending",
    })),
    ...(data?.latestTrainings ?? []).slice(0, 2).map((item) => ({
      id: `train-${item.id}`,
      title: item.title,
      description: item.subtitle ?? "Formation à suivre de près.",
      status: item.status ?? "published",
    })),
  ].slice(0, 4);
  const matchingKpis = buildMatchingKpis(data);
  const matchingScoreByProject = buildMatchingScoreByProjectChart(data);
  const matchingRows = buildMatchingRows(data);

  return (
    <DashboardLayout>
      <DashboardHeader title="Tableau de bord admin" subtitle="Vue globale de la plateforme" actions={<DashboardFilter filters={filters} onChange={setFilters} />} />
      <div className="dashboard-section-title">Pilotage global</div>
      <DashboardKpiGrid items={data?.kpis} explanationMap={adminDashboardExplanations} />
      <PriorityActionsCard items={priorityItems} />

      <div className="dashboard-chart-grid">
        <ChartCard 
          title="Évolution des employés" 
          subtitle="Ajouts par mois" 
          data={data?.employeesEvolution} 
          type="line"
          xAxisTitle="Mois"
          yAxisTitle="Nombre d'employés"
          explanation={adminDashboardExplanations.chart_employees_evolution}
        />
        <ChartCard 
          title="Répartition utilisateurs" 
          subtitle="Distribution par rôle" 
          data={data?.usersByRole} 
          type="doughnut"
          explanation={adminDashboardExplanations.chart_users_by_role}
        />
      </div>

      <div className="dashboard-section-title">Compétences, quiz et formations</div>
      <div className="dashboard-chart-grid dashboard-chart-grid-3">
        <ChartCard 
          title="Compétences les plus demandées" 
          data={data?.topSkills} 
          type="bar"
          xAxisTitle="Compétences"
          yAxisTitle="Nombre de demandes"
          explanation={adminDashboardExplanations.chart_top_skills}
        />
        <ChartCard 
          title="Formations les plus suivies" 
          data={data?.topTrainings} 
          type="horizontalBar"
          xAxisTitle="Nombre d'inscriptions"
          yAxisTitle="Formations"
          explanation={adminDashboardExplanations.chart_top_trainings}
        />
        <ChartCard 
          title="Taux de réussite quiz par mois" 
          data={data?.quizSuccessByMonth} 
          type="line"
          xAxisTitle="Mois"
          yAxisTitle="Taux de réussite (%)"
          explanation={adminDashboardExplanations.chart_quiz_success_rate}
        />
      </div>

      <div className="dashboard-chart-grid">
        <DataTable title="Derniers employés ajoutés" rows={data?.latestEmployees} valueLabel="Niveau" />
        <DataTable title="Dernières formations créées" rows={data?.latestTrainings} valueLabel="Modules" valueMode="number" />
      </div>
      <div className="dashboard-section-title">Projets, matching et activité</div>
      <DashboardKpiGrid items={matchingKpis} explanationMap={adminDashboardExplanations} />
      <div className="dashboard-chart-grid">
        <ChartCard 
          title="Score de matching par projet" 
          data={matchingScoreByProject} 
          type="horizontalBar"
          xAxisTitle="Score de matching (%)"
          yAxisTitle="Projets"
          explanation={adminDashboardExplanations.chart_matching_by_project}
        />
        <DataTable title="Recommandations de matching" rows={matchingRows} valueLabel="Score" valueMode="number" />
      </div>
      <ProjectOverviewCard title="Projets" data={data?.projects} mode="admin" />
      <RecentActivityList title="Activités récentes" items={data?.recentActivities} />
    </DashboardLayout>
  );
}

function buildMatchingKpis(data: AdminDashboardDto | null): KpiCardDto[] {
  const recommendations = data?.projects?.recommendations ?? [];
  const uniqueProjects = new Set(recommendations.map((item) => item.projectId)).size;
  const scored = recommendations.filter((item) => typeof item.score === "number");
  const avgScore = scored.length ? Math.round(scored.reduce((sum, item) => sum + Number(item.score ?? 0), 0) / scored.length) : 0;
  const criticalProjects = new Set((data?.projects?.criticalSkillGaps ?? []).filter((gap) => gap.gap > 0).map((gap) => gap.projectId)).size;

  return [
    { key: "admin_matching_projects", label: "Projets avec matching", value: uniqueProjects, color: "blue", description: "Projets avec recommandations de profils" },
    { key: "admin_matching_avg", label: "Score moyen matching", value: avgScore, unit: "%", color: avgScore >= 70 ? "green" : "orange", description: "Qualité globale du matching" },
    { key: "admin_matching_reco", label: "Recommandations actives", value: recommendations.length, color: "violet", description: "Suggestions profils-projets" },
    { key: "admin_matching_risk", label: "Projets à risque de staffing", value: criticalProjects, color: criticalProjects > 0 ? "red" : "green", description: "Gaps critiques persistants" },
  ];
}

function buildMatchingScoreByProjectChart(data: AdminDashboardDto | null): ChartDataDto {
  const recommendations = data?.projects?.recommendations ?? [];
  const grouped = new Map<string, { name: string; scores: number[] }>();
  recommendations.forEach((item) => {
    if (!grouped.has(item.projectId)) grouped.set(item.projectId, { name: item.projectName, scores: [] });
    if (typeof item.score === "number") grouped.get(item.projectId)!.scores.push(Number(item.score));
  });
  const items = Array.from(grouped.values())
    .map((entry) => ({
      label: entry.name,
      score: entry.scores.length ? Math.round(entry.scores.reduce((sum, score) => sum + score, 0) / entry.scores.length) : 0,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);
  return { labels: items.map((item) => item.label), datasets: [{ label: "Score matching", data: items.map((item) => item.score) }] };
}

function buildMatchingRows(data: AdminDashboardDto | null) {
  return (data?.projects?.recommendations ?? [])
    .filter((item) => typeof item.score === "number")
    .sort((a, b) => Number(b.score ?? 0) - Number(a.score ?? 0))
    .slice(0, 8)
    .map((item, idx) => ({
      id: `${item.projectId}-${idx}`,
      title: item.title,
      subtitle: item.projectName,
      status: item.status ?? null,
      primaryValue: Number(item.score ?? 0),
      date: null,
    }));
}
