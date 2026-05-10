import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  employeeLearningProgramApi,
  type QuizQuestionLearner,
  type VideoQuizLearner,
} from "../../api/learningProgramApi";
import { useLearningProgramBasePath } from "../../hooks/useLearningProgramBasePath";
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ChevronRightIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  PlayCircleIcon,
  QuestionMarkCircleIcon,
  ShieldCheckIcon,
} from "../../icons/heroicons/outline";

function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

function Skeleton({ className }: { className: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-slate-200/80", className)} />;
}

function AlertBox({
  variant,
  children,
}: {
  variant: "error" | "success" | "info";
  children: ReactNode;
}) {
  const styles = {
    error: "border-rose-200 bg-rose-50 text-rose-900",
    success: "border-emerald-200 bg-emerald-50 text-emerald-950",
    info: "border-blue-200 bg-blue-50 text-blue-950",
  };
  const icons = {
    error: ExclamationTriangleIcon,
    success: CheckCircleIcon,
    info: InformationCircleIcon,
  };
  const Icon = icons[variant];

  return (
    <div role={variant === "error" ? "alert" : "status"} className={cn("flex items-start gap-3 rounded-lg border px-4 py-3 text-base leading-6 shadow-sm", styles[variant])}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export function EmployeeLearningProgramQuiz() {
  const base = useLearningProgramBasePath();
  const { enrollmentUuid, videoUuid } = useParams<{ enrollmentUuid: string; videoUuid: string }>();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<VideoQuizLearner | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [resultPassed, setResultPassed] = useState<boolean | null>(null);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);

  useEffect(() => {
    if (!enrollmentUuid || !videoUuid) return;
    employeeLearningProgramApi
      .quiz(enrollmentUuid, videoUuid)
      .then((r) => setQuiz(r.data))
      .catch((e) => setError(e?.response?.data?.error ?? "Quiz indisponible"));
  }, [enrollmentUuid, videoUuid]);

  const submit = async () => {
    if (!enrollmentUuid || !videoUuid || !quiz) return;
    const list = quiz.questions.map((q: QuizQuestionLearner) => ({
      questionUuid: q.questionUuid,
      optionUuid: answers[q.questionUuid],
    }));
    if (list.some((x) => !x.optionUuid)) {
      setError("Répondez à toutes les questions.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const { data } = await employeeLearningProgramApi.submitQuiz(enrollmentUuid, videoUuid, list);
      if (data.passed) {
        setResult(data.programCompleted ? "Formation terminée !" : "Quiz réussi.");
        setResultPassed(true);
        setTimeout(() => navigate(`${base}/learning-programs/play/${enrollmentUuid}`), 1200);
      } else {
        setResult(`Score ${data.scorePercent}% — seuil 70% requis.`);
        setResultPassed(false);
      }
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      setError(err?.response?.data?.error ?? "Envoi impossible");
    } finally {
      setSubmitting(false);
    }
  };

  const backHref = `${base}/learning-programs/play/${enrollmentUuid}`;

  if (error && !quiz) {
    return (
      <div className="flex min-h-screen items-center justify-center app-page-bg p-6">
        <section className="w-full max-w-md rounded-lg border border-rose-200 bg-white p-8 shadow-lg shadow-rose-100">
          <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-rose-50 text-rose-700">
            <ExclamationTriangleIcon className="h-6 w-6" />
          </span>
          <h1 className="mt-5 text-2xl font-bold text-slate-950">Quiz indisponible</h1>
          <p className="mt-2 text-base leading-6 text-rose-700">{error}</p>
          <Link
            to={backHref}
            className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-base font-bold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Retour à la formation
          </Link>
        </section>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="min-h-screen app-page-bg">
        <header className="border-b border-slate-200 bg-white px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex max-w-none items-center justify-between">
            <Skeleton className="h-10 w-44" />
            <Skeleton className="h-10 w-32" />
          </div>
        </header>
        <main className="grid max-w-none gap-5 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:px-8">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="mt-3 h-4 w-2/3" />
            <div className="mt-8 space-y-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-28 w-full" />
              ))}
            </div>
          </section>
          <aside className="hidden space-y-4 lg:block">
            <Skeleton className="h-36 w-full" />
            <Skeleton className="h-32 w-full" />
          </aside>
        </main>
      </div>
    );
  }

  const answeredCount = quiz.questions.filter((q) => answers[q.questionUuid]).length;
  const questionCount = quiz.questions.length;
  const progress = questionCount > 0 ? Math.round((answeredCount / questionCount) * 100) : 0;
  const canSubmit = answeredCount === questionCount && questionCount > 0 && !submitting;
  const activeQuestion = quiz.questions[Math.min(activeQuestionIndex, Math.max(questionCount - 1, 0))] ?? null;
  const activeAnswer = activeQuestion ? answers[activeQuestion.questionUuid] : null;
  const isLastQuestion = activeQuestionIndex >= questionCount - 1;

  return (
    <div className="min-h-screen app-page-bg text-slate-950">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="flex min-h-12 w-full items-center gap-3 px-4 py-1.5 sm:px-6 lg:px-8">
          <Link
            to={backHref}
            className="inline-flex min-h-9 shrink-0 items-center gap-2 rounded-lg px-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Retour
          </Link>

          <div className="hidden h-8 w-px bg-slate-200 sm:block" />

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-700">
                <QuestionMarkCircleIcon className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <h1 className="truncate text-lg font-bold text-slate-950">Quiz vidéo</h1>
                <p className="hidden text-sm text-slate-500 sm:block">Validez vos acquis avant de revenir à la formation.</p>
              </div>
            </div>
          </div>

          <div className="hidden items-center gap-3 sm:flex">
            <div className="text-right">
              <p className="text-sm font-semibold text-slate-950">{progress}%</p>
              <p className="text-sm text-slate-500">
                {answeredCount}/{questionCount} réponses
              </p>
            </div>
            <div className="h-2 w-28 overflow-hidden rounded-full bg-violet-100">
              <div className="h-full rounded-full bg-violet-700 transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>
      </header>

      <main className="grid w-full items-stretch gap-6 px-4 pb-6 pt-3 sm:px-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:px-8">
        <section className="flex h-full flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="h-1.5 bg-gradient-to-r from-violet-700 via-fuchsia-500 to-blue-500" />

          <div className="border-b border-slate-200 p-5 sm:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-base font-bold text-violet-800">
                <PlayCircleIcon className="h-3.5 w-3.5" />
                Vidéo
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-base font-bold text-blue-800">
                <ShieldCheckIcon className="h-3.5 w-3.5" />
                Seuil 70%
              </span>
            </div>
            <h2 className="mt-5 text-3xl font-bold leading-tight text-slate-950">Répondez au quiz</h2>
            <p className="mt-3 max-w-4xl text-base leading-6 text-slate-600">
              Répondez question par question, comme dans le quiz employé, avec une navigation plus guidée et professionnelle.
            </p>

            <div className="mt-5 sm:hidden">
              <div className="mb-2 flex items-center justify-between text-base font-bold text-slate-600">
                <span>Progression</span>
                <span>{answeredCount}/{questionCount}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-violet-100">
                <div className="h-full rounded-full bg-violet-700 transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
              </div>
            </div>
          </div>

          <div className="flex flex-1 flex-col space-y-4 p-5 sm:p-6">
            {error ? <AlertBox variant="error">{error}</AlertBox> : null}

            {result ? (
              <AlertBox variant={resultPassed === false ? "error" : "success"}>
                <p className="font-bold">{result}</p>
                {resultPassed ? (
                  <p className="mt-1 text-base">Redirection vers la formation en cours...</p>
                ) : null}
              </AlertBox>
            ) : null}

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 sm:p-5">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                  {quiz.questions.map((q, index) => {
                    const answered = Boolean(answers[q.questionUuid]);
                    const active = index === activeQuestionIndex;
                    return (
                      <button
                        key={q.questionUuid}
                        type="button"
                        onClick={() => setActiveQuestionIndex(index)}
                        className={cn(
                          "flex h-9 w-9 items-center justify-center rounded-lg border text-base font-bold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500",
                          active
                            ? "border-violet-700 bg-violet-700 text-white shadow-md shadow-violet-200"
                            : answered
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300"
                              : "border-slate-200 bg-white text-slate-500 hover:border-violet-200 hover:text-violet-700",
                        )}
                        aria-label={`Question ${index + 1}`}
                      >
                        {answered && !active ? <CheckCircleIcon className="h-4 w-4" /> : index + 1}
                      </button>
                    );
                  })}
                </div>
                <span className="rounded-full border border-violet-200 bg-white px-4 py-2 text-base font-bold text-violet-800">
                  Question {activeQuestionIndex + 1} / {questionCount}
                </span>
              </div>

              {activeQuestion ? (
                <fieldset key={activeQuestion.questionUuid} className="rounded-lg border border-violet-100 bg-white p-5 shadow-sm">
                  <legend className="sr-only">Question {activeQuestionIndex + 1}</legend>
                  <h3 className="text-xl font-bold leading-8 text-slate-950">{activeQuestion.text}</h3>

                  <div className="mt-5 grid gap-3">
                    {activeQuestion.options.map((option, optionIndex) => {
                      const checked = activeAnswer === option.optionUuid;
                      const optionKey = String.fromCharCode(65 + optionIndex);
                      return (
                        <label
                          key={option.optionUuid}
                          className={cn(
                            "group flex cursor-pointer items-center gap-4 rounded-lg border px-5 py-4 text-base leading-6 transition duration-200",
                            checked
                              ? "border-violet-700 bg-violet-50 text-violet-950 shadow-sm ring-2 ring-violet-100"
                              : "border-slate-200 bg-white text-slate-700 hover:-translate-y-0.5 hover:border-violet-300 hover:bg-violet-50/40 hover:shadow-sm",
                          )}
                        >
                          <input
                            type="radio"
                            name={activeQuestion.questionUuid}
                            value={option.optionUuid}
                            checked={checked}
                            onChange={() => {
                              setAnswers((prev) => ({ ...prev, [activeQuestion.questionUuid]: option.optionUuid }));
                              if (error === "Répondez à toutes les questions.") setError(null);
                            }}
                            className="sr-only"
                          />
                          <span
                            className={cn(
                              "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-base font-bold transition",
                              checked ? "border-violet-700 bg-violet-700 text-white" : "border-slate-300 bg-slate-50 text-slate-500 group-hover:border-violet-300 group-hover:text-violet-700",
                            )}
                          >
                            {optionKey}
                          </span>
                          <span className="flex-1 font-semibold">{option.label}</span>
                          {checked ? <CheckCircleIcon className="h-5 w-5 shrink-0 text-violet-700" /> : null}
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
              ) : (
                <AlertBox variant="info">Aucune question disponible pour ce quiz.</AlertBox>
              )}
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={activeQuestionIndex === 0}
                  onClick={() => setActiveQuestionIndex((value) => Math.max(0, value - 1))}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-3 text-base font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  <ArrowLeftIcon className="h-4 w-4" />
                  Précédent
                </button>
                <button
                  type="button"
                  disabled={isLastQuestion}
                  onClick={() => setActiveQuestionIndex((value) => Math.min(questionCount - 1, value + 1))}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-violet-200 bg-violet-50 px-5 py-3 text-base font-bold text-violet-800 shadow-sm transition hover:bg-violet-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  Suivant
                  <ChevronRightIcon className="h-4 w-4" />
                </button>
              </div>
              <button
                type="button"
                disabled={!canSubmit}
                onClick={() => void submit()}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-violet-700 px-7 py-3 text-base font-bold text-white shadow-lg shadow-violet-200 transition duration-200 hover:-translate-y-0.5 hover:bg-violet-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2 disabled:translate-y-0 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
              >
                {submitting ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : <CheckCircleIcon className="h-4 w-4" />}
                {submitting ? "Envoi..." : "Valider le quiz"}
              </button>
            </div>
          </div>
        </section>

        <aside className="flex h-full flex-col space-y-4 lg:sticky lg:top-16">
          <section className="rounded-lg border border-violet-200 bg-violet-50 p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-white text-violet-700 shadow-sm">
                <QuestionMarkCircleIcon className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-base font-bold text-violet-950">Progression</h3>
                <p className="text-base font-bold text-violet-700">{answeredCount} réponses sur {questionCount}</p>
              </div>
            </div>
            <div className="mt-5 h-2 overflow-hidden rounded-full bg-white">
              <div className="h-full rounded-full bg-violet-700 transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-base font-bold text-slate-950">Avant de valider</h3>
            <div className="mt-4 space-y-3 text-base leading-6 text-slate-600">
              <p className="flex gap-3">
                <CheckCircleIcon className="mt-1 h-4 w-4 shrink-0 text-emerald-600" />
                Une seule réponse est possible par question.
              </p>
              <p className="flex gap-3">
                <ShieldCheckIcon className="mt-1 h-4 w-4 shrink-0 text-blue-600" />
                Le score minimum requis est 70%.
              </p>
              <p className="flex gap-3">
                <InformationCircleIcon className="mt-1 h-4 w-4 shrink-0 text-violet-600" />
                Vérifiez vos réponses avant de valider le quiz.
              </p>
            </div>
          </section>

          <Link
            to={backHref}
            className="mt-auto flex min-h-12 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-3 text-base font-bold text-slate-700 shadow-sm transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Revenir à la formation
          </Link>
        </aside>
      </main>
    </div>
  );
}
