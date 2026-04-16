import { http } from "./http";

export type AssignmentStatus = "PENDING" | "ACCEPTED" | "REFUSED" | "REMOVED";

export type AssignmentDto = {
  id: number;
  projectId: number;
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
  id: number;
  assignmentId: number;
  projectId: number;
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

export const assignmentsApi = {
  listProjectAssignments: (projectId: number) =>
    http.get<AssignmentDto[]>(`/api/manager/projects/${projectId}/assignments`),

  invite: (projectId: number, employeeKeycloakId: string) =>
    http.post<AssignmentDto>(`/api/manager/projects/${projectId}/assignments/invite`, { employeeKeycloakId }),

  remove: (assignmentId: number, reason: string) =>
    http.post<AssignmentDto>(`/api/manager/projects/assignments/${assignmentId}/remove`, { reason }),

  myPending: (params?: { project?: string; from?: string; to?: string; order?: string; page?: number; size?: number }) =>
    http.get<PageDto<AssignmentDto>>(`/api/employee/assignments/pending`, { params }),
  accept: (assignmentId: number) => http.post<AssignmentDto>(`/api/employee/assignments/${assignmentId}/accept`, {}),
  refuse: (assignmentId: number, reason: string) =>
    http.post<AssignmentDto>(`/api/employee/assignments/${assignmentId}/refuse`, { reason }),

  adminEvents: (params?: { project?: string; employee?: string; page?: number; size?: number }) =>
    http.get(`/api/admin/assignments/events`, { params }),

  managerEvents: (params?: { project?: string; employee?: string; page?: number; size?: number }) =>
    http.get(`/api/manager/assignments/events`, { params }),
};

