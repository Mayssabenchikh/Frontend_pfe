export type UserListDto = {
  uuid: string;
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
  uuid: string;
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

export type NavId =
  | "dashboard"
  | "users"
  | "archives"
  | "projects"
  | "skills"
  | "skillRequests"
  | "skillCategories"
  | "assignments"
  | "profile";

export type SkillCategoryDto = { uuid: string; name: string; iconUrl?: string | null; skillsCount?: number; sampleSkillNames?: string[] };
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
  uuid: string;
  name: string;
  iconUrl?: string | null;
  categoryUuid: string;
  categoryName: string;
  levelMin: number;
  levelMax: number;
  synonyms: string[];
};

export type PendingSkillRequestDto = {
  uuid: string;
  rawSkillName: string;
  requestedByName: string;
  requestedByEmail: string;
  requestersCount: number;
  requesters: {
    keycloakId: string;
    name: string;
    email: string;
    requestedAt: string | null;
  }[];
  status: "PENDING" | "APPROVED" | "REJECTED" | "MERGED" | string;
  resolvedSkillUuid: string | null;
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

export type AdminRole = "MANAGER" | "EMPLOYEE" | "TRAINING_MANAGER";

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
