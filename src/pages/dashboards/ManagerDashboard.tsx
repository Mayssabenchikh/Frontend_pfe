import { useCallback, useEffect, useState } from "react";
import { useKeycloak } from "@react-keycloak/web";
import { dashboardService, type ChartDataDto, type DashboardFilters, type KpiCardDto, type ManagerDashboardDto } from "../../api/dashboardService";
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

export function ManagerDashboard() {
  const { keycloak } = useKeycloak();
  const managerId = keycloak.subject ?? "";
  const [data, setData] = useState<ManagerDashboardDto | null>(null);
  const [filters, setFilters] = useState<DashboardFilters>({ period: "month" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!managerId) {
      setLoading(false);
      setError("Identifiant manager introuvable.");
      return;
    }
    setLoading(true);
    dashboardService.getManagerDashboard(managerId, filters)
      .then((res) => { setData(res.data); setError(null); })
      .catch((err) => setError(err?.response?.data?.error ?? "Erreur de chargement"))
      .finally(() => setLoading(false));
  }, [filters, managerId]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadingState />;
  if (error) return <DashboardLayout><ErrorState message={error} onRetry={load} /></DashboardLayout>;

  const priorityItems: PriorityActionItem[] = (data?.employeesAtRisk ?? []).slice(0, 3).map((row) => ({
    id: `risk-${row.id}`,
    title: row.title,
    description: row.subtitle ?? "Employé à accompagner prioritairement.",
    status: row.status ?? "risk",
  }));
  const matchingKpis = buildMatchingKpis(data);
  const matchingScoreByProject = buildMatchingScoreByProjectChart(data);
  const matchingTopProfiles = buildMatchingTopProfilesRows(data);

  return (
    <DashboardLayout>
      <DashboardHeader title="Tableau de bord manager" subtitle="Suivi de l'équipe" actions={<DashboardFilter filters={filters} options={data?.filterOptions} onChange={setFilters} />} />
      <div className="dashboard-section-title">Vue équipe</div>
      <DashboardKpiGrid items={data?.kpis} />
      <PriorityActionsCard items={priorityItems} />
      <div className="dashboard-section-title">Compétences, quiz et progression</div>
      <div className="dashboard-chart-grid dashboard-chart-grid-3">
        <ChartCard title="Niveaux des employés par compétence" data={data?.skillLevelsByEmployee} type="bar" />
        <ChartCard title="Progression des employés" data={data?.employeeProgress} type="line" />
        <ChartCard title="Résultats quiz par employé" data={data?.quizResultsByEmployee} type="bar" />
        <ChartCard title="Écarts de compétences par compétence" data={data?.skillGapsBySkill} type="horizontalBar" />
      </div>
      <div className="dashboard-chart-grid">
        <DataTable title="Employés de l'équipe" rows={data?.employees} valueLabel="Progression" />
        <RecentActivityList title="Employés en difficulté" items={data?.employeesAtRisk} />
      </div>
      <div className="dashboard-section-title">Matching et projets</div>
      <DashboardKpiGrid items={matchingKpis} />
      <div className="dashboard-chart-grid">
        <ChartCard title="Score de matching par projet" data={matchingScoreByProject} type="horizontalBar" />
        <DataTable title="Top profils recommandés par projet" rows={matchingTopProfiles} valueLabel="Score" valueMode="number" />
      </div>
      <ProjectOverviewCard title="Projets de l'équipe" data={data?.projects} mode="manager" />
      <div className="dashboard-chart-grid">
        <RecentActivityList title="Formations recommandées" items={data?.recommendedTrainings} />
        <RecentActivityList title="Activités récentes de l'équipe" items={data?.recentActivities} />
      </div>
    </DashboardLayout>
  );
}

function buildMatchingKpis(data: ManagerDashboardDto | null): KpiCardDto[] {
  const recommendations = data?.projects?.recommendations ?? [];
  const uniqueProjects = new Set(recommendations.map((item) => item.projectId)).size;
  const scored = recommendations.filter((item) => typeof item.score === "number");
  const avgScore = scored.length ? Math.round(scored.reduce((sum, item) => sum + Number(item.score ?? 0), 0) / scored.length) : 0;
  const highScore = scored.filter((item) => Number(item.score ?? 0) >= 70).length;
  const gaps = data?.projects?.criticalSkillGaps ?? [];
  const noSufficientMatch = new Set(gaps.filter((gap) => gap.gap > 0).map((gap) => gap.projectId)).size;

  return [
    { key: "matching_projects", label: "Projets avec matching", value: uniqueProjects, color: "blue", description: "Projets avec au moins une recommandation" },
    { key: "matching_avg_score", label: "Score moyen matching", value: avgScore, unit: "%", color: avgScore >= 70 ? "green" : "orange", description: "Moyenne des scores proposés" },
    { key: "matching_high_score", label: "Matchs >= 70%", value: highScore, color: "green", description: "Recommandations à fort potentiel" },
    { key: "matching_risk", label: "Projets sans match suffisant", value: noSufficientMatch, color: noSufficientMatch > 0 ? "red" : "green", description: "Projets avec gaps critiques restants" },
  ];
}

function buildMatchingScoreByProjectChart(data: ManagerDashboardDto | null): ChartDataDto {
  const recommendations = data?.projects?.recommendations ?? [];
  const grouped = new Map<string, { name: string; scores: number[] }>();

  recommendations.forEach((item) => {
    if (!grouped.has(item.projectId)) grouped.set(item.projectId, { name: item.projectName, scores: [] });
    if (typeof item.score === "number") grouped.get(item.projectId)!.scores.push(Number(item.score));
  });

  const items = Array.from(grouped.values()).map((entry) => ({
    label: entry.name,
    score: entry.scores.length ? Math.round(entry.scores.reduce((sum, s) => sum + s, 0) / entry.scores.length) : 0,
  })).sort((a, b) => b.score - a.score).slice(0, 8);

  return {
    labels: items.map((item) => item.label),
    datasets: [{ label: "Score matching", data: items.map((item) => item.score) }],
  };
}

function buildMatchingTopProfilesRows(data: ManagerDashboardDto | null) {
  return (data?.projects?.recommendations ?? [])
    .filter((item) => typeof item.score === "number")
    .sort((a, b) => Number(b.score ?? 0) - Number(a.score ?? 0))
    .slice(0, 8)
    .map((item, index) => ({
      id: `${item.projectId}-${index}`,
      title: item.title,
      subtitle: item.projectName,
      status: item.status ?? (Number(item.score ?? 0) >= 70 ? "validé" : "en attente"),
      primaryValue: Number(item.score ?? 0),
      date: null,
    }));
}
