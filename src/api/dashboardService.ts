import { http } from "./http";

export type KpiCardDto = {
  key: string;
  label: string;
  value: number;
  unit?: string;
  color?: string;
  trend?: string | null;
  description?: string;
};

export type ChartDatasetDto = {
  label: string;
  data: number[];
  backgroundColor?: string[];
  borderColor?: string[];
};

export type ChartDataDto = {
  labels: string[];
  datasets: ChartDatasetDto[];
};

export type TableRowDto = {
  id: string;
  title: string;
  subtitle?: string | null;
  status?: string | null;
  primaryValue?: number | null;
  secondaryValue?: number | null;
  date?: string | null;
};

export type RecentActivityDto = {
  id: string;
  title: string;
  description?: string | null;
  type?: string | null;
  status?: string | null;
  date?: string | null;
};

export type QuizPerformanceDto = {
  label: string;
  score: number;
  status: string;
  date?: string | null;
};

export type FilterOptionDto = {
  value: string;
  label: string;
};

export type DashboardFilterOptionsDto = {
  periods?: FilterOptionDto[];
  statuses?: FilterOptionDto[];
};

export type ProjectKpiDto = {
  key: string;
  label: string;
  value: number;
  unit?: string;
  color?: string;
  description?: string;
};

export type ProjectSkillGapDto = {
  projectId: string;
  projectName: string;
  skillName: string;
  requiredLevel: number;
  bestAvailableLevel: number;
  gap: number;
  status: string;
};

export type ProjectProgressDto = {
  projectId: string;
  projectName: string;
  status: string;
  progress: number;
  assignedEmployees: number;
  date?: string | null;
};

export type ProjectRecommendationDto = {
  projectId: string;
  projectName: string;
  title: string;
  description?: string | null;
  status?: string | null;
  score?: number | null;
};

export type ProjectDashboardDto = {
  kpis: ProjectKpiDto[];
  projectsEvolution: ChartDataDto;
  projectsByStatus: ChartDataDto;
  projectsByManager: ChartDataDto;
  projectSkillsDemand: ChartDataDto;
  projectCoverage: ChartDataDto;
  projects: ProjectProgressDto[];
  criticalSkillGaps: ProjectSkillGapDto[];
  recommendations: ProjectRecommendationDto[];
};

export type AdminDashboardDto = {
  kpis: KpiCardDto[];
  employeesEvolution: ChartDataDto;
  usersByRole: ChartDataDto;
  topSkills: ChartDataDto;
  topTrainings: ChartDataDto;
  quizSuccessByMonth: ChartDataDto;
  latestEmployees: TableRowDto[];
  latestTrainings: TableRowDto[];
  recentActivities: RecentActivityDto[];
  projects: ProjectDashboardDto;
  filterOptions?: DashboardFilterOptionsDto;
};

export type ManagerDashboardDto = {
  kpis: KpiCardDto[];
  skillLevelsByEmployee: ChartDataDto;
  employeeProgress: ChartDataDto;
  quizResultsByEmployee: ChartDataDto;
  skillGapsBySkill: ChartDataDto;
  employees: TableRowDto[];
  employeesAtRisk: TableRowDto[];
  recommendedTrainings: TableRowDto[];
  recentActivities: RecentActivityDto[];
  projects: ProjectDashboardDto;
  filterOptions?: DashboardFilterOptionsDto;
};

export type EmployeeDashboardDto = {
  kpis: KpiCardDto[];
  globalProgress: number;
  nextQuiz: string;
  quizScoreEvolution: ChartDataDto;
  currentVsTargetSkills: ChartDataDto;
  trainingProgressByProgram: ChartDataDto;
  skillsByLevel: ChartDataDto;
  recommendedTrainings: TableRowDto[];
  pendingActivities: TableRowDto[];
  recentQuizResults: QuizPerformanceDto[];
  feedback: RecentActivityDto[];
  projects: ProjectDashboardDto;
  filterOptions?: DashboardFilterOptionsDto;
};

export type TrainingManagerDashboardDto = {
  kpis: KpiCardDto[];
  contentByType: ChartDataDto;
  completionByTraining: ChartDataDto;
  recommendationsByTraining: ChartDataDto;
  creationsEvolution: ChartDataDto;
  trainings: TableRowDto[];
  pendingCorrections: TableRowDto[];
  recentTrainings: TableRowDto[];
  recentActivities: RecentActivityDto[];
  projects: ProjectDashboardDto;
  filterOptions?: DashboardFilterOptionsDto;
};

export type DashboardFilters = {
  period?: string;
  role?: string;
  status?: string;
  search?: string;
};

const cleanParams = (filters?: DashboardFilters) =>
  Object.fromEntries(Object.entries(filters ?? {}).filter(([, value]) => value !== undefined && value !== "" && value !== "all"));

export const dashboardService = {
  getAdminDashboard(filters?: DashboardFilters) {
    return http.get<AdminDashboardDto>("/api/dashboard/admin", { params: cleanParams(filters) });
  },
  getManagerDashboard(managerId: string, filters?: DashboardFilters) {
    return http.get<ManagerDashboardDto>(`/api/dashboard/manager/${managerId}`, { params: cleanParams(filters) });
  },
  getEmployeeDashboard(employeeId: string, filters?: DashboardFilters) {
    return http.get<EmployeeDashboardDto>(`/api/dashboard/employee/${employeeId}`, { params: cleanParams(filters) });
  },
  getTrainingManagerDashboard(trainingManagerId: string, filters?: DashboardFilters) {
    return http.get<TrainingManagerDashboardDto>(`/api/dashboard/training-manager/${trainingManagerId}`, { params: cleanParams(filters) });
  },
};
