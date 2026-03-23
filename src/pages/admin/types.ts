export type UserListDto = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  enabled: boolean;
  department?: string | null;
  jobTitle?: string | null;
  phone?: string | null;
  hireDate?: string | null;
  avatarUrl?: string | null;
};

export type ArchivedUserDto = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  department?: string | null;
  jobTitle?: string | null;
  phone?: string | null;
  hireDate?: string | null;
  archivedAt?: string | null;
  avatarUrl?: string | null;
};

export type NavId = "dashboard" | "users" | "archives" | "skills" | "skillRequests" | "skillCategories" | "profile";

export type SkillCategoryDto = { id: number; name: string; skillsCount?: number; sampleSkillNames?: string[] };
export type SkillCategoryPageDto = {
  content: SkillCategoryDto[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
};
export type SkillPageDto = {
  content: SkillDto[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
};
export type SkillDto = {
  id: number;
  name: string;
  categoryId: number;
  categoryName: string;
  levelMin: number;
  levelMax: number;
  synonyms: string[];
};

export type PendingSkillRequestDto = {
  id: number;
  rawSkillName: string;
  requestedByName: string;
  requestedByEmail: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "MERGED" | string;
  resolvedSkillId: number | null;
  resolvedSkillName: string | null;
  adminNotes: string | null;
  createdAt: string;
  resolvedAt: string | null;
};

export type PendingSkillRequestPageDto = {
  content: PendingSkillRequestDto[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
};

export type AdminRole = "MANAGER" | "EMPLOYEE";

export type MessageType = "success" | "error";

export type FlashMessage = { type: MessageType; text: string };

export type TokenParsed = {
  name?: string;
  preferred_username?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  email?: string;
};