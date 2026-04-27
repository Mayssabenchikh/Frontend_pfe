import { http } from "./http";
import type { AxiosResponse } from "axios";
import type { AssignmentDto } from "./assignmentsApi";

export type ProjectRequirementDto = {
  uuid: string;
  skillUuid: string;
  skillName: string;
  categoryName: string;
  levelMin: number;
};

export type ProjectDto = {
  uuid: string;
  name: string;
  description: string;
  status: string;
  leadName: string | null;
  leadEmail: string | null;
  priority: string | null;
  teamSize: number | null;
  startDate: string | null;
  dueDate: string | null;
  createdAt: string;
  requirements: ProjectRequirementDto[];
};

const BASE = "/api/manager";
const PROJECTS_ENDPOINT = `${BASE}/projects`;
const EMPLOYEE_PROJECTS_ENDPOINT = `/api/employee/projects`;
const PROJECTS_LIST_DEDUPE_TTL_MS = 500;

type ProjectsListParams = {
  search?: string;
  status?: string;
  priority?: string;
  from?: string;
  to?: string;
  order?: string;
  page?: number;
  size?: number;
};

type ProjectsListRequestState = {
  inFlight: Promise<AxiosResponse<ProjectPage>> | null;
  cacheAt: number;
  cachedValue: AxiosResponse<ProjectPage> | null;
};

const projectsListRequestState = new Map<string, ProjectsListRequestState>();

function buildProjectsListKey(params?: ProjectsListParams): string {
  const entries = Object.entries(params ?? {})
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .sort(([a], [b]) => a.localeCompare(b));

  if (!entries.length) {
    return "projects:list:default";
  }

  return `projects:list:${entries.map(([k, v]) => `${k}=${String(v)}`).join("&")}`;
}

export type ProjectPage = {
  content: ProjectDto[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
};

export type ProjectRequirementInput = {
  skillUuid: string;
  levelMin: number;
};

export type ProjectPayload = {
  name: string;
  description?: string;
  status?: string;
  priority?: string;
  teamSize?: number;
  startDate?: string;
  dueDate?: string;
  requirements?: ProjectRequirementInput[];
};

export const projectsApi = {
  list: (params?: ProjectsListParams) => {
    const key = buildProjectsListKey(params);
    const now = Date.now();
    const state = projectsListRequestState.get(key);

    if (state?.cachedValue && now - state.cacheAt < PROJECTS_LIST_DEDUPE_TTL_MS) {
      return Promise.resolve(state.cachedValue);
    }

    if (state?.inFlight) {
      return state.inFlight;
    }

    const request = http.get<ProjectPage>(PROJECTS_ENDPOINT, { params }).finally(() => {
      const current = projectsListRequestState.get(key);
      if (!current) return;
      current.inFlight = null;
    });

    projectsListRequestState.set(key, {
      inFlight: request,
      cacheAt: state?.cacheAt ?? 0,
      cachedValue: state?.cachedValue ?? null,
    });

    return request.then((res) => {
      projectsListRequestState.set(key, {
        inFlight: null,
        cacheAt: Date.now(),
        cachedValue: res,
      });
      return res;
    });
  },
  get: (uuid: string) => http.get<ProjectDto>(`${PROJECTS_ENDPOINT}/${uuid}`),
  create: (data: ProjectPayload) => http.post<ProjectDto>(PROJECTS_ENDPOINT, data),
  update: (uuid: string, data: ProjectPayload) => http.put<ProjectDto>(`${PROJECTS_ENDPOINT}/${uuid}`, data),
  delete: (uuid: string) => http.delete(`${PROJECTS_ENDPOINT}/${uuid}`),
  setRequirements: (uuid: string, requirements: ProjectRequirementInput[]) =>
    http.post<ProjectDto>(`${PROJECTS_ENDPOINT}/${uuid}/requirements`, requirements),
};

export const employeeProjectsApi = {
  list: (params?: { search?: string; status?: string; priority?: string; from?: string; to?: string; order?: string; page?: number; size?: number }) =>
    http.get<ProjectPage>(EMPLOYEE_PROJECTS_ENDPOINT, { params }),
  get: (uuid: string) => http.get<ProjectDto>(`${EMPLOYEE_PROJECTS_ENDPOINT}/${uuid}`),
  team: (uuid: string) => http.get<AssignmentDto[]>(`${EMPLOYEE_PROJECTS_ENDPOINT}/${uuid}/team`),
};
