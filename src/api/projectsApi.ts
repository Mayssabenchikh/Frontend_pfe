import { http } from "./http";

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
  progressPercent: number | null;
  teamSize: number | null;
  startDate: string | null;
  dueDate: string | null;
  createdAt: string;
  requirements: ProjectRequirementDto[];
};

const BASE = "/api/manager";

export type ProjectPage = {
  content: ProjectDto[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
};

export const projectsApi = {
  list: (params?: { search?: string; status?: string; priority?: string; page?: number; size?: number }) =>
    http.get<ProjectPage>(`${BASE}/projects`, { params }),
  get: (id: number) => http.get<ProjectDto>(`${BASE}/projects/${id}`),
  create: (data: { name: string; description?: string; status?: string; priority?: string; progressPercent?: number; teamSize?: number; startDate?: string; dueDate?: string; requirements?: { skillId: number; levelMin: number }[] }) =>
    http.post<ProjectDto>(`${BASE}/projects`, data),
  update: (id: number, data: { name: string; description?: string; status?: string; priority?: string; progressPercent?: number; teamSize?: number; startDate?: string; dueDate?: string; requirements?: { skillId: number; levelMin: number }[] }) =>
    http.put<ProjectDto>(`${BASE}/projects/${id}`, data),
  delete: (id: number) => http.delete(`${BASE}/projects/${id}`),
  setRequirements: (id: number, requirements: { skillId: number; levelMin: number }[]) =>
    http.post<ProjectDto>(`${BASE}/projects/${id}/requirements`, requirements),
};
