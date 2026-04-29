import { http } from "./http";

export type TrainingRecommendation = {
  type: "PROJECT" | "PROGRESSION";
  skillName: string;
  contextName: string | null;
  currentLevel: number;
  targetLevel: number;
  mandatory: boolean;
  priority: "HIGH" | "MEDIUM" | "LOW";
  trainingUuid: string;
  trainingTitle: string;
  playlistUrl: string | null;
  message: string;
};

export const trainingRecommendationApi = {
  getRecommendations: () =>
    http.get<TrainingRecommendation[]>("/api/employee/training/recommendations"),
};
