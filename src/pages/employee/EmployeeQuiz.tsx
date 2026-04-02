import { useEffect, useMemo, useState } from "react";
import {
  BoltIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowPathIcon,
  PlayIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import { quizApi, type AttemptResultResponse, type EmployeeSkillDto, type QuizMode, type QuizStartResponse } from "../../api/quizApi";

type QuizPhase = "setup" | "in_progress" | "submitted";

const QUESTION_COUNT = 10;
const TIME_LIMIT_SECONDS = 60;

function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function isConflictError(error: any) {
  return error?.response?.status === 409;
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

export function EmployeeQuiz() {
  const [skills, setSkills] = useState<EmployeeSkillDto[]>([]);
  const [loadingSkills, setLoadingSkills] = useState(true);
  const [phase, setPhase] = useState<QuizPhase>("setup");
  const [mode, setMode] = useState<QuizMode>("official");
  const [selectedSkillId, setSelectedSkillId] = useState<number | null>(null);
  const [startData, setStartData] = useState<QuizStartResponse | null>(null);
  const [result, setResult] = useState<AttemptResultResponse | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [activeQuestion, setActiveQuestion] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [loadingResult, setLoadingResult] = useState(false);

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
    if (phase !== "submitted" || !startData || !result || result.feedbackStatus !== "PENDING") return;
    const interval = window.setInterval(async () => {
      try {
        const res = await quizApi.result(startData.attemptId);
        setResult(res.data);
        if (res.data.feedbackStatus !== "PENDING") {
          window.clearInterval(interval);
        }
      } catch {
        window.clearInterval(interval);
      }
    }, 5000);
    return () => window.clearInterval(interval);
  }, [phase, startData, result]);

  const questions = startData?.quiz?.questions ?? [];
  const answeredCount = useMemo(
    () => questions.filter((q) => Boolean(answers[q.id])).length,
    [questions, answers],
  );
  const completion = questions.length ? Math.round((answeredCount / questions.length) * 100) : 0;
  const currentQuestion = questions[activeQuestion];
  const isUrgent = remainingSeconds <= 120;

  const score = result?.scorePercent ?? 0;
  const ring = circularStroke(score);

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
    setError(null);
    setStarting(true);
    try {
      const res = await quizApi.startQuiz({
        skillId: selectedSkillId,
        mode,
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
      setPhase("in_progress");
      setRemainingSeconds(getRemainingSeconds(res.data.expiresAt));
    } catch (e: any) {
      const message = e?.response?.data?.error ?? "Impossible de démarrer le quiz";
      setError(message);
    } finally {
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

  async function handleSubmit() {
    if (!startData || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const payload = Object.entries(answers).map(([questionId, answerKey]) => ({ questionId, answerKey }));
      await quizApi.submit(startData.attemptId, payload);
      const resultRes = await fetchResultWithRetry(startData.attemptId);
      setResult(resultRes.data);
      setPhase("submitted");
    } catch (e: any) {
      setError(e?.response?.data?.error ?? "Soumission impossible");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAutoEnd() {
    if (!startData || submitting) return;
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
      setPhase("submitted");
    } catch (e: any) {
      setError(e?.response?.data?.error ?? "Attendez la finalisation automatique");
    } finally {
      setSubmitting(false);
    }
  }

  async function refreshResult() {
    if (!startData) return;
    setLoadingResult(true);
    try {
      const resultRes = await fetchResultWithRetry(startData.attemptId, 3, 500);
      setResult(resultRes.data);
    } catch (e: any) {
      setError(e?.response?.data?.error ?? "Impossible de rafraîchir le résultat");
    } finally {
      setLoadingResult(false);
    }
  }

  function resetFlow() {
    setPhase("setup");
    setStartData(null);
    setResult(null);
    setAnswers({});
    setActiveQuestion(0);
    setRemainingSeconds(0);
    setError(null);
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col bg-gradient-to-br from-slate-50 via-violet-50/30 to-blue-50/30">
      <section className="relative overflow-hidden border-b border-violet-200/60 bg-gradient-to-r from-white via-violet-50/70 to-blue-50/70 px-6 py-5 shadow-sm md:px-8">
        <div className="pointer-events-none absolute -top-24 right-[-72px] h-56 w-56 rounded-full bg-violet-300/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-[-72px] h-56 w-56 rounded-full bg-blue-300/20 blur-3xl" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-violet-700">
              <SparklesIcon className="h-4 w-4" />
              Skillify Assessment Suite
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">Professional Quiz Console</h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-600">
              Environnement d’évaluation premium pour compétences techniques. Sélectionnez une compétence, démarrez un quiz minuté et analysez les insights de performance.
            </p>
          </div>
          <div className="rounded-2xl border border-violet-200/70 bg-white/80 px-4 py-3 backdrop-blur">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Questionnaire</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">{QUESTION_COUNT} questions</p>
            <p className="text-xs text-slate-500">Durée {Math.floor(TIME_LIMIT_SECONDS / 60)} minutes</p>
          </div>
        </div>
      </section>

      <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-auto p-4 md:p-6">
      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 shadow-sm">
          {error}
        </div>
      )}

      {phase === "setup" && (
        <section className="grid min-h-[520px] gap-6 lg:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-xl shadow-slate-200/50 lg:col-span-2">
            <h2 className="text-lg font-semibold text-slate-900">Configuration du quiz</h2>
            <p className="mt-1 text-sm text-slate-500">Le niveau officiel est verrouillé sur votre niveau courant. Le placement sert uniquement à définir le niveau de départ.</p>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Compétence</span>
                <select
                  value={selectedSkillId ?? ""}
                  onChange={(e) => setSelectedSkillId(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 shadow-sm outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-200"
                >
                  {loadingSkills && <option>Chargement...</option>}
                  {!loadingSkills && skills.length === 0 && <option>Aucune compétence</option>}
                  {skills.map((s) => (
                    <option key={`${s.skillId}-${s.id}`} value={s.skillId}>
                      {s.skillName} · Niveau {s.level} · {s.status}
                    </option>
                  ))}
                </select>
              </label>
              <div className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Mode</span>
                <div className="grid grid-cols-2 gap-2 rounded-xl border border-slate-200 bg-slate-50 p-1">
                  {(["official", "placement"] as QuizMode[]).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMode(m)}
                      className={[
                        "rounded-lg px-3 py-2 text-sm font-semibold capitalize transition-all",
                        mode === m ? "bg-white text-violet-700 shadow-sm" : "text-slate-500 hover:text-slate-700",
                      ].join(" ")}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {loadingSkills && (
              <div className="mt-5 space-y-2">
                <div className="h-10 animate-pulse rounded-xl bg-slate-100" />
                <div className="h-10 animate-pulse rounded-xl bg-slate-100" />
              </div>
            )}

            <button
              type="button"
              disabled={!selectedSkillId || loadingSkills || starting}
              onClick={startQuiz}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-400/30 transition hover:from-violet-500 hover:to-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {starting ? (
                <>
                  <ArrowPathIcon className="h-4 w-4 animate-spin" />
                  Génération du quiz...
                </>
              ) : (
                <>
                  <PlayIcon className="h-4 w-4" />
                  Démarrer l’évaluation
                </>
              )}
            </button>
          </div>

          <div className="space-y-3 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-lg shadow-slate-200/50">
            <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">Guidelines</h3>
            <ul className="space-y-3 text-sm text-slate-600">
              <li className="flex items-start gap-2"><CheckCircleIcon className="mt-0.5 h-4 w-4 text-emerald-500" />Une seule réponse correcte par question.</li>
              <li className="flex items-start gap-2"><ClockIcon className="mt-0.5 h-4 w-4 text-amber-500" />Soumission automatique à expiration du timer.</li>
              <li className="flex items-start gap-2"><BoltIcon className="mt-0.5 h-4 w-4 text-violet-500" />Feedback IA généré à la demande pendant la session.</li>
            </ul>
          </div>
        </section>
      )}

      {phase === "in_progress" && startData && currentQuestion && (
        <section className="grid min-h-[620px] gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Progression</p>
                <p className="text-sm text-slate-600">{answeredCount}/{questions.length} réponses</p>
              </div>
              <div className={[
                "inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold",
                isUrgent
                  ? "border-rose-200 bg-rose-50 text-rose-700 animate-pulse"
                  : "border-violet-200 bg-violet-50 text-violet-700",
              ].join(" ")}>
                <ClockIcon className="h-4 w-4" />
                {formatTime(remainingSeconds)}
              </div>
            </div>

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setActiveQuestion((v) => Math.max(0, v - 1))}
                disabled={activeQuestion === 0}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-violet-300 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Précédent
              </button>
              <button
                type="button"
                onClick={() => setActiveQuestion((v) => Math.min(questions.length - 1, v + 1))}
                disabled={activeQuestion === questions.length - 1}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-violet-300 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Suivant
              </button>
            </div>

            <div className="mt-4 grid grid-cols-10 gap-1.5">
              {questions.map((q, idx) => (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => setActiveQuestion(idx)}
                  className={[
                    "h-2 rounded-full transition-all",
                    idx === activeQuestion ? "ring-2 ring-violet-300" : "",
                    answers[q.id] ? "bg-gradient-to-r from-violet-500 to-blue-500" : "bg-slate-200",
                  ].join(" ")}
                  aria-label={`Aller à la question ${idx + 1}`}
                />
              ))}
            </div>

            <div className="mt-5 rounded-2xl border border-violet-100 bg-violet-50/50 p-4 animate-in fade-in duration-300">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-violet-600">
                Question {activeQuestion + 1} / {questions.length}
              </p>
              <h2 className="mt-2 text-lg font-semibold text-slate-900">{currentQuestion.question}</h2>
              {currentQuestion.category && (
                <p className="mt-1 text-xs text-slate-500">Catégorie: {currentQuestion.category}</p>
              )}
            </div>

            <div className="mt-5 space-y-3">
              {currentQuestion.options.map((option) => {
                const selected = answers[currentQuestion.id] === option.key;
                return (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => pickAnswer(currentQuestion.id, option.key)}
                    className={[
                      "group w-full rounded-2xl border px-4 py-3 text-left transition-all duration-200",
                      selected
                        ? "border-violet-300 bg-violet-50 shadow-md shadow-violet-200/50"
                        : "border-slate-200 bg-white hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-sm",
                    ].join(" ")}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={[
                          "flex h-8 w-8 items-center justify-center rounded-full border text-xs font-bold transition",
                          selected
                            ? "border-violet-500 bg-violet-500 text-white"
                            : "border-slate-300 text-slate-500 group-hover:border-violet-400 group-hover:text-violet-600",
                        ].join(" ")}
                      >
                        {option.key}
                      </span>
                      <span className="text-sm font-medium text-slate-700">{option.text}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 h-px bg-slate-100" />
          </div>

          <aside className="space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg shadow-slate-200/50">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Completion</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">{completion}%</p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={[
                    "h-full rounded-full bg-gradient-to-r from-violet-500 to-blue-500 transition-all duration-500",
                    completion < 30 ? "w-[20%]" : completion < 50 ? "w-[40%]" : completion < 70 ? "w-[60%]" : completion < 90 ? "w-[80%]" : "w-full",
                  ].join(" ")}
                />
              </div>
              <p className="mt-2 text-xs text-slate-500">La barre est animée et reflète votre avancement en temps réel.</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg shadow-slate-200/50">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Niveau courant</p>
              <p className="mt-2 text-2xl font-semibold text-violet-700">Level {startData.level}</p>
              <p className="mt-2 text-sm text-slate-600">
                Le niveau augmente automatiquement en cas de réussite selon les règles d’évaluation interne.
              </p>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="mt-5 w-full rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-300/40 transition hover:from-violet-500 hover:to-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? (
                  <span className="inline-flex items-center gap-2">
                    <ArrowPathIcon className="h-4 w-4 animate-spin" />
                    Soumission en cours...
                  </span>
                ) : (
                  "Soumettre le quiz"
                )}
              </button>
            </div>
          </aside>
        </section>
      )}

      {phase === "submitted" && result && (
        <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/50">
            <h2 className="text-lg font-semibold text-slate-900">Score Overview</h2>
            <div className="mt-6 flex items-center justify-center">
              <div className="relative h-36 w-36">
                <svg className="h-36 w-36 -rotate-90" viewBox="0 0 120 120" aria-hidden="true">
                  <circle cx="60" cy="60" r={ring.radius} strokeWidth="10" className="fill-none stroke-slate-100" />
                  <circle
                    cx="60"
                    cy="60"
                    r={ring.radius}
                    strokeWidth="10"
                    strokeLinecap="round"
                    className="fill-none stroke-violet-500 transition-all duration-700"
                    strokeDasharray={ring.circumference}
                    strokeDashoffset={ring.offset}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-3xl font-semibold text-slate-900">{Math.round(score)}%</p>
                  <p className="text-xs uppercase tracking-[0.14em] text-slate-500">score</p>
                </div>
              </div>
            </div>
            <div className="mt-5 rounded-2xl border border-violet-100 bg-violet-50/60 p-4">
              <p className="text-sm text-slate-700">
                Résultat:{" "}
                <span className={result.passed ? "font-semibold text-emerald-700" : "font-semibold text-rose-700"}>
                  {result.passed ? "Validé" : "Non validé"}
                </span>
              </p>
              {result.nextAllowedAt && (
                <p className="mt-2 text-xs text-slate-500">Prochaine tentative autorisée: {new Date(result.nextAllowedAt).toLocaleString()}</p>
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

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/50">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-slate-900">Performance Insights</h2>
              <button
                type="button"
                onClick={refreshResult}
                disabled={loadingResult}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-violet-300 hover:text-violet-700 disabled:opacity-60"
              >
                <ArrowPathIcon className={["h-4 w-4", loadingResult ? "animate-spin" : ""].join(" ")} />
                Rafraîchir
              </button>
            </div>

            {result.feedbackStatus === "PENDING" && (
              <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50/70 p-4">
                <p className="text-sm font-semibold text-blue-900">Génération du feedback en cours</p>
                <p className="mt-1 text-xs text-blue-900/80">
                  Le score est déjà disponible. Les recommandations IA sont en cours de préparation.
                </p>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-blue-100">
                  <div className="h-full w-1/2 animate-pulse rounded-full bg-gradient-to-r from-blue-400 to-violet-500" />
                </div>
              </div>
            )}

            <div className="mt-4 space-y-3">
              {(result.feedback?.perQuestion ?? []).map((item) => {
                const scoreItem = result.result?.perQuestion?.find((q) => q.questionId === item.questionId);
                return (
                  <div key={item.questionId} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      {item.questionId} · {scoreItem?.isCorrect ? "Correct" : "Incorrect"}
                    </p>
                    <p className="mt-2 text-sm text-slate-700">{item.explanation}</p>
                    <p className="mt-2 text-xs text-violet-700">Action: {item.recommendation}</p>
                  </div>
                );
              })}

              {result.feedback?.overallFeedback && (
                <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-4">
                  <p className="text-sm font-semibold text-blue-900">Résumé global</p>
                  <p className="mt-1 text-sm text-blue-900/90">{result.feedback.overallFeedback.summary ?? "Résumé en cours de génération."}</p>
                  {!!result.feedback.overallFeedback.nextSteps?.length && (
                    <ul className="mt-3 list-disc space-y-1 pl-5 text-xs text-blue-900/90">
                      {result.feedback.overallFeedback.nextSteps.slice(0, 3).map((step, idx) => (
                        <li key={`${step}-${idx}`}>{step}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>
      )}
      </div>
    </div>
  );
}
