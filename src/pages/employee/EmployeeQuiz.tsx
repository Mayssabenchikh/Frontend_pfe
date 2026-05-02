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
  faChevronUp,
  faXmark,
  faChevronLeft,
  faChevronRight,
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
const SKILLS_PAGE_SIZE = 12;
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
function statusBadgeConfig(status: string): { label: string; className: string } {
  const raw = String(status ?? "").toUpperCase();
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
    if (!starting) { setGenerationElapsedSeconds(0); return; }
    const interval = window.setInterval(() => setGenerationElapsedSeconds((p) => p + 1), 1000);
    return () => window.clearInterval(interval);
  }, [starting]);

  useEffect(() => {
    if (phase !== "submitted" || !startData || !result || (result.feedbackStatus !== "PENDING" && result.feedbackStatus !== "GENERATING")) return;
    const interval = window.setInterval(async () => {
      try {
        const res = await quizApi.result(startData.attemptId);
        setResult(res.data);
        if (res.data.feedbackStatus === "READY" || res.data.feedbackStatus === "FAILED") window.clearInterval(interval);
      } catch { window.clearInterval(interval); }
    }, 5000);
    return () => window.clearInterval(interval);
  }, [phase, startData, result]);

  const selectedSkill = useMemo(() => skills.find((s) => s.skillUuid === selectedSkillId) ?? null, [skills, selectedSkillId]);
  const quizCooldownActive = useMemo(() => isQuizCooldownActive(selectedSkill?.quizNextAllowedAt), [selectedSkill]);
  const questions = startData?.quiz?.questions ?? [];
  const answeredCount = useMemo(() => questions.filter((q) => Boolean(answers[q.id])).length, [questions, answers]);
  const currentQuestion = questions[activeQuestion];
  const isLastQuestion = activeQuestion === questions.length - 1;
  const hasCurrentAnswer = currentQuestion ? Boolean(answers[currentQuestion.id]) : false;
  const isUrgent = remainingSeconds <= 120;
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

  const submittedQuestionCards = useMemo(() => {
    if (!result || !startData) return [];
    const feedbackMap = new Map(perQuestionInsights.map((item) => [item.questionId, item]));
    return (result.result?.perQuestion ?? []).map((scoreItem, index) => {
      const quizQuestion = startData.quiz.questions.find((q) => q.id === scoreItem.questionId);
      const correctOption = quizQuestion?.options?.find((o) => o.key === scoreItem.correctAnswerKey);
      const userOption = quizQuestion?.options?.find((o) => o.key === scoreItem.userAnswerKey);
      const insight = feedbackMap.get(scoreItem.questionId);
      return {
        index, questionId: scoreItem.questionId, isCorrect: scoreItem.isCorrect,
        questionText: quizQuestion?.question || "Question indisponible",
        correctText: `${scoreItem.correctAnswerKey}${correctOption?.text ? ` – ${correctOption.text}` : ""}`,
        userText: scoreItem.userAnswerKey ? `${scoreItem.userAnswerKey}${userOption?.text ? ` – ${userOption.text}` : ""}` : "Aucune réponse",
        explanation: insight?.explanation || "",
      };
    });
  }, [result, startData, perQuestionInsights]);

  function resolveSkillIconUrl(skill: EmployeeSkillDto): string | null {
    return skill.iconUrl || getSkillIconUrl(skill.skillName);
  }
  async function fetchResultWithRetry(attemptId: number, retries = 5, delayMs = 700) {
    let lastError: any;
    for (let i = 0; i < retries; i += 1) {
      try { return await quizApi.result(attemptId); }
      catch (e: any) { lastError = e; if (!isConflictError(e) || i === retries - 1) throw e; await sleep(delayMs); }
    }
    throw lastError;
  }

  async function startQuiz(skillUuid?: string) {
    const activeSkillId = skillUuid ?? selectedSkillId;
    const activeSkill = skills.find((s) => s.skillUuid === activeSkillId) ?? selectedSkill ?? null;
    if (!activeSkillId || starting) return;
    if (activeSkill?.quizNextAllowedAt && isQuizCooldownActive(activeSkill.quizNextAllowedAt)) {
      setCooldownAlertMessage([`Prochaine tentative autorisée après le ${formatFrenchDateTime(activeSkill.quizNextAllowedAt)}.`, "", `Après un score inférieur à 70 %, un délai de ${QUIZ_FAIL_COOLDOWN_DAYS} jours est obligatoire avant une nouvelle tentative.`].join("\n"));
      return;
    }
    setError(null); setStarting(true);
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
      const resultRes = await fetchResultWithRetry(startData.attemptId);
      setResult(resultRes.data); setOpenedReviewQuestionId(resultRes.data.result?.perQuestion?.[0]?.questionId ?? null);
      await syncSkillStatusAfterQuiz(resultRes.data, startData.quizKind, selectedSkillId ?? undefined);
      setPhase("submitted");
    } catch (e: any) {
      const parsed = readApiError(e, "Soumission impossible");
      if (parsed.status === 404) {
        try {
          const resultRes = await fetchResultWithRetry(startData.attemptId, 12, 800);
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
      const resultRes = await fetchResultWithRetry(startData.attemptId);
      setResult(resultRes.data); setOpenedReviewQuestionId(resultRes.data.result?.perQuestion?.[0]?.questionId ?? null);
      await syncSkillStatusAfterQuiz(resultRes.data, startData.quizKind, selectedSkillId ?? undefined);
      setPhase("submitted");
    } catch (e: any) {
      const parsed = readApiError(e, "Attendez la finalisation automatique");
      if (parsed.status === 404) {
        try {
          const resultRes = await fetchResultWithRetry(startData.attemptId, 12, 800);
          setResult(resultRes.data); setOpenedReviewQuestionId(resultRes.data.result?.perQuestion?.[0]?.questionId ?? null);
          await syncSkillStatusAfterQuiz(resultRes.data, startData.quizKind, selectedSkillId ?? undefined);
          setPhase("submitted"); return;
        } catch { setError("Impossible de récupérer le résultat automatique. Relancez un nouveau quiz."); return; }
      }
      setError(parsed.message);
    } finally { setSubmitting(false); submitLockRef.current = false; }
  }

  async function resetFlow() {
    setPhase("setup"); setStartData(null); setResult(null); setAnswers({});
    setActiveQuestion(0); setOpenedReviewQuestionId(null); setRemainingSeconds(0); setError(null);
    try { const res = await quizApi.listEmployeeSkills(); const data = Array.isArray(res.data) ? res.data : []; setSkills(data); } catch { /* ignore */ }
  }

  function quitInProgressQuiz() {
    setQuitConfirmOpen(false); setPhase("setup"); setStartData(null); setResult(null); setAnswers({});
    setActiveQuestion(0); setOpenedReviewQuestionId(null); setRemainingSeconds(0); setError(null);
    setSubmitting(false); submitLockRef.current = false;
  }

  const css = `
    /* ── Reset & Base ── */
    *, *::before, *::after { box-sizing: border-box; }

    .eq-wrap { background: #F9F8FF; display: flex; flex: 1; flex-direction: column; width: 100%; height: 100%; min-height: 0; overflow: hidden; }
    .eq-body  { padding: 12px; display: flex; flex-direction: column; gap: 10px; flex: 1; min-height: 0; overflow-y: auto; padding-bottom: 0 !important; }
    .eq-body > *:last-child { margin-bottom: 0 !important; padding-bottom: 0 !important; }
    .eq-browser { display: flex; flex: 1; min-height: 0; flex-direction: column; }
    .eq-browser-main { flex: 1; min-height: 0; overflow-y: auto; padding-top: 4px; padding-bottom: 10px; }
    .eq-skills-grid { margin-bottom: 0 !important; }
    .eq-empty-wrap { margin-bottom: 0 !important; padding-bottom: 0 !important; }

    /* ── Animations ── */
    @keyframes eq-spin    { to { transform: rotate(360deg); } }
    @keyframes eq-fade-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes eq-shimmer { 0% { background-position: -400px 0; } 100% { background-position: 400px 0; } }
    @keyframes eq-pulse-ring { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
    @keyframes eq-bounce-dot { 0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; } 40% { transform: scale(1); opacity: 1; } }

    .eq-fade-in { animation: eq-fade-in 0.28s ease both; }

    /* ── Badges ── */
    .eq-pill { display: inline-flex; align-items: center; padding: 3px 10px; border-radius: 99px; font-size: 11px; font-weight: 600; letter-spacing: 0.01em; }
    .badge-violet { background: #EDE9FE; color: #5B21B6; }
    .badge-green  { background: #D1FAE5; color: #065F46; }
    .badge-red    { background: #FEE2E2; color: #991B1B; }
    .badge-amber  { background: #FEF3C7; color: #92400E; }
    .badge-teal   { background: #CFFAFE; color: #0E7490; }
    .badge-slate  { background: #F1F5F9; color: #475569; }

    /* ── Card ── */
    .eq-card {
      background: #fff;
      border: 1px solid #EAE7F8;
      border-radius: 14px;
      padding: 14px 16px;
      animation: eq-fade-in 0.25s ease both;
    }

    /* ── Selected skill header ── */
    .eq-sel-header { display: flex; align-items: center; gap: 14px; padding-bottom: 16px; border-bottom: 1px solid #F0EEF9; margin-bottom: 16px; }
    .eq-sel-avatar {
      width: 46px; height: 46px; flex-shrink: 0; border-radius: 12px;
      background: linear-gradient(135deg, #EDE9FE 0%, #DDD6FE 100%);
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 1px 4px rgba(109,40,217,0.12);
    }
    .eq-sel-avatar img { width: 22px; height: 22px; object-fit: contain; }
    .eq-sel-name { font-size: 15px; font-weight: 700; color: #1E1B4B; }
    .eq-sel-meta { font-size: 12px; color: #7C3AED; margin-top: 3px; font-weight: 500; }

    /* ── Stats row ── */
    .eq-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
    .eq-stat { border-radius: 10px; padding: 12px 14px; border: 1px solid transparent; }
    .eq-stat-val { font-size: 19px; font-weight: 700; line-height: 1; }
    .eq-stat-lbl { font-size: 11px; margin-top: 4px; font-weight: 500; opacity: 0.75; }
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
    .eq-info-row { display: flex; gap: 10px; margin-top: 12px; }
    .eq-info-cell { flex: 1; display: flex; align-items: center; gap: 10px; padding: 10px 12px; background: #FAFAFA; border: 1px solid #EAE7F8; border-radius: 10px; transition: border-color 0.15s; }
    .eq-info-cell:hover { border-color: #DDD6FE; }
    .eq-info-ico { width: 30px; height: 30px; flex-shrink: 0; border-radius: 8px; display: flex; align-items: center; justify-content: center; }
    .eq-info-ico.violet { background: #EDE9FE; }
    .eq-info-ico.teal   { background: #CFFAFE; }
    .eq-info-ico.violet svg { color: #6D28D9; width: 14px; height: 14px; }
    .eq-info-ico.teal   svg { color: #0891B2; width: 14px; height: 14px; }
    .eq-info-lbl { font-size: 12px; font-weight: 600; color: #1E1B4B; }
    .eq-info-sub { font-size: 11px; color: #6B7280; margin-top: 1px; }

    /* ── Buttons ── */
    .eq-btn-primary {
      width: 100%; padding: 11px;
      background: linear-gradient(135deg, #6D28D9 0%, #5B21B6 100%);
      color: #fff;
      border: none; border-radius: 10px;
      font-size: 13px; font-weight: 600;
      cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;
      margin-top: 16px;
      transition: opacity 0.15s, transform 0.1s, box-shadow 0.15s;
      box-shadow: 0 2px 8px rgba(109,40,217,0.22);
    }
    .eq-btn-primary:hover:not(:disabled)  { opacity: 0.92; box-shadow: 0 4px 14px rgba(109,40,217,0.28); }
    .eq-btn-primary:active:not(:disabled) { transform: scale(0.985); }
    .eq-btn-primary:disabled { opacity: 0.42; cursor: not-allowed; box-shadow: none; }

    .eq-btn-ghost { padding: 7px 14px; background: #fff; color: #374151; border: 1px solid #E5E7EB; border-radius: 8px; font-size: 12px; font-weight: 500; cursor: pointer; transition: background 0.15s, border-color 0.15s; }
    .eq-btn-ghost:hover:not(:disabled) { background: #F9FAFB; border-color: #D1D5DB; }
    .eq-btn-ghost:disabled { opacity: 0.4; cursor: not-allowed; }

    .eq-btn-danger { padding: 7px 14px; background: #fff; color: #DC2626; border: 1px solid #FECACA; border-radius: 8px; font-size: 12px; font-weight: 500; cursor: pointer; transition: background 0.15s; }
    .eq-btn-danger:hover:not(:disabled) { background: #FEF2F2; }

    .eq-btn-next {
      padding: 8px 20px;
      background: linear-gradient(135deg, #6D28D9 0%, #5B21B6 100%);
      color: #fff; border: none; border-radius: 8px;
      font-size: 12px; font-weight: 600; cursor: pointer;
      transition: opacity 0.15s, transform 0.1s, box-shadow 0.15s;
      box-shadow: 0 2px 6px rgba(109,40,217,0.2);
    }
    .eq-btn-next:hover:not(:disabled)  { opacity: 0.9; box-shadow: 0 3px 10px rgba(109,40,217,0.28); }
    .eq-btn-next:active:not(:disabled) { transform: scale(0.97); }
    .eq-btn-next:disabled { background: #E5E7EB; color: #9CA3AF; cursor: not-allowed; box-shadow: none; }

    /* ── Section label ── */
    .eq-section-lbl { font-size: 11px; font-weight: 700; color: #9CA3AF; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 6px; }

    .eq-section-topbar { display: flex; justify-content: flex-end; margin-bottom: 6px; }
    .eq-section-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 12px; flex-wrap: wrap; margin-bottom: 8px; }
    .eq-searchbar { display: flex; align-items: center; gap: 8px; width: min(100%, 360px); }
    .eq-searchbar { position: relative; }
    .eq-filters { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; width: min(100%, 680px); justify-content: flex-end; }

    .eq-search-input {
      width: 100%;
      border: 1px solid #E5E7EB; border-radius: 10px;
      background: #fff; padding: 9px 38px 9px 36px;
      font-size: 13px; color: #1E1B4B;
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
      font-size: 13px;
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
      font-size: 15px; font-weight: 700; color: #1E1B4B;
      margin-bottom: 4px; line-height: 1.35;
    }
    .eq-empty-sub {
      font-size: 12px; color: #6B7280;
      max-width: 280px; line-height: 1.65; margin-bottom: 4px;
    }
    .eq-empty-hint {
      display: inline-flex; align-items: center; gap: 5px;
      font-size: 11px; color: #9CA3AF;
      padding: 5px 11px;
      background: #F9F8FF; border: 1px solid #EDE9FE;
      border-radius: 99px; margin-top: 4px;
    }
    .eq-empty-hint svg { width: 11px; height: 11px; color: #7C3AED; }
    .eq-empty-action {
      margin-top: 14px;
      display: inline-flex; align-items: center; gap: 7px;
      padding: 9px 20px;
      background: linear-gradient(135deg, #6D28D9 0%, #5B21B6 100%);
      color: #fff;
      border: none; border-radius: 9px;
      font-size: 12px; font-weight: 600;
      cursor: pointer;
      transition: opacity 0.15s, transform 0.1s, box-shadow 0.15s;
      box-shadow: 0 2px 8px rgba(109,40,217,0.22);
    }
    .eq-empty-action:hover  { opacity: 0.9; box-shadow: 0 4px 12px rgba(109,40,217,0.28); }
    .eq-empty-action:active { transform: scale(0.97); }
    .eq-empty-action svg { width: 13px; height: 13px; }

    /* ── Skills grid ── */
    .eq-skills-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); gap: 10px; }
    @media (min-width: 1280px) {
      .eq-skills-grid { grid-template-columns: repeat(6, minmax(0, 1fr)); }
    }
    .eq-pagination {
      margin-top: auto;
      border-top: 1px solid rgba(139, 92, 246, 0.1);
      background: #fff;
      padding: 8px 18px 10px;
      box-shadow: 0 -8px 18px rgba(109, 40, 217, 0.035);
    }
    .eq-skill-card {
      background: #fff; border: 1px solid #EAE7F8; border-radius: 12px;
      min-height: 190px;
      padding: 18px; cursor: pointer;
      transition: border-color 0.18s, box-shadow 0.18s, transform 0.15s;
      display: flex; flex-direction: column; gap: 12px;
    }
    .eq-skill-card:hover {
      border-color: #A78BFA;
      box-shadow: 0 4px 16px rgba(109,40,217,0.10);
      transform: translateY(-1px);
    }
    .eq-skill-card.active {
      border-color: #6D28D9;
      box-shadow: 0 0 0 2.5px rgba(109,40,217,0.16), 0 4px 16px rgba(109,40,217,0.10);
      transform: translateY(-1px);
    }
    .eq-sk-top { display: flex; align-items: flex-start; justify-content: space-between; }
    .eq-sk-ico {
      width: 40px; height: 40px; flex-shrink: 0; border-radius: 11px;
      background: linear-gradient(135deg, #EDE9FE 0%, #DDD6FE 100%);
      display: flex; align-items: center; justify-content: center;
    }
    .eq-sk-ico img { width: 20px; height: 20px; object-fit: contain; }
    .eq-sk-ico svg { width: 20px; height: 20px; color: #6D28D9; }
    .eq-sk-name { font-size: 14px; font-weight: 650; color: #1E1B4B; line-height: 1.35; }
    .eq-sk-lvl  { font-size: 12px; color: #7C3AED; margin-top: 4px; font-weight: 500; }
    .eq-sk-footer { display: flex; align-items: center; gap: 5px; font-size: 11px; color: #6B7280; }
    .eq-sk-footer svg { width: 12px; height: 12px; color: #9CA3AF; }
    .eq-sk-sep { color: #D1D5DB; margin: 0 2px; }
    .eq-sk-start {
      width: 100%; padding: 9px;
      background: linear-gradient(135deg, #6D28D9 0%, #5B21B6 100%);
      color: #fff; border: none; border-radius: 8px;
      font-size: 12px; font-weight: 600; cursor: pointer;
      transition: opacity 0.15s, box-shadow 0.15s;
      box-shadow: 0 1px 5px rgba(109,40,217,0.18);
    }
    .eq-sk-start:hover:not(:disabled)  { opacity: 0.88; box-shadow: 0 3px 10px rgba(109,40,217,0.26); }
    .eq-sk-start:disabled { background: #F3F4F6; color: #9CA3AF; cursor: not-allowed; box-shadow: none; }

    /* ── Generation overlay ── */
    .eq-gen-wrap {
      display: flex; align-items: center; justify-content: center;
      min-height: 360px;
    }
    .eq-gen-card {
      background: #fff;
      border: 1px solid #EAE7F8; border-radius: 18px;
      padding: 40px 44px; text-align: center; max-width: 300px;
      box-shadow: 0 8px 32px rgba(109,40,217,0.08);
      animation: eq-fade-in 0.3s ease both;
    }
    .eq-gen-ring {
      width: 56px; height: 56px; margin: 0 auto 20px;
      border-radius: 50%;
      border: 3.5px solid #EDE9FE;
      border-top-color: #6D28D9;
      animation: eq-spin 0.9s linear infinite;
      position: relative;
    }
    .eq-gen-dots { display: flex; gap: 5px; justify-content: center; margin: 14px 0 0; }
    .eq-gen-dot {
      width: 6px; height: 6px; border-radius: 50%;
      background: #6D28D9; opacity: 0.3;
      animation: eq-bounce-dot 1.4s ease-in-out infinite;
    }
    .eq-gen-dot:nth-child(2) { animation-delay: 0.16s; }
    .eq-gen-dot:nth-child(3) { animation-delay: 0.32s; }
    .eq-gen-title { font-size: 16px; font-weight: 700; color: #1E1B4B; }
    .eq-gen-sub   { font-size: 12px; color: #6B7280; margin-top: 6px; line-height: 1.6; }
    .eq-gen-skill { color: #6D28D9; font-weight: 600; }
    .eq-gen-time  {
      font-size: 32px; font-weight: 700; color: #6D28D9;
      margin: 16px 0 2px; font-variant-numeric: tabular-nums;
      letter-spacing: -0.02em;
    }
    .eq-gen-time-lbl { font-size: 11px; color: #9CA3AF; font-weight: 500; }

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
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="eq-sel-name">{selectedSkillForSetup.skillName}</div>
                      <div className="eq-sel-meta">
                        {formatSkillLevelLabel(
                          selectedSkillForSetup.level,
                          selectedSkillForSetup.status,
                          selectedSkillForSetup.validatedLevel,
                          selectedSkillForSetup.targetLevel,
                        )}
                      </div>
                    </div>
                    {(() => {
                      const b = statusBadgeConfig(selectedSkillForSetup.status);
                      return <span className={`eq-pill ${b.className}`}>{b.label}</span>;
                    })()}
                  </div>

                  {/* Stats */}
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

                  {/* Info cells */}
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

      

                  {/* CTA */}
                  {!quizCooldownActive && (
                    <button
                      className="eq-btn-primary"
                      disabled={loadingSkills || starting}
                      onClick={() => void startQuiz()}
                    >
                      {starting
                        ? <>
                            <FontAwesomeIcon icon={faSpinner} style={{ width: 14, height: 14, animation: "eq-spin 0.85s linear infinite" }} />
                            Génération en cours…
                          </>
                        : <>
                            <FontAwesomeIcon icon={faWandSparkles} style={{ width: 14, height: 14 }} />
                            Démarrer le quiz
                          </>}
                    </button>
                  )}
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
                          const badge = statusBadgeConfig(skill.status);
                          const iconUrl = resolveSkillIconUrl(skill);
                          const isSelected = selectedSkillId === skill.skillUuid;
                          const cooldown = isQuizCooldownActive(skill.quizNextAllowedAt);
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
                                    : <FontAwesomeIcon icon={faBolt} style={{ width: 18, height: 18 }} />}
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
                                <FontAwesomeIcon icon={faClock} style={{ width: 12, height: 12 }} />
                                <span>15 min</span>
                                <span className="eq-sk-sep">·</span>
                                <FontAwesomeIcon icon={faWandSparkles} style={{ width: 12, height: 12 }} />
                                <span>20 questions</span>
                              </div>
                              <button
                                className="eq-sk-start"
                                disabled={loadingSkills || starting || cooldown}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedSkillId(skill.skillUuid);
                                  void startQuiz(skill.skillUuid);
                                }}
                              >
                                {cooldown ? "Indisponible" : "Commencer"}
                              </button>
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

          {/* ══════════════ GENERATING ══════════════ */}
          {phase === "setup" && starting && (
            <div className="eq-gen-wrap">
              <div className="eq-gen-card">
                <div className="eq-gen-ring" />
                <div className="eq-gen-title">Génération du quiz</div>
                <div className="eq-gen-sub">
                  Questions adaptées à votre profil pour{" "}
                  <span className="eq-gen-skill">{selectedSkillForSetup?.skillName}</span>
                </div>
                <div className="eq-gen-time">{formatTime(generationElapsedSeconds)}</div>
                <div className="eq-gen-time-lbl">temps écoulé</div>
                <div className="eq-gen-dots">
                  <div className="eq-gen-dot" />
                  <div className="eq-gen-dot" />
                  <div className="eq-gen-dot" />
                </div>
              </div>
            </div>
          )}

          {/* ══════════════ IN PROGRESS ══════════════ */}
          {phase === "in_progress" && startData && currentQuestion && (
            <>
              {/* Progress tracker */}
              <div className="eq-card" style={{ padding: "14px 18px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>
                    Session en cours
                    <span style={{ color: "#6D28D9", margin: "0 5px" }}>{answeredCount}/{questions.length}</span>
                    <span style={{ color: "#9CA3AF", fontWeight: 400 }}>réponses</span>
                  </div>
                  <button className="eq-btn-danger" onClick={() => setQuitConfirmOpen(true)} disabled={submitting}>
                    Quitter
                  </button>
                </div>
                <div className="eq-dots">
                  {questions.map((q, i) => (
                    <div
                      key={q.id}
                      className={`eq-dot${answers[q.id] ? " done" : i === activeQuestion ? " cur" : ""}`}
                      onClick={() => setActiveQuestion(i)}
                    >
                      {i + 1}
                    </div>
                  ))}
                </div>
                <div className="eq-prog-wrap">
                  <div className="eq-prog-bar" style={{ width: `${(answeredCount / questions.length) * 100}%` }} />
                </div>
              </div>

              {/* Question card */}
              <div className="eq-card">
                <div className="eq-q-header">
                  <div className="eq-q-meta">
                    <span className="eq-q-num">Q {activeQuestion + 1} / {questions.length}</span>
                    <span className="eq-q-cat">{currentQuestion.category || "Compréhension"}</span>
                  </div>
                  <div className={`eq-timer${isUrgent ? " urgent" : ""}`}>
                    <FontAwesomeIcon icon={faClock} className="eq-timer-icon" />
                    <div>
                      <div className="eq-timer-val">{formatTime(remainingSeconds)}</div>
                      <div className="eq-timer-lbl">restant</div>
                    </div>
                  </div>
                </div>

                <div className="eq-q-text">{currentQuestion.question}</div>

                <div>
                  {currentQuestion.options.map((option) => {
                    const isSelected = answers[currentQuestion.id] === option.key;
                    return (
                      <div
                        key={`${currentQuestion.id}-${option.key}`}
                        className={`eq-opt${isSelected ? " selected" : ""}`}
                        onClick={() => pickAnswer(currentQuestion.id, option.key)}
                      >
                        <span className="eq-opt-key">{option.key}</span>
                        <span className="eq-opt-text">{option.text}</span>
                        {isSelected && <FontAwesomeIcon icon={faCircleCheck} style={{ width: 16, height: 16, color: "#6D28D9", flexShrink: 0 }} />}
                      </div>
                    );
                  })}
                </div>

                <div className="eq-qnav">
                  <div className="eq-nav-l">
                    <button
                      className="eq-btn-ghost"
                      onClick={() => setActiveQuestion((v) => Math.max(0, v - 1))}
                      disabled={activeQuestion === 0}
                    >
                      ← Précédent
                    </button>
                    <button
                      className="eq-btn-ghost"
                      onClick={() => setActiveQuestion((v) => Math.min(questions.length - 1, v + 1))}
                      disabled={activeQuestion === questions.length - 1}
                    >
                      Sauter
                    </button>
                  </div>
                  <button
                    className="eq-btn-next"
                    disabled={submitting || (!isLastQuestion && !hasCurrentAnswer)}
                    onClick={() => {
                      if (isLastQuestion) { void handleSubmit(); return; }
                      setActiveQuestion((v) => Math.min(questions.length - 1, v + 1));
                    }}
                  >
                    {submitting
                      ? <FontAwesomeIcon icon={faSpinner} style={{ width: 14, height: 14, animation: "eq-spin 0.85s linear infinite" }} />
                      : isLastQuestion ? "Soumettre ✓" : "Suivant →"}
                  </button>
                </div>
              </div>
            </>
          )}

          {/* ══════════════ SUBMITTED ══════════════ */}
          {phase === "submitted" && result && (
            <div className="eq-card">
              {/* Score ring */}
              <div className="eq-result-score">
                <svg width="84" height="84" viewBox="0 0 120 120" style={{ flexShrink: 0 }}>
                  <circle cx="60" cy="60" r={ring.radius} strokeWidth="10" fill="none" stroke="#EDE9FE" />
                  <circle
                    cx="60" cy="60" r={ring.radius} strokeWidth="10" fill="none"
                    stroke={passed ? "#059669" : "#DC2626"}
                    strokeLinecap="round"
                    strokeDasharray={ring.circumference}
                    strokeDashoffset={ring.offset}
                    transform="rotate(-90 60 60)"
                    style={{ transition: "stroke-dashoffset 0.85s cubic-bezier(0.4,0,0.2,1)" }}
                  />
                  <text x="60" y="57" textAnchor="middle" fontSize="19" fontWeight="700" fill="#1E1B4B">{roundedScore}%</text>
                  <text x="60" y="73" textAnchor="middle" fontSize="10" fontWeight="500" fill="#9CA3AF">score</text>
                </svg>
                <div>
                  <div className="eq-score-heading">{passed ? "Quiz validé !" : "À renforcer"}</div>
                  <div className="eq-score-lbl">
                    {result.result?.correctAnswers ?? 0} bonne{(result.result?.correctAnswers ?? 0) !== 1 ? "s" : ""} réponse{(result.result?.correctAnswers ?? 0) !== 1 ? "s" : ""} sur {questions.length}
                  </div>
                  <div className="eq-score-tags">
                    {passed
                      ? <span className="eq-pill badge-green">Niveau augmenté</span>
                      : <span className="eq-pill badge-red">Réessayez dans {QUIZ_FAIL_COOLDOWN_DAYS} j</span>}
                    <span className="eq-pill badge-slate">Session terminée</span>
                  </div>
                  {result.nextAllowedAt && (
                    <div style={{ fontSize: 11, color: "#6B7280", marginTop: 8 }}>
                      Prochaine tentative : {new Date(result.nextAllowedAt).toLocaleString("fr-FR")}
                    </div>
                  )}
                </div>
              </div>

              {/* Kind band */}
              <div className={`eq-kind-band ${passed ? "pass" : startData?.quizKind === "initial" ? "neutral" : "fail"}`}>
                {startData?.quizKind === "initial"
                  ? "Niveau attribué selon votre score."
                  : passed
                    ? "Niveau augmenté suite à la validation."
                    : "Score insuffisant — niveau inchangé."}
              </div>

              <div className="eq-divider" />

              {/* Feedback banners */}
              {(result.feedbackStatus === "PENDING" || result.feedbackStatus === "GENERATING") && (
                <div className="eq-feedback-banner pending">
                  <div className="eq-fb-title">Génération du feedback en cours</div>
                  <div>Le score est disponible. Le détail IA se complète automatiquement.</div>
                </div>
              )}
              {result.feedbackStatus === "FAILED" && (
                <div className="eq-feedback-banner failed">
                  <div className="eq-fb-title">Feedback IA indisponible</div>
                  <div>Le détail local reste visible ci-dessous.</div>
                </div>
              )}

              {/* Per-question review */}
              <div className="eq-section-lbl">Détail par question</div>
              {submittedQuestionCards.map((card) => {
                const expanded = openedReviewQuestionId === card.questionId;
                return (
                  <div key={card.questionId} className="eq-review-item">
                    <div
                      className={`eq-review-head ${card.isCorrect ? "ok" : "ko"}`}
                      onClick={() => setOpenedReviewQuestionId((prev) => prev === card.questionId ? null : card.questionId)}
                    >
                      <span className="eq-review-qnum">Q{card.index + 1}</span>
                      <span className="eq-review-qtxt">{card.questionText}</span>
                      <span className={`eq-pill ${card.isCorrect ? "badge-green" : "badge-red"}`}>
                        {card.isCorrect ? "Correcte" : "Incorrecte"}
                      </span>
                      {expanded
                        ? <FontAwesomeIcon icon={faChevronUp} style={{ width: 14, height: 14, color: "#9CA3AF", flexShrink: 0 }} />
                        : <FontAwesomeIcon icon={faChevronDown} style={{ width: 14, height: 14, color: "#9CA3AF", flexShrink: 0 }} />}
                    </div>
                    {expanded && (
                      <div className="eq-review-body">
                        <div className="eq-review-row">
                          <span style={{ fontWeight: 600, color: "#065F46" }}>Bonne réponse : </span>
                          {card.correctText}
                        </div>
                        <div className="eq-review-row">
                          <span style={{ fontWeight: 600, color: "#374151" }}>Votre réponse : </span>
                          {card.userText}
                        </div>
                        {card.explanation && (
                          <div className={card.isCorrect ? "eq-explain-ok" : "eq-explain-ko"}>
                            {card.explanation}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              <button className="eq-btn-primary" onClick={resetFlow} style={{ marginTop: 14 }}>
                <FontAwesomeIcon icon={faSpinner} style={{ width: 14, height: 14 }} />
                Nouveau quiz
              </button>
            </div>
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
