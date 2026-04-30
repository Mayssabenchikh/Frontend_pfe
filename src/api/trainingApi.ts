import { http } from "./http";

export type RecommendationRequest = {
  category: string;
  skillName: string;
  employeeSkillLevel: number;
  targetSkillLevel: number;
};

export type RecommendationItem = {
  trainingUuid: string;
  category: string;
  skillName: string;
  employeeSkillLevel: number;
  targetSkillLevel: number;
  courseName: string;
  courseLevel: string;
  playlistUrl: string;
  score: number;
  estimatedDurationHours: number | null;
};

export type PlaylistVideo = {
  videoId: string;
  title: string;
  thumbnailUrl: string;
};

export const trainingApi = {
  /** Recommandations pour l’éditeur de parcours (responsable formation uniquement). */
  trainingManagerRecommendTop3: (payload: RecommendationRequest) =>
    http.post<RecommendationItem[]>("/api/training-manager/training/recommend", payload),
  trainingManagerPlaylistVideos: (playlistUrl: string) =>
    http.get<PlaylistVideo[]>("/api/training-manager/training/playlist-videos", { params: { playlistUrl } }),
};
