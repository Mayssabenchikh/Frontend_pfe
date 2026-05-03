import { http } from "./http";

export type UserSkillDetailDto = {
  uuid: string;
  skillUuid: string;
  skillName: string;
  iconUrl: string | null;
  categoryName: string;
  level: number;
  validatedLevel: number;
  targetLevel: number;
  status: string;
  source: string;
  quizNextAllowedAt: string | null;
  lastQuizAt: string | null;
  lastValidatedAt: string | null;
};

export type UserAssignmentDetailDto = {
  uuid: string;
  projectUuid: string;
  projectName: string;
  projectStartDate: string | null;
  projectDueDate: string | null;
  status: string;
  invitedAt: string | null;
  respondedAt: string | null;
  closedAt: string | null;
};

export type UserDetailDto = {
  keycloakId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  enabled: boolean;
  archived: boolean;
  department: string | null;
  jobTitle: string | null;
  phone: string | null;
  hireDate: string | null;
  avatarUrl: string | null;
  emailVerified: boolean | null;
  createdAt: string | null;
  archivedAt: string | null;
  skills: UserSkillDetailDto[];
  assignments: UserAssignmentDetailDto[];
};

export const userDetailApi = {
  adminUser: (keycloakId: string) =>
    http.get<UserDetailDto>(`/api/admin/users/${encodeURIComponent(keycloakId)}/detail`),

  managerProjectTeamMember: (projectUuid: string, employeeKeycloakId: string) =>
    http.get<UserDetailDto>(
      `/api/manager/projects/${encodeURIComponent(projectUuid)}/team/${encodeURIComponent(employeeKeycloakId)}/detail`,
    ),

  employeeProjectTeamMember: (projectUuid: string, employeeKeycloakId: string) =>
    http.get<UserDetailDto>(
      `/api/employee/projects/${encodeURIComponent(projectUuid)}/team/${encodeURIComponent(employeeKeycloakId)}/detail`,
    ),
};
