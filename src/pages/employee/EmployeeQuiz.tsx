import { useEffect, useMemo, useRef, useState } from "react";
import {
  BoltIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowPathIcon,
  ChevronDownIcon,
  PaperAirplaneIcon,
} from "@heroicons/react/24/outline";
import { quizApi, type AttemptResultResponse, type EmployeeSkillDto, type QuizStartResponse } from "../../api/quizApi.ts";
import { getSkillIconUrl } from "../admin/skillIcons";
import { AlertBanner } from "../../components/AlertBanner";
import { AlertModal } from "../../components/AlertModal";
import { ConfirmModal } from "../../components/ConfirmModal";

type QuizPhase = "setup" | "in_progress" | "submitted";

const QUESTION_COUNT = 20;
const TIME_LIMIT_SECONDS = 15 * 60;
const MIN_START_LOADING_MS = 600;
const QUIZ_FAIL_COOLDOWN_DAYS = 15;

function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function isConflictError(error: any) {
  return error?.response?.status === 409;
}

function readApiError(error: any, fallback: string): { status?: number; code?: string; message: string } {
  const status = error?.response?.status;
  const data = error?.response?.data;
  const detail = data?.detail;

  const code =
    detail && typeof detail === "object" && typeof detail.error_code === "string"
      ? detail.error_code
      : undefined;

  const message =
    (typeof data?.error === "string" && data.error.trim()) ||
    (typeof detail === "string" && detail.trim()) ||
    (detail && typeof detail === "object" && typeof detail.message === "string" && detail.message.trim()) ||
    fallback;

  return { status, code, message };
}

function mapQuizStartError(status: number | undefined, code: string | undefined, message: string): string {
  if (status === 502 && code === "QUIZ_UPSTREAM_TIMEOUT") {
    return "Le service de génération est temporairement lent. Réessayez dans quelques instants.";
  }
  if (status === 502 && code === "QUIZ_INVALID_MODEL_OUTPUT") {
    return "Le quiz généré est invalide pour le moment. Relancez la génération.";
  }
  if (status === 500 && code === "QUIZ_INTERNAL_ERROR") {
    return "Une erreur interne est survenue pendant la génération du quiz.";
  }
  return message;
}

function formatTime(total: number) {
  const safe = Math.max(0, total);
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function getRemainingSeconds(expiresAt?: string | null) {
  if (!expiresAt) return 0;
  const ms = new Date(expiresAt).getTime() - Date.now();
  return Math.max(0, Math.floor(ms / 1000));
}

function circularStroke(score: number) {
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, score));
  const offset = circumference - (clamped / 100) * circumference;
  return { radius, circumference, offset };
}

function isQuizCooldownActive(quizNextAllowedAt?: string | null): boolean {
  if (!quizNextAllowedAt) return false;
  const t = new Date(quizNextAllowedAt).getTime();
  if (Number.isNaN(t)) return false;
  return t > Date.now();
}

function formatFrenchDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("fr-FR", { dateStyle: "long", timeStyle: "short" });
}

function formatFrenchDate(iso?: string | null): string {
  if (!iso) return "À planifier";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("fr-FR", { dateStyle: "long" });
}

function statusToFrench(status?: string | null): string {
  const raw = String(status ?? "").toUpperCase();
  if (raw === "VALIDATED") return "Validé";
  if (raw === "FAILED") return "Échoué";
  if (raw === "QUIZ_PENDING") return "Quiz en attente";
  if (raw === "EXTRACTED") return "Extrait";
  if (raw === "IN_PROGRESS") return "En cours";
  return raw || "Inconnu";
}

function formatSkillLevelLabel(
  level?: number | null,
  status?: string | null,
  validatedLevel?: number | null,
  targetLevel?: number | null,
): string {
  const numericLevel = Number.isFinite(level) ? Number(level) : 0;
  const validated = Number.isFinite(validatedLevel) ? Number(validatedLevel) : 0;
  const target = Number.isFinite(targetLevel) ? Number(targetLevel) : numericLevel;
  const rawStatus = String(status ?? "").toUpperCase();
  if (rawStatus === "EXTRACTED") {
    return "Niveau non évalué";
  }
  if (rawStatus === "QUIZ_PENDING") {
    if (validated > 0) {
      return `Validé L${validated} · Cible L${Math.max(validated, target)} (en attente)`;
    }
    return `Niveau cible L${Math.max(1, target)} (en attente de validation)`;
  }
  if (numericLevel <= 0) {
    return "Niveau en attente";
  }
  return `Expertise Niveau ${numericLevel}`;
}

function levelUsedForQuizStart(skill?: EmployeeSkillDto | null): number {
  if (!skill) return 1;
  const status = String(skill.status ?? "").toUpperCase();
  const validated = Number(skill.validatedLevel ?? 0) || 0;
  const target = Number(skill.targetLevel ?? skill.level ?? 0) || 0;
  if (status === "EXTRACTED" || status === "QUIZ_PENDING") {
    return Math.max(1, target || 1);
  }
  return Math.max(1, validated || target || 1);
}

function quizKindForSkill(skill?: EmployeeSkillDto | null): QuizStartResponse["quizKind"] | undefined {
  if (!skill) return undefined;
  const status = String(skill.status ?? "").toUpperCase();
  if (status === "EXTRACTED" || status === "QUIZ_PENDING") {
    return "initial";
  }
  return "progression";
}

export function EmployeeQuiz() {
  const [skills, setSkills] = useState<EmployeeSkillDto[]>([]);
  const [loadingSkills, setLoadingSkills] = useState(true);
  const [phase, setPhase] = useState<QuizPhase>("setup");
  const [selectedSkillId, setSelectedSkillId] = useState<number | null>(null);
  const [startData, setStartData] = useState<QuizStartResponse | null>(null);
  const [result, setResult] = useState<AttemptResultResponse | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [activeQuestion, setActiveQuestion] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [starting, setStarting] = useState(false);
  const [generationElapsedSeconds, setGenerationElapsedSeconds] = useState(0);
  const [openedReviewQuestionId, setOpenedReviewQuestionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cooldownAlertMessage, setCooldownAlertMessage] = useState<string | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [quitConfirmOpen, setQuitConfirmOpen] = useState(false);
  const submitLockRef = useRef(false);

  useEffect(() => {
    setLoadingSkills(true);
    quizApi
      .listEmployeeSkills()
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : [];
        setSkills(data);
        if (!selectedSkillId && data.length) {
          setSelectedSkillId(data[0].skillId);
        }
      })
      .catch(() => setSkills([]))
      .finally(() => setLoadingSkills(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (phase !== "in_progress" || !startData) return;
    setRemainingSeconds(getRemainingSeconds(startData.expiresAt));
    const interval = window.setInterval(() => {
      setRemainingSeconds((prev) => {
        const next = prev - 1;
        if (next <= 0) {
          window.clearInterval(interval);
          handleAutoEnd();
          return 0;
        }
        return next;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [phase, startData]);

  useEffect(() => {
    if (!starting) {
      setGenerationElapsedSeconds(0);
      return;
    }
    const interval = window.setInterval(() => {
      setGenerationElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => window.clearInterval(interval);
  }, [starting]);

  useEffect(() => {
    if (
      phase !== "submitted" ||
      !startData ||
      !result ||
      (result.feedbackStatus !== "PENDING" && result.feedbackStatus !== "GENERATING")
    ) {
      return;
    }
    const interval = window.setInterval(async () => {
      try {
        const res = await quizApi.result(startData.attemptId);
        setResult(res.data);
        if (res.data.feedbackStatus === "READY" || res.data.feedbackStatus === "FAILED") {
          window.clearInterval(interval);
        }
      } catch {
        window.clearInterval(interval);
      }
    }, 5000);
    return () => window.clearInterval(interval);
  }, [phase, startData, result]);

  const selectedSkill = useMemo(
    () => skills.find((s) => s.skillId === selectedSkillId) ?? null,
    [skills, selectedSkillId],
  );
  const setupPrimarySkill = selectedSkill ?? skills[0] ?? null;
  const setupSecondarySkills = useMemo(
    () => skills.filter((s) => !setupPrimarySkill || s.skillId !== setupPrimarySkill.skillId),
    [skills, setupPrimarySkill],
  );
  const quizCooldownActive = useMemo(
    () => isQuizCooldownActive(selectedSkill?.quizNextAllowedAt),
    [selectedSkill],
  );

  

  const questions = startData?.quiz?.questions ?? [];
  const answeredCount = useMemo(
    () => questions.filter((q) => Boolean(answers[q.id])).length,
    [questions, answers],
  );
  const currentQuestion = questions[activeQuestion];
  const isLastQuestion = activeQuestion === questions.length - 1;
  const hasCurrentAnswer = currentQuestion ? Boolean(answers[currentQuestion.id]) : false;
  const isUrgent = remainingSeconds <= 120;
  const unansweredCount = Math.max(questions.length - answeredCount, 0);
  const currentCorrectAnswers = result?.result?.correctAnswers ?? 0;
  const reviewCount = result?.result ? Math.max(answeredCount - currentCorrectAnswers, 0) : unansweredCount;

  const score = result?.scorePercent ?? 0;
  const ring = circularStroke(score);
  const roundedScore = Math.round(score);
  const scoreStatusLabel = roundedScore >= 70 ? "Quiz validé" : "Résultat à renforcer";
  const scoreStatusClass = roundedScore >= 70 ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700";

  /** Détails par question : feedback IA si présent, sinon correction locale (scores + libellés des options). */
  const perQuestionInsights = useMemo(() => {
    const fromAi = result?.feedback?.perQuestion;
    if (fromAi && fromAi.length > 0) {
      return fromAi;
    }
    const scored = result?.result?.perQuestion ?? [];
    const quizQuestions = startData?.quiz?.questions ?? [];
    if (!scored.length || !quizQuestions.length) {
      return [];
    }
    return scored.map((row) => {
      const explanation = row.isCorrect
        ? "Bonne réponse sur cette question."
        : row.userAnswerKey
          ? "Réponse incorrecte. Revoyez cette notion avant une nouvelle tentative."
          : "Vous n'avez pas répondu à cette question.";
      return { questionId: row.questionId, explanation };
    });
  }, [result, startData]);

  const submittedQuestionCards = useMemo(() => {
    if (!result || !startData) return [];

    const feedbackByQuestionId = new Map(
      perQuestionInsights.map((item) => [item.questionId, item] as const),
    );

    return (result.result?.perQuestion ?? []).map((scoreItem, index) => {
      const quizQuestion = startData.quiz.questions.find((q) => q.id === scoreItem.questionId);
      const correctOption = quizQuestion?.options?.find((o) => o.key === scoreItem.correctAnswerKey);
      const userOption = quizQuestion?.options?.find((o) => o.key === scoreItem.userAnswerKey);
      const insight = feedbackByQuestionId.get(scoreItem.questionId);

      return {
        index,
        questionId: scoreItem.questionId,
        isCorrect: scoreItem.isCorrect,
        questionText: quizQuestion?.question || "Question indisponible",
        correctText: `${scoreItem.correctAnswerKey}${correctOption?.text ? ` - ${correctOption.text}` : ""}`,
        userText: scoreItem.userAnswerKey
          ? `${scoreItem.userAnswerKey}${userOption?.text ? ` - ${userOption.text}` : ""}`
          : "Aucune réponse",
        explanation: insight?.explanation || "",
      };
    });
  }, [result, startData, perQuestionInsights]);

  async function fetchResultWithRetry(attemptId: number, retries = 5, delayMs = 700) {
    let lastError: any;
    for (let i = 0; i < retries; i += 1) {
      try {
        return await quizApi.result(attemptId);
      } catch (e: any) {
        lastError = e;
        if (!isConflictError(e) || i === retries - 1) {
          throw e;
        }
        await sleep(delayMs);
      }
    }
    throw lastError;
  }

  async function startQuiz() {
    if (!selectedSkillId || starting) return;
    if (quizCooldownActive && selectedSkill?.quizNextAllowedAt) {
      setCooldownAlertMessage(
        [
          `Prochaine tentative autorisée après le ${formatFrenchDateTime(selectedSkill.quizNextAllowedAt)}.`,
          "",
          `Après un score inférieur à 70 %, un délai de ${QUIZ_FAIL_COOLDOWN_DAYS} jours est obligatoire avant une nouvelle tentative.`,
        ].join("\n"),
      );
      return;
    }

    setError(null);
    setStarting(true);
    const loadingStartedAt = Date.now();
    try {
      const res = await quizApi.startQuiz({
        skillId: selectedSkillId,
        skillName: selectedSkill?.skillName || "Compétence",
        level: levelUsedForQuizStart(selectedSkill),
        skillStatus: selectedSkill?.status,
        quizKind: quizKindForSkill(selectedSkill),
        questionCount: QUESTION_COUNT,
        timeLimitSeconds: TIME_LIMIT_SECONDS,
      });
      const startedQuestions = res.data?.quiz?.questions ?? [];
      if (!startedQuestions.length) {
        setError("Le quiz généré est vide ou invalide. Veuillez relancer.");
        return;
      }
      setStartData(res.data);
      setAnswers({});
      setResult(null);
      setActiveQuestion(0);
      setOpenedReviewQuestionId(null);
      setPhase("in_progress");
      setRemainingSeconds(getRemainingSeconds(res.data.expiresAt));
    } catch (e: any) {
      const parsed = readApiError(e, "Impossible de démarrer le quiz");
      const status = parsed.status;
      const rawMessage = parsed.message;
      const message = mapQuizStartError(status, parsed.code, rawMessage);
      if (status === 409) {
        const cooldownConflict = /cooldown|nextAllowedAt|prochaine tentative|15 jours/i.test(String(rawMessage));
        setCooldownAlertMessage(
          cooldownConflict
            ? [
                rawMessage,
                "",
                `Après un score inférieur à 70 %, un délai de ${QUIZ_FAIL_COOLDOWN_DAYS} jours est obligatoire avant une nouvelle tentative.`,
              ].join("\n")
            : rawMessage,
        );
        setError(null);
        return;
      }
      setError(message);
    } finally {
      const elapsed = Date.now() - loadingStartedAt;
      if (elapsed < MIN_START_LOADING_MS) {
        await sleep(MIN_START_LOADING_MS - elapsed);
      }
      setStarting(false);
    }
  }

  async function saveSingleAnswer(questionId: string, answerKey: string) {
    if (!startData) return;
    try {
      await quizApi.saveAnswers(startData.attemptId, [{ questionId, answerKey }]);
    } catch {
      // autosave best effort
    }
  }

  function pickAnswer(questionId: string, answerKey: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: answerKey }));
    void saveSingleAnswer(questionId, answerKey);
  }

  useEffect(() => {
    if (phase !== "in_progress" || !currentQuestion) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey) return;

      const target = event.target as HTMLElement | null;
      if (target) {
        const tag = target.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable) {
          return;
        }
      }

      if (event.key === "Enter") {
        if (activeQuestion >= questions.length - 1 || !answers[currentQuestion.id]) return;
        event.preventDefault();
        setActiveQuestion((v) => Math.min(questions.length - 1, v + 1));
        return;
      }

      const pressed = event.key.toUpperCase();
      if (pressed !== "A" && pressed !== "B" && pressed !== "C" && pressed !== "D") return;

      const matched = currentQuestion.options.find((option) => option.key.toUpperCase() === pressed);
      if (!matched) return;

      event.preventDefault();
      pickAnswer(currentQuestion.id, matched.key);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [phase, currentQuestion, activeQuestion, questions.length, answers]);

  async function syncSkillStatusAfterQuiz(
    quizResult: AttemptResultResponse,
    quizKind?: QuizStartResponse["quizKind"],
  ) {
    if (!selectedSkillId) return;
    try {
      const isProgressionQuiz = quizKind === "progression";
      const fallbackNextAllowedAt = !quizResult.passed && isProgressionQuiz
        ? (quizResult.nextAllowedAt ?? new Date(Date.now() + QUIZ_FAIL_COOLDOWN_DAYS * 24 * 60 * 60 * 1000).toISOString())
        : null;

      const res = await quizApi.syncSkillStatus({
        skillId: selectedSkillId,
        passed: quizResult.passed,
        level: quizResult.level,
        nextAllowedAt: fallbackNextAllowedAt,
        quizKind,
      });
      const updated = res.data;
      setSkills((prev) => prev.map((s) => (s.skillId === updated.skillId ? updated : s)));
    } catch {
      // keep quiz UX responsive even if status sync fails
    }
  }

  async function handleSubmit() {
    if (!startData || submitting || submitLockRef.current) return;
    submitLockRef.current = true;
    setSubmitting(true);
    setError(null);
    try {
      const payload = Object.entries(answers).map(([questionId, answerKey]) => ({ questionId, answerKey }));
      await quizApi.submit(startData.attemptId, payload);
      const resultRes = await fetchResultWithRetry(startData.attemptId);
      setResult(resultRes.data);
      setOpenedReviewQuestionId(resultRes.data.result?.perQuestion?.[0]?.questionId ?? null);
      await syncSkillStatusAfterQuiz(resultRes.data, startData.quizKind);
      setPhase("submitted");
    } catch (e: any) {
      const parsed = readApiError(e, "Soumission impossible");
      if (parsed.status === 404) {
        try {
          const resultRes = await fetchResultWithRetry(startData.attemptId, 12, 800);
          setResult(resultRes.data);
          setOpenedReviewQuestionId(resultRes.data.result?.perQuestion?.[0]?.questionId ?? null);
          await syncSkillStatusAfterQuiz(resultRes.data, startData.quizKind);
          setPhase("submitted");
          return;
        } catch {
          setError("Tentative introuvable côté service quiz. Relancez un nouveau quiz.");
          return;
        }
      }
      setError(parsed.message);
    } finally {
      setSubmitting(false);
      submitLockRef.current = false;
    }
  }

  async function handleAutoEnd() {
    if (!startData || submitting || submitLockRef.current) return;
    submitLockRef.current = true;
    setSubmitting(true);
    setError(null);
    try {
      const payload = Object.entries(answers).map(([questionId, answerKey]) => ({ questionId, answerKey }));

      try {
        await quizApi.submit(startData.attemptId, payload);
      } catch (e: any) {
        if (!isConflictError(e)) {
          throw e;
        }
      }

      const resultRes = await fetchResultWithRetry(startData.attemptId);
      setResult(resultRes.data);
      setOpenedReviewQuestionId(resultRes.data.result?.perQuestion?.[0]?.questionId ?? null);
      await syncSkillStatusAfterQuiz(resultRes.data, startData.quizKind);
      setPhase("submitted");
    } catch (e: any) {
      const parsed = readApiError(e, "Attendez la finalisation automatique");
      if (parsed.status === 404) {
        try {
          const resultRes = await fetchResultWithRetry(startData.attemptId, 12, 800);
          setResult(resultRes.data);
          setOpenedReviewQuestionId(resultRes.data.result?.perQuestion?.[0]?.questionId ?? null);
          await syncSkillStatusAfterQuiz(resultRes.data, startData.quizKind);
          setPhase("submitted");
          return;
        } catch {
          setError("Impossible de récupérer le résultat automatique. Relancez un nouveau quiz.");
          return;
        }
      }
      setError(parsed.message);
    } finally {
      setSubmitting(false);
      submitLockRef.current = false;
    }
  }

  async function resetFlow() {
    setPhase("setup");
    setStartData(null);
    setResult(null);
    setAnswers({});
    setActiveQuestion(0);
    setOpenedReviewQuestionId(null);
    setRemainingSeconds(0);
    setError(null);
    try {
      const res = await quizApi.listEmployeeSkills();
      const data = Array.isArray(res.data) ? res.data : [];
      setSkills(data);
    } catch {
      /* ignore */
    }
  }

  function quitInProgressQuiz() {
    setQuitConfirmOpen(false);
    setPhase("setup");
    setStartData(null);
    setResult(null);
    setAnswers({});
    setActiveQuestion(0);
    setOpenedReviewQuestionId(null);
    setRemainingSeconds(0);
    setError(null);
    setSubmitting(false);
    submitLockRef.current = false;
  }

  function statusBadge(status: string) {
    const raw = String(status ?? "").toUpperCase();
    const label = statusToFrench(raw);
    if (raw === "VALIDATED") {
      return { label, className: "bg-emerald-100 text-emerald-700" };
    }
    if (raw === "FAILED") {
      return { label, className: "bg-rose-100 text-rose-700" };
    }
    if (raw === "QUIZ_PENDING" || raw === "EXTRACTED") {
      return { label, className: "bg-amber-100 text-amber-700" };
    }
    return { label, className: "bg-slate-100 text-slate-700" };
  }

  function resolveSkillIconUrl(skill: EmployeeSkillDto): string | null {
    return skill.iconUrl || getSkillIconUrl(skill.skillName);
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col" style={{ background: "var(--luxury-light-bg, #f8f7ff)" }}>
      <div
        className={[
          "relative flex min-h-0 flex-1 flex-col p-4 md:px-6 md:pt-6",
          phase === "setup" ? "gap-4 overflow-hidden pb-0 md:pb-0" : "gap-6 overflow-auto md:pb-6",
        ].join(" ")}
      >
      {error && (
        <AlertBanner message={error} />
      )}

      {phase === "setup" && (
        <section className="quiz-enter space-y-4 lg:flex lg:min-h-0 lg:flex-1 lg:flex-col lg:overflow-hidden">
          <div className="quiz-enter quiz-enter-delay-1">
            <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-3xl font-bold tracking-tight text-slate-900">Quiz de positionnement</h2>
                         </div>
              <p className="text-sm text-slate-600">
              Passez un quiz par compétence pour déterminer précisément votre niveau technique actuel.
            </p>
          </div>

          <div className="min-h-[460px] lg:min-h-0 lg:flex-1">
            <div className="quiz-enter quiz-enter-delay-1 flex min-h-0 flex-col gap-4">

            {setupPrimarySkill ? (
              <div className="rounded-3xl border border-violet-100/80 bg-white p-5 shadow-md shadow-violet-100/50">
                <button
                  type="button"
                  onClick={() => setSelectedSkillId(setupPrimarySkill.skillId)}
                  className="w-full text-left"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                        {(() => {
                          const iconUrl = resolveSkillIconUrl(setupPrimarySkill);
                          return iconUrl ? (
                            <img src={iconUrl} alt="" className="h-6 w-6 object-contain" />
                          ) : (
                            <BoltIcon className="h-5 w-5" />
                          );
                        })()}
                      </div>
                      <div>
                        <p className="text-2xl font-semibold text-slate-900">{setupPrimarySkill.skillName}</p>
                        <p className="text-sm text-slate-500">
                          {formatSkillLevelLabel(
                            setupPrimarySkill.level,
                            setupPrimarySkill.status,
                            setupPrimarySkill.validatedLevel,
                            setupPrimarySkill.targetLevel,
                          )}
                        </p>
                      </div>
                    </div>
                    {(() => {
                      const badge = statusBadge(setupPrimarySkill.status);
                      return <span className={["rounded-full px-3 py-1 text-xs font-semibold", badge.className].join(" ")}>{badge.label}</span>;
                    })()}
                  </div>

                  <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-2.5">
                    <div className="grid gap-2.5 sm:grid-cols-2">
                      <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                        <div className="flex items-start gap-3">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-rose-50">
                            <img
                              src="/quiz/lock-outline.svg"
                              alt="Illustration cadenas"
                              className="h-7 w-7 object-contain"
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-800">{quizCooldownActive ? "Quiz bloqué" : "Quiz disponible"}</p>
                            <p className="text-xs text-slate-500">
                              {quizCooldownActive ? "Délai de carence : 15 jours" : "Tentative autorisée immédiatement"}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                        <div className="flex items-start gap-3">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-50">
                            <img
                              src="/quiz/calendar-outline.svg"
                              alt="Illustration calendrier"
                              className="h-7 w-7 object-contain"
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-800">Prochaine tentative</p>
                            <p className="text-xs text-slate-500">{formatFrenchDate(setupPrimarySkill.quizNextAllowedAt)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </button>

                {!quizCooldownActive && (
                  <button
                    type="button"
                    disabled={!selectedSkillId || loadingSkills || starting}
                    onClick={startQuiz}
                    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-fuchsia-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-fuchsia-300/40 transition hover:from-orange-400 hover:to-fuchsia-500 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {starting ? (
                      <>
                        <ArrowPathIcon className="h-5 w-5 animate-spin" />
                        Génération du quiz...
                      </>
                    ) : (
                      <>
                        Démarrer le quiz
                      </>
                    )}
                  </button>
                )}
              </div>
            ) : (
              <div className="rounded-3xl border border-violet-100 bg-white p-5 text-sm text-slate-500 shadow-md">Aucune compétence disponible.</div>
            )}

            <div className="rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">Compétences</h3>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                  {setupSecondarySkills.length}
                </span>
              </div>

              <div className="mt-3 space-y-2.5 lg:max-h-[42dvh] lg:min-h-[240px] lg:overflow-y-auto lg:pr-1">
                {setupSecondarySkills.map((s) => {
                  const badge = statusBadge(s.status);
                  const iconUrl = resolveSkillIconUrl(s);
                  const selected = selectedSkillId === s.skillId;

                  return (
                    <button
                      key={`${s.skillId}-${s.id}`}
                      type="button"
                      onClick={() => setSelectedSkillId(s.skillId)}
                      className={[
                        "group w-full rounded-2xl border px-3.5 py-2.5 text-left transition",
                        selected
                          ? "border-violet-300 bg-violet-50/80 shadow-sm shadow-violet-100"
                          : "border-slate-200 bg-white hover:border-violet-200 hover:shadow-sm",
                      ].join(" ")}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={[
                              "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                              selected ? "bg-violet-100 text-violet-700" : "bg-slate-100 text-slate-600",
                            ].join(" ")}
                          >
                              {iconUrl ? <img src={iconUrl} alt="" className="h-5 w-5 object-contain" /> : <BoltIcon className="h-4 w-4" />}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-800">{s.skillName}</p>
                            <p className="text-xs text-slate-500">
                              {formatSkillLevelLabel(s.level, s.status, s.validatedLevel, s.targetLevel)}
                            </p>
                          </div>
                        </div>
                        <ChevronDownIcon
                          className={[
                            "mt-0.5 h-4 w-4 shrink-0 transition-transform",
                            selected ? "rotate-180 text-violet-500" : "text-slate-400",
                          ].join(" ")}
                        />
                      </div>

                      <div className="mt-2.5 flex items-center justify-start gap-2">
                        <span className={["rounded-full px-2.5 py-1 text-[11px] font-semibold", badge.className].join(" ")}>
                          {badge.label}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
            </div>
          </div>
        </section>
      )}

      {phase === "setup" && starting && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center overflow-hidden bg-transparent p-4">
          <div className="pointer-events-none absolute inset-0 bg-slate-900/50 backdrop-blur-[3px]" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_22%_22%,rgba(168,85,247,0.32),transparent_45%),radial-gradient(circle_at_80%_14%,rgba(236,72,153,0.22),transparent_42%)]" />

          <div className="relative z-10 flex w-full max-w-2xl flex-col items-center text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-violet-300/70 bg-slate-900/45 text-violet-200 shadow-lg shadow-violet-500/30 backdrop-blur-md">
              <ArrowPathIcon className="h-9 w-9 animate-spin" />
            </div>
            <h3 className="mt-5 text-3xl font-bold tracking-tight text-violet-100 drop-shadow-[0_2px_12px_rgba(76,29,149,0.6)]">
              Génération du quiz en cours
            </h3>
            <p className="mt-2 text-sm text-violet-100/90">
              Préparation des questions adaptées à la compétence sélectionnée.
            </p>

            <div className="mt-6 rounded-full border border-violet-300/60 bg-slate-900/45 px-6 py-3 shadow-md shadow-violet-500/25 backdrop-blur-md">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-violet-200">Temps écoulé</p>
              <p className="mt-1 text-5xl font-bold leading-none text-violet-100">{formatTime(generationElapsedSeconds)}</p>
            </div>
          </div>
        </div>
      )}

      {phase === "in_progress" && startData && currentQuestion && (
        <section className="quiz-enter grid min-h-[620px] gap-5 xl:grid-cols-[minmax(0,1.65fr)_360px]">
          <div className="quiz-enter quiz-enter-delay-1 space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-100 text-violet-600">
                      <ClockIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xl font-semibold text-slate-900">Session quiz</p>
                      <p className="text-sm text-slate-500">
                        <span className="text-3xl font-bold text-violet-600">{answeredCount}</span>
                        <span className="font-semibold text-slate-700"> / {questions.length} réponses</span>
                      </p>
                    </div>
                  </div>
                </div>

                <div
                  className={[
                    "w-full rounded-2xl border px-4 py-3 sm:w-[150px]",
                    isUrgent ? "border-rose-200 bg-rose-50" : "border-slate-200 bg-white",
                  ].join(" ")}
                >
                  <p className="text-4xl font-bold leading-none text-slate-900">{formatTime(remainingSeconds)}</p>
                  <p className="mt-2 text-sm font-medium text-slate-500">Temps restant</p>
                </div>
              </div>
              <div className="mt-4 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setQuitConfirmOpen(true)}
                  disabled={submitting}
                  className="inline-flex w-full items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 transition hover:border-rose-300 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                >
                  Quitter le quiz
                </button>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="inline-flex rounded-full bg-violet-100 px-3 py-1 text-sm font-semibold text-violet-700">
                  Question {activeQuestion + 1} / {questions.length}
                </span>
                <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700">
                  {currentQuestion.category || "Compréhension"}
                </span>
              </div>

              <h2 className="mt-4 text-xl font-semibold leading-tight tracking-tight text-slate-900 md:text-2xl">
                {currentQuestion.question}
              </h2>

              <div key={`options-${currentQuestion.id}`} className="quiz-question-swap mt-6 space-y-3">
                {currentQuestion.options.map((option) => {
                  const selected = answers[currentQuestion.id] === option.key;
                  return (
                    <button
                      key={`${currentQuestion.id}-${option.key}`}
                      type="button"
                      onClick={() => pickAnswer(currentQuestion.id, option.key)}
                      className={[
                        "group flex w-full items-center gap-4 rounded-2xl border px-4 py-4 text-left transition-all duration-200",
                        selected
                          ? "border-violet-400 bg-violet-50 shadow-sm shadow-violet-100"
                          : "border-slate-200 bg-white hover:border-violet-200",
                      ].join(" ")}
                    >
                      <span
                        className={[
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-lg font-bold",
                          selected ? "border-violet-500 bg-violet-500 text-white" : "border-slate-300 text-slate-600",
                        ].join(" ")}
                      >
                        {option.key}
                      </span>
                      <span className="flex-1 text-base font-medium leading-tight text-slate-700 md:text-lg">
                        {option.text}
                      </span>
                      {selected && <CheckCircleIcon className="h-6 w-6 shrink-0 text-violet-600" />}
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setActiveQuestion((v) => Math.max(0, v - 1))}
                  disabled={activeQuestion === 0}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-violet-300 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Précédent
                </button>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setActiveQuestion((v) => Math.min(questions.length - 1, v + 1))}
                    disabled={activeQuestion === questions.length - 1}
                    className="rounded-xl px-5 py-2.5 text-sm font-semibold text-slate-500 transition hover:text-violet-600 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Sauter
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (isLastQuestion) {
                        void handleSubmit();
                        return;
                      }
                      setActiveQuestion((v) => Math.min(questions.length - 1, v + 1));
                    }}
                    disabled={submitting || (!isLastQuestion && !hasCurrentAnswer)}
                    className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isLastQuestion ? "Soumettre" : "Suivant"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <aside className="quiz-enter quiz-enter-delay-2 space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-semibold text-slate-900">Aperçu global</h3>
              </div>

              <div className="mt-4 space-y-4">
                <div className="rounded-2xl bg-slate-50 p-3">
                  <p className="text-3xl font-bold text-slate-900">{startData.level <= 0 ? "-" : startData.level}</p>
                  <p className="mt-1 text-sm font-medium text-slate-500">Niveau estimé</p>
                </div>

                <div className="flex items-center justify-between text-sm font-medium text-slate-700">
                  <span>Réponses données</span>
                  <span className="font-semibold text-slate-900">{answeredCount} / {questions.length}</span>
                </div>

                <div className="flex items-center justify-between text-sm font-medium text-slate-700">
                  <span>À revoir</span>
                  <span className="font-semibold text-slate-900">{reviewCount}</span>
                </div>

              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
                  <PaperAirplaneIcon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-2xl font-semibold text-slate-900">Prêt à soumettre ?</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Relisez vos réponses avant de valider pour maximiser votre score.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-violet-400 px-4 py-3 text-lg font-semibold text-violet-700 transition hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? (
                  <span className="inline-flex items-center gap-2">
                    <ArrowPathIcon className="h-4 w-4 animate-spin" />
                    Soumission...
                  </span>
                ) : (
                  <>
                    <PaperAirplaneIcon className="h-5 w-5" />
                    Soumettre le quiz
                  </>
                )}
              </button>
            </div>
          </aside>
        </section>
      )}

      {phase === "submitted" && result && (
        <section className="quiz-enter space-y-5">
          <div className="quiz-enter quiz-enter-delay-1 w-full rounded-3xl border border-violet-100 bg-white/95 p-6 shadow-lg shadow-violet-100/60">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900">Vue d'ensemble du score</h2>
              </div>
            </div>

            <div className="mt-5">
              <div className="relative w-full overflow-hidden rounded-3xl border border-violet-200/80 bg-gradient-to-br from-violet-100 via-fuchsia-50 to-white p-6 shadow-lg shadow-violet-200/60 md:p-8">
                <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-violet-300/35 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-20 -left-16 h-52 w-52 rounded-full bg-fuchsia-300/30 blur-3xl" />

                <div className="relative p-4 md:p-5">
                  <div className="relative grid gap-5 md:grid-cols-[190px_minmax(0,1fr)] md:items-center">
                    <div className="mx-auto flex h-[170px] w-[170px] items-center justify-center rounded-full bg-white/75 ring-1 ring-violet-200/80 backdrop-blur-sm">
                      <div className="relative h-[132px] w-[132px]">
                        <svg className="h-[132px] w-[132px] -rotate-90" viewBox="0 0 120 120" aria-hidden="true">
                          <circle cx="60" cy="60" r={ring.radius} strokeWidth="10" className="fill-none stroke-violet-200/80" />
                          <circle
                            cx="60"
                            cy="60"
                            r={ring.radius}
                            strokeWidth="10"
                            strokeLinecap="round"
                            className="fill-none stroke-violet-600 transition-all duration-700"
                            strokeDasharray={ring.circumference}
                            strokeDashoffset={ring.offset}
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <p className="text-3xl font-black text-slate-900">{roundedScore}%</p>
                          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Global</p>
                        </div>
                      </div>
                    </div>

                    <div className="min-w-0 space-y-3">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-violet-700">
                          <BoltIcon className="h-4 w-4" />
                          Score global
                        </p>
                        <span className={["rounded-full px-3 py-1 text-xs font-semibold", scoreStatusClass].join(" ")}>
                          {scoreStatusLabel}
                        </span>
                      </div>

                      <h3 className="text-xl font-semibold tracking-tight text-slate-900 md:text-2xl">
                        Evaluation finale de votre tentative
                      </h3>

                      <p className="max-w-2xl text-sm text-slate-600 md:text-base">
                        Score final du quiz de positionnement. Consultez le détail des questions ci-dessous pour comprendre vos points forts et les notions à revoir.
                      </p>

                      <div className="flex flex-wrap gap-2.5">
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                          <CheckCircleIcon className="h-3.5 w-3.5" />
                          Détail par question disponible
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/85 px-3 py-1 text-xs font-semibold text-slate-600">
                          <ClockIcon className="h-3.5 w-3.5" />
                          Session terminée
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-violet-100 bg-violet-50/60 p-4">
              <p className="text-sm text-slate-700">
                Résultat:{" "}
                <span
                  className={
                    startData?.quizKind === "initial"
                      ? "font-semibold text-violet-700"
                      : result.passed
                        ? "font-semibold text-emerald-700"
                        : "font-semibold text-rose-700"
                  }
                >
                  {startData?.quizKind === "initial"
                    ? "Niveau attribué selon votre score"
                    : result.passed
                      ? "Validé — niveau augmenté"
                      : "Non validé"}
                </span>
              </p>
              {result.nextAllowedAt && (
                <p className="mt-2 text-xs text-slate-500">
                  Prochaine tentative autorisée: {new Date(result.nextAllowedAt).toLocaleString()}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={resetFlow}
              className="mt-5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-violet-300 hover:text-violet-700"
            >
              Démarrer un nouveau quiz
            </button>
          </div>

          {(result.feedbackStatus === "PENDING" || result.feedbackStatus === "GENERATING") && (
            <div className="rounded-2xl border border-violet-300 bg-violet-50/70 p-4">
              <p className="text-sm font-semibold text-violet-800">Génération du feedback en cours</p>
              <p className="mt-1 text-xs text-violet-700/90">
                Le score est déjà disponible. Le détail IA continue de se compléter automatiquement.
              </p>
            </div>
          )}

          {result.feedbackStatus === "FAILED" && (
            <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4">
              <p className="text-sm font-semibold text-amber-800">Feedback IA indisponible</p>
              <p className="mt-1 text-xs text-amber-700/90">
                Le détail local reste visible. Vous pouvez cliquer sur Rafraîchir pour réessayer.
              </p>
            </div>
          )}

          <div className="quiz-enter quiz-enter-delay-2 grid gap-4 md:grid-cols-2">
            {submittedQuestionCards.map((card) => {
              const expanded = openedReviewQuestionId === card.questionId;
              return (
                <button
                  key={card.questionId}
                  type="button"
                  onClick={() => setOpenedReviewQuestionId((prev) => (prev === card.questionId ? null : card.questionId))}
                  className={[
                    "w-full rounded-2xl border p-4 text-left transition-all",
                    card.isCorrect
                      ? "border-emerald-300 bg-emerald-50/70 hover:border-emerald-400"
                      : "border-rose-300 bg-rose-50/70 hover:border-rose-400",
                    expanded ? "shadow-md" : "shadow-sm",
                  ].join(" ")}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">
                        Question {card.index + 1}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-900 line-clamp-2">{card.questionText}</p>
                    </div>
                    <span
                      className={[
                        "rounded-full px-2.5 py-1 text-[11px] font-semibold",
                        card.isCorrect ? "bg-emerald-200 text-emerald-800" : "bg-rose-200 text-rose-800",
                      ].join(" ")}
                    >
                      {card.isCorrect ? "Correcte" : "Incorrecte"}
                    </span>
                  </div>

                  {expanded && (
                    <div className="mt-3 space-y-2 border-t border-slate-200/70 pt-3">
                      <p className="text-sm text-slate-700">
                        <span className="font-semibold text-emerald-700">Bonne réponse: </span>
                        {card.correctText}
                      </p>
                      <p className="text-sm text-slate-700">
                        <span className="font-semibold text-violet-700">Votre réponse: </span>
                        {card.userText}
                      </p>
                      {!!card.explanation && <p className="text-sm text-slate-700">{card.explanation}</p>}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

        </section>
      )}
      </div>
      <AlertModal
        open={Boolean(cooldownAlertMessage)}
        title="Quiz temporairement indisponible"
        message={<span className="whitespace-pre-line">{cooldownAlertMessage}</span>}
        onClose={() => setCooldownAlertMessage(null)}
      />
      <ConfirmModal
        open={quitConfirmOpen}
        title="Quitter le quiz en cours ?"
        message="Votre tentative en cours sera abandonnée et vos réponses non soumises ne seront pas prises en compte."
        confirmLabel="Quitter"
        cancelLabel="Rester"
        variant="danger"
        loading={false}
        onConfirm={quitInProgressQuiz}
        onCancel={() => setQuitConfirmOpen(false)}
      />
    </div>
  );
} 