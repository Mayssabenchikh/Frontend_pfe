import { http } from "./http";

export type VideoSourceType = "RECOMMENDATION" | "MANUAL";
export type QuizGenerationStatus = "PENDING" | "READY" | "FAILED";

export type LearningProgramSummary = {
  uuid: string;
  title: string;
  description: string | null;
  skillUuid: string | null;
  skillName: string | null;
  targetSkillLevel: number;
  published: boolean;
  courseCount: number;
  videoCount: number;
};

export type LearningProgramSummaryPage = {
  items: LearningProgramSummary[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
};

export type LearningVideoDetail = {
  uuid: string;
  youtubeVideoId: string;
  uploadedVideoUrl?: string | null;
  title: string;
  thumbnailUrl: string | null;
  sourceType: VideoSourceType;
  sourcePlaylistUrl: string | null;
  sortOrder: number;
  quizStatus: QuizGenerationStatus;
  questionCount: number | null;
};

export type CourseActivityKind = "EXERCISE" | "PRACTICAL";

export type ActivitySubmissionMode = "TEXT" | "CODE" | "FILE";

export type LearningActivityDetail = {
  uuid: string;
  kind: CourseActivityKind;
  /** Absent sur d’anciennes réponses API : traiter comme TEXT. */
  submissionMode?: ActivitySubmissionMode;
  title: string;
  instructions: string | null;
  resourceUrl: string | null;
  sortOrder: number;
};

export type LearningTextArticleDetail = {
  uuid: string;
  title: string;
  body: string;
  sortOrder: number;
};

export type LearningCourseDetail = {
  uuid: string;
  title: string;
  sortOrder: number;
  videos: LearningVideoDetail[];
  /** Leçons lecture ; absent sur anciennes API → []. */
  textArticles?: LearningTextArticleDetail[];
  activities: LearningActivityDetail[];
};

export type LearningProgramDetail = {
  uuid: string;
  title: string;
  description: string | null;
  skillUuid: string | null;
  skillName: string | null;
  targetSkillLevel: number;
  published: boolean;
  courses: LearningCourseDetail[];
};

export type LearningEnrollmentSummary = {
  enrollmentUuid: string;
  programUuid: string;
  programTitle: string;
  status: string;
  progressPercent: number;
  startedAt: string;
  updatedAt: string;
};

export type LearningPlayerStep = {
  stepKind: "VIDEO" | "TEXT" | "ACTIVITY";
  videoUuid: string | null;
  activityUuid: string | null;
  youtubeVideoId: string;
  uploadedVideoUrl?: string | null;
  title: string;
  thumbnailUrl: string | null;
  sortIndex: number;
  courseUuid?: string | null;
  courseTitle?: string | null;
  /** Numéro de « partie » (module), 1-based. */
  coursePartNumber?: number;
  unlocked: boolean;
  stepDone: boolean;
  quizStatus: QuizGenerationStatus;
  questionCount: number;
  activityInstructions: string | null;
  activityResourceUrl: string | null;
  activityKind: CourseActivityKind | null;
  activitySubmissionMode: ActivitySubmissionMode | null;
  quizCooldownUntil: string | null;
  textArticleUuid?: string | null;
  textArticleBody?: string | null;
};

export type LearningPlayer = {
  enrollmentUuid: string;
  programUuid: string;
  programTitle: string;
  progressPercent: number;
  status: string;
  steps: LearningPlayerStep[];
  programSkillUuid: string | null;
  programSkillName: string | null;
  programTargetSkillLevel: number;
  suggestSkillValidationQuiz: boolean;
};

export type QuizOptionLearner = { optionUuid: string; label: string; sortOrder: number };
export type QuizQuestionLearner = { questionUuid: string; text: string; sortOrder: number; options: QuizOptionLearner[] };
export type VideoQuizLearner = { videoUuid: string; status: QuizGenerationStatus; questions: QuizQuestionLearner[] };

export type SubmitVideoQuizResult = {
  passed: boolean;
  correctCount: number;
  totalQuestions: number;
  scorePercent: number;
  programCompleted: boolean;
  videoQuizCooldownUntil: string | null;
};

export type CompleteActivityResult = {
  completed: boolean;
  programCompleted: boolean;
};

export type LearningAssetUpload = {
  fileUrl: string;
  contentType?: string | null;
  originalFilename?: string | null;
};

export type CourseStepOrderKind = "VIDEO" | "TEXT" | "ACTIVITY";

export type CourseStepOrderItem = {
  kind: CourseStepOrderKind;
  uuid: string;
  sortOrder: number;
};

export const learningProgramApi = {
  listPublished: () => http.get<LearningProgramSummary[]>("/api/trainings"),
  getPublished: (uuid: string) => http.get<LearningProgramDetail>(`/api/trainings/${uuid}`),

  managerList: (params?: { page?: number; size?: number }) =>
    http.get<LearningProgramSummaryPage>("/api/training-manager/trainings", { params }),
  managerGet: (uuid: string) => http.get<LearningProgramDetail>(`/api/training-manager/trainings/${uuid}`),
  managerCreate: (payload: {
    title: string;
    description?: string | null;
    skillUuid?: string | null;
    targetSkillLevel: number;
    published?: boolean;
  }) => http.post<LearningProgramDetail>("/api/training-manager/trainings", payload),
  managerPatch: (uuid: string, payload: Partial<{ title: string; description: string | null; skillUuid: string | null; targetSkillLevel: number; published: boolean }>) =>
    http.patch<LearningProgramDetail>(`/api/training-manager/trainings/${uuid}`, payload),
  managerAddCourse: (programUuid: string, payload: { title: string; sortOrder?: number | null }) =>
    http.post<LearningProgramDetail>(`/api/training-manager/trainings/${programUuid}/courses`, payload),
  managerPatchCourse: (programUuid: string, courseUuid: string, payload: { title?: string; sortOrder?: number }) =>
    http.patch<LearningProgramDetail>(`/api/training-manager/trainings/${programUuid}/courses/${courseUuid}`, payload),
  managerAddVideo: (programUuid: string, courseUuid: string, payload: AddLearningVideoPayload) =>
    http.post<LearningProgramDetail>(`/api/training-manager/trainings/${programUuid}/courses/${courseUuid}/videos`, payload),
  managerPatchVideo: (
    programUuid: string,
    courseUuid: string,
    videoUuid: string,
    payload: Partial<{
      youtubeVideoIdOrUrl: string;
      title: string;
      thumbnailUrl: string | null;
      sourceType: VideoSourceType;
      sourcePlaylistUrl: string | null;
      sortOrder: number;
    }>,
  ) =>
    http.patch<LearningProgramDetail>(
      `/api/training-manager/trainings/${programUuid}/courses/${courseUuid}/videos/${videoUuid}`,
      payload,
    ),
  managerDeleteVideo: (programUuid: string, courseUuid: string, videoUuid: string) =>
    http.delete<LearningProgramDetail>(
      `/api/training-manager/trainings/${programUuid}/courses/${courseUuid}/videos/${videoUuid}`,
    ),
  managerRegenerateQuiz: (programUuid: string, videoUuid: string) =>
    http.post<LearningProgramDetail>(
      `/api/training-manager/trainings/${programUuid}/videos/${videoUuid}/regenerate-quiz`,
      {},
    ),
  managerAddActivity: (
    programUuid: string,
    courseUuid: string,
    payload: {
      kind: CourseActivityKind;
      submissionMode?: ActivitySubmissionMode | null;
      title: string;
      instructions?: string | null;
      resourceUrl?: string | null;
      sortOrder?: number | null;
    },
  ) =>
    http.post<LearningProgramDetail>(
      `/api/training-manager/trainings/${programUuid}/courses/${courseUuid}/activities`,
      payload,
    ),
  managerPatchActivity: (
    programUuid: string,
    courseUuid: string,
    activityUuid: string,
    payload: Partial<{
      kind: CourseActivityKind;
      submissionMode: ActivitySubmissionMode;
      title: string;
      instructions: string | null;
      resourceUrl: string | null;
      sortOrder: number;
    }>,
  ) =>
    http.patch<LearningProgramDetail>(
      `/api/training-manager/trainings/${programUuid}/courses/${courseUuid}/activities/${activityUuid}`,
      payload,
    ),
  managerDeleteActivity: (programUuid: string, courseUuid: string, activityUuid: string) =>
    http.delete<LearningProgramDetail>(
      `/api/training-manager/trainings/${programUuid}/courses/${courseUuid}/activities/${activityUuid}`,
    ),
  managerAddTextArticle: (programUuid: string, courseUuid: string, payload: { title: string; body: string; sortOrder?: number | null }) =>
    http.post<LearningProgramDetail>(
      `/api/training-manager/trainings/${programUuid}/courses/${courseUuid}/text-articles`,
      payload,
    ),
  managerPatchTextArticle: (
    programUuid: string,
    courseUuid: string,
    textArticleUuid: string,
    payload: Partial<{ title: string; body: string; sortOrder: number }>,
  ) =>
    http.patch<LearningProgramDetail>(
      `/api/training-manager/trainings/${programUuid}/courses/${courseUuid}/text-articles/${textArticleUuid}`,
      payload,
    ),
  managerDeleteTextArticle: (programUuid: string, courseUuid: string, textArticleUuid: string) =>
    http.delete<LearningProgramDetail>(
      `/api/training-manager/trainings/${programUuid}/courses/${courseUuid}/text-articles/${textArticleUuid}`,
    ),
  managerReorderCourseSteps: (programUuid: string, courseUuid: string, steps: CourseStepOrderItem[]) =>
    http.patch<LearningProgramDetail>(
      `/api/training-manager/trainings/${programUuid}/courses/${courseUuid}/steps/order`,
      { steps },
    ),
  managerUploadTextAsset: (programUuid: string, file: File) => {
    const form = new FormData();
    form.append("file", file);
    return http.post<LearningAssetUpload>(`/api/training-manager/trainings/${programUuid}/uploads/text-asset`, form);
  },
  managerUploadVideoAsset: (programUuid: string, file: File) => {
    const form = new FormData();
    form.append("file", file);
    return http.post<LearningAssetUpload>(`/api/training-manager/trainings/${programUuid}/uploads/video-asset`, form);
  },
};

export type AddLearningVideoPayload = {
  sourceType: VideoSourceType;
  youtubeVideoIdOrUrl: string;
  title?: string | null;
  thumbnailUrl?: string | null;
  sourcePlaylistUrl?: string | null;
  sortOrder?: number | null;
};

export const employeeLearningProgramApi = {
  my: () => http.get<LearningEnrollmentSummary[]>("/api/employee/learning-programs/my"),
  enroll: (programUuid: string) =>
    http.post<LearningEnrollmentSummary>(`/api/employee/learning-programs/${programUuid}/enroll`),
  player: (enrollmentUuid: string) =>
    http.get<LearningPlayer>(`/api/employee/learning-programs/enrollments/${enrollmentUuid}/player`),
  quiz: (enrollmentUuid: string, videoUuid: string) =>
    http.get<VideoQuizLearner>(`/api/employee/learning-programs/enrollments/${enrollmentUuid}/videos/${videoUuid}/quiz`),
  submitQuiz: (enrollmentUuid: string, videoUuid: string, answers: { questionUuid: string; optionUuid: string }[]) =>
    http.post<SubmitVideoQuizResult>(`/api/employee/learning-programs/enrollments/${enrollmentUuid}/videos/${videoUuid}/quiz-attempts`, {
      answers,
    }),
  submitActivity: (enrollmentUuid: string, activityUuid: string, body: { text?: string | null; fileUrl?: string | null }) =>
    http.post<CompleteActivityResult>(
      `/api/employee/learning-programs/enrollments/${enrollmentUuid}/activities/${activityUuid}/submit`,
      body,
    ),
  uploadActivitySubmission: (enrollmentUuid: string, activityUuid: string, file: File) => {
    const form = new FormData();
    form.append("file", file);
    return http.post<{ fileUrl: string }>(
      `/api/employee/learning-programs/enrollments/${enrollmentUuid}/activities/${activityUuid}/submission-upload`,
      form,
    );
  },
  markTextArticleRead: (enrollmentUuid: string, textArticleUuid: string) =>
    http.post<CompleteActivityResult>(
      `/api/employee/learning-programs/enrollments/${enrollmentUuid}/text-articles/${textArticleUuid}/mark-read`,
      {},
    ),
};
