import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  employeeLearningProgramApi,
  type ActivitySubmissionMode,
  type LearningPlayer,
  type LearningPlayerStep,
} from "../../api/learningProgramApi";
import { useLearningProgramBasePath } from "../../hooks/useLearningProgramBasePath";
import {
  ArrowPathIcon,
  BookOpenIcon,
  CheckCircleIcon,
  LockClosedIcon,
  PlayCircleIcon,
  QuestionMarkCircleIcon,
} from "../../icons/heroicons/outline";
import { LearningMarkdownBody } from "../../components/learning/LearningMarkdownBody";

function stepKey(step: LearningPlayerStep): string {
  if (step.stepKind === "VIDEO") return `v-${step.videoUuid ?? ""}`;
  if (step.stepKind === "TEXT") return `t-${step.textArticleUuid ?? ""}`;
  return `a-${step.activityUuid ?? ""}`;
}

function partNumber(step: LearningPlayerStep): number {
  return step.coursePartNumber ?? 1;
}

function partTitle(step: LearningPlayerStep): string {
  const t = step.courseTitle?.trim();
  if (t) return t;
  return `Module ${partNumber(step)}`;
}

type TocPart = {
  partNumber: number;
  courseTitle: string;
  entries: { step: LearningPlayerStep; lessonInPart: number }[];
};

function buildToc(steps: LearningPlayerStep[]): TocPart[] {
  const order: number[] = [];
  const byPart = new Map<number, { courseTitle: string; entries: TocPart["entries"] }>();
  for (const step of steps) {
    const pn = partNumber(step);
    if (!byPart.has(pn)) {
      byPart.set(pn, { courseTitle: partTitle(step), entries: [] });
      order.push(pn);
    }
    const g = byPart.get(pn)!;
    g.entries.push({ step, lessonInPart: g.entries.length + 1 });
  }
  return order.map((pn) => {
    const g = byPart.get(pn)!;
    return { partNumber: pn, courseTitle: g.courseTitle, entries: g.entries };
  });
}

function formatCooldownUntil(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString("fr-FR", { dateStyle: "long", timeStyle: "short" });
}

function isCooldownActive(iso: string | null | undefined): boolean {
  if (!iso) return false;
  return new Date(iso).getTime() > Date.now();
}

type ActivityDraft = { text: string; fileUrl: string };

function submissionModeLabel(mode: ActivitySubmissionMode | null | undefined): string {
  if (mode === "CODE") return "Code / technique";
  if (mode === "FILE") return "Fichier";
  return "Texte";
}

function ProgressRing({ percent }: { percent: number }) {
  const p = Math.min(100, Math.max(0, percent));
  const r = 20;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - p / 100);
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" className="shrink-0" aria-hidden>
      <circle cx="24" cy="24" r={r} fill="none" stroke="#e2e8f0" strokeWidth="4" />
      <circle
        cx="24"
        cy="24"
        r={r}
        fill="none"
        stroke="#0ea5e9"
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={offset}
        transform="rotate(-90 24 24)"
      />
    </svg>
  );
}

export function EmployeeLearningProgramPlayer() {
  const base = useLearningProgramBasePath();
  const { enrollmentUuid } = useParams<{ enrollmentUuid: string }>();
  const [player, setPlayer] = useState<LearningPlayer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activityBusy, setActivityBusy] = useState<string | null>(null);
  const [textBusy, setTextBusy] = useState<string | null>(null);
  const [uploadBusy, setUploadBusy] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, ActivityDraft>>({});
  const [selectedStepIndex, setSelectedStepIndex] = useState(0);

  const reload = useCallback(async () => {
    if (!enrollmentUuid) return null;
    const r = await employeeLearningProgramApi.player(enrollmentUuid);
    setPlayer(r.data);
    return r.data;
  }, [enrollmentUuid]);

  useEffect(() => {
    if (!enrollmentUuid) return;
    setError(null);
    employeeLearningProgramApi
      .player(enrollmentUuid)
      .then((r) => {
        setPlayer(r.data);
        const first = r.data.steps.findIndex((s) => s.unlocked && !s.stepDone);
        setSelectedStepIndex(first >= 0 ? first : 0);
      })
      .catch((e) => setError(e?.response?.data?.error ?? "Chargement impossible"));
  }, [enrollmentUuid]);

  const toc = useMemo(() => (player ? buildToc(player.steps) : []), [player]);

  useEffect(() => {
    if (!player?.steps.length) return;
    setSelectedStepIndex((i) => Math.min(Math.max(0, i), player.steps.length - 1));
  }, [player?.steps.length]);

  const hasPendingVideoQuiz = useMemo(() => {
    if (!player) return false;
    return player.steps.some((s) => s.stepKind === "VIDEO" && s.quizStatus === "PENDING");
  }, [player]);

  useEffect(() => {
    if (!enrollmentUuid || !hasPendingVideoQuiz) return;
    const timer = window.setInterval(() => {
      void reload();
    }, 5000);
    return () => window.clearInterval(timer);
  }, [enrollmentUuid, hasPendingVideoQuiz, reload]);

  const activeIndex =
    player && player.steps.length > 0
      ? Math.min(Math.max(0, selectedStepIndex), player.steps.length - 1)
      : 0;
  const selectedStep = player?.steps[activeIndex] ?? null;

  const getDraft = (activityUuid: string): ActivityDraft =>
    drafts[activityUuid] ?? { text: "", fileUrl: "" };

  const setDraft = (activityUuid: string, patch: Partial<ActivityDraft>) => {
    setDrafts((prev) => {
      const cur = prev[activityUuid] ?? { text: "", fileUrl: "" };
      return { ...prev, [activityUuid]: { ...cur, ...patch } };
    });
  };

  const uploadFile = async (activityUuid: string, file: File) => {
    if (!enrollmentUuid) return;
    setUploadBusy(activityUuid);
    setError(null);
    try {
      const { data } = await employeeLearningProgramApi.uploadActivitySubmission(enrollmentUuid, activityUuid, file);
      setDraft(activityUuid, { fileUrl: data.fileUrl });
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      setError(err?.response?.data?.error ?? "Téléversement impossible");
    } finally {
      setUploadBusy(null);
    }
  };

  const markTextRead = async (step: LearningPlayerStep) => {
    if (!enrollmentUuid || step.textArticleUuid == null) return;
    setTextBusy(step.textArticleUuid);
    setError(null);
    try {
      await employeeLearningProgramApi.markTextArticleRead(enrollmentUuid, step.textArticleUuid);
      const completedKey = stepKey(step);
      const data = await reload();
      if (data) {
        const curIdx = data.steps.findIndex((s) => stepKey(s) === completedKey);
        const baseIdx = curIdx >= 0 ? curIdx : 0;
        const next = data.steps.findIndex((s, i) => i > baseIdx && s.unlocked && !s.stepDone);
        if (next >= 0) setSelectedStepIndex(next);
        else {
          const anyLeft = data.steps.findIndex((s) => s.unlocked && !s.stepDone);
          setSelectedStepIndex(anyLeft >= 0 ? anyLeft : Math.min(baseIdx, data.steps.length - 1));
        }
      }
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      setError(err?.response?.data?.error ?? "Impossible d’enregistrer la lecture");
    } finally {
      setTextBusy(null);
    }
  };

  const submitActivity = async (step: LearningPlayerStep) => {
    if (!enrollmentUuid || step.activityUuid == null) return;
    const mode: ActivitySubmissionMode = step.activitySubmissionMode ?? "TEXT";
    const d = getDraft(step.activityUuid);
    const textTrim = d.text.trim();

    if (mode === "TEXT") {
      if (textTrim.length < 1) {
        setError("Saisissez une réponse avant de valider.");
        return;
      }
    } else if (mode === "CODE") {
      if (textTrim.length < 5) {
        setError("Collez au moins 5 caractères de code ou de contenu technique.");
        return;
      }
    } else if (mode === "FILE") {
      if (!d.fileUrl.trim()) {
        setError("Téléversez un fichier puis validez.");
        return;
      }
    }

    setActivityBusy(step.activityUuid);
    setError(null);
    try {
      await employeeLearningProgramApi.submitActivity(enrollmentUuid, step.activityUuid, {
        text: mode === "FILE" ? (textTrim.length ? textTrim : null) : d.text,
        fileUrl: mode === "FILE" ? d.fileUrl.trim() : null,
      });
      const completedKey = stepKey(step);
      const data = await reload();
      if (data) {
        const curIdx = data.steps.findIndex((s) => stepKey(s) === completedKey);
        const baseIdx = curIdx >= 0 ? curIdx : 0;
        const next = data.steps.findIndex((s, i) => i > baseIdx && s.unlocked && !s.stepDone);
        if (next >= 0) setSelectedStepIndex(next);
        else {
          const anyLeft = data.steps.findIndex((s) => s.unlocked && !s.stepDone);
          setSelectedStepIndex(anyLeft >= 0 ? anyLeft : Math.min(baseIdx, data.steps.length - 1));
        }
      }
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      setError(err?.response?.data?.error ?? "Impossible de valider l’activité");
    } finally {
      setActivityBusy(null);
    }
  };

  if (error && !player) {
    return (
      <div className="p-6">
        <p className="text-rose-700">{error}</p>
        <Link to={`${base}/learning-programs`} className="text-indigo-600 text-sm mt-2 inline-block">
          ← Retour
        </Link>
      </div>
    );
  }

  if (!player) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center bg-slate-50 text-slate-500 text-sm">
        Chargement…
      </div>
    );
  }

  const skillQuizHref =
    player.programSkillUuid != null && player.programSkillUuid !== ""
      ? `${base}/quiz?skill=${encodeURIComponent(player.programSkillUuid)}`
      : `${base}/quiz`;

  return (
    <div className="min-h-screen bg-[#eef1f8] text-slate-900">
      <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white shadow-sm">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-4 px-4 py-3 sm:px-6">
          <Link
            to={`${base}/learning-programs`}
            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          >
            <span aria-hidden>←</span> Parcours
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-semibold tracking-tight text-slate-900 sm:text-xl">{player.programTitle}</h1>
            {player.programSkillName != null && (
              <p className="mt-0.5 truncate text-xs text-slate-500">
                Compétence : {player.programSkillName} · niveau {player.programTargetSkillLevel}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <ProgressRing percent={player.progressPercent} />
            <p className="text-sm font-medium text-slate-600">
              <span className="text-slate-900">{player.progressPercent}%</span>
              <span className="hidden sm:inline"> de progression</span>
            </p>
          </div>
        </div>
      </header>

      {error && (
        <div className="mx-auto max-w-[1600px] px-4 pt-4 sm:px-6">
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800" role="alert">
            {error}
          </div>
        </div>
      )}

      <div className="mx-auto flex max-w-[1600px] min-h-[calc(100vh-4.5rem)]">
        <aside className="hidden w-[min(100%,320px)] shrink-0 border-r border-slate-200/90 bg-white lg:block lg:sticky lg:top-[57px] lg:max-h-[calc(100vh-57px)] lg:overflow-y-auto">
          <div className="border-b border-slate-100 px-4 py-3">
            <h2 className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">Table des matières</h2>
          </div>
          <nav className="pb-8">
            {toc.map((part) => (
              <div key={part.partNumber} className="mb-1">
                <div className="bg-sky-100 px-3 py-2.5 text-[11px] font-bold uppercase leading-snug tracking-wide text-sky-950">
                  Partie {part.partNumber} : {part.courseTitle}
                </div>
                <ul className="py-1">
                  {part.entries.map(({ step, lessonInPart }) => {
                    const globalIdx = player.steps.indexOf(step);
                    const isSel = globalIdx === activeIndex;
                    const isVideo = step.stepKind === "VIDEO";
                    const isText = step.stepKind === "TEXT";
                    return (
                      <li key={stepKey(step)}>
                        <button
                          type="button"
                          disabled={!step.unlocked}
                          onClick={() => {
                            if (step.unlocked) setSelectedStepIndex(globalIdx);
                          }}
                          className={`flex w-full items-start gap-2 px-3 py-2.5 text-left text-sm transition-colors ${
                            isSel ? "bg-slate-200/90 font-medium text-slate-900" : "text-slate-700 hover:bg-slate-50"
                          } ${!step.unlocked ? "cursor-not-allowed opacity-50" : ""}`}
                        >
                          <span className="mt-0.5 shrink-0 text-slate-400">
                            {!step.unlocked ? (
                              <LockClosedIcon className="h-4 w-4" />
                            ) : isVideo ? (
                              <PlayCircleIcon className={`h-4 w-4 ${step.stepDone ? "text-emerald-600" : "text-sky-600"}`} />
                            ) : isText ? (
                              <BookOpenIcon className={`h-4 w-4 ${step.stepDone ? "text-emerald-600" : "text-indigo-600"}`} />
                            ) : step.stepDone ? (
                              <CheckCircleIcon className="h-4 w-4 text-emerald-600" />
                            ) : (
                              <span className="flex h-4 w-4 items-center justify-center rounded border border-slate-300 text-[10px] font-bold text-slate-500">
                                {lessonInPart}
                              </span>
                            )}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="mr-1.5 tabular-nums text-slate-400">{lessonInPart}.</span>
                            <span className="text-[13px] leading-snug">
                              {isVideo ? (
                                <>
                                  {step.title}
                                  <span className="ml-1 text-[10px] font-semibold uppercase text-sky-700">Vidéo</span>
                                </>
                              ) : isText ? (
                                <>
                                  {step.title}
                                  <span className="ml-1 text-[10px] font-semibold uppercase text-indigo-700">Lecture</span>
                                </>
                              ) : (
                                <>
                                  {step.title}
                                  <span className="ml-1 text-[10px] font-semibold uppercase text-teal-700">
                                    {step.activityKind === "PRACTICAL" ? "Pratique" : "Exercice"}
                                  </span>
                                </>
                              )}
                              {isVideo && step.quizStatus === "READY" && (
                                <span className="ml-1 text-[10px] font-semibold uppercase text-violet-700">Quiz</span>
                              )}
                              {isVideo && step.quizStatus === "PENDING" && (
                                <span className="ml-1 text-[10px] font-semibold uppercase text-amber-700">
                                  Quiz · préparation
                                </span>
                              )}
                            </span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>
        </aside>

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-8 sm:py-8">
          <div className="mb-4 lg:hidden">
            <label className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Leçon</label>
            <select
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
              value={activeIndex}
              onChange={(e) => setSelectedStepIndex(Number(e.target.value))}
            >
              {player.steps.map((s, i) => (
                <option key={stepKey(s)} value={i} disabled={!s.unlocked}>
                  {i + 1}. {s.title} {!s.unlocked ? "(verrouillé)" : ""}
                </option>
              ))}
            </select>
          </div>

          {player.suggestSkillValidationQuiz && (
            <div className="mb-6 rounded-xl border border-indigo-200 bg-indigo-50/90 px-4 py-3 text-sm text-indigo-950">
              <p className="font-medium">Parcours terminé — valider votre niveau</p>
              <Link
                to={skillQuizHref}
                className="mt-2 inline-flex rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Quiz de compétence
              </Link>
            </div>
          )}

          {selectedStep && (
            <article className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
              <div className="border-b border-slate-100 bg-slate-50/80 px-5 py-4 sm:px-8 sm:py-5">
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  Partie {partNumber(selectedStep)} ·{" "}
                  {selectedStep.stepKind === "VIDEO"
                    ? "Vidéo & quiz"
                    : selectedStep.stepKind === "TEXT"
                      ? "Contenu texte"
                      : "Activité"}
                </p>
                <h2 className="mt-1 text-xl font-semibold leading-tight text-slate-900 sm:text-2xl">{selectedStep.title}</h2>
              </div>

              <div className="px-5 py-6 sm:px-8 sm:py-8">
                {selectedStep.stepKind === "VIDEO" ? (
                  <div className="space-y-6">
                    {!selectedStep.unlocked ? (
                      <p className="rounded-lg border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                        Complétez les étapes précédentes pour débloquer cette leçon.
                      </p>
                    ) : (
                      <>
                        {isCooldownActive(selectedStep.quizCooldownUntil) && !selectedStep.stepDone && (
                          <div className="flex gap-3 rounded-lg border border-amber-100 bg-amber-50/90 px-4 py-3 text-sm text-amber-950">
                            <QuestionMarkCircleIcon className="h-5 w-5 shrink-0 text-amber-700" />
                            <p>
                              Quiz temporairement indisponible après un échec. Prochain essai :{" "}
                              <strong>{formatCooldownUntil(selectedStep.quizCooldownUntil) ?? "—"}</strong>.
                            </p>
                          </div>
                        )}
                        <div className="overflow-hidden rounded-lg border border-slate-200 bg-black shadow-md ring-1 ring-slate-900/5">
                          <div className="aspect-video w-full">
                            {selectedStep.uploadedVideoUrl ? (
                              <video title={selectedStep.title} className="h-full w-full" controls src={selectedStep.uploadedVideoUrl} />
                            ) : (
                              <iframe
                                title={selectedStep.title}
                                className="h-full w-full"
                                src={`https://www.youtube.com/embed/${selectedStep.youtubeVideoId}`}
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                              />
                            )}
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                          <a
                            href={selectedStep.uploadedVideoUrl ?? `https://www.youtube.com/watch?v=${selectedStep.youtubeVideoId}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm font-medium text-sky-700 hover:underline"
                          >
                            {selectedStep.uploadedVideoUrl ? "Ouvrir la vidéo" : "Ouvrir sur YouTube"}
                          </a>
                          {selectedStep.quizStatus === "READY" &&
                            !selectedStep.stepDone &&
                            !isCooldownActive(selectedStep.quizCooldownUntil) &&
                            selectedStep.videoUuid != null && (
                              <Link
                                to={`${base}/learning-programs/quiz/${player.enrollmentUuid}/${selectedStep.videoUuid}`}
                                className="inline-flex items-center rounded-lg bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-sky-700"
                              >
                                Passer le quiz
                              </Link>
                            )}
                          {selectedStep.quizStatus === "PENDING" && !selectedStep.stepDone && (
                            <button
                              type="button"
                              disabled
                              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-5 py-2.5 text-sm font-semibold text-slate-600"
                            >
                              <ArrowPathIcon className="h-4 w-4 animate-spin" />
                              Génération du quiz...
                            </button>
                          )}
                          {selectedStep.quizStatus === "FAILED" && selectedStep.uploadedVideoUrl && !selectedStep.stepDone && (
                            <span className="inline-flex items-center rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-900">
                              Quiz non implémenté pour cette vidéo (upload/url).
                            </span>
                          )}
                          {selectedStep.stepDone && (
                            <span className="inline-flex items-center gap-1 text-sm font-medium text-emerald-700">
                              <CheckCircleIcon className="h-4 w-4" /> Quiz validé
                            </span>
                          )}
                        </div>
                        <aside className="flex gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                          <QuestionMarkCircleIcon className="h-5 w-5 shrink-0 text-slate-400" />
                          <p>
                            Regardez la vidéo puis validez vos acquis avec le quiz. En cas d’échec, un délai de 15 jours
                            s’applique avant le prochain essai.
                          </p>
                        </aside>
                      </>
                    )}
                  </div>
                ) : selectedStep.stepKind === "TEXT" ? (
                  <div className="space-y-6">
                    {!selectedStep.unlocked ? (
                      <p className="rounded-lg border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                        Complétez les étapes précédentes pour accéder à ce contenu.
                      </p>
                    ) : (
                      <>
                        <div className="max-w-none text-sm leading-relaxed text-slate-800">
                          <div className="rounded-lg border border-slate-100 bg-slate-50/80 px-4 py-4">
                            {selectedStep.textArticleBody?.trim() ? (
                              <LearningMarkdownBody markdown={selectedStep.textArticleBody} />
                            ) : (
                              <p className="text-sm text-slate-500">Aucun contenu renseigné pour cette lecture.</p>
                            )}
                          </div>
                        </div>
                        {selectedStep.stepDone ? (
                          <p className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700">
                            <CheckCircleIcon className="h-4 w-4" /> Lecture validée
                          </p>
                        ) : (
                          <button
                            type="button"
                            disabled={textBusy === selectedStep.textArticleUuid}
                            onClick={() => void markTextRead(selectedStep)}
                            className="rounded-lg bg-indigo-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-800 disabled:opacity-50"
                          >
                            {textBusy === selectedStep.textArticleUuid ? "Enregistrement…" : "J’ai lu — continuer"}
                          </button>
                        )}
                      </>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {!selectedStep.unlocked ? (
                      <p className="rounded-lg border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                        Complétez les étapes précédentes pour accéder à cette activité.
                      </p>
                    ) : (
                      <>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                          <span className="rounded-full bg-teal-50 px-2 py-0.5 font-semibold uppercase text-teal-800 ring-1 ring-teal-100">
                            {selectedStep.activityKind === "PRACTICAL" ? "Pratique" : "Exercice"}
                          </span>
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-600">
                            {submissionModeLabel(selectedStep.activitySubmissionMode)}
                          </span>
                          {selectedStep.stepDone && (
                            <span className="inline-flex items-center gap-1 font-medium text-emerald-700">
                              <CheckCircleIcon className="h-3.5 w-3.5" /> Validée
                            </span>
                          )}
                        </div>
                        {selectedStep.activityInstructions != null && selectedStep.activityInstructions.trim() !== "" && (
                          <div className="flex gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800">
                            <QuestionMarkCircleIcon className="h-5 w-5 shrink-0 text-slate-400" />
                            <div className="min-w-0 leading-relaxed">
                              <LearningMarkdownBody markdown={selectedStep.activityInstructions} linkBehavior="download" />
                            </div>
                          </div>
                        )}
                        {selectedStep.activityResourceUrl != null && selectedStep.activityResourceUrl.trim() !== "" && (
                          <a
                            href={selectedStep.activityResourceUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex text-sm font-semibold text-sky-700 hover:underline"
                          >
                            Ressource / consignes en ligne →
                          </a>
                        )}
                        {!selectedStep.stepDone && selectedStep.activityUuid != null && (
                          <div className="space-y-4 rounded-xl border border-teal-100 bg-teal-50/30 p-4 sm:p-5">
                            {(selectedStep.activitySubmissionMode ?? "TEXT") === "FILE" && (
                              <div className="space-y-3">
                                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600">
                                  Fichier
                                  <input
                                    type="file"
                                    className="mt-1.5 block w-full text-sm text-slate-600"
                                    disabled={uploadBusy === selectedStep.activityUuid}
                                    onChange={(e) => {
                                      const f = e.target.files?.[0];
                                      if (f) void uploadFile(selectedStep.activityUuid!, f);
                                      e.target.value = "";
                                    }}
                                  />
                                </label>
                                {uploadBusy === selectedStep.activityUuid && (
                                  <p className="text-xs text-slate-500">Téléversement…</p>
                                )}
                                {getDraft(selectedStep.activityUuid).fileUrl && (
                                  <p className="text-xs font-medium text-emerald-800">Fichier prêt pour validation.</p>
                                )}
                                <label className="block text-xs font-semibold text-slate-600">
                                  Commentaire (optionnel)
                                  <textarea
                                    className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                                    rows={2}
                                    value={getDraft(selectedStep.activityUuid).text}
                                    onChange={(e) => setDraft(selectedStep.activityUuid!, { text: e.target.value })}
                                  />
                                </label>
                              </div>
                            )}
                            {(selectedStep.activitySubmissionMode ?? "TEXT") === "TEXT" && (
                              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600">
                                Votre réponse
                                <textarea
                                  className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                                  rows={6}
                                  value={getDraft(selectedStep.activityUuid).text}
                                  onChange={(e) => setDraft(selectedStep.activityUuid!, { text: e.target.value })}
                                  placeholder="Rédigez votre réponse ici."
                                />
                              </label>
                            )}
                            {(selectedStep.activitySubmissionMode ?? "TEXT") === "CODE" && (
                              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600">
                                Code (min. 5 caractères)
                                <textarea
                                  className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-xs leading-relaxed"
                                  rows={12}
                                  spellCheck={false}
                                  value={getDraft(selectedStep.activityUuid).text}
                                  onChange={(e) => setDraft(selectedStep.activityUuid!, { text: e.target.value })}
                                  placeholder="Collez votre code ici."
                                />
                              </label>
                            )}
                            <button
                              type="button"
                              disabled={activityBusy === selectedStep.activityUuid}
                              onClick={() => void submitActivity(selectedStep)}
                              className="rounded-lg bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-teal-800 disabled:opacity-50"
                            >
                              {activityBusy === selectedStep.activityUuid ? "Validation…" : "Valider l’activité"}
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            </article>
          )}
        </main>
      </div>
    </div>
  );
}
