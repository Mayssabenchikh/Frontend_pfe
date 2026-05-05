import { http } from "./http";

export type AiEvaluationCriterion = {
  criterion: string;
  description?: string | null;
  points: number;
};

export type AiActivitySuggestionRequest = {
  formationTitle: string;
  formationDescription?: string | null;
  skills?: string[];
  targetLevel: string;
  moduleTitle?: string | null;
  subModuleTitle?: string | null;
  contentType: string;
  submissionType: string;
  learningObjective?: string | null;
  estimatedDuration?: string | null;
  existingInstructions?: string | null;
};

export type AiActivitySuggestionResponse = {
  title: string;
  description: string;
  instructions: string;
  learningObjective: string;
  targetSkill: string;
  difficultyLevel: "beginner" | "intermediate" | "advanced" | string;
  estimatedDuration: string;
  expectedSubmissionType: string;
  evaluationCriteria: AiEvaluationCriterion[];
  totalPoints: number;
  requiresHumanReview: boolean;
};

export type AiSubmissionCorrectionRequest = {
  instructions: string;
  learningObjective?: string | null;
  skills?: string[];
  targetLevel: string;
  evaluationCriteria?: AiEvaluationCriterion[];
  totalPoints: number;
  submissionType: string;
  learnerSubmission: string;
};

export type AiSubmissionCorrectionResponse = {
  suggestedScore: number;
  maxScore: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  mistakes: string[];
  acquiredSkills: string[];
  skillsToImprove: string[];
  personalizedFeedback: string;
  recommendations: string[];
  confidenceLevel: "low" | "medium" | "high" | string;
  requiresHumanReview: boolean;
};

export const aiApi = {
  activitySuggestion: (payload: AiActivitySuggestionRequest) =>
    http.post<AiActivitySuggestionResponse>("/api/ai/activity-suggestion", payload),
  exerciseSuggestion: (payload: AiActivitySuggestionRequest) =>
    http.post<AiActivitySuggestionResponse>("/api/ai/exercise-suggestion", payload),
  submissionCorrection: (payload: AiSubmissionCorrectionRequest) =>
    http.post<AiSubmissionCorrectionResponse>("/api/ai/submission-correction", payload),
};
