import { http } from "./http";

export type RecommendationRequest = {
  category: string;
  skillName: string;
  employeeSkillLevel: number;
  targetSkillLevel: number;
};

export type DiscoverCourseCard = {
  trainingUuid: string;
  courseName: string;
  courseLevel: string;
  category: string;
  track: string;
  playlistUrl: string;
  estimatedDurationMinutes: number | null;
  thumbnailUrl: string | null;
};

export type DiscoverCoursesPage = {
  content: DiscoverCourseCard[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
  availableCategories: string[];
  availableTracks: string[];
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

export type SkillRecommendationGroup = {
  category: string;
  skillName: string;
  employeeSkillLevel: number;
  targetSkillLevel: number;
  recommendations: RecommendationItem[];
};

export type EmployeeTrainingProgress = {
  progressUuid: string;
  trainingUuid: string;
  courseName: string;
  courseLevel: string;
  playlistUrl: string;
  progressPercent: number;
  watchedSeconds: number;
  playlistTotalSeconds: number;
  status: "IN_PROGRESS" | "COMPLETED";
  startedAt: string;
  updatedAt: string;
  completedAt: string | null;
};

export type PlaylistVideo = {
  videoId: string;
  title: string;
  thumbnailUrl: string;
};

export const trainingApi = {
  recommendTop3: (payload: RecommendationRequest) =>
    http.post<RecommendationItem[]>("/api/employee/training/recommend", payload),
  /** Recommandations pour l’éditeur de parcours (responsable formation uniquement). */
  trainingManagerRecommendTop3: (payload: RecommendationRequest) =>
    http.post<RecommendationItem[]>("/api/training-manager/training/recommend", payload),
  trainingManagerPlaylistVideos: (playlistUrl: string) =>
    http.get<PlaylistVideo[]>("/api/training-manager/training/playlist-videos", { params: { playlistUrl } }),
  discoverCourses: (params: {
    q?: string;
    category?: string;
    level?: string;
    track?: string;
    minDuration?: number;
    maxDuration?: number;
    page?: number;
    size?: number;
  }) =>
    http.get<DiscoverCoursesPage>("/api/employee/training/discover", { params }),
  recommendFromSkills: (params?: {
    maxPerSkill?: number;
    q?: string;
    level?: string;
    track?: string;
    minHours?: number;
    maxHours?: number;
  }) =>
    http.get<SkillRecommendationGroup[]>("/api/employee/training/recommend/from-skills", {
      params: {
        maxPerSkill: params?.maxPerSkill ?? 3,
        q: params?.q,
        level: params?.level,
        track: params?.track,
        minHours: params?.minHours,
        maxHours: params?.maxHours,
      },
    }),
  startTraining: (trainingUuid: string) =>
    http.post<EmployeeTrainingProgress>("/api/employee/training/start", { trainingUuid }),
  updateProgress: (progressUuid: string, progressPercent: number) =>
    http.patch<EmployeeTrainingProgress>(`/api/employee/training/progress/${progressUuid}`, { progressPercent }),
  watchProgress: (progressUuid: string, videoId: string, watchedSeconds: number) =>
    http.patch<EmployeeTrainingProgress>(`/api/employee/training/progress/${progressUuid}/watch`, { videoId, watchedSeconds }),
  myLearning: () =>
    http.get<EmployeeTrainingProgress[]>("/api/employee/training/my-learning"),
  playlistVideos: (playlistUrl: string) =>
    http.get<PlaylistVideo[]>("/api/employee/training/playlist-videos", { params: { playlistUrl } }),
};
