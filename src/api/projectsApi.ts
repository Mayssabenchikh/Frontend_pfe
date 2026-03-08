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
  createdAt: string;
  requirements: ProjectRequirementDto[];
};

const BASE = "/api/manager";

export const projectsApi = {
  list: (search?: string) =>
    http.get<ProjectDto[]>(`${BASE}/projects`, { params: search ? { search } : {} }),
  get: (id: number) => http.get<ProjectDto>(`${BASE}/projects/${id}`),
  create: (data: { name: string; description?: string; status?: string; requirements?: { skillId: number; levelMin: number }[] }) =>
    http.post<ProjectDto>(`${BASE}/projects`, data),
  update: (id: number, data: { name: string; description?: string; status?: string; requirements?: { skillId: number; levelMin: number }[] }) =>
    http.put<ProjectDto>(`${BASE}/projects/${id}`, data),
  delete: (id: number) => http.delete(`${BASE}/projects/${id}`),
  setRequirements: (id: number, requirements: { skillId: number; levelMin: number }[]) =>
    http.post<ProjectDto>(`${BASE}/projects/${id}/requirements`, requirements),
};
