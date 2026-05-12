import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBolt,
  faCircleCheck,
  faClock,
  faMagnifyingGlass,
  faSpinner,
  faLock,
  faCalendarDays,
  faWandSparkles,
  faChevronDown,
  faXmark,
  faChevronLeft,
  faChevronRight,
  faBookmark,
  faClipboardCheck,
  faRightFromBracket,
  faShieldHalved,
  faChartSimple,
} from "@fortawesome/free-solid-svg-icons";
import { quizApi, type AttemptResultResponse, type EmployeeSkillDto, type QuizStartResponse, type PagedEmployeeSkillResponse } from "../../api/quizApi.ts";
import { getSkillIconUrl } from "../admin/skillIcons";
import { AlertBanner } from "../../components/AlertBanner";
import { AlertModal } from "../../components/AlertModal";
import { ConfirmModal } from "../../components/ConfirmModal";
import { getUserFacingApiMessage, translateApiMessageToFrench } from "../../utils/apiUserMessage";

type QuizPhase = "setup" | "in_progress" | "submitted";

const QUESTION_COUNT = 20;
const TIME_LIMIT_SECONDS = 15 * 60;
const SKILLS_PAGE_SIZE = 8;
const REVIEW_PAGE_SIZE = 4;
const MIN_START_LOADING_MS = 600;
const QUIZ_FAIL_COOLDOWN_DAYS = 15;

function sleep(ms: number) {
  return new Promise<void>((resolve) => { window.setTimeout(resolve, ms); });
}
function isConflictError(error: any) { return error?.response?.status === 409; }
function readApiError(error: any, fallback: string): { status?: number; code?: string; message: string } {
  const status = error?.response?.status;
  const data = error?.response?.data;
  const detail = data?.detail;
  const code = detail && typeof detail === "object" && typeof detail.error_code === "string" ? detail.error_code : undefined;
  const raw = (typeof data?.error === "string" && data.error.trim()) || (typeof detail === "string" && detail.trim()) || (detail && typeof detail === "object" && typeof detail.message === "string" && detail.message.trim()) || "";
  const message = raw ? translateApiMessageToFrench(raw) : getUserFacingApiMessage(error, fallback);
  return { status, code, message };
}
function mapQuizStartError(status: number | undefined, code: string | undefined, message: string): string {
  if (status === 502 && code === "QUIZ_UPSTREAM_TIMEOUT") return "Le service de génération est temporairement lent. Réessayez dans quelques instants.";
  if (status === 502 && code === "QUIZ_INVALID_MODEL_OUTPUT") return "Le quiz généré est invalide pour le moment. Relancez la génération.";
  if (status === 500 && code === "QUIZ_INTERNAL_ERROR") return "Une erreur interne est survenue pendant la génération du quiz.";
  return message;
}
function formatTime(total: number) {
  const safe = Math.max(0, total);
  return `${String(Math.floor(safe / 60)).padStart(2, "0")}:${String(safe % 60).padStart(2, "0")}`;
}
function getRemainingSeconds(expiresAt?: string | null) {
  if (!expiresAt) return 0;
  return Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
}
function circularStroke(score: number) {
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.max(0, Math.min(100, score)) / 100) * circumference;
  return { radius, circumference, offset };
}
function isQuizCooldownActive(quizNextAllowedAt?: string | null): boolean {
  if (!quizNextAllowedAt) return false;
  const t = new Date(quizNextAllowedAt).getTime();
  return !Number.isNaN(t) && t > Date.now();
}
function formatFrenchDateTime(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString("fr-FR", { dateStyle: "long", timeStyle: "short" });
}
function formatFrenchDate(iso?: string | null): string {
  if (!iso) return "À planifier";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString("fr-FR", { dateStyle: "long" });
}
function statusToFrench(status?: string | null): string {
  const raw = String(status ?? "").toUpperCase();
  if (raw === "VALIDATED") return "Validé";
  if (raw === "FAILED") return "Échoué";
  if (raw === "QUIZ_PENDING") return "En attente";
  if (raw === "EXTRACTED") return "Extrait";
  if (raw === "IN_PROGRESS") return "En cours";
  return raw || "Inconnu";
}
function formatSkillLevelLabel(level?: number | null, status?: string | null, validatedLevel?: number | null, targetLevel?: number | null): string {
  const numericLevel = Number.isFinite(level) ? Number(level) : 0;
  const validated = Number.isFinite(validatedLevel) ? Number(validatedLevel) : 0;
  const target = Number.isFinite(targetLevel) ? Number(targetLevel) : numericLevel;
  const rawStatus = String(status ?? "").toUpperCase();
  if (rawStatus === "EXTRACTED") return "Niveau non évalué";
  if (rawStatus === "QUIZ_PENDING") {
    if (validated > 0) return `Validé N${validated} · Cible N${Math.max(validated, target)} (en attente)`;
    return `Niveau cible N${Math.max(1, target)} (en attente)`;
  }
  if (rawStatus === "FAILED") {
    if (validated > 0) {
      if (target <= validated) return `Niveau validé N${validated} · Progression à retenter`;
      return `Niveau validé N${validated} · Objectif N${target} à retenter`;
    }
    return `Niveau cible N${Math.max(1, target || numericLevel)} à retenter`;
  }
  if (numericLevel <= 0) return "Niveau en attente";
  return `Expertise Niveau ${numericLevel}`;
}
function levelUsedForQuizStart(skill?: EmployeeSkillDto | null): number {
  if (!skill) return 1;
  const status = String(skill.status ?? "").toUpperCase();
  const validated = Number(skill.validatedLevel ?? 0) || 0;
  const target = Number(skill.targetLevel ?? skill.level ?? 0) || 0;
  if (status === "EXTRACTED" || status === "QUIZ_PENDING") return Math.max(1, target || 1);
  return Math.max(1, validated || target || 1);
}
function quizKindForSkill(skill?: EmployeeSkillDto | null): QuizStartResponse["quizKind"] | undefined {
  if (!skill) return undefined;
  const status = String(skill.status ?? "").toUpperCase();
  if (status === "EXTRACTED" || status === "QUIZ_PENDING") return "initial";
  return "progression";
}
function statusBadgeConfig(status: string, validatedLevel?: number | null): { label: string; className: string } {
  const raw = String(status ?? "").toUpperCase();
  const validated = Number(validatedLevel ?? 0) || 0;
  if (raw === "FAILED" && validated > 0) return { label: `Validé N${validated}`, className: "badge-green" };
  const label = statusToFrench(raw);
  if (raw === "VALIDATED") return { label, className: "badge-green" };
  if (raw === "FAILED") return { label, className: "badge-red" };
  if (raw === "QUIZ_PENDING" || raw === "EXTRACTED") return { label, className: "badge-amber" };
  return { label, className: "badge-violet" };
}

export function EmployeeQuiz() {
  const [searchParams] = useSearchParams();
  const skillFromUrl = searchParams.get("skill");

  const [skills, setSkills] = useState<EmployeeSkillDto[]>([]);
  const [loadingSkills, setLoadingSkills] = useState(true);
  const [skillSearch, setSkillSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalSkills, setTotalSkills] = useState(0);
  const [phase, setPhase] = useState<QuizPhase>("setup");
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);
  const [startData, setStartData] = useState<QuizStartResponse | null>(null);
  const [result, setResult] = useState<AttemptResultResponse | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [bookmarkedQuestions, setBookmarkedQuestions] = useState<Record<string, boolean>>({});
  const [activeQuestion, setActiveQuestion] = useState(0);
  const [reviewPage, setReviewPage] = useState(0);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [starting, setStarting] = useState(false);
  const [startingSkillId, setStartingSkillId] = useState<string | null>(null);
  const [openedReviewQuestionId, setOpenedReviewQuestionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cooldownAlertMessage, setCooldownAlertMessage] = useState<string | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [quitConfirmOpen, setQuitConfirmOpen] = useState(false);
  const submitLockRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    const timeout = window.setTimeout(() => {
      setLoadingSkills(true);
      quizApi.listEmployeeSkillsPaged(skillSearch, currentPage, SKILLS_PAGE_SIZE)
        .then((res) => {
          if (cancelled) return;
          const data = res.data as PagedEmployeeSkillResponse | null;
          if (data && "content" in data) {
            setSkills(data.content);
            setTotalPages(data.totalPages);
            setTotalSkills(data.totalCount);
            setCurrentPage(data.currentPage);
            setSelectedSkillId((current) => {
              if (current && data.content.some((s) => s.skillUuid === current)) return current;
              if (skillFromUrl && data.content.some((s) => s.skillUuid === skillFromUrl)) return skillFromUrl;
              return data.content[0]?.skillUuid ?? null;
            });
          }
        })
        .catch(() => { if (!cancelled) { setSkills([]); setSelectedSkillId(null); setTotalPages(0); setTotalSkills(0); } })
        .finally(() => { if (!cancelled) setLoadingSkills(false); });
    }, 250);
    return () => { cancelled = true; window.clearTimeout(timeout); };
  }, [skillSearch, currentPage, skillFromUrl]);

  const categoryOptions = useMemo(() => {
    const cats = skills.map((s) => s.categoryName?.trim()).filter((c): c is string => Boolean(c));
    return ["ALL", ...Array.from(new Set(cats)).sort((a, b) => a.localeCompare(b, "fr"))];
  }, [skills]);

  const visibleSkills = useMemo(() => {
    if (selectedCategory === "ALL") return skills;
    return skills.filter((s) => s.categoryName === selectedCategory);
  }, [skills, selectedCategory]);

  useEffect(() => {
    if (selectedCategory !== "ALL" && !categoryOptions.includes(selectedCategory)) setSelectedCategory("ALL");
  }, [categoryOptions, selectedCategory]);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(0);
  }, [selectedCategory, skillSearch]);

  useEffect(() => {
    if (phase !== "in_progress" || !startData) return;
    setRemainingSeconds(getRemainingSeconds(startData.expiresAt));
    const interval = window.setInterval(() => {
      setRemainingSeconds((prev) => {
        const next = prev - 1;
        if (next <= 0) { window.clearInterval(interval); handleAutoEnd(); return 0; }
        return next;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [phase, startData]);

  useEffect(() => {
    if (phase !== "submitted" || !startData || !result || (result.feedbackStatus !== "PENDING" && result.feedbackStatus !== "GENERATING")) return;
    const interval = window.setInterval(async () => {
      try {
        const res = await quizApi.result(startData.attemptId, reviewPage, REVIEW_PAGE_SIZE);
        setResult(res.data);
        if (res.data.feedbackStatus === "READY" || res.data.feedbackStatus === "FAILED") window.clearInterval(interval);
      } catch { window.clearInterval(interval); }
    }, 5000);
    return () => window.clearInterval(interval);
  }, [phase, startData, result, reviewPage]);

  const selectedSkill = useMemo(() => skills.find((s) => s.skillUuid === selectedSkillId) ?? null, [skills, selectedSkillId]);
  const quizCooldownActive = useMemo(() => isQuizCooldownActive(selectedSkill?.quizNextAllowedAt), [selectedSkill]);
  const questions = startData?.quiz?.questions ?? [];
  const answeredCount = useMemo(() => questions.filter((q) => Boolean(answers[q.id])).length, [questions, answers]);
  const bookmarkedCount = useMemo(() => questions.filter((q) => Boolean(bookmarkedQuestions[q.id])).length, [questions, bookmarkedQuestions]);
  const currentQuestion = questions[activeQuestion];
  const currentQuestionMarked = currentQuestion ? Boolean(bookmarkedQuestions[currentQuestion.id]) : false;
  const isLastQuestion = activeQuestion === questions.length - 1;
  const hasCurrentAnswer = currentQuestion ? Boolean(answers[currentQuestion.id]) : false;
  const isUrgent = remainingSeconds <= 120;
  const unansweredCount = Math.max(questions.length - answeredCount, 0);
  const score = result?.scorePercent ?? 0;
  const ring = circularStroke(score);
  const roundedScore = Math.round(score);
  const passed = roundedScore >= 70;

  const perQuestionInsights = useMemo(() => {
    const fromAi = result?.feedback?.perQuestion;
    if (fromAi && fromAi.length > 0) return fromAi;
    const scored = result?.result?.perQuestion ?? [];
    const quizQuestions = startData?.quiz?.questions ?? [];
    if (!scored.length || !quizQuestions.length) return [];
    return scored.map((row) => ({
      questionId: row.questionId,
      explanation: row.isCorrect ? "Bonne réponse sur cette question." : row.userAnswerKey ? "Réponse incorrecte. Revoyez cette notion avant une nouvelle tentative." : "Vous n'avez pas répondu à cette question.",
    }));
  }, [result, startData]);

  const { allSubmittedCards, displayedSubmittedCards, reviewTotalPages } = useMemo(() => {
    if (!startData || !result) return { allSubmittedCards: [], displayedSubmittedCards: [], reviewTotalPages: 0 };
    const feedbackMap = new Map(perQuestionInsights.map((item) => [item.questionId, item]));
    const serverPage = result.questionPage?.currentPage;
    const serverPageSize = result.questionPage?.pageSize ?? REVIEW_PAGE_SIZE;

    // build cards from whatever per-question data we have in the result (may be page-scoped)
    const raw = result.result?.perQuestion ?? [];
    const all = raw.map((scoreItem, idx) => {
      const quizQuestion = startData.quiz.questions.find((q) => q.id === scoreItem.questionId);
      const correctOption = quizQuestion?.options?.find((o) => o.key === scoreItem.correctAnswerKey);
      const userOption = quizQuestion?.options?.find((o) => o.key === scoreItem.userAnswerKey);
      const insight = feedbackMap.get(scoreItem.questionId);
      // if server provides page info, compute global index using that page offset
      const baseIndex = (typeof serverPage === 'number') ? (serverPage * serverPageSize + idx) : idx;
      return {
        index: baseIndex,
        questionId: scoreItem.questionId,
        isCorrect: scoreItem.isCorrect,
        questionText: quizQuestion?.question || "Question indisponible",
        correctText: `${scoreItem.correctAnswerKey}${correctOption?.text ? ` – ${correctOption.text}` : ""}`,
        userText: scoreItem.userAnswerKey ? `${scoreItem.userAnswerKey}${userOption?.text ? ` – ${userOption.text}` : ""}` : "Aucune réponse",
        explanation: insight?.explanation || "",
      };
    });

    // If server provides totalPages, use that. Otherwise compute from available items.
    const totalPages = (typeof result.questionPage?.totalPages === 'number' && result.questionPage.totalPages > 0)
      ? result.questionPage.totalPages
      : Math.max(1, Math.ceil(all.length / REVIEW_PAGE_SIZE));

    // Determine displayed slice: if server paginates, 'all' already represents current page; otherwise slice client-side
    let displayed = all;
    if (typeof result.questionPage?.totalPages !== 'number') {
      const start = reviewPage * REVIEW_PAGE_SIZE;
      displayed = all.slice(start, start + REVIEW_PAGE_SIZE).map((card, i) => ({ ...card, index: start + i }));
    }

    return { allSubmittedCards: all, displayedSubmittedCards: displayed, reviewTotalPages: totalPages };
  }, [result, startData, perQuestionInsights, reviewPage]);

  function resolveSkillIconUrl(skill: EmployeeSkillDto): string | null {
    return skill.iconUrl || getSkillIconUrl(skill.skillName);
  }
  async function fetchResultWithRetry(attemptId: number, retries = 5, delayMs = 700, page = reviewPage) {
    let lastError: any;
    for (let i = 0; i < retries; i += 1) {
      try { return await quizApi.result(attemptId, page, REVIEW_PAGE_SIZE); }
      catch (e: any) { lastError = e; if (!isConflictError(e) || i === retries - 1) throw e; await sleep(delayMs); }
    }
    throw lastError;
  }

  async function loadReviewPage(page: number) {
    if (!startData || submitting) return;
    setError(null);
    if (typeof page !== "number" || Number.isNaN(page)) return;
    // guard and clamp requested page using current known total pages if available
    const knownTotal = result?.questionPage?.totalPages;
    let requested = Math.max(0, Math.floor(page));
    if (typeof knownTotal === "number" && knownTotal > 0) requested = Math.min(requested, Math.max(0, knownTotal - 1));
    setReviewLoading(true);
    try {
      const resultRes = await fetchResultWithRetry(startData.attemptId, 5, 700, requested);
      const current = resultRes.data.questionPage?.currentPage ?? requested;
      setReviewPage(current);
      setResult(resultRes.data);
      setOpenedReviewQuestionId(resultRes.data.result?.perQuestion?.[0]?.questionId ?? null);
    } catch (e: any) {
      setError(readApiError(e, "Impossible de charger cette page de réponses").message);
    } finally {
      setReviewLoading(false);
    }
  }

  async function startQuiz(skillUuid?: string) {
    const activeSkillId = skillUuid ?? selectedSkillId;
    const activeSkill = skills.find((s) => s.skillUuid === activeSkillId) ?? selectedSkill ?? null;
    if (!activeSkillId || starting) return;
    if (activeSkill?.quizNextAllowedAt && isQuizCooldownActive(activeSkill.quizNextAllowedAt)) {
      setCooldownAlertMessage([`Prochaine tentative autorisée après le ${formatFrenchDateTime(activeSkill.quizNextAllowedAt)}.`, "", `Après un score inférieur à 70 %, un délai de ${QUIZ_FAIL_COOLDOWN_DAYS} jours est obligatoire avant une nouvelle tentative.`].join("\n"));
      return;
    }
    setError(null); setStarting(true); setStartingSkillId(activeSkillId);
    const loadingStartedAt = Date.now();
    try {
      const res = await quizApi.startQuiz({ skillId: activeSkillId, skillName: activeSkill?.skillName || "Compétence", level: levelUsedForQuizStart(activeSkill), skillStatus: activeSkill?.status, quizKind: quizKindForSkill(activeSkill), questionCount: QUESTION_COUNT, timeLimitSeconds: TIME_LIMIT_SECONDS });
      const startedQuestions = res.data?.quiz?.questions ?? [];
      if (!startedQuestions.length) { setError("Le quiz généré est vide ou invalide. Veuillez relancer."); return; }
      setStartData(res.data); setAnswers({}); setResult(null); setActiveQuestion(0); setOpenedReviewQuestionId(null);
      setPhase("in_progress"); setRemainingSeconds(getRemainingSeconds(res.data.expiresAt));
    } catch (e: any) {
      const parsed = readApiError(e, "Impossible de démarrer le quiz");
      const message = mapQuizStartError(parsed.status, parsed.code, parsed.message);
      if (parsed.status === 409) {
        const cooldownConflict = /cooldown|nextAllowedAt|prochaine tentative|15 jours/i.test(String(parsed.message));
        setCooldownAlertMessage(cooldownConflict ? [parsed.message, "", `Après un score inférieur à 70 %, un délai de ${QUIZ_FAIL_COOLDOWN_DAYS} jours est obligatoire avant une nouvelle tentative.`].join("\n") : parsed.message);
        setError(null); return;
      }
      setError(message);
    } finally {
      const elapsed = Date.now() - loadingStartedAt;
      if (elapsed < MIN_START_LOADING_MS) await sleep(MIN_START_LOADING_MS - elapsed);
      setStarting(false);
      setStartingSkillId(null);
    }
  }

  async function saveSingleAnswer(questionId: string, answerKey: string) {
    if (!startData) return;
    try { await quizApi.saveAnswers(startData.attemptId, [{ questionId, answerKey }]); } catch { /* best effort */ }
  }
  function pickAnswer(questionId: string, answerKey: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: answerKey }));
    void saveSingleAnswer(questionId, answerKey);
  }

  function toggleBookmark(questionId: string) {
    setBookmarkedQuestions((prev) => ({ ...prev, [questionId]: !prev[questionId] }));
  }

  useEffect(() => {
    if (phase !== "in_progress" || !currentQuestion) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      const target = event.target as HTMLElement | null;
      if (target) { const tag = target.tagName; if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable) return; }
      if (event.key === "Enter") { if (activeQuestion >= questions.length - 1 || !answers[currentQuestion.id]) return; event.preventDefault(); setActiveQuestion((v) => Math.min(questions.length - 1, v + 1)); return; }
      const pressed = event.key.toUpperCase();
      if (!["A","B","C","D"].includes(pressed)) return;
      const matched = currentQuestion.options.find((o) => o.key.toUpperCase() === pressed);
      if (!matched) return;
      event.preventDefault(); pickAnswer(currentQuestion.id, matched.key);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [phase, currentQuestion, activeQuestion, questions.length, answers]);

  async function syncSkillStatusAfterQuiz(quizResult: AttemptResultResponse, quizKind?: QuizStartResponse["quizKind"], skillUuid?: string) {
    const activeSkillId = skillUuid ?? selectedSkillId;
    if (!activeSkillId) return;
    try {
      const isProgressionQuiz = quizKind === "progression";
      const fallbackNextAllowedAt = !quizResult.passed && isProgressionQuiz ? (quizResult.nextAllowedAt ?? new Date(Date.now() + QUIZ_FAIL_COOLDOWN_DAYS * 24 * 60 * 60 * 1000).toISOString()) : null;
      const res = await quizApi.syncSkillStatus({ skillUuid: activeSkillId, passed: quizResult.passed, level: quizResult.level, nextAllowedAt: fallbackNextAllowedAt, quizKind });
      const updated = res.data;
      setSkills((prev) => prev.map((s) => (s.skillUuid === updated.skillUuid ? updated : s)));
    } catch { /* keep quiz UX responsive */ }
  }

  async function handleSubmit() {
    if (!startData || submitting || submitLockRef.current) return;
    submitLockRef.current = true; setSubmitting(true); setError(null);
    try {
      const payload = Object.entries(answers).map(([questionId, answerKey]) => ({ questionId, answerKey }));
      await quizApi.submit(startData.attemptId, payload);
      const resultRes = await fetchResultWithRetry(startData.attemptId, 5, 700, 0);
      setReviewPage(0);
      setResult(resultRes.data); setOpenedReviewQuestionId(resultRes.data.result?.perQuestion?.[0]?.questionId ?? null);
      await syncSkillStatusAfterQuiz(resultRes.data, startData.quizKind, selectedSkillId ?? undefined);
      setPhase("submitted");
    } catch (e: any) {
      const parsed = readApiError(e, "Soumission impossible");
      if (parsed.status === 404) {
        try {
          const resultRes = await fetchResultWithRetry(startData.attemptId, 12, 800, 0);
          setResult(resultRes.data); setOpenedReviewQuestionId(resultRes.data.result?.perQuestion?.[0]?.questionId ?? null);
          await syncSkillStatusAfterQuiz(resultRes.data, startData.quizKind, selectedSkillId ?? undefined);
          setPhase("submitted"); return;
        } catch { setError("Tentative introuvable côté service quiz. Relancez un nouveau quiz."); return; }
      }
      setError(parsed.message);
    } finally { setSubmitting(false); submitLockRef.current = false; }
  }

  async function handleAutoEnd() {
    if (!startData || submitting || submitLockRef.current) return;
    submitLockRef.current = true; setSubmitting(true); setError(null);
    try {
      const payload = Object.entries(answers).map(([questionId, answerKey]) => ({ questionId, answerKey }));
      try { await quizApi.submit(startData.attemptId, payload); } catch (e: any) { if (!isConflictError(e)) throw e; }
      const resultRes = await fetchResultWithRetry(startData.attemptId, 5, 700, 0);
      setReviewPage(0);
      setResult(resultRes.data); setOpenedReviewQuestionId(resultRes.data.result?.perQuestion?.[0]?.questionId ?? null);
      await syncSkillStatusAfterQuiz(resultRes.data, startData.quizKind, selectedSkillId ?? undefined);
      setPhase("submitted");
    } catch (e: any) {
      const parsed = readApiError(e, "Attendez la finalisation automatique");
      if (parsed.status === 404) {
        try {
          const resultRes = await fetchResultWithRetry(startData.attemptId, 12, 800, 0);
          setResult(resultRes.data); setOpenedReviewQuestionId(resultRes.data.result?.perQuestion?.[0]?.questionId ?? null);
          await syncSkillStatusAfterQuiz(resultRes.data, startData.quizKind, selectedSkillId ?? undefined);
          setPhase("submitted"); return;
        } catch { setError("Impossible de récupérer le résultat automatique. Relancez un nouveau quiz."); return; }
      }
      setError(parsed.message);
    } finally { setSubmitting(false); submitLockRef.current = false; }
  }

  async function resetFlow() {
    setPhase("setup"); setStartData(null); setResult(null); setAnswers({}); setBookmarkedQuestions({});
    setReviewPage(0);
    setActiveQuestion(0); setOpenedReviewQuestionId(null); setRemainingSeconds(0); setError(null);
    setSkillSearch("");
    setSelectedCategory("ALL");
    setCurrentPage(0);
    setSubmitting(false);
    submitLockRef.current = false;
  }

  function quitInProgressQuiz() {
    setQuitConfirmOpen(false); setPhase("setup"); setStartData(null); setResult(null); setAnswers({}); setBookmarkedQuestions({});
    setReviewPage(0);
    setActiveQuestion(0); setOpenedReviewQuestionId(null); setRemainingSeconds(0); setError(null);
    setSubmitting(false); submitLockRef.current = false;
  }

  const css = `
    /* ── Reset & Base ── */
    *, *::before, *::after { box-sizing: border-box; }

    .eq-wrap {  position: relative; display: flex; flex: 1; flex-direction: column; width: 100%; height: 100%; min-height: calc(100dvh - 7.5rem); overflow: hidden; }
    .eq-body  { padding: 8px 10px; display: flex; flex-direction: column; gap: 8px; flex: 1; min-height: 0; overflow-x: hidden; overflow-y: auto; padding-bottom: 0 !important; }
    .eq-body > *:last-child { margin-bottom: 0 !important; padding-bottom: 0 !important; }
    .eq-browser { display: flex; flex: 1; min-height: 0; flex-direction: column; }
    .eq-browser-main { flex: 1; min-height: 0; overflow-y: auto; padding-top: 4px; padding-bottom: 10px; }
    .eq-skills-grid { margin-bottom: 0 !important; }
    .eq-empty-wrap { margin-bottom: 0 !important; padding-bottom: 0 !important; }
    .eq-in-progress {
      display: flex;
      flex: 1;
      min-width: 0;
      min-height: calc(100dvh - 8.5rem);
      width: 100%;
      max-width: 100%;
    }
    .eq-in-progress-inner {
      display: flex;
      flex: 1;
      min-width: 0;
      width: 100%;
    }
    .eq-in-progress-grid {
      display: grid;
      flex: 1;
      min-width: 0;
      width: 100%;
      align-items: start;
      gap: 14px;
      padding: 8px 0 10px;
    }
    .eq-in-progress-main {
      display: flex;
      min-width: 0;
      min-height: 0;
      flex-direction: column;
      gap: 12px;
    }
    .eq-question-card {
      display: block;
      min-height: 0;
    }
    .eq-options-stack {
      display: block;
    }
    @media (min-width: 1280px) {
      .eq-in-progress-grid { grid-template-columns: minmax(0, 1fr) 320px; }
    }

    /* ── Animations ── */
    @keyframes eq-spin    { to { transform: rotate(360deg); } }
    @keyframes eq-fade-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes eq-shimmer { 0% { background-position: -400px 0; } 100% { background-position: 400px 0; } }
    @keyframes eq-pulse-ring { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
    @keyframes eq-bounce-dot { 0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; } 40% { transform: scale(1); opacity: 1; } }

    .eq-fade-in { animation: eq-fade-in 0.28s ease both; }

    /* ── Badges ── */
    .eq-pill { display: inline-flex; align-items: center; padding: 4px 11px; border-radius: 99px; font-size: 12px; font-weight: 600; letter-spacing: 0.01em; }
    .badge-violet { background: #EDE9FE; color: #5B21B6; }
    .badge-green  { background: #D1FAE5; color: #065F46; }
    .badge-red    { background: #FEE2E2; color: #991B1B; }
    .badge-amber  { background: #FEF3C7; color: #92400E; }
    .badge-teal   { background: #CFFAFE; color: #0E7490; }
    .badge-slate  { background: #F1F5F9; color: #475569; }

    /* ── Card ── */
    .eq-card {
      background:
        radial-gradient(circle at 12% 16%, rgba(124, 58, 237, 0.11), transparent 24%),
        radial-gradient(circle at 92% 18%, rgba(59, 130, 246, 0.08), transparent 27%),
        radial-gradient(circle at 96% 92%, rgba(16, 185, 129, 0.08), transparent 30%),
        linear-gradient(135deg, #FFFFFF 0%, #FAF8FF 42%, #F8FAFC 70%, #F0FDF4 100%);
      border: 1px solid rgba(221, 214, 254, 0.86);
      border-radius: 14px;
      padding: 10px 12px;
      box-shadow: 0 8px 22px rgba(76, 29, 149, 0.07), inset 0 0 0 4px rgba(255, 255, 255, 0.58);
      animation: eq-fade-in 0.25s ease both;
    }
    /* ── Selected skill header ── */
    .eq-sel-header { display: flex; align-items: center; gap: 10px; padding-bottom: 10px; border-bottom: 1px solid #F0EEF9; margin-bottom: 10px; }
    .eq-sel-avatar {
      width: 38px; height: 38px; flex-shrink: 0; border-radius: 10px;
      background: linear-gradient(135deg, #EDE9FE 0%, #DDD6FE 100%);
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 1px 4px rgba(109,40,217,0.12);
    }
    .eq-sel-avatar img { width: 18px; height: 18px; object-fit: contain; }
    .eq-sel-name { font-size: 16px; font-weight: 700; color: #1E1B4B; }
    .eq-sel-meta { font-size: 12px; color: #7C3AED; margin-top: 2px; font-weight: 500; }

    /* ── Stats row ── */
    .eq-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
    .eq-stat { border-radius: 9px; padding: 8px 10px; border: 1px solid transparent; }
    .eq-stat-val { font-size: 18px; font-weight: 700; line-height: 1; }
    .eq-stat-lbl { font-size: 11px; margin-top: 3px; font-weight: 500; opacity: 0.75; }
    .eq-stat.s-violet  { background: #EDE9FE; border-color: #DDD6FE; }
    .eq-stat.s-violet  .eq-stat-val { color: #5B21B6; }
    .eq-stat.s-violet  .eq-stat-lbl { color: #5B21B6; }
    .eq-stat.s-teal    { background: #ECFEFF; border-color: #CFFAFE; }
    .eq-stat.s-teal    .eq-stat-val { color: #0E7490; }
    .eq-stat.s-teal    .eq-stat-lbl { color: #0E7490; }
    .eq-stat.s-emerald { background: #ECFDF5; border-color: #D1FAE5; }
    .eq-stat.s-emerald .eq-stat-val { color: #065F46; }
    .eq-stat.s-emerald .eq-stat-lbl { color: #065F46; }
    .eq-stat.s-amber   { background: #FFFBEB; border-color: #FEF3C7; }
    .eq-stat.s-amber   .eq-stat-val { color: #92400E; }
    .eq-stat.s-amber   .eq-stat-lbl { color: #92400E; }

    /* ── Info row ── */
    .eq-info-row { display: flex; gap: 8px; margin-top: 8px; }
    .eq-info-cell { flex: 1; display: flex; align-items: center; gap: 8px; padding: 8px 10px; background: #FAFAFA; border: 1px solid #EAE7F8; border-radius: 9px; transition: border-color 0.15s; }
    .eq-info-cell:hover { border-color: #DDD6FE; }
    .eq-info-ico { width: 26px; height: 26px; flex-shrink: 0; border-radius: 7px; display: flex; align-items: center; justify-content: center; }
    .eq-info-ico.violet { background: #EDE9FE; }
    .eq-info-ico.teal   { background: #CFFAFE; }
    .eq-info-ico.violet svg { color: #6D28D9; width: 14px; height: 14px; }
    .eq-info-ico.teal   svg { color: #0891B2; width: 14px; height: 14px; }
    .eq-info-lbl { font-size: 12px; font-weight: 600; color: #1E1B4B; }
    .eq-info-sub { font-size: 11px; color: #6B7280; margin-top: 1px; }

    /* ── Buttons ── */
    .eq-btn-primary {
      width: 100%; padding: 9px;
      background: linear-gradient(135deg, #6D28D9 0%, #5B21B6 100%);
      color: #fff;
      border: none; border-radius: 10px;
      font-size: 14px; font-weight: 600;
      cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;
      margin-top: 10px;
      transition: opacity 0.15s, transform 0.1s, box-shadow 0.15s;
      box-shadow: 0 2px 8px rgba(109,40,217,0.22);
    }
    .eq-btn-primary:hover:not(:disabled)  { opacity: 0.92; box-shadow: 0 4px 14px rgba(109,40,217,0.28); }
    .eq-btn-primary:active:not(:disabled) { transform: scale(0.985); }
    .eq-btn-primary:disabled { opacity: 0.42; cursor: not-allowed; box-shadow: none; }

    .eq-btn-ghost { padding: 8px 15px; background: #fff; color: #374151; border: 1px solid #E5E7EB; border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer; transition: background 0.15s, border-color 0.15s; }
    .eq-btn-ghost:hover:not(:disabled) { background: #F9FAFB; border-color: #D1D5DB; }
    .eq-btn-ghost:disabled { opacity: 0.4; cursor: not-allowed; }

    .eq-btn-danger { padding: 8px 15px; background: #fff; color: #DC2626; border: 1px solid #FECACA; border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer; transition: background 0.15s; }
    .eq-btn-danger:hover:not(:disabled) { background: #FEF2F2; }

    .eq-btn-next {
      padding: 8px 20px;
      background: linear-gradient(135deg, #6D28D9 0%, #5B21B6 100%);
      color: #fff; border: none; border-radius: 8px;
      font-size: 14px; font-weight: 600; cursor: pointer;
      transition: opacity 0.15s, transform 0.1s, box-shadow 0.15s;
      box-shadow: 0 2px 6px rgba(109,40,217,0.2);
    }
    .eq-btn-next:hover:not(:disabled)  { opacity: 0.9; box-shadow: 0 3px 10px rgba(109,40,217,0.28); }
    .eq-btn-next:active:not(:disabled) { transform: scale(0.97); }
    .eq-btn-next:disabled { background: #E5E7EB; color: #9CA3AF; cursor: not-allowed; box-shadow: none; }

    /* ── Section label ── */
    .eq-section-lbl { font-size: 12px; font-weight: 700; color: #9CA3AF; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 6px; }

    .eq-section-topbar { display: flex; justify-content: flex-end; margin-bottom: 6px; }
    .eq-section-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 12px; flex-wrap: wrap; margin-bottom: 8px; }
    .eq-searchbar { display: flex; align-items: center; gap: 8px; width: min(100%, 360px); }
    .eq-searchbar { position: relative; }
    .eq-filters { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; width: min(100%, 680px); justify-content: flex-end; }

    .eq-search-input {
      width: 100%;
      border: 1px solid #E5E7EB; border-radius: 10px;
      background: #fff; padding: 9px 38px 9px 36px;
      font-size: 14px; color: #1E1B4B;
      outline: none;
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    .eq-search-input::placeholder { color: #9CA3AF; }
    .eq-search-input:focus { border-color: #7C3AED; box-shadow: 0 0 0 3px rgba(109,40,217,0.10); }
    .eq-search-input::-webkit-search-cancel-button,
    .eq-search-input::-webkit-search-decoration {
      -webkit-appearance: none;
      appearance: none;
      display: none;
    }

    .eq-search-icon {
      position: absolute;
      left: 12px;
      top: 50%;
      transform: translateY(-50%);
      color: #9CA3AF;
      pointer-events: none;
    }

    .eq-search-clear {
      position: absolute;
      right: 8px;
      top: 50%;
      transform: translateY(-50%);
      width: 22px;
      height: 22px;
      border: 0;
      border-radius: 999px;
      background: #EDE9FE;
      color: #6D28D9;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: background 0.15s;
    }
    .eq-search-clear:hover { background: #DDD6FE; }

    .eq-category-select-wrap {
      position: relative;
      min-width: 220px;
      flex-shrink: 0;
    }

    .eq-category-select {
      width: 100%;
      min-width: 220px;
      border: 1px solid #D8D3F7;
      border-radius: 12px;
      background: linear-gradient(180deg, #FFFFFF 0%, #FAF8FF 100%);
      padding: 10px 40px 10px 14px;
      font-size: 14px;
      font-weight: 600;
      color: #26215C;
      outline: none;
      transition: border-color 0.15s, box-shadow 0.15s, transform 0.15s;
      cursor: pointer;
      box-shadow: 0 1px 2px rgba(38, 33, 92, 0.04);
      appearance: none;
      -webkit-appearance: none;
      -moz-appearance: none;
    }
    .eq-category-select:hover {
      border-color: #B9A8EE;
      transform: translateY(-1px);
    }
    .eq-category-select:focus {
      border-color: #7C3AED;
      box-shadow: 0 0 0 3px rgba(109,40,217,0.10);
    }

    .eq-category-icon {
      position: absolute;
      right: 14px;
      top: 50%;
      transform: translateY(-50%);
      color: #7C3AED;
      pointer-events: none;
    }

    .eq-category-select option {
      color: #26215C;
      background: #FFFFFF;
    }

    /* ── Skeleton loader ── */
    .eq-skeleton-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(178px, 1fr)); gap: 10px; }
    .eq-skeleton-card {
      border-radius: 12px; height: 168px; overflow: hidden;
      background: linear-gradient(90deg, #F3F0FF 25%, #EAE7F8 50%, #F3F0FF 75%);
      background-size: 400px 100%;
      animation: eq-shimmer 1.4s ease-in-out infinite;
    }

    /* ── Empty state ── */
    .eq-empty-wrap {
      display: flex; flex-direction: column; align-items: center;
      padding: 52px 24px 48px;
      background: #fff;
      border: 1.5px dashed #DDD6FE;
      border-radius: 14px;
      text-align: center;
      gap: 6px;
      animation: eq-fade-in 0.3s ease both;
    }
    .eq-empty-ico-outer {
      width: 64px; height: 64px;
      background: linear-gradient(135deg, #EDE9FE 0%, #DDD6FE 100%);
      border-radius: 18px;
      display: flex; align-items: center; justify-content: center;
      margin-bottom: 10px;
      box-shadow: 0 4px 14px rgba(109,40,217,0.12);
    }
    .eq-empty-ico-outer svg { width: 26px; height: 26px; color: #6D28D9; }
    .eq-empty-title {
      font-size: 17px; font-weight: 700; color: #1E1B4B;
      margin-bottom: 4px; line-height: 1.35;
    }
    .eq-empty-sub {
      font-size: 14px; color: #6B7280;
      max-width: 280px; line-height: 1.65; margin-bottom: 4px;
    }
    .eq-empty-hint {
      display: inline-flex; align-items: center; gap: 5px;
      font-size: 12px; color: #9CA3AF;
      padding: 5px 11px;
      background: #f8f7ff; border: 1px solid #EDE9FE;
      border-radius: 99px; margin-top: 4px;
    }
    .eq-empty-hint svg { width: 11px; height: 11px; color: #7C3AED; }
    .eq-empty-action {
      margin-top: 14px;
      margin-bottom: 18px;
      display: inline-flex; align-items: center; gap: 7px;
      padding: 9px 20px;
      background: linear-gradient(135deg, #6D28D9 0%, #5B21B6 100%);
      color: #fff;
      border: none; border-radius: 9px;
      font-size: 14px; font-weight: 600;
      cursor: pointer;
      transition: opacity 0.15s, transform 0.1s, box-shadow 0.15s;
      box-shadow: 0 2px 8px rgba(109,40,217,0.22);
    }
    .eq-empty-action:hover  { opacity: 0.9; box-shadow: 0 4px 12px rgba(109,40,217,0.28); }
    .eq-empty-action:active { transform: scale(0.97); }
    .eq-empty-action svg { width: 13px; height: 13px; }

    /* ── Skills grid ── */
    .eq-skills-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 12px; }
    @media (min-width: 1280px) {
      .eq-skills-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
    }
    .eq-pagination {
      margin-top: auto;
      border-top: 1px solid rgba(139, 92, 246, 0.1);
      background: #fff;
      padding: 6px 14px 8px;
      box-shadow: 0 -8px 18px rgba(109, 40, 217, 0.035);
    }
    .eq-skill-card {
      position: relative;
      overflow: hidden;
      min-height: 188px;
      padding: 14px;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      gap: 10px;
      border: 1px solid rgba(221, 214, 254, 0.86);
      border-radius: 15px;
      background:
        radial-gradient(circle at 12% 16%, rgba(124, 58, 237, 0.11), transparent 24%),
        radial-gradient(circle at 92% 18%, rgba(59, 130, 246, 0.08), transparent 27%),
        radial-gradient(circle at 96% 92%, rgba(16, 185, 129, 0.08), transparent 30%),
        linear-gradient(135deg, #FFFFFF 0%, #FAF8FF 42%, #F8FAFC 70%, #F0FDF4 100%);
      box-shadow: 0 8px 22px rgba(76, 29, 149, 0.07), inset 0 0 0 4px rgba(255, 255, 255, 0.58);
      transition: border-color 0.18s, box-shadow 0.18s, transform 0.15s;
    }
    .eq-skill-card::before {
      content: "";
      position: absolute;
      inset: 5px;
      border-radius: 13px;
      border: 1px solid rgba(255, 255, 255, 0.72);
      pointer-events: none;
    }
    .eq-skill-card:hover {
      border-color: #A78BFA;
      box-shadow: 0 16px 34px rgba(76, 29, 149, 0.12), inset 0 0 0 5px rgba(255, 255, 255, 0.62);
      transform: translateY(-2px);
    }
    .eq-skill-card.active {
      border-color: #7C3AED;
      box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.18), 0 16px 34px rgba(76, 29, 149, 0.13), inset 0 0 0 5px rgba(255, 255, 255, 0.62);
      transform: translateY(-2px);
    }
    .eq-skill-card > * {
      position: relative;
      z-index: 1;
    }
    .eq-sk-top { display: flex; align-items: flex-start; justify-content: space-between; }
    .eq-sk-ico {
      width: 38px; height: 38px; flex-shrink: 0; border-radius: 12px;
      background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 58%, #2563EB 100%);
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 12px 20px rgba(91, 33, 182, 0.22);
    }
    .eq-sk-ico img { width: 21px; height: 21px; object-fit: contain; filter: brightness(0) invert(1); }
    .eq-sk-ico svg { width: 20px; height: 20px; color: #FFFFFF; }
    .eq-skill-card .eq-pill {
      min-height: 24px;
      padding: 4px 8px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 800;
      box-shadow: 0 10px 18px rgba(15, 23, 42, 0.08);
    }
    .eq-sk-name { font-size: 17px; font-weight: 900; color: #071452; line-height: 1.08; letter-spacing: 0; }
    .eq-sk-lvl  { font-size: 11px; color: #5B36F2; margin-top: 3px; font-weight: 800; line-height: 1.3; }
    .eq-sk-footer {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px;
      padding: 6px;
      border: 1px solid rgba(221, 214, 254, 0.78);
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.66);
      box-shadow: 0 8px 20px rgba(76, 29, 149, 0.05);
    }
    .eq-sk-metric {
      display: flex;
      align-items: center;
      gap: 7px;
      min-width: 0;
    }
    .eq-sk-metric-icon {
      display: inline-flex;
      width: 22px;
      height: 22px;
      flex-shrink: 0;
      align-items: center;
      justify-content: center;
      border-radius: 10px;
      background: #EEF2FF;
      color: #4F46E5;
    }
    .eq-sk-metric-icon svg { width: 11px; height: 11px; color: #4F46E5; }
    .eq-sk-metric-val { font-size: 11px; font-weight: 900; color: #071452; line-height: 1.1; }
    .eq-sk-metric-lbl { margin-top: 2px; font-size: 9px; font-weight: 700; color: #64709D; line-height: 1.1; }
    .eq-sk-unavailable {
      display: flex;
      min-height: 36px;
      flex-direction: row;
      align-items: center;
      justify-content: center;
      gap: 8px;
      overflow: hidden;
      border: 1.5px dashed #C4B5FD;
      border-radius: 12px;
      background:
        radial-gradient(circle at 7% 78%, rgba(124, 58, 237, 0.11), transparent 26%),
        radial-gradient(circle at 100% 100%, rgba(59, 130, 246, 0.08), transparent 28%),
        rgba(245, 243, 255, 0.68);
      color: #5B36F2;
      text-align: left;
    }
    .eq-sk-unavailable-icon {
      display: inline-flex;
      width: 24px;
      height: 24px;
      align-items: center;
      justify-content: center;
      border-radius: 999px;
      background: #EDE9FE;
      color: #6D28D9;
    }
    .eq-sk-unavailable-icon svg { width: 13px; height: 13px; }
    .eq-sk-unavailable-title { font-size: 11px; font-weight: 900; line-height: 1; }
    .eq-sk-start {
      width: 100%; padding: 10px;
      background: linear-gradient(135deg, #6D28D9 0%, #4F46E5 68%, #0EA5E9 100%);
      color: #fff; border: none; border-radius: 14px;
      font-size: 13px; font-weight: 800; cursor: pointer;
      transition: opacity 0.15s, box-shadow 0.15s;
      box-shadow: 0 10px 20px rgba(109, 40, 217, 0.22);
    }
    .eq-sk-start .eq-start-btn-icon { margin-right: 6px; animation: eq-spin 0.8s linear infinite; }
    .eq-sk-start:hover:not(:disabled)  { opacity: 0.9; box-shadow: 0 3px 10px rgba(109,40,217,0.26); }
    .eq-sk-start:disabled { background: #F3F4F6; color: #9CA3AF; cursor: not-allowed; box-shadow: none; }
    .eq-start-loading {
      position: absolute;
      inset: 0;
      z-index: 50;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(248, 250, 252, 0.72);
      backdrop-filter: blur(10px);
    }
    .eq-start-loading-card {
      display: flex;
      align-items: center;
      gap: 14px;
      min-width: 280px;
      border: 1px solid rgba(196, 181, 253, 0.8);
      border-radius: 18px;
      background: rgba(255, 255, 255, 0.94);
      padding: 18px 20px;
      box-shadow: 0 20px 45px rgba(76, 29, 149, 0.16);
    }
    .eq-start-loading-icon {
      display: inline-flex;
      width: 42px;
      height: 42px;
      align-items: center;
      justify-content: center;
      border-radius: 14px;
      background: linear-gradient(135deg, #6D28D9, #4F46E5);
      color: #fff;
      box-shadow: 0 10px 22px rgba(109, 40, 217, 0.28);
    }
    .eq-start-loading-icon svg { animation: eq-spin 0.8s linear infinite; }
    .eq-start-loading-title { font-size: 14px; font-weight: 800; color: #1E1B4B; }
    .eq-start-loading-sub { margin-top: 2px; font-size: 12px; color: #7C3AED; }
    @media (max-width: 700px) {
      .eq-skills-grid { grid-template-columns: 1fr; }
      .eq-skill-card { min-height: 0; padding: 14px; border-radius: 18px; }
      .eq-sk-name { font-size: 20px; }
    }

    /* ── Progress bar ── */
    .eq-prog-wrap { background: #EDE9FE; border-radius: 99px; height: 4px; overflow: hidden; margin-top: 10px; }
    .eq-prog-bar  { height: 100%; background: linear-gradient(90deg, #6D28D9, #8B5CF6); border-radius: 99px; transition: width 0.4s ease; }

    /* ── Dots nav ── */
    .eq-dots { display: flex; gap: 5px; flex-wrap: wrap; margin-bottom: 10px; }
    .eq-dot {
      width: 22px; height: 22px; border-radius: 50%;
      border: 1px solid #E5E7EB;
      display: flex; align-items: center; justify-content: center;
      font-size: 9px; font-weight: 600; color: #9CA3AF;
      cursor: pointer; transition: all 0.15s;
    }
    .eq-dot:hover:not(.done) { border-color: #7C3AED; color: #6D28D9; background: #F5F3FF; }
    .eq-dot.done { background: #6D28D9; border-color: #6D28D9; color: #fff; }
    .eq-dot.cur  { background: #EDE9FE; border-color: #7C3AED; color: #5B21B6; }

    /* ── Page buttons ── */
    .eq-page-btn { min-width: 36px; height: 36px; display: inline-flex; align-items: center; justify-content: center; border-radius: 14px; border: 1px solid #E6E6F0; background: #fff; color: #4B5563; font-weight: 700; cursor: pointer; padding: 0 10px; }
    .eq-page-btn:hover { border-color: #C4B5FD; color: #6D28D9; }
    .eq-page-btn.active { background: #6D28D9; color: #fff; border-color: #6D28D9; }
    .eq-page-btn.disabled { opacity: 0.45; cursor: not-allowed; }

    /* ── Question header ── */
    .eq-q-header { display: flex; align-items: center; justify-content: space-between; padding-bottom: 14px; border-bottom: 1px solid #F3F4F6; margin-bottom: 16px; }
    .eq-q-meta { display: flex; align-items: center; gap: 8px; }
    .eq-q-num  { font-size: 12px; font-weight: 700; color: #6D28D9; }
    .eq-q-cat  { font-size: 11px; font-weight: 600; color: #0E7490; background: #CFFAFE; padding: 3px 10px; border-radius: 99px; }

    /* ── Timer ── */
    .eq-timer {
      display: flex; align-items: center; gap: 6px;
      padding: 6px 11px; border-radius: 8px;
      border: 1px solid #E5E7EB; background: #F9FAFB;
      transition: border-color 0.3s, background 0.3s;
    }
    .eq-timer.urgent { border-color: #FECACA; background: #FEF2F2; }
    .eq-timer-val { font-size: 15px; font-weight: 700; color: #1E1B4B; font-variant-numeric: tabular-nums; }
    .eq-timer.urgent .eq-timer-val { color: #DC2626; animation: eq-pulse-ring 1s ease-in-out infinite; }
    .eq-timer-icon { width: 13px; height: 13px; color: #9CA3AF; }
    .eq-timer.urgent .eq-timer-icon { color: #DC2626; }
    .eq-timer-lbl { font-size: 10px; color: #9CA3AF; font-weight: 500; }

    /* ── Question text ── */
    .eq-q-text { font-size: 15px; font-weight: 600; color: #1E1B4B; line-height: 1.65; margin-bottom: 16px; }

    /* ── Options ── */
    .eq-opt {
      display: flex; align-items: center; gap: 12px;
      padding: 12px 14px;
      border: 1.5px solid #E5E7EB; border-radius: 10px;
      cursor: pointer; margin-bottom: 8px;
      transition: border-color 0.15s, background 0.15s, transform 0.1s, box-shadow 0.15s;
    }
    .eq-opt:hover:not(.selected) { border-color: #C4B5FD; background: #F5F3FF; transform: translateX(2px); }
    .eq-opt.selected {
      border-color: #6D28D9; background: #F5F3FF;
      box-shadow: 0 0 0 3px rgba(109,40,217,0.08);
    }
    .eq-opt-key {
      width: 28px; height: 28px; flex-shrink: 0;
      border-radius: 50%; border: 1.5px solid #D1D5DB;
      display: flex; align-items: center; justify-content: center;
      font-size: 11px; font-weight: 700; color: #6B7280;
      transition: all 0.15s;
    }
    .eq-opt.selected .eq-opt-key { background: #6D28D9; border-color: #6D28D9; color: #fff; }
    .eq-opt-text { font-size: 13px; color: #1E1B4B; flex: 1; line-height: 1.5; }

    /* ── Nav ── */
    .eq-qnav { display: flex; align-items: center; justify-content: space-between; padding-top: 14px; border-top: 1px solid #F3F4F6; margin-top: 6px; }
    .eq-nav-l { display: flex; gap: 7px; }

    /* ── Result ── */
    .eq-result-score { display: flex; align-items: center; gap: 20px; margin-bottom: 16px; }
    .eq-score-heading { font-size: 22px; font-weight: 700; color: #1E1B4B; }
    .eq-score-lbl     { font-size: 13px; color: #6B7280; margin-top: 4px; }
    .eq-score-tags    { display: flex; gap: 6px; margin-top: 10px; flex-wrap: wrap; }
    .eq-divider       { height: 1px; background: #F3F4F6; margin: 0 0 14px; }

    /* ── Kind band ── */
    .eq-kind-band { display: flex; align-items: center; gap: 8px; padding: 10px 14px; border-radius: 10px; margin-bottom: 16px; font-size: 12px; font-weight: 500; border: 1px solid; }
    .eq-kind-band.pass    { background: #D1FAE5; border-color: #6EE7B7; color: #065F46; }
    .eq-kind-band.fail    { background: #FEF3C7; border-color: #FDE68A; color: #92400E; }
    .eq-kind-band.neutral { background: #F5F3FF; border-color: #DDD6FE; color: #5B21B6; }

    /* ── Review ── */
    .eq-review-item { border: 1px solid #EAE7F8; border-radius: 10px; overflow: hidden; margin-bottom: 8px; transition: box-shadow 0.15s; }
    .eq-review-item:hover { box-shadow: 0 2px 10px rgba(0,0,0,0.05); }
    .eq-review-head {
      display: flex; align-items: center; gap: 9px;
      padding: 11px 14px; cursor: pointer; background: #fff;
      border-left: 3px solid transparent;
      transition: background 0.12s;
    }
    .eq-review-head:hover { background: #FAFAFE; }
    .eq-review-head.ok { border-left-color: #059669; }
    .eq-review-head.ko { border-left-color: #DC2626; }
    .eq-review-qnum { font-size: 10px; font-weight: 700; color: #9CA3AF; flex-shrink: 0; min-width: 26px; }
    .eq-review-qtxt { font-size: 12px; font-weight: 500; color: #1E1B4B; flex: 1; line-height: 1.4; }
    .eq-review-body { padding: 12px 14px; background: #FAFAFA; border-top: 1px solid #F0EEF9; font-size: 12px; animation: eq-fade-in 0.18s ease both; }
    .eq-review-row  { margin-bottom: 6px; color: #374151; line-height: 1.5; }
    .eq-explain-ok { margin-top: 8px; padding: 9px 12px; border-radius: 8px; font-size: 12px; background: #D1FAE5; color: #065F46; border-left: 3px solid #059669; }
    .eq-explain-ko { margin-top: 8px; padding: 9px 12px; border-radius: 8px; font-size: 12px; background: #FEE2E2; color: #991B1B; border-left: 3px solid #DC2626; }

    /* ── Feedback banners ── */
    .eq-feedback-banner { padding: 12px 14px; border-radius: 10px; border: 1px solid; font-size: 12px; margin-bottom: 12px; }
    .eq-feedback-banner.pending { background: #EDE9FE; border-color: #C4B5FD; color: #5B21B6; }
    .eq-feedback-banner.failed  { background: #FEF3C7; border-color: #FDE68A; color: #92400E; }
    .eq-fb-title { font-weight: 700; margin-bottom: 3px; }

    /* ── Cooldown card ── */
    .eq-cooldown-card {
      display: flex; align-items: center; gap: 14px;
      padding: 14px 16px;
      background: #FFF7ED;
      border: 1px solid #FED7AA; border-radius: 12px;
      margin-top: 16px;
    }
    .eq-cooldown-ico { width: 36px; height: 36px; border-radius: 10px; background: #FFEDD5; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .eq-cooldown-ico svg { width: 17px; height: 17px; color: #C2410C; }
    .eq-cooldown-title { font-size: 13px; font-weight: 700; color: #9A3412; }
    .eq-cooldown-sub   { font-size: 11px; color: #C2410C; margin-top: 2px; }
  `;

  const selectedSkillForSetup = skills.find((s) => s.skillUuid === selectedSkillId) ?? skills[0] ?? null;
  const hasActiveFilters = skillSearch.trim().length > 0 || selectedCategory !== "ALL";

  return (
    <>
      <style>{css}</style>
      <div className="eq-wrap">
        <div className="eq-body">
          {error && <AlertBanner message={error} />}
          {starting && (
            <div className="eq-start-loading" role="status" aria-live="polite">
              <div className="eq-start-loading-card">
                <span className="eq-start-loading-icon">
                  <FontAwesomeIcon icon={faSpinner} />
                </span>
                <div>
                  <div className="eq-start-loading-title">Préparation du quiz...</div>
                  <div className="eq-start-loading-sub">Génération des questions en cours</div>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════ SETUP ══════════════ */}
          {phase === "setup" && (
            <>
              {/* ── Selected skill info card ── */}
              {selectedSkillForSetup && (
                <div className="eq-card">
                  <div className="eq-sel-header">
                    <div className="eq-sel-avatar">
                      {(() => {
                        const url = resolveSkillIconUrl(selectedSkillForSetup);
                        return url
                          ? <img src={url} alt="" />
                          : <FontAwesomeIcon icon={faBolt} style={{ width: 20, height: 20, color: "#6D28D9" }} />;
                      })()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="eq-sel-name">{selectedSkillForSetup.skillName}</div>
                        {(() => {
                          const b = statusBadgeConfig(selectedSkillForSetup.status, selectedSkillForSetup.validatedLevel);
                          return <span className={`eq-pill ${b.className}`}>{b.label}</span>;
                        })()}
                      </div>
                      <div className="eq-sel-meta">
                        {formatSkillLevelLabel(
                          selectedSkillForSetup.level,
                          selectedSkillForSetup.status,
                          selectedSkillForSetup.validatedLevel,
                          selectedSkillForSetup.targetLevel,
                        )}
                      </div>
                    </div>
                    {!quizCooldownActive && (
                      <button
                        className="inline-flex flex-shrink-0 items-center gap-2 rounded-xl border border-violet-200 bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(124,58,237,0.28)] transition hover:from-violet-500 hover:to-indigo-500 hover:shadow-[0_6px_18px_rgba(124,58,237,0.34)] disabled:cursor-not-allowed disabled:opacity-45"
                        disabled={loadingSkills || starting}
                        onClick={() => void startQuiz()}
                      >
                        <FontAwesomeIcon
                          icon={starting ? faSpinner : faWandSparkles}
                          className={starting ? "animate-spin" : undefined}
                          style={{ width: 14, height: 14 }}
                        />
                        {starting ? "Préparation..." : "Démarrer le quiz"}
                      </button>
                    )}
                  </div>

                  <div className="eq-stats">
                    <div className="eq-stat s-violet">
                      <div className="eq-stat-val">20</div>
                      <div className="eq-stat-lbl">Questions IA</div>
                    </div>
                    <div className="eq-stat s-teal">
                      <div className="eq-stat-val">15 min</div>
                      <div className="eq-stat-lbl">Durée max</div>
                    </div>
                    <div className="eq-stat s-emerald">
                      <div className="eq-stat-val">70 %</div>
                      <div className="eq-stat-lbl">Seuil requis</div>
                    </div>
                    <div className="eq-stat s-amber">
                      <div className="eq-stat-val">15 j</div>
                      <div className="eq-stat-lbl">Délai carence</div>
                    </div>
                  </div>

                  <div className="eq-info-row">
                    <div className="eq-info-cell">
                      <div className={`eq-info-ico ${quizCooldownActive ? "teal" : "violet"}`}>
                        {quizCooldownActive ? <FontAwesomeIcon icon={faLock} /> : <FontAwesomeIcon icon={faCircleCheck} />}
                      </div>
                      <div>
                        <div className="eq-info-lbl">{quizCooldownActive ? "Quiz bloqué" : "Quiz disponible"}</div>
                        <div className="eq-info-sub">{quizCooldownActive ? "Délai de carence actif" : "Tentative autorisée"}</div>
                      </div>
                    </div>
                    <div className="eq-info-cell">
                      <div className="eq-info-ico teal">
                        <FontAwesomeIcon icon={faCalendarDays} />
                      </div>
                      <div>
                        <div className="eq-info-lbl">Prochaine tentative</div>
                        <div className="eq-info-sub">{formatFrenchDate(selectedSkillForSetup.quizNextAllowedAt)}</div>
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* ── Skills browser ── */}
              <div className="eq-browser">
                {/* Filters bar */}
                <div className="eq-section-topbar">
                  <div className="eq-filters">
                    <div className="eq-searchbar">
                      <span className="eq-search-icon">
                        <FontAwesomeIcon icon={faMagnifyingGlass} style={{ width: 14, height: 14 }} />
                      </span>
                      <input
                        type="search"
                        value={skillSearch}
                        onChange={(e) => setSkillSearch(e.target.value)}
                        placeholder="Rechercher une compétence…"
                        className="eq-search-input"
                      />
                      {skillSearch && (
                        <button
                          type="button"
                          className="eq-search-clear"
                          onClick={() => setSkillSearch("")}
                          aria-label="Effacer la recherche"
                        >
                          <FontAwesomeIcon icon={faXmark} style={{ width: 12, height: 12 }} />
                        </button>
                      )}
                    </div>
                    {skills.length > 0 && (
                      <div className="eq-category-select-wrap">
                        <select
                          className="eq-category-select"
                          value={selectedCategory}
                          onChange={(e) => setSelectedCategory(e.target.value)}
                        >
                          <option value="ALL">Toutes les catégories</option>
                          {categoryOptions.filter((c) => c !== "ALL").map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                        <span className="eq-category-icon" aria-hidden="true">
                          <FontAwesomeIcon icon={faChevronDown} style={{ width: 12, height: 12 }} />
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="eq-section-lbl">
                  Compétences disponibles
                  {!loadingSkills && visibleSkills.length > 0 && (
                    <span style={{ marginLeft: 6, fontWeight: 500, color: "#C4B5FD" }}>
                      ({visibleSkills.length})
                    </span>
                  )}
                </div>

                {/* Skeleton while loading */}
                {loadingSkills ? (
                  <div className="eq-skeleton-grid">
                    {Array.from({ length: SKILLS_PAGE_SIZE }).map((_, i) => (
                      <div key={i} className="eq-skeleton-card" style={{ animationDelay: `${i * 0.08}s` }} />
                    ))}
                  </div>
                ) : visibleSkills.length > 0 ? (
                  <>
                    <div className="eq-browser-main">
                      <div className="eq-skills-grid">
                        {visibleSkills.map((skill) => {
                          const badge = statusBadgeConfig(skill.status, skill.validatedLevel);
                          const iconUrl = resolveSkillIconUrl(skill);
                          const isSelected = selectedSkillId === skill.skillUuid;
                          const cooldown = isQuizCooldownActive(skill.quizNextAllowedAt);
                          const isStartingThisSkill = starting && startingSkillId === skill.skillUuid;
                          return (
                            <div
                              key={`${skill.skillUuid}-${skill.uuid}`}
                              className={`eq-skill-card${isSelected ? " active" : ""}`}
                              onClick={() => setSelectedSkillId(skill.skillUuid)}
                            >
                              <div className="eq-sk-top">
                                <div className="eq-sk-ico">
                                  {iconUrl
                                    ? <img src={iconUrl} alt="" />
                                    : <FontAwesomeIcon icon={faBolt} />}
                                </div>
                                <span className={`eq-pill ${badge.className}`}>{badge.label}</span>
                              </div>
                              <div>
                                <div className="eq-sk-name">{skill.skillName}</div>
                                <div className="eq-sk-lvl">
                                  {formatSkillLevelLabel(skill.level, skill.status, skill.validatedLevel, skill.targetLevel)}
                                </div>
                              </div>
                              <div className="eq-sk-footer">
                                <div className="eq-sk-metric">
                                  <span className="eq-sk-metric-icon">
                                    <FontAwesomeIcon icon={faClock} />
                                  </span>
                                  <div className="min-w-0">
                                    <div className="eq-sk-metric-val">15 min</div>
                                    <div className="eq-sk-metric-lbl">Durée estimée</div>
                                  </div>
                                </div>
                                <div className="eq-sk-metric">
                                  <span className="eq-sk-metric-icon">
                                    <FontAwesomeIcon icon={faChartSimple} />
                                  </span>
                                  <div className="min-w-0">
                                    <div className="eq-sk-metric-val">20 questions</div>
                                    <div className="eq-sk-metric-lbl">Quiz IA</div>
                                  </div>
                                </div>
                              </div>
                              {cooldown ? (
                                <div className="eq-sk-unavailable" aria-label="Indisponible">
                                  <span className="eq-sk-unavailable-icon">
                                    <FontAwesomeIcon icon={faLock} />
                                  </span>
                                  <span className="eq-sk-unavailable-title">Indisponible</span>
                                </div>
                              ) : (
                                <button
                                  className="eq-sk-start"
                                  disabled={loadingSkills || starting}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedSkillId(skill.skillUuid);
                                    void startQuiz(skill.skillUuid);
                                  }}
                                >
                                  {isStartingThisSkill && <FontAwesomeIcon icon={faSpinner} className="eq-start-btn-icon" />}
                                  {isStartingThisSkill ? "Préparation..." : "Commencer"}
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Pagination controls — admin style — fixed bottom after sidebar */}
                    {totalPages > 1 && (
                      <div className="eq-pagination flex shrink-0 items-center justify-between gap-3">
                        <p className="text-sm text-slate-400">
                          Page {currentPage + 1} sur {totalPages}
                          {" · "}
                          {Math.min(currentPage * SKILLS_PAGE_SIZE + 1, totalSkills)}–{Math.min(currentPage * SKILLS_PAGE_SIZE + visibleSkills.length, totalSkills)} sur {totalSkills}
                        </p>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                            disabled={currentPage === 0 || loadingSkills}
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-500 shadow-sm transition-all duration-150 hover:border-violet-300 hover:text-violet-600 focus:outline-none focus:ring-2 focus:ring-violet-300 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:text-slate-500"
                          >
                            <FontAwesomeIcon icon={faChevronLeft} className="h-4 w-4" />
                            Précédent
                          </button>
                          <button
                            type="button"
                            onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                            disabled={currentPage >= totalPages - 1 || loadingSkills}
                            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(124,58,237,0.35)] transition-all duration-150 active:scale-[0.97] focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            Suivant
                            <FontAwesomeIcon icon={faChevronRight} className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  /* ── Empty state — pro & moderne ── */
                  <div className="eq-empty-wrap">
                    <div className="eq-empty-ico-outer">
                      <FontAwesomeIcon icon={faWandSparkles} />
                    </div>

                    <div className="eq-empty-title">
                      {skillSearch
                        ? `Aucun résultat pour « ${skillSearch} »`
                        : "Aucune compétence dans cette catégorie"}
                    </div>

                    <div className="eq-empty-sub">
                      {skillSearch
                        ? "Vérifiez l'orthographe ou essayez un terme plus général."
                        : "Sélectionnez « Toutes les catégories » ou modifiez vos filtres pour afficher d'autres compétences."}
                    </div>

                   

                    {/* Reset button — uniquement si filtre actif */}
                    {hasActiveFilters && (
                      <button
                        className="eq-empty-action"
                        onClick={() => { setSkillSearch(""); setSelectedCategory("ALL"); }}
                      >
                        <FontAwesomeIcon icon={faSpinner} style={{ width: 13, height: 13 }} />
                        Réinitialiser les filtres
                      </button>
                    )}
                  </div>
                )}
              </div>
            </>
          )}

          {/* ══════════════ IN PROGRESS ══════════════ */}
          {phase === "in_progress" && startData && currentQuestion && (
            <section className="quiz-enter app-page-bg text-slate-950 eq-in-progress">
              <div className="eq-in-progress-inner">
                <div className="eq-in-progress-grid">
                  <main className="eq-in-progress-main">
                    <div className="rounded-xl border border-violet-100 bg-gradient-to-br from-white via-slate-50 to-violet-50/70 p-4 shadow-sm shadow-violet-100/60">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                            <FontAwesomeIcon icon={faClipboardCheck} className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-lg font-bold">Session en cours</p>
                            <p className="text-sm font-medium text-slate-500">{answeredCount} / {questions.length} réponses complétées</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className={["text-xs font-semibold uppercase tracking-wide", isUrgent ? "text-rose-600" : "text-rose-700"].join(" ")}>Temps restant</p>
                            <p className={["font-mono text-3xl font-bold leading-none", isUrgent ? "text-rose-700" : "text-slate-950"].join(" ")}>{formatTime(remainingSeconds)}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setQuitConfirmOpen(true)}
                            disabled={submitting}
                            className="inline-flex items-center gap-2 rounded-2xl border border-rose-300 bg-white px-4 py-2.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <FontAwesomeIcon icon={faRightFromBracket} className="h-4 w-4" />
                            Quitter
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl border border-violet-100 bg-gradient-to-br from-white via-slate-50 to-violet-50/70 p-4 shadow-sm shadow-violet-100/60">
                      <div className="flex flex-nowrap justify-between gap-2">
                        {questions.map((q, index) => {
                          const answered = Boolean(answers[q.id]);
                          const marked = Boolean(bookmarkedQuestions[q.id]);
                          const active = index === activeQuestion;
                          return (
                            <button
                              key={q.id}
                              type="button"
                              onClick={() => setActiveQuestion(index)}
                              aria-label={`Aller à la question ${index + 1}`}
                              className={[
                                "relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-bold transition xl:h-9 xl:w-9",
                                active
                                  ? "border-violet-600 bg-violet-700 text-white ring-4 ring-violet-200"
                                  : answered
                                    ? "border-emerald-200 bg-emerald-100 text-emerald-800"
                                    : marked
                                      ? "border-amber-300 bg-amber-50 text-amber-700 ring-2 ring-amber-100"
                                      : "border-violet-200 bg-slate-100 text-slate-700 hover:border-violet-400 hover:text-violet-700",
                              ].join(" ")}
                            >
                              {index + 1}
                              {marked && (
                                <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-amber-400" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                      <div className="mt-3 h-1 overflow-hidden rounded-full bg-slate-200">
                        <div
                          className="h-full rounded-full bg-violet-700 transition-all duration-300"
                          style={{ width: `${questions.length ? (answeredCount / questions.length) * 100 : 0}%` }}
                        />
                      </div>
                    </div>

                    <div className="eq-question-card rounded-xl border border-violet-100 bg-gradient-to-br from-white via-slate-50 to-violet-50/70 p-5 shadow-sm shadow-violet-100/70">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-violet-700 px-4 py-1.5 text-sm font-semibold text-white">Question {activeQuestion + 1} / {questions.length}</span>
                          <span className="rounded-full border border-violet-200 bg-slate-100 px-4 py-1.5 text-sm font-semibold text-slate-700">{currentQuestion.category || "Compréhension"}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleBookmark(currentQuestion.id)}
                          aria-pressed={currentQuestionMarked}
                          className={[
                            "inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold transition",
                            currentQuestionMarked
                              ? "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
                              : "text-slate-700 hover:bg-slate-100",
                          ].join(" ")}
                        >
                          <FontAwesomeIcon icon={faBookmark} className="h-4 w-4" />
                          {currentQuestionMarked ? "Marqué" : "Marquer"}
                        </button>
                      </div>

                      <h2 className="mt-4 text-xl font-bold leading-snug tracking-tight text-slate-950 md:text-2xl">
                        {currentQuestion.question}
                      </h2>

                      <div key={`options-${currentQuestion.id}`} className="quiz-question-swap eq-options-stack mt-4 space-y-3">
                        {currentQuestion.options.map((option) => {
                          const selected = answers[currentQuestion.id] === option.key;
                          return (
                            <button
                              key={`${currentQuestion.id}-${option.key}`}
                              type="button"
                              onClick={() => pickAnswer(currentQuestion.id, option.key)}
                              className={[
                                "group flex w-full items-center gap-4 rounded-xl border px-4 py-4 text-left transition-all duration-150",
                                selected
                                  ? "border-violet-700 bg-violet-50 shadow-sm ring-2 ring-violet-500"
                                  : "border-violet-100 bg-white/90 hover:border-violet-400 hover:bg-violet-50/60",
                              ].join(" ")}
                            >
                              <span
                                className={[
                                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-base font-bold",
                                  selected ? "bg-violet-700 text-white" : "bg-slate-100 text-slate-700 group-hover:bg-violet-100 group-hover:text-violet-700",
                                ].join(" ")}
                              >
                                {option.key}
                              </span>
                              <span className={["min-w-0 flex-1 text-base font-semibold leading-relaxed md:text-lg", selected ? "text-violet-800" : "text-slate-800"].join(" ")}>
                                {option.text}
                              </span>
                              {selected && <FontAwesomeIcon icon={faCircleCheck} className="h-5 w-5 shrink-0 text-violet-700" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => setActiveQuestion((v) => Math.max(0, v - 1))}
                        disabled={activeQuestion === 0}
                        className="inline-flex items-center gap-2 rounded-2xl border border-violet-200 bg-white px-5 py-3 text-base font-bold text-slate-700 shadow-sm transition hover:border-violet-400 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <FontAwesomeIcon icon={faChevronLeft} className="h-4 w-4" />
                        Précédent
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveQuestion((v) => Math.min(questions.length - 1, v + 1))}
                        disabled={activeQuestion === questions.length - 1}
                        className="rounded-2xl px-5 py-3 text-base font-semibold text-slate-700 transition hover:bg-violet-50 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Sauter
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (isLastQuestion) { void handleSubmit(); return; }
                          setActiveQuestion((v) => Math.min(questions.length - 1, v + 1));
                        }}
                        disabled={submitting || (!isLastQuestion && !hasCurrentAnswer)}
                        className="inline-flex items-center gap-2 rounded-2xl bg-violet-700 px-6 py-3 text-base font-bold text-white shadow-md shadow-violet-200 transition hover:bg-violet-600 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
                      >
                        {submitting ? (
                          <>
                            <FontAwesomeIcon icon={faSpinner} className="h-4 w-4 animate-spin" />
                            Soumission...
                          </>
                        ) : (
                          <>
                            {isLastQuestion ? "Soumettre" : "Suivant"}
                            <FontAwesomeIcon icon={faChevronRight} className="h-4 w-4" />
                          </>
                        )}
                      </button>
                    </div>
                  </main>

                  <aside className="min-w-0 space-y-3 self-start">
                    <div className="rounded-xl border border-violet-100 bg-gradient-to-br from-white via-slate-50 to-violet-50/70 p-4 shadow-sm shadow-violet-100/60">
                      <div className="flex items-center gap-2">
                        <FontAwesomeIcon icon={faChartSimple} className="h-5 w-5 text-violet-700" />
                        <h3 className="text-lg font-bold">Aperçu</h3>
                      </div>
                      <div className="mt-3 space-y-2">
                        <div className="flex items-center justify-between text-base">
                          <span className="font-medium text-slate-600">Réponses données</span>
                          <span className="font-mono text-2xl font-bold text-emerald-600">{String(answeredCount).padStart(2, "0")}</span>
                        </div>
                        <div className="flex items-center justify-between text-base">
                          <span className="font-medium text-slate-600">Questions restantes</span>
                          <span className="text-xl font-bold text-slate-950">{unansweredCount}</span>
                        </div>
                        <div className="flex items-center justify-between text-base">
                          <span className="font-medium text-slate-600">Marquées</span>
                          <span className="text-xl font-bold text-amber-600">{bookmarkedCount}</span>
                        </div>
                      </div>
                    </div>

                    <div className="overflow-hidden rounded-xl bg-violet-700 p-4 text-white shadow-md shadow-violet-200">
                      <div className="flex items-center gap-2">
                        <FontAwesomeIcon icon={faShieldHalved} className="h-5 w-5" />
                        <h3 className="text-lg font-bold">Prêt à finir ?</h3>
                      </div>
                      <p className="mt-2 text-sm font-medium leading-relaxed text-violet-50">
                        Vous pouvez revoir vos réponses à tout moment avant de soumettre définitivement votre évaluation.
                      </p>
                      <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="mt-3 w-full rounded-2xl bg-white px-4 py-2.5 text-base font-bold text-violet-700 transition hover:bg-violet-50 disabled:cursor-not-allowed disabled:bg-violet-100"
                      >
                        {submitting ? "Soumission..." : "Soumettre le quiz"}
                      </button>
                    </div>
                  </aside>
                </div>
              </div>
            </section>
          )}

          {/* ══════════════ SUBMITTED ══════════════ */}
          {phase === "submitted" && result && (
            <section className="quiz-enter flex min-h-[calc(100dvh-8.5rem)] flex-1 flex-col gap-5 pb-0">
              <div className="quiz-enter quiz-enter-delay-1 rounded-3xl border border-violet-100 bg-gradient-to-br from-white via-slate-50 to-violet-50/80 px-6 py-6 shadow-lg shadow-violet-100/60">
                  <div className="grid gap-5 md:grid-cols-[132px_minmax(0,1fr)] md:items-center">
                  <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-white">
                    <div className="relative h-28 w-28">
                      <svg className="h-28 w-28 -rotate-90" viewBox="0 0 120 120" aria-hidden="true">
                        <circle cx="60" cy="60" r={ring.radius} strokeWidth="8" className="fill-none stroke-slate-100" />
                        <circle
                          cx="60"
                          cy="60"
                          r={ring.radius}
                          strokeWidth="8"
                          strokeLinecap="round"
                          className={["fill-none transition-all duration-700", passed ? "stroke-emerald-500" : "stroke-rose-500"].join(" ")}
                          strokeDasharray={ring.circumference}
                          strokeDashoffset={ring.offset}
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <p className="text-3xl font-bold leading-none text-slate-900">{roundedScore}%</p>
                        <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-400">score</p>
                      </div>
                    </div>
                  </div>

                  <div className="min-w-0 flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Résultat du quiz</h2>
                        <span
                          className={[
                            "rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-wide",
                            passed ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700",
                          ].join(" ")}
                        >
                          {passed ? "Quiz validé" : "Quiz non validé"}
                        </span>
                      </div>
                      <p className="mt-2 max-w-3xl text-base font-medium leading-relaxed text-slate-500">
                        <span className="font-bold text-slate-800">
                          {result.result?.correctAnswers ?? 0} bonne{(result.result?.correctAnswers ?? 0) !== 1 ? "s" : ""} réponse{(result.result?.correctAnswers ?? 0) !== 1 ? "s" : ""} sur {questions.length}.
                        </span>{" "}
                        Consultez le détail ci-dessous pour identifier les notions maîtrisées et celles qui nécessitent une révision approfondie avant votre certification finale.
                      </p>
                    </div>
                    <div className="flex shrink-0 items-start">
                      <button
                        type="button"
                        onClick={resetFlow}
                        className="inline-flex items-center gap-2 rounded-2xl border border-violet-200 bg-violet-50 px-4 py-2 text-sm font-semibold text-violet-700 shadow-sm transition hover:border-violet-300 hover:bg-violet-100"
                      >
                        <FontAwesomeIcon icon={faWandSparkles} className="h-4 w-4" />
                        Démarrer nouveau quiz
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className={["grid gap-4", result.nextAllowedAt ? "lg:grid-cols-2" : "lg:grid-cols-[minmax(0,1fr)_auto]"].join(" ")}>
                <div
                  className={[
                    "rounded-3xl border border-l-4 p-5 shadow-sm",
                    result.passed
                      ? "border-emerald-200 border-l-emerald-500 bg-gradient-to-br from-emerald-50 to-white text-emerald-800 shadow-emerald-100/70"
                      : "border-rose-200 border-l-rose-500 bg-gradient-to-br from-rose-50 to-white text-rose-800 shadow-rose-100/70",
                  ].join(" ")}
                >
                  <div className="flex items-start gap-3">
                    <FontAwesomeIcon icon={result.passed ? faCircleCheck : faXmark} className="mt-0.5 h-4 w-4" />
                    <div>
                      <p className="text-sm font-semibold">
                        {startData?.quizKind === "initial"
                          ? "Niveau attribué selon votre score"
                          : result.passed
                            ? "Validé, niveau augmenté"
                            : "Score insuffisant, progression à retenter"}
                      </p>
                      <p className="mt-1 text-sm font-medium opacity-90">
                        {result.passed
                          ? "Vos compétences ont été mises à jour dans votre profil collaborateur."
                          : "Votre niveau validé est conservé. Revoyez les points ci-dessous avant une nouvelle tentative."}
                      </p>
                    </div>
                  </div>
                </div>

                {result.nextAllowedAt && (
                  <div className="rounded-3xl border border-l-4 border-amber-200 border-l-amber-500 bg-gradient-to-br from-amber-50 to-white p-5 text-amber-800 shadow-sm shadow-amber-100/70">
                    <div className="flex items-start gap-3">
                      <FontAwesomeIcon icon={faCalendarDays} className="mt-0.5 h-4 w-4" />
                      <div>
                        <p className="text-sm font-semibold">
                          Prochaine tentative autorisée : {formatFrenchDate(result.nextAllowedAt)}
                        </p>
                        <p className="mt-1 text-sm font-medium opacity-90">
                          Un délai de carence est nécessaire pour consolider vos acquis.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* bouton supprimé sur demande */}
              </div>

              {(result.feedbackStatus === "PENDING" || result.feedbackStatus === "GENERATING") && (
                <div className="rounded-3xl border border-violet-200 bg-gradient-to-br from-violet-50 to-white p-5 shadow-sm shadow-violet-100/70">
                  <p className="text-base font-semibold text-violet-800">Génération du feedback en cours</p>
                  <p className="mt-1 text-sm text-violet-700/90">
                    Le score est déjà disponible. Le détail IA continue de se compléter automatiquement.
                  </p>
                </div>
              )}
              {result.feedbackStatus === "FAILED" && (
                <div className="rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-5 shadow-sm shadow-amber-100/70">
                  <p className="text-base font-semibold text-amber-800">Feedback IA indisponible</p>
                  <p className="mt-1 text-sm text-amber-700/90">
                    Le détail local reste visible. Vous pouvez réessayer plus tard.
                  </p>
                </div>
              )}

              <div className="quiz-enter quiz-enter-delay-2 flex min-h-0 flex-1 flex-col gap-3">
                <div className="flex items-center gap-2 text-slate-800">
                  <FontAwesomeIcon icon={faClipboardCheck} className="h-4 w-4 text-slate-600" />
                  <h3 className="text-xl font-bold">Détail des réponses</h3>
                </div>
                {displayedSubmittedCards.map((card) => {
                  const expanded = openedReviewQuestionId === card.questionId;
                  return (
                    <button
                      key={card.questionId}
                      type="button"
                      onClick={() => setOpenedReviewQuestionId((prev) => prev === card.questionId ? null : card.questionId)}
                      className={[
                        "w-full rounded-3xl border border-violet-100 bg-gradient-to-br from-white via-slate-50 to-violet-50/70 p-5 text-left transition-all hover:border-violet-300 hover:shadow-md",
                        expanded ? "shadow-lg shadow-violet-100/80 ring-1 ring-violet-100" : "shadow-sm shadow-violet-100/60",
                      ].join(" ")}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex min-w-0 flex-1 items-start gap-3">
                          <span className="mt-0.5 inline-flex h-8 min-w-8 items-center justify-center rounded-full bg-slate-100 px-2 text-sm font-semibold text-slate-600">
                            #{card.index + 1}
                          </span>
                          <p className="min-w-0 flex-1 text-base font-bold leading-relaxed text-slate-800">
                            {card.questionText}
                          </p>
                        </div>
                        <span
                          className={[
                            "shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-wide",
                            card.isCorrect ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700",
                          ].join(" ")}
                        >
                          {card.isCorrect ? "Correcte" : "Incorrecte"}
                        </span>
                      </div>

                      {expanded && (
                        <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
                          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                            <span className="mr-2">✓</span>
                            <span className="font-bold">Bonne réponse :</span> {card.correctText}
                          </div>
                          <div
                            className={[
                              "rounded-2xl border px-4 py-3 text-sm font-semibold",
                              card.isCorrect
                                ? "border-slate-100 bg-white text-slate-600"
                                : "border-rose-100 bg-rose-50 text-rose-700",
                            ].join(" ")}
                          >
                            <span className="mr-2">{card.isCorrect ? "⊙" : "×"}</span>
                            <span className="font-bold">Votre réponse :</span> {card.userText}
                          </div>
                          {!!card.explanation && (
                            <div className="pt-1">
                              <p className="text-sm leading-relaxed text-slate-600">{card.explanation}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
                {reviewTotalPages > 1 && (
                  <div className="mt-auto flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-violet-100 bg-gradient-to-br from-white via-slate-50 to-violet-50/70 px-5 py-4 shadow-sm shadow-violet-100/60">
                    <p className="text-sm font-semibold text-slate-600">
                      Page {reviewPage + 1} sur {reviewTotalPages}
                      <span className="ml-2 text-slate-400">
                        {result.questionPage?.totalCount ?? allSubmittedCards.length} réponses
                      </span>
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (result.questionPage) void loadReviewPage(reviewPage - 1);
                          else setReviewPage((p) => Math.max(0, p - 1));
                        }}
                        disabled={(result.questionPage ? !result.questionPage.hasPrevious : reviewPage === 0) || submitting || reviewLoading}
                        className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-violet-300 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-45"
                      >
                        <FontAwesomeIcon icon={faChevronLeft} className="h-3.5 w-3.5" />
                        Précédent
                      </button>
                      <div style={{ display: "flex", gap: 8, alignItems: "center", maxWidth: 420, overflowX: "auto", padding: "4px 2px" }}>
                        {(() => {
                          const total = reviewTotalPages;
                          const cur = reviewPage;
                          if (!total || total <= 1) return null;
                          const pagesSet = new Set<number>();
                          pagesSet.add(0);
                          pagesSet.add(total - 1);
                          for (let i = cur - 2; i <= cur + 2; i += 1) {
                            if (i > 0 && i < total - 1) pagesSet.add(i);
                          }
                          const arr = Array.from(pagesSet).sort((a, b) => a - b);
                          const seq: Array<number | string> = [];
                          for (let i = 0; i < arr.length; i += 1) {
                            seq.push(arr[i]);
                            if (i < arr.length - 1 && arr[i + 1] > arr[i] + 1) seq.push("...");
                          }
                          return seq.map((p, idx) => {
                            if (p === "...") return <span key={`sep-${idx}`} style={{ padding: "0 6px", color: "#9CA3AF" }}>…</span>;
                            const pageNum = Number(p);
                            const isActive = pageNum === cur;
                            return (
                              <button
                                key={`pg-${pageNum}`}
                                type="button"
                                onClick={() => {
                                  if (result.questionPage) void loadReviewPage(pageNum);
                                  else setReviewPage(pageNum);
                                }}
                                disabled={reviewLoading || submitting}
                                className={["eq-page-btn", isActive ? "active" : "", reviewLoading ? "disabled" : ""].join(" ")}
                                aria-current={isActive}
                                title={`Aller à la page ${pageNum + 1}`}
                              >
                                {pageNum + 1}
                              </button>
                            );
                          });
                        })()}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (result.questionPage) void loadReviewPage(reviewPage + 1);
                          else setReviewPage((p) => Math.min(reviewTotalPages - 1, p + 1));
                        }}
                        disabled={(result.questionPage ? !result.questionPage.hasNext : reviewPage >= reviewTotalPages - 1) || submitting || reviewLoading}
                        className="inline-flex items-center gap-2 rounded-2xl bg-violet-700 px-3 py-2 text-sm font-semibold text-white shadow-sm shadow-violet-200 transition hover:bg-violet-600 disabled:cursor-not-allowed disabled:opacity-45"
                      >
                        Suivant
                        <FontAwesomeIcon icon={faChevronRight} className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}
        </div>
      </div>

      <AlertModal
        open={Boolean(cooldownAlertMessage)}
        title="Quiz temporairement indisponible"
        message={<span style={{ whiteSpace: "pre-line" }}>{cooldownAlertMessage}</span>}
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
    </>
  );
}
