import { http } from "./http";
import type { AiEvaluationCriterion, AiSubmissionCorrectionResponse } from "./aiApi";
import type { ActivitySubmissionMode, CourseActivityKind } from "./learningProgramApi";

export type TrainingManagerSubmissionSummary = {
  submissionUuid: string;
  enrollmentUuid: string;
  programUuid: string;
  programTitle: string;
  courseUuid: string;
  courseTitle: string;
  activityUuid: string;
  activityTitle: string;
  activityKind: CourseActivityKind;
  submissionMode: ActivitySubmissionMode;
  learnerName: string;
  learnerEmail: string;
  submittedAt: string;
  aiCorrectionReady: boolean;
  humanReviewed: boolean;
  finalScore: number | null;
};

export type TrainingManagerSubmissionDetail = {
  submissionUuid: string;
  enrollmentUuid: string;
  programUuid: string;
  programTitle: string;
  programTargetLevel: number;
  courseUuid: string;
  courseTitle: string;
  activityUuid: string;
  activityTitle: string;
  activityKind: CourseActivityKind;
  submissionMode: ActivitySubmissionMode;
  learningObjective: string | null;
  targetSkill: string | null;
  difficultyLevel: string | null;
  estimatedDuration: string | null;
  expectedSubmissionType: string | null;
  evaluationCriteria: AiEvaluationCriterion[];
  totalPoints: number | null;
  requiredResources: string[];
  learnerTips: string[];
  genericFeedback: string | null;
  tags: string[];
  instructions: string | null;
  resourceUrl: string | null;
  learnerName: string;
  learnerEmail: string;
  learnerSubmissionText: string | null;
  learnerSubmissionFileUrl: string | null;
  submittedAt: string;
  aiCorrection: AiSubmissionCorrectionResponse | null;
  finalScore: number | null;
  finalFeedback: string | null;
  reviewedAt: string | null;
};

export const trainingManagerSubmissionsApi = {
  list: () => http.get<TrainingManagerSubmissionSummary[]>("/api/training-manager/submissions"),
  detail: (submissionUuid: string) =>
    http.get<TrainingManagerSubmissionDetail>(`/api/training-manager/submissions/${submissionUuid}`),
  aiCorrection: (submissionUuid: string) =>
    http.post<AiSubmissionCorrectionResponse>(`/api/training-manager/submissions/${submissionUuid}/ai-correction`, {}),
  review: (submissionUuid: string, payload: { finalScore?: number | null; finalFeedback?: string | null }) =>
    http.post<TrainingManagerSubmissionDetail>(`/api/training-manager/submissions/${submissionUuid}/review`, payload),
};
