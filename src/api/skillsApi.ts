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
const DEFAULT_PAGE = 0;
const DEFAULT_PAGE_SIZE = 20;

type PaginationOptions = { page?: number; size?: number; search?: string };
type PendingStatus = "PENDING" | "APPROVED" | "MERGED" | "REJECTED";
export type PendingMergeSuggestionDto = {
  suggestedSkillUuid: string | null;
  confidence: number;
  reason?: string | null;
  alternatives?: Array<{ skillUuid: string; confidence: number; reason?: string | null }>;
};

function buildPaginationParams(opts?: PaginationOptions): Record<string, string | number> {
  const params: Record<string, string | number> = {
    page: opts?.page ?? DEFAULT_PAGE,
    size: opts?.size ?? DEFAULT_PAGE_SIZE,
  };
  if (opts?.search && opts.search.trim()) {
    params.search = opts.search.trim();
  }
  return params;
}

export const skillsApi = {
  listCategories: () => http.get<SkillCategoryDto[]>(`${BASE}/skill-categories`),
  listCategoriesPaginated: (opts?: PaginationOptions) => {
    const params = buildPaginationParams(opts);
    return http.get<SkillCategoryPageDto>(`${BASE}/skill-categories`, { params });
  },
  createCategory: (name: string) =>
    http.post<SkillCategoryDto>(`${BASE}/skill-categories`, { name }),
  updateCategory: (uuid: string, name: string) =>
    http.put<SkillCategoryDto>(`${BASE}/skill-categories/${uuid}`, { name }),
  deleteCategory: (uuid: string) =>
    http.delete(`${BASE}/skill-categories/${uuid}`),
  uploadCategoryIcon: (uuid: string, file: File) => {
    const form = new FormData();
    form.append("file", file);
    return http.post<SkillCategoryDto>(`${BASE}/skill-categories/${uuid}/icon`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  listSkills: (categoryUuid?: string) => {
    const params = categoryUuid ? { categoryUuid } : {};
    return http.get<SkillDto[]>(`${BASE}/skills`, { params });
  },
  listSkillsPaginated: (opts?: { categoryUuid?: string; page?: number; size?: number; search?: string }) => {
    const params = buildPaginationParams(opts);
    if (opts?.categoryUuid != null) params.categoryUuid = opts.categoryUuid;
    return http.get<SkillPageDto>(`${BASE}/skills`, { params });
  },
  getSkill: (uuid: string) => http.get<SkillDto>(`${BASE}/skills/${uuid}`),
  createSkill: (data: { name: string; categoryUuid: string; levelMin: number; levelMax: number }) =>
    http.post<SkillDto>(`${BASE}/skills`, data),
  updateSkill: (uuid: string, data: { name: string; categoryUuid: string; levelMin: number; levelMax: number }) =>
    http.put<SkillDto>(`${BASE}/skills/${uuid}`, data),
  deleteSkill: (uuid: string) => http.delete(`${BASE}/skills/${uuid}`),
  uploadSkillIcon: (uuid: string, file: File) => {
    const form = new FormData();
    form.append("file", file);
    return http.post<SkillDto>(`${BASE}/skills/${uuid}/icon`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  addSynonym: (skillUuid: string, alias: string) =>
    http.post(`${BASE}/skills/${skillUuid}/synonyms`, { alias }),
  removeSynonym: (skillUuid: string, alias: string) =>
    http.delete(`${BASE}/skills/${skillUuid}/synonyms`, { params: { alias } }),
  listPendingSkillRequests: (opts?: { page?: number; size?: number; status?: PendingStatus }) => {
    const params = buildPaginationParams(opts);
    if (opts?.status) params.status = opts.status;
    return http.get<PendingSkillRequestPageDto>(`${BASE}/pending-skills`, { params });
  },
  listPendingSkillRequestsAll: () =>
    http.get<PendingSkillRequestDto[]>(`${BASE}/pending-skills`),
  getPendingSkillRequestsCount: () =>
    http.get<{ count: number }>(`${BASE}/pending-skills/count`),
  getPendingSkillRequestsStats: () =>
    http.get<Record<PendingStatus, number>>(`${BASE}/pending-skills/stats`),
  suggestMergeForPendingSkillRequest: (uuid: string) =>
    http.post<PendingMergeSuggestionDto>(`${BASE}/pending-skills/${uuid}/suggest-merge`, {}),
  resolvePendingSkillRequest: (
    uuid: string,
    data: { action: "APPROVE" | "MERGE" | "REJECT"; categoryUuid?: string; existingSkillUuid?: string; adminNotes?: string }
  ) => http.post(`${BASE}/pending-skills/${uuid}/resolve`, data),
};
