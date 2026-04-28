import { http } from "./http";

export type TrainingManagerProfileDto = {
  uuid: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  department: string | null;
  jobTitle: string | null;
  hireDate: string | null;
  avatarUrl: string | null;
};

export const trainingManagerApi = {
  me: () => http.get<TrainingManagerProfileDto>("/api/training-manager/me"),
};
