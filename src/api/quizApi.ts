import axios from "axios";
import { http } from "./http";

export type EmployeeSkillDto = {
  uuid: string;
  skillUuid: string;
  skillName: string;
  iconUrl?: string | null;
  categoryName: string;
  level: number;
  validatedLevel?: number;
  targetLevel?: number;
  status: string;
  /** ISO local datetime ; present tant que le delai apres un echec n'est pas ecoule */
  quizNextAllowedAt?: string | null;
};

export type QuizKind = "initial" | "progression";

export type QuizQuestion = {
  id: string;
  targetLevel?: number;
  category?: string;
  question: string;
  options: Array<{ key: string; text: string }>;
};

export type QuizStartRequest = {
  skillId: string;
  skillName: string;
  level: number;
  skillStatus?: string;
  quizKind?: QuizKind;
  questionCount: number;
  timeLimitSeconds: number;
};

export type QuizStartResponse = {
  attemptId: number;
  quizTemplateId: number | null;
  quizKind: QuizKind;
  level: number;
  startedAt: string;
  expiresAt: string;
  timeLimitSeconds: number;
  quiz: {
    quizMeta?: Record<string, unknown>;
    skillName?: string;
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
  feedbackStatus: "PENDING" | "GENERATING" | "READY" | "FAILED";
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
    }>;
    overallFeedback?: {
      summary?: string;
      strengths?: string[];
      gaps?: string[];
      nextSteps?: string[];
    };
  };
};

export type QuizSkillStatusSyncRequest = {
  skillUuid: string;
  passed: boolean;
  level?: number | null;
  nextAllowedAt?: string | null;
  quizKind?: QuizKind;
};

type AnswerItem = { questionId: string; answerKey: string };
type ApiResponse<T> = Promise<{ data: T }>;

const LIST_SKILLS_DEDUPE_TTL_MS = 3000;
let listEmployeeSkillsInFlight: ApiResponse<EmployeeSkillDto[]> | null = null;
let listEmployeeSkillsCache: { at: number; value: { data: EmployeeSkillDto[] } } | null = null;

const quizAttemptHttp = axios.create({
  baseURL: import.meta.env.VITE_COMPETENCE_QUIZ_API_URL || "http://127.0.0.1:8002",
});

const ATTEMPT_BASE_PATHS = ["/api/quiz/attempts", "/api/q_attempts"] as const;
let detectedAttemptBasePath: (typeof ATTEMPT_BASE_PATHS)[number] | null = null;

type AttemptPathOptions = {
  retryOnNotFound?: boolean;
};

async function withAttemptBasePath<T>(
  request: (basePath: (typeof ATTEMPT_BASE_PATHS)[number]) => Promise<{ data: T }>,
  options?: AttemptPathOptions,
): Promise<{ data: T }> {
  const retryOnNotFound = options?.retryOnNotFound ?? true;

  if (detectedAttemptBasePath) {
    try {
      return await request(detectedAttemptBasePath);
    } catch (error: any) {
      if (error?.response?.status !== 404) {
        throw error;
      }
      if (!retryOnNotFound) {
        throw error;
      }
      // Reset cached path and probe all known paths again.
      detectedAttemptBasePath = null;
    }
  }

  let lastError: any;
  for (const basePath of ATTEMPT_BASE_PATHS) {
    try {
      const response = await request(basePath);
      detectedAttemptBasePath = basePath;
      return response;
    } catch (error: any) {
      lastError = error;
      if (error?.response?.status !== 404) {
        throw error;
      }
    }
  }

  throw lastError;
}

function wrapData<T>(data: T): { data: T } {
  return { data };
}

export const quizApi = {
  listEmployeeSkills: async (): ApiResponse<EmployeeSkillDto[]> => {
    const now = Date.now();
    if (listEmployeeSkillsCache && now - listEmployeeSkillsCache.at < LIST_SKILLS_DEDUPE_TTL_MS) {
      return listEmployeeSkillsCache.value;
    }

    if (listEmployeeSkillsInFlight) {
      return listEmployeeSkillsInFlight;
    }

    listEmployeeSkillsInFlight = http
      .get<EmployeeSkillDto[]>("/api/employee/me/skills")
      .then((res) => {
        const wrapped = wrapData(Array.isArray(res.data) ? res.data : []);
        listEmployeeSkillsCache = { at: Date.now(), value: wrapped };
        return wrapped;
      })
      .finally(() => {
        listEmployeeSkillsInFlight = null;
      });

    return listEmployeeSkillsInFlight;
  },

  startQuiz: async (payload: QuizStartRequest): ApiResponse<QuizStartResponse> => {
    const res = await withAttemptBasePath((basePath) =>
      quizAttemptHttp.post<QuizStartResponse>(`${basePath}/start`, payload),
    );
    return wrapData(res.data);
  },

  saveAnswers: async (attemptId: number, answers: AnswerItem[]): ApiResponse<{ saved: boolean }> => {
    const res = await withAttemptBasePath((basePath) =>
      quizAttemptHttp.post<{ saved: boolean }>(`${basePath}/${attemptId}/answers`, {
        answers,
      }),
      { retryOnNotFound: false },
    );
    return wrapData(res.data);
  },

  submit: async (attemptId: number, answers: AnswerItem[]): ApiResponse<SubmitResponse> => {
    const res = await withAttemptBasePath((basePath) =>
      quizAttemptHttp.post<SubmitResponse>(`${basePath}/${attemptId}/submit`, {
        answers,
      }),
      { retryOnNotFound: false },
    );
    return wrapData(res.data);
  },

  result: async (attemptId: number): ApiResponse<AttemptResultResponse> => {
    const res = await withAttemptBasePath((basePath) =>
      quizAttemptHttp.get<AttemptResultResponse>(`${basePath}/${attemptId}/result`),
      { retryOnNotFound: false },
    );
    return wrapData(res.data);
  },

  syncSkillStatus: async (payload: QuizSkillStatusSyncRequest): ApiResponse<EmployeeSkillDto> => {
    const res = await http.post<EmployeeSkillDto>("/api/employee/quiz/status", payload);
    return wrapData(res.data);
  },
};
