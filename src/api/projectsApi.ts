import { http } from "./http";
import type { AssignmentDto } from "./assignmentsApi";

export type ProjectRequirementDto = {
  id: number;
  skillId: number;
  skillName: string;
  categoryName: string;
  levelMin: number;
};

export type ProjectDto = {
  id: number;
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

export type ProjectPage = {
  content: ProjectDto[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
};

export type ProjectRequirementInput = {
  skillId: number;
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
  list: (params?: { search?: string; status?: string; priority?: string; from?: string; to?: string; order?: string; page?: number; size?: number }) =>
    http.get<ProjectPage>(PROJECTS_ENDPOINT, { params }),
  get: (id: number) => http.get<ProjectDto>(`${PROJECTS_ENDPOINT}/${id}`),
  create: (data: ProjectPayload) => http.post<ProjectDto>(PROJECTS_ENDPOINT, data),
  update: (id: number, data: ProjectPayload) => http.put<ProjectDto>(`${PROJECTS_ENDPOINT}/${id}`, data),
  delete: (id: number) => http.delete(`${PROJECTS_ENDPOINT}/${id}`),
  setRequirements: (id: number, requirements: ProjectRequirementInput[]) =>
    http.post<ProjectDto>(`${PROJECTS_ENDPOINT}/${id}/requirements`, requirements),
};

export const employeeProjectsApi = {
  list: (params?: { search?: string; status?: string; priority?: string; from?: string; to?: string; order?: string; page?: number; size?: number }) =>
    http.get<ProjectPage>(EMPLOYEE_PROJECTS_ENDPOINT, { params }),
  get: (id: number) => http.get<ProjectDto>(`${EMPLOYEE_PROJECTS_ENDPOINT}/${id}`),
  team: (id: number) => http.get<AssignmentDto[]>(`${EMPLOYEE_PROJECTS_ENDPOINT}/${id}/team`),
};
