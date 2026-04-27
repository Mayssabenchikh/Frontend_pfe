import axios, { type InternalAxiosRequestConfig } from "axios";

/**
 * FastAPI matching microservice.
 *
 * En dev : les URL locales (localhost / 127.0.0.1) passent par le proxy Vite `/matching-api`
 * pour éviter CORS (origine du navigateur = localhost:5173 ≠ 127.0.0.1:8003).
 * Pour forcer l’URL directe en dev : VITE_MATCHING_DIRECT=1 dans .env.
 *
 * En prod : définir VITE_MATCHING_API_URL vers l’hôte réel du service.
 */
function resolveMatchingBaseUrl(): string {
  const raw = (import.meta.env.VITE_MATCHING_API_URL as string | undefined)?.trim();
  const direct = import.meta.env.VITE_MATCHING_DIRECT === "1";

  if (import.meta.env.DEV) {
    if (direct) {
      return raw || "http://127.0.0.1:8003";
    }
    const isLocal =
      !raw ||
      /^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?\/?$/i.test(raw);
    if (isLocal) {
      return "/matching-api";
    }
    return raw;
  }

  return raw || "http://127.0.0.1:8003";
}

const baseURL = resolveMatchingBaseUrl();
const internalKey = import.meta.env.VITE_MATCHING_INTERNAL_API_KEY as string | undefined;

export const matchingHttp = axios.create({ baseURL });

matchingHttp.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  config.headers = config.headers ?? {};
  if (internalKey && String(internalKey).trim()) {
    (config.headers as Record<string, string>)["X-Internal-Api-Key"] = String(internalKey).trim();
  }
  return config;
});

export type MatchEvidence = "quiz" | "cv" | "none";

export type RequirementScoreDto = {
  skill_uuid: string;
  skill_name: string;
  required_level: number;
  employee_level: number;
  effective_level: number;
  meets: boolean;
  partial_score: number;
  confidence: number;
  evidence: MatchEvidence;
};

export type MatchBreakdownDto = {
  requirements: RequirementScoreDto[];
  weights_total: number;
  mandatory_failed: string[];
};

export type EmployeeMatchRowDto = {
  employee_keycloak_id: string;
  display_name: string;
  email: string;
  match_score: number;
  confidence_score: number;
  meets_mandatory: boolean;
  rank: number;
  breakdown: MatchBreakdownDto;
  match_result_uuid?: string | null;
};

export type MatchListResponseDto = {
  project_uuid: string;
  computed_at: string;
  employees: EmployeeMatchRowDto[];
  total_employees: number;
  page: number;
  page_size: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
};

export type GapSkillDto = {
  skill_uuid: string;
  skill_name: string;
  gap_type: "missing" | "insufficient_level" | "unverified_cv_only" | "quiz_pending_unverified" | "failed_quiz_recent";
  required_level?: number | null;
  employee_level?: number | null;
  status?: string | null;
  source?: string | null;
};

export type GapAnalysisResponseDto = {
  project_uuid: string;
  employee_keycloak_id: string;
  gaps: GapSkillDto[];
};

export type TeamMemberPickDto = {
  employee_keycloak_id: string;
  display_name: string;
  marginal_coverage_gain: number;
};

export type TeamBuildResponseDto = {
  project_uuid: string;
  team_size: number;
  members: TeamMemberPickDto[];
  avg_redundancy: number;
  total_members: number;
  page: number;
  page_size: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
};

export type ExplainResponseDto = {
  match_result_uuid: string;
  deterministic_summary: string;
  ai_explanation?: Record<string, unknown> | null;
};

export const matchingApi = {
  getProjectMatches: (
    projectUuid: string,
    params?: {
      page?: number;
      page_size?: number;
    },
  ) =>
    matchingHttp.get<MatchListResponseDto>(`/projects/${encodeURIComponent(projectUuid)}/matches`, { params }),

  getEmployeeGap: (projectUuid: string, employeeKeycloakId: string) =>
    matchingHttp.get<GapAnalysisResponseDto>(
      `/projects/${encodeURIComponent(projectUuid)}/employees/${encodeURIComponent(employeeKeycloakId)}/gap`,
    ),

  buildTeam: (
    projectUuid: string,
    body: { team_size: number; only_mandatory_eligible?: boolean },
    params?: {
      page?: number;
      page_size?: number;
    },
  ) =>
    matchingHttp.post<TeamBuildResponseDto>(
      `/projects/${encodeURIComponent(projectUuid)}/team`,
      {
        team_size: body.team_size,
        only_mandatory_eligible: body.only_mandatory_eligible ?? true,
      },
      { params },
    ),

  explainMatch: (matchResultUuid: string) =>
    matchingHttp.get<ExplainResponseDto>(`/matches/${encodeURIComponent(matchResultUuid)}/explain`),
};
