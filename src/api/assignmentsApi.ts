import { http } from "./http";

export type AssignmentStatus = "PENDING" | "ACCEPTED" | "REFUSED" | "REMOVED";

export type AssignmentDto = {
  uuid: string;
  projectUuid: string;
  projectName: string;
  projectStartDate: string | null;
  projectDueDate: string | null;
  employeeKeycloakId: string;
  employeeEmail: string;
  employeeName: string;
  employeeAvatarUrl: string | null;
  status: AssignmentStatus;
  invitedAt: string;
  respondedAt: string | null;
  closedAt: string | null;
};

export type AssignmentEventAction = "ASSIGNED" | "ACCEPTED" | "REFUSED" | "REMOVED";

export type AssignmentEventDto = {
  uuid: string;
  assignmentUuid: string;
  projectUuid: string;
  projectName: string | null;
  employeeKeycloakId: string;
  employeeEmail: string;
  employeeName: string;
  action: AssignmentEventAction;
  actorKeycloakId: string;
  actorRole: string;
  reason: string | null;
  snapshotRank: number | null;
  snapshotMatchScore: number | null;
  snapshotConfidenceScore: number | null;
  createdAt: string;
};

export type PageDto<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
};

export type EmployeeAcceptedAssignmentsCountDto = {
  count: number;
  max: number;
  reached: boolean;
};

export const assignmentsApi = {
  listProjectAssignments: (projectUuid: string) =>
    http.get<AssignmentDto[]>(`/api/manager/projects/${projectUuid}/assignments`),

  invite: (projectUuid: string, employeeKeycloakId: string) =>
    http.post<AssignmentDto>(`/api/manager/projects/${projectUuid}/assignments/invite`, { employeeKeycloakId }),

  remove: (assignmentUuid: string, reason: string) =>
    http.post<AssignmentDto>(`/api/manager/projects/assignments/${assignmentUuid}/remove`, { reason }),

  employeeAcceptedAssignmentsCount: (employeeKeycloakId: string) =>
    http.get<EmployeeAcceptedAssignmentsCountDto>(
      `/api/manager/projects/assignments/employee/${encodeURIComponent(employeeKeycloakId)}/accepted-count`,
    ),

  myAssignments: (params?: { project?: string; from?: string; to?: string; order?: string; page?: number; size?: number }) =>
    http.get<PageDto<AssignmentDto>>(`/api/employee/assignments`, { params }),

  adminEvents: (params?: { project?: string; employee?: string; page?: number; size?: number }) =>
    http.get(`/api/admin/assignments/events`, { params }),

  managerEvents: (params?: { project?: string; employee?: string; page?: number; size?: number }) =>
    http.get(`/api/manager/assignments/events`, { params }),
};
