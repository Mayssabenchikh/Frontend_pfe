import { http } from "./http";
import type {
  SkillCategoryDto,
  SkillCategoryPageDto,
  SkillDto,
  SkillPageDto,
  PendingSkillRequestDto,
  PendingSkillRequestPageDto,
} from "../pages/admin/types";

const BASE = "/api/admin";

export const skillsApi = {
  listCategories: () => http.get<SkillCategoryDto[]>(`${BASE}/skill-categories`),
  listCategoriesPaginated: (opts?: { page?: number; size?: number; search?: string }) => {
    const params: Record<string, string | number> = { page: opts?.page ?? 0, size: opts?.size ?? 20 };
    if (opts?.search && opts.search.trim()) params.search = opts.search.trim();
    return http.get<SkillCategoryPageDto>(`${BASE}/skill-categories`, { params });
  },
  createCategory: (name: string) =>
    http.post<SkillCategoryDto>(`${BASE}/skill-categories`, { name }),
  updateCategory: (id: number, name: string) =>
    http.put<SkillCategoryDto>(`${BASE}/skill-categories/${id}`, { name }),
  deleteCategory: (id: number) =>
    http.delete(`${BASE}/skill-categories/${id}`),

  listSkills: (categoryId?: number) => {
    const params = categoryId ? { categoryId } : {};
    return http.get<SkillDto[]>(`${BASE}/skills`, { params });
  },
  listSkillsPaginated: (opts?: { categoryId?: number; page?: number; size?: number; search?: string }) => {
    const params: Record<string, string | number> = { page: opts?.page ?? 0, size: opts?.size ?? 20 };
    if (opts?.categoryId != null) params.categoryId = opts.categoryId;
    if (opts?.search && opts.search.trim()) params.search = opts.search.trim();
    return http.get<SkillPageDto>(`${BASE}/skills`, { params });
  },
  getSkill: (id: number) => http.get<SkillDto>(`${BASE}/skills/${id}`),
  createSkill: (data: { name: string; categoryId: number; levelMin: number; levelMax: number }) =>
    http.post<SkillDto>(`${BASE}/skills`, data),
  updateSkill: (id: number, data: { name: string; categoryId: number; levelMin: number; levelMax: number }) =>
    http.put<SkillDto>(`${BASE}/skills/${id}`, data),
  deleteSkill: (id: number) => http.delete(`${BASE}/skills/${id}`),
  addSynonym: (skillId: number, alias: string) =>
    http.post(`${BASE}/skills/${skillId}/synonyms`, { alias }),
  removeSynonym: (skillId: number, alias: string) =>
    http.delete(`${BASE}/skills/${skillId}/synonyms`, { params: { alias } }),
  listPendingSkillRequests: (opts?: { page?: number; size?: number; status?: "PENDING" | "APPROVED" | "MERGED" | "REJECTED" }) => {
    const params: Record<string, string | number> = { page: opts?.page ?? 0, size: opts?.size ?? 20 };
    if (opts?.status) params.status = opts.status;
    return http.get<PendingSkillRequestPageDto>(`${BASE}/pending-skills`, { params });
  },
  listPendingSkillRequestsAll: () =>
    http.get<PendingSkillRequestDto[]>(`${BASE}/pending-skills`),
  getPendingSkillRequestsCount: () =>
    http.get<{ count: number }>(`${BASE}/pending-skills/count`),
  getPendingSkillRequestsStats: () =>
    http.get<Record<"PENDING" | "APPROVED" | "MERGED" | "REJECTED", number>>(`${BASE}/pending-skills/stats`),
  resolvePendingSkillRequest: (
    id: number,
    data: { action: "APPROVE" | "MERGE" | "REJECT"; categoryId?: number; existingSkillId?: number; adminNotes?: string }
  ) => http.post(`${BASE}/pending-skills/${id}/resolve`, data),
};
