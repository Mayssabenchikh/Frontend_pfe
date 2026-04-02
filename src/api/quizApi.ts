import { http } from "./http";

export type EmployeeSkillDto = {
  id: number;
  skillId: number;
  skillName: string;
  categoryName: string;
  level: number;
  status: string;
  source: string;
};

export type QuizMode = "placement" | "official";

export type QuizQuestion = {
  id: string;
  targetLevel?: number;
  category?: string;
  question: string;
  options: Array<{ key: string; text: string }>;
};

export type QuizStartResponse = {
  attemptId: number;
  quizTemplateId: number | null;
  mode: QuizMode;
  level: number;
  startedAt: string;
  expiresAt: string;
  timeLimitSeconds: number;
  quiz: {
    quizMeta?: Record<string, unknown>;
    questions: QuizQuestion[];
  };
};

export type SubmitResponse = {
  attemptId: number;
  status: string;
  scorePercent: number;
  passed: boolean;
  submittedAt: string;
  nextAllowedAt?: string | null;
};

export type AttemptResultResponse = {
  attemptId: number;
  status: string;
  level: number;
  scorePercent: number;
  passed: boolean;
  submittedAt: string;
  nextAllowedAt?: string | null;
  feedbackStatus: "PENDING" | "READY" | "FAILED";
  result: {
    totalQuestions: number;
    correctAnswers: number;
    scorePercent: number;
    passed: boolean;
    perQuestion: Array<{
      questionId: string;
      correctAnswerKey: string;
      userAnswerKey: string;
      isCorrect: boolean;
    }>;
  };
  feedback?: {
    perQuestion?: Array<{
      questionId: string;
      explanation: string;
      recommendation: string;
    }>;
    overallFeedback?: {
      summary?: string;
      strengths?: string[];
      gaps?: string[];
      nextSteps?: string[];
    };
  };
};

type AnswerItem = { questionId: string; answerKey: string };

export const quizApi = {
  listEmployeeSkills: () => http.get<EmployeeSkillDto[]>("/api/employee/me/skills"),
  startQuiz: (payload: {
    skillId: number;
    mode: QuizMode;
    questionCount: number;
    timeLimitSeconds: number;
  }) => http.post<QuizStartResponse>("/api/employee/quizzes/start", payload),
  saveAnswers: (attemptId: number, answers: AnswerItem[]) =>
    http.patch<{ saved: boolean }>(`/api/employee/quizzes/${attemptId}/answers`, { answers }),
  submit: (attemptId: number, answers: AnswerItem[]) =>
    http.post<SubmitResponse>(`/api/employee/quizzes/${attemptId}/submit`, { answers }),
  result: (attemptId: number) =>
    http.get<AttemptResultResponse>(`/api/employee/quizzes/${attemptId}/result`),
};
