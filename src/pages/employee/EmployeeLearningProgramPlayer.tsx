import { useCallback, useEffect, useMemo, useState, type ComponentType, type ReactNode } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import {
  employeeLearningProgramApi,
  type ActivitySubmissionMode,
  type LearningPlayer,
  type LearningPlayerStep,
} from "../../api/learningProgramApi";
import { LearningMarkdownBody } from "../../components/learning/LearningMarkdownBody";
import { useLearningProgramBasePath } from "../../hooks/useLearningProgramBasePath";
import {
  AcademicCapIcon,
  ArrowLeftIcon,
  ArrowPathIcon,
  ArrowTopRightOnSquareIcon,
  BookOpenIcon,
  CheckCircleIcon,
  ChevronRightIcon,
  ClipboardDocumentCheckIcon,
  ClipboardDocumentIcon,
  ClipboardDocumentListIcon,
  ClockIcon,
  CommandLineIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  LockClosedIcon,
  PlayCircleIcon,
  QuestionMarkCircleIcon,
  StarIcon,
  TagIcon,
} from "../../icons/heroicons/outline";

function formatTime(totalSeconds: number): string {
  const total = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function parseEstimatedDurationSeconds(value?: string | null): number {
  const raw = String(value ?? "").trim().toLowerCase();
  if (!raw) return 0;

  // Common formats: "30 min", "30min", "1h", "1 h 30", "1h30", "90m", "15"
  let hours = 0;
  let minutes = 0;

  const hMatch = raw.match(/(\d+(?:[.,]\d+)?)\s*h/);
  if (hMatch?.[1]) hours = Number(hMatch[1].replace(",", ".")) || 0;

  const mMatch = raw.match(/(\d+)\s*(?:min|m)\b/);
  if (mMatch?.[1]) minutes = Number(mMatch[1]) || 0;

  // "1h30" without explicit "min"
  if (minutes === 0 && hMatch && raw.match(/h\s*(\d{1,2})\b/)) {
    const trailing = raw.match(/h\s*(\d{1,2})\b/)?.[1];
    if (trailing) minutes = Number(trailing) || 0;
  }

  // Plain number => minutes
  if (!hMatch && !mMatch) {
    const n = Number(raw.replace(",", "."));
    if (Number.isFinite(n) && n > 0) minutes = n;
  }

  const totalMinutes = Math.max(0, Math.round(hours * 60 + minutes));
  return totalMinutes * 60;
}

function stepKey(step: LearningPlayerStep): string {
  if (step.stepKind === "VIDEO") return `v-${step.videoUuid ?? ""}`;
  if (step.stepKind === "TEXT") return `t-${step.textArticleUuid ?? ""}`;
  return `a-${step.activityUuid ?? ""}`;
}

function partNumber(step: LearningPlayerStep): number {
  return step.coursePartNumber ?? 1;
}

function partTitle(step: LearningPlayerStep): string {
  const title = step.courseTitle?.trim();
  return title || `Module ${partNumber(step)}`;
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
    const part = byPart.get(pn)!;
    part.entries.push({ step, lessonInPart: part.entries.length + 1 });
  }

  return order.map((pn) => {
    const part = byPart.get(pn)!;
    return { partNumber: pn, courseTitle: part.courseTitle, entries: part.entries };
  });
}

type ActivityDraft = { text: string; fileUrl: string };

function submissionModeLabel(mode: ActivitySubmissionMode | null | undefined): string {
  if (mode === "CODE") return "Code / technique";
  if (mode === "FILE") return "Fichier";
  return "Texte";
}

function playerStatusLabel(status?: string | null): string {
  const value = String(status ?? "").toUpperCase();
  if (value === "COMPLETED") return "Terminé";
  if (value === "IN_PROGRESS") return "En cours";
  if (value === "NOT_STARTED") return "Non commencé";
  if (value === "CANCELLED") return "Annulé";
  return status || "Statut inconnu";
}

function stepKindLabel(step: LearningPlayerStep): string {
  if (step.stepKind === "VIDEO") return "Vidéo";
  if (step.stepKind === "TEXT") return "Lecture";
  return step.activityKind === "PRACTICAL" ? "Activité pratique" : "Exercice";
}

function stepIcon(step: LearningPlayerStep): ComponentType<React.SVGProps<SVGSVGElement>> {
  if (step.stepKind === "VIDEO") return PlayCircleIcon;
  if (step.stepKind === "TEXT") return BookOpenIcon;
  if (step.activitySubmissionMode === "CODE") return CommandLineIcon;
  if (step.activitySubmissionMode === "FILE") return ClipboardDocumentIcon;
  return ClipboardDocumentListIcon;
}

function stepTone(step: LearningPlayerStep): {
  label: string;
  iconBg: string;
  iconText: string;
  pill: string;
  accent: string;
} {
  if (step.stepKind === "VIDEO") {
    return {
      label: "Vidéo",
      iconBg: "bg-violet-100",
      iconText: "text-violet-700",
      pill: "border-violet-200 bg-violet-50 text-violet-700",
      accent: "from-violet-600 to-fuchsia-500",
    };
  }
  if (step.stepKind === "TEXT") {
    return {
      label: "Lecture",
      iconBg: "bg-blue-100",
      iconText: "text-blue-700",
      pill: "border-blue-200 bg-blue-50 text-blue-700",
      accent: "from-blue-600 to-cyan-500",
    };
  }
  return {
    label: step.activityKind === "PRACTICAL" ? "Pratique" : "Exercice",
    iconBg: "bg-emerald-100",
    iconText: "text-emerald-700",
    pill: "border-emerald-200 bg-emerald-50 text-emerald-700",
    accent: "from-emerald-600 to-teal-500",
  };
}

function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

function Skeleton({ className }: { className: string }) {
  return <div className={cn("animate-pulse rounded-2xl bg-slate-200/80", className)} />;
}

function StatusPill({ step }: { step: LearningPlayerStep }) {
  if (!step.unlocked) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-base font-semibold text-amber-800">
        <LockClosedIcon className="h-3.5 w-3.5" />
        Verrouillé
      </span>
    );
  }
  if (step.stepDone) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-base font-semibold text-emerald-800">
        <CheckCircleIcon className="h-3.5 w-3.5" />
        Complété
      </span>
    );
  }
  if (step.stepKind === "VIDEO" && step.quizStatus === "PENDING") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-base font-semibold text-orange-800">
        <ArrowPathIcon className="h-3.5 w-3.5 animate-spin" />
        Quiz en cours
      </span>
    );
  }
  if (step.stepKind === "VIDEO" && step.quizStatus === "FAILED") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-base font-semibold text-rose-800">
        <ExclamationTriangleIcon className="h-3.5 w-3.5" />
        Quiz indisponible
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-base font-semibold text-blue-800">
      <ClockIcon className="h-3.5 w-3.5" />À faire
    </span>
  );
}

function KindPill({ step }: { step: LearningPlayerStep }) {
  const tone = stepTone(step);
  const Icon = stepIcon(step);
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-base font-bold", tone.pill)}>
      <Icon className="h-3.5 w-3.5" />
      {tone.label}
    </span>
  );
}

function AlertBox({
  variant,
  children,
  className,
}: {
  variant: "error" | "warning" | "info" | "success";
  children: ReactNode;
  className?: string;
}) {
  const styles = {
    error: "border-rose-200 bg-rose-50 text-rose-900",
    warning: "border-orange-200 bg-orange-50 text-orange-950",
    info: "border-blue-200 bg-blue-50 text-blue-950",
    success: "border-emerald-200 bg-emerald-50 text-emerald-950",
  };
  const icons = {
    error: ExclamationTriangleIcon,
    warning: ClockIcon,
    info: InformationCircleIcon,
    success: CheckCircleIcon,
  };
  const Icon = icons[variant];

  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-3 rounded-2xl border px-4 py-3 text-base leading-6 shadow-sm animate-profile-section",
        styles[variant],
        className,
      )}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="min-w-0">{children}</div>
    </div>
  );
}

function PrimaryButton({
  children,
  onClick,
  loading,
  loadingLabel,
  disabled,
  icon: Icon,
}: {
  children: ReactNode;
  onClick: () => void;
  loading?: boolean;
  loadingLabel?: string;
  disabled?: boolean;
  icon?: ComponentType<React.SVGProps<SVGSVGElement>>;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-violet-700 px-5 py-2.5 text-base font-bold text-white shadow-lg shadow-violet-200 transition duration-200 hover:-translate-y-0.5 hover:bg-violet-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2 disabled:translate-y-0 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
    >
      {loading ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : Icon ? <Icon className="h-4 w-4" /> : null}
      {loading ? loadingLabel ?? "Chargement..." : children}
    </button>
  );
}

function SecondaryButton({
  children,
  onClick,
  disabled,
  icon: Icon,
  className,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  icon?: ComponentType<React.SVGProps<SVGSVGElement>>;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-base font-bold text-slate-700 shadow-sm transition duration-200 hover:border-violet-200 hover:bg-violet-50 hover:text-violet-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-45",
        className,
      )}
    >
      {Icon ? <Icon className="h-4 w-4" /> : null}
      {children}
    </button>
  );
}

function CompletedPanel({ label }: { label: string }) {
  return (
    <div className="flex items-start gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-950 animate-profile-section">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-emerald-700 shadow-sm">
        <CheckCircleIcon className="h-5 w-5" />
      </span>
      <div>
        <p className="text-base font-bold">{label}</p>
        <p className="mt-1 text-base leading-6 text-emerald-800">Cette étape est validée. Vous pouvez continuer votre formation.</p>
      </div>
    </div>
  );
}

function LockedPanel() {
  return (
    <section className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed border-amber-300 bg-amber-50 px-6 py-12 text-center animate-profile-section">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-amber-700 shadow-sm">
        <LockClosedIcon className="h-6 w-6" />
      </span>
      <h3 className="mt-5 text-2xl font-bold text-slate-950">Étape verrouillée</h3>
      <p className="mt-2 max-w-md text-base leading-6 text-slate-600">Terminez les étapes précédentes pour débloquer ce contenu.</p>
    </section>
  );
}

function StepNumber({ step, selected }: { step: LearningPlayerStep; selected: boolean }) {
  if (!step.unlocked) {
    return (
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-400">
        <LockClosedIcon className="h-3.5 w-3.5" />
      </span>
    );
  }
  if (step.stepDone) {
    return (
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm shadow-emerald-200">
        <CheckCircleIcon className="h-4 w-4" />
      </span>
    );
  }
  const tone = stepTone(step);
  return (
    <span
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition duration-200",
        selected ? `${tone.iconBg} ${tone.iconText} ring-2 ring-violet-200` : "bg-slate-100 text-slate-500",
      )}
    >
      {selected ? <ChevronRightIcon className="h-4 w-4" /> : <span className="h-2 w-2 rounded-full bg-current" />}
    </span>
  );
}

function StepPlanItem({
  step,
  index,
  lessonInPart,
  selected,
  onSelect,
}: {
  step: LearningPlayerStep;
  index: number;
  lessonInPart: number;
  selected: boolean;
  onSelect: () => void;
}) {
  const Icon = stepIcon(step);
  return (
    <li>
      <button
        type="button"
        disabled={!step.unlocked}
        onClick={onSelect}
        className={cn(
          "group grid w-full grid-cols-[auto_1fr] gap-3 rounded-lg px-3 py-3 text-left transition duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500",
          selected ? "bg-violet-50 shadow-sm ring-1 ring-violet-200" : "hover:bg-slate-50",
          !step.unlocked && "cursor-not-allowed opacity-55",
        )}
      >
        <StepNumber step={step} selected={selected} />
        <span className="min-w-0">
          <span
            className={cn(
              "block truncate text-base font-bold leading-5",
              selected ? "text-violet-950" : step.stepDone ? "text-slate-500" : "text-slate-800",
            )}
          >
            {lessonInPart}. {step.title}
          </span>
          <span className="mt-1 flex items-center gap-1.5 text-base text-slate-500">
            <Icon className={cn("h-3.5 w-3.5", selected && "text-violet-700")} />
            <span>{index + 1}</span>
            <span className="h-1 w-1 rounded-full bg-slate-300" />
            <span>{stepKindLabel(step)}</span>
          </span>
        </span>
      </button>
    </li>
  );
}

function EmptyState({ backTo }: { backTo: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center app-page-bg p-6">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <ClipboardDocumentListIcon className="mx-auto h-10 w-10 text-slate-400" />
        <h1 className="mt-4 text-2xl font-bold text-slate-950">Aucune étape disponible</h1>
        <p className="mt-2 text-base leading-6 text-slate-600">Ce programme ne contient pas encore de contenu à afficher.</p>
        <Link
          to={backTo}
          className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-violet-700 px-5 py-2.5 text-base font-bold text-white transition hover:bg-violet-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Retour
        </Link>
      </div>
    </div>
  );
}

export function EmployeeLearningProgramPlayer() {
  const base = useLearningProgramBasePath();
  const location = useLocation();
  const { enrollmentUuid } = useParams<{ enrollmentUuid: string }>();
  const backTo = (location.state as { backTo?: string } | null)?.backTo ?? `${base}/training-recommendations`;

  const [player, setPlayer] = useState<LearningPlayer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activityBusy, setActivityBusy] = useState<string | null>(null);
  const [textBusy, setTextBusy] = useState<string | null>(null);
  const [uploadBusy, setUploadBusy] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, ActivityDraft>>({});
  const [selectedStepIndex, setSelectedStepIndex] = useState(0);
  const [modulesSidebarOpen, setModulesSidebarOpen] = useState(true);
  const [activityTimerSeconds, setActivityTimerSeconds] = useState<number | null>(null);
  const [activityTimerTotalSeconds, setActivityTimerTotalSeconds] = useState<number | null>(null);
  const [activityTimerExpired, setActivityTimerExpired] = useState(false);
  const [reviewRating, setReviewRating] = useState<number>(0);
  const [reviewNote, setReviewNote] = useState<string>("");
  const [reviewSaving, setReviewSaving] = useState(false);
  const [reviewSavedAt, setReviewSavedAt] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!enrollmentUuid) return null;
    const response = await employeeLearningProgramApi.player(enrollmentUuid);
    setPlayer(response.data);
    return response.data;
  }, [enrollmentUuid]);

  useEffect(() => {
    if (!enrollmentUuid) return;
    setError(null);
    employeeLearningProgramApi
      .player(enrollmentUuid)
      .then((response) => {
        setPlayer(response.data);
        const first = response.data.steps.findIndex((step) => step.unlocked && !step.stepDone);
        setSelectedStepIndex(first >= 0 ? first : 0);
      })
      .catch((e) => setError(e?.response?.data?.error ?? "Chargement impossible"));
  }, [enrollmentUuid]);

  useEffect(() => {
    if (!enrollmentUuid) return;
    employeeLearningProgramApi
      .myReview(enrollmentUuid)
      .then((res) => {
        const r = res.data;
        if (!r) return;
        setReviewRating(r.rating ?? 0);
        setReviewNote(r.note ?? "");
        setReviewSavedAt(r.updatedAt ?? null);
      })
      .catch(() => {
        // ignore
      });
  }, [enrollmentUuid]);

  const toc = useMemo(() => (player ? buildToc(player.steps) : []), [player]);

  useEffect(() => {
    if (!player?.steps.length) return;
    setSelectedStepIndex((index) => Math.min(Math.max(0, index), player.steps.length - 1));
  }, [player?.steps.length]);

  const hasPendingVideoQuiz = useMemo(() => {
    if (!player) return false;
    return player.steps.some((step) => step.stepKind === "VIDEO" && step.quizStatus === "PENDING");
  }, [player]);

  useEffect(() => {
    if (!enrollmentUuid || !hasPendingVideoQuiz) return;
    const timer = window.setInterval(() => void reload(), 5000);
    return () => window.clearInterval(timer);
  }, [enrollmentUuid, hasPendingVideoQuiz, reload]);

  const activeIndex =
    player && player.steps.length > 0 ? Math.min(Math.max(0, selectedStepIndex), player.steps.length - 1) : 0;
  const selectedStep = player?.steps[activeIndex] ?? null;
  const programCompleted = player?.status === "COMPLETED";

  useEffect(() => {
    if (!enrollmentUuid || !selectedStep || selectedStep.stepKind !== "ACTIVITY" || !selectedStep.unlocked || selectedStep.stepDone || !selectedStep.activityUuid) {
      setActivityTimerSeconds(null);
      setActivityTimerTotalSeconds(null);
      setActivityTimerExpired(false);
      return;
    }

    const totalSeconds = parseEstimatedDurationSeconds(selectedStep.activityEstimatedDuration);
    if (totalSeconds <= 0) {
      setActivityTimerSeconds(null);
      setActivityTimerTotalSeconds(null);
      setActivityTimerExpired(false);
      return;
    }

    const storageKey = `lp_act_timer:${enrollmentUuid}:${selectedStep.activityUuid}`;
    const now = Date.now();
    const existing = window.localStorage.getItem(storageKey);
    let startedAtMs = existing ? Number(existing) : NaN;
    if (!Number.isFinite(startedAtMs) || startedAtMs <= 0) {
      startedAtMs = now;
      window.localStorage.setItem(storageKey, String(startedAtMs));
    }

    setActivityTimerTotalSeconds(totalSeconds);

    const tick = () => {
      const elapsed = Math.floor((Date.now() - startedAtMs) / 1000);
      const remaining = Math.max(0, totalSeconds - elapsed);
      setActivityTimerSeconds(remaining);
      setActivityTimerExpired(remaining === 0);
    };

    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, [enrollmentUuid, selectedStep]);

  const prevUnlockedIndex = useMemo(() => {
    if (!player || activeIndex <= 0) return null;
    for (let i = activeIndex - 1; i >= 0; i -= 1) {
      if (player.steps[i]?.unlocked) return i;
    }
    return null;
  }, [activeIndex, player]);

  const nextUnlockedIndex = useMemo(() => {
    if (!player || activeIndex >= player.steps.length - 1) return null;
    for (let i = activeIndex + 1; i < player.steps.length; i += 1) {
      if (player.steps[i]?.unlocked) return i;
    }
    return null;
  }, [activeIndex, player]);

  const skillQuizHref =
    player?.programSkillUuid != null && player.programSkillUuid !== ""
      ? `${base}/quiz?skill=${encodeURIComponent(player.programSkillUuid)}`
      : `${base}/quiz`;

  const getDraft = (activityUuid: string): ActivityDraft => drafts[activityUuid] ?? { text: "", fileUrl: "" };

  const setDraft = (activityUuid: string, patch: Partial<ActivityDraft>) => {
    setDrafts((prev) => {
      const current = prev[activityUuid] ?? { text: "", fileUrl: "" };
      return { ...prev, [activityUuid]: { ...current, ...patch } };
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

  const advanceAfterCompletion = (data: LearningPlayer, completedKey: string) => {
    const curIdx = data.steps.findIndex((step) => stepKey(step) === completedKey);
    const baseIdx = curIdx >= 0 ? curIdx : 0;
    const next = data.steps.findIndex((step, index) => index > baseIdx && step.unlocked && !step.stepDone);
    if (next >= 0) {
      setSelectedStepIndex(next);
    } else {
      const anyLeft = data.steps.findIndex((step) => step.unlocked && !step.stepDone);
      setSelectedStepIndex(anyLeft >= 0 ? anyLeft : Math.min(baseIdx, data.steps.length - 1));
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
      if (data) advanceAfterCompletion(data, completedKey);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      setError(err?.response?.data?.error ?? "Impossible d'enregistrer la lecture");
    } finally {
      setTextBusy(null);
    }
  };

  const submitActivity = async (step: LearningPlayerStep) => {
    if (!enrollmentUuid || step.activityUuid == null) return;
    const mode: ActivitySubmissionMode = step.activitySubmissionMode ?? "TEXT";
    const draft = getDraft(step.activityUuid);
    const textTrim = draft.text.trim();

    if (mode === "TEXT" && textTrim.length < 1) {
      setError("Saisissez une réponse avant de valider.");
      return;
    }
    if (mode === "CODE" && textTrim.length < 5) {
      setError("Collez au moins 5 caractères de code ou de contenu technique.");
      return;
    }
    if (mode === "FILE" && !draft.fileUrl.trim()) {
      setError("Téléversez un fichier puis validez.");
      return;
    }

    setActivityBusy(step.activityUuid);
    setError(null);
    try {
      await employeeLearningProgramApi.submitActivity(enrollmentUuid, step.activityUuid, {
        text: mode === "FILE" ? (textTrim.length ? textTrim : null) : draft.text,
        fileUrl: mode === "FILE" ? draft.fileUrl.trim() : null,
      });
      try {
        window.localStorage.removeItem(`lp_act_timer:${enrollmentUuid}:${step.activityUuid}`);
      } catch {
        // ignore
      }
      const completedKey = stepKey(step);
      const data = await reload();
      if (data) advanceAfterCompletion(data, completedKey);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      setError(err?.response?.data?.error ?? "Impossible de valider l'activité");
    } finally {
      setActivityBusy(null);
    }
  };

  const submitProgramReview = async () => {
    if (!enrollmentUuid) return;
    if (reviewRating < 1 || reviewRating > 5) {
      setError("Veuillez sélectionner une note entre 1 et 5 étoiles.");
      return;
    }
    setReviewSaving(true);
    setError(null);
    try {
      const { data } = await employeeLearningProgramApi.submitReview(enrollmentUuid, {
        rating: reviewRating,
        note: reviewNote.trim() || null,
      });
      setReviewRating(data.rating ?? reviewRating);
      setReviewNote(data.note ?? "");
      setReviewSavedAt(data.updatedAt ?? null);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      setError(err?.response?.data?.error ?? "Impossible d'enregistrer l’avis");
    } finally {
      setReviewSaving(false);
    }
  };

  if (error && !player) {
    return (
      <div className="flex min-h-screen items-center justify-center app-page-bg p-6">
        <div className="w-full max-w-md rounded-2xl border border-rose-200 bg-white p-8 shadow-lg shadow-rose-100">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-700">
            <ExclamationTriangleIcon className="h-6 w-6" />
          </span>
          <h1 className="mt-5 text-2xl font-bold text-slate-950">Chargement impossible</h1>
          <p className="mt-2 text-base leading-6 text-rose-700">{error}</p>
          <Link
            to={backTo}
            className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-base font-bold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Retour
          </Link>
        </div>
      </div>
    );
  }

  if (!player) {
    return (
      <div className="min-h-screen app-page-bg">
        <div className="border-b border-slate-200 bg-white px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex max-w-none items-center justify-between gap-4">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-10 w-36" />
          </div>
        </div>
        <div className="grid max-w-none gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[360px_minmax(0,1fr)_360px] lg:px-8">
          <aside className="hidden rounded-2xl border border-slate-200 bg-white p-4 lg:block">
            <Skeleton className="h-20 w-full" />
            <div className="mt-6 space-y-3">
              {Array.from({ length: 7 }).map((_, index) => (
                <Skeleton key={index} className="h-14 w-full" />
              ))}
            </div>
          </aside>
          <main className="rounded-2xl border border-slate-200 bg-white p-5">
            <Skeleton className="h-7 w-2/3" />
            <Skeleton className="mt-4 h-4 w-1/3" />
            <Skeleton className="mt-8 h-[360px] w-full" />
            <Skeleton className="mt-6 h-11 w-40" />
          </main>
          <aside className="hidden space-y-4 lg:block">
            <Skeleton className="h-36 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-40 w-full" />
          </aside>
        </div>
      </div>
    );
  }

  if (player.steps.length === 0) return <EmptyState backTo={backTo} />;

  const doneCount = player.steps.filter((step) => step.stepDone).length;
  const pct = Math.max(0, Math.min(100, player.progressPercent));
  const tone = selectedStep ? stepTone(selectedStep) : null;
  const SelectedIcon = selectedStep ? stepIcon(selectedStep) : ClipboardDocumentListIcon;

  return (
    <div className="flex w-full flex-col app-page-bg text-slate-950">
      <header className="z-30 shrink-0 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="flex min-h-12 w-full items-center gap-3 px-4 py-1.5 sm:px-6 lg:px-8">
          <Link
            to={backTo}
            className="inline-flex min-h-9 shrink-0 items-center gap-2 rounded-lg px-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Retour
          </Link>

          <div className="hidden h-8 w-px bg-slate-200 sm:block" />

          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center gap-2">
              <span className="hidden h-2.5 w-2.5 rounded-full bg-violet-600 sm:block" />
              <h1 className="truncate text-base font-bold text-slate-950 sm:text-lg">{player.programTitle}</h1>
              <span className="hidden rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-violet-800 md:inline-flex">
                {playerStatusLabel(player.status)}
              </span>
            </div>
            <p className="mt-0.5 hidden truncate text-sm text-slate-500 sm:block">
              {player.programSkillName ? (
                <>
                  {player.programSkillName}
                  <span className="mx-2 text-slate-300">/</span>
                </>
              ) : null}
              Niveau cible {player.programTargetSkillLevel}
            </p>
          </div>

          <div className="hidden items-center gap-3 md:flex">
            <div className="text-right">
              <p className="text-sm font-semibold text-slate-950">{pct}%</p>
              <p className="text-sm text-slate-500">
                {doneCount}/{player.steps.length} étapes
              </p>
            </div>
            <div className="h-2 w-28 overflow-hidden rounded-full bg-violet-100">
              <div className="h-full rounded-full bg-violet-700 transition-all duration-700 ease-out" style={{ width: `${pct}%` }} />
            </div>
          </div>

          {!modulesSidebarOpen ? (
            <button
              type="button"
              onClick={() => setModulesSidebarOpen(true)}
              className="hidden min-h-9 shrink-0 items-center gap-2 rounded-lg border border-violet-200 bg-white px-3 text-sm font-semibold text-violet-700 shadow-sm transition hover:bg-violet-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 lg:inline-flex"
              title="Afficher les modules"
            >
              <ClipboardDocumentListIcon className="h-4 w-4" />
              Afficher modules
            </button>
          ) : null}
        </div>
      </header>

      <div className="shrink-0 space-y-3">
      {player.suggestSkillValidationQuiz ? (
        <div className="w-full px-4 pt-3 sm:px-6 lg:px-8">
          <section className="grid gap-4 rounded-2xl border border-violet-200 bg-violet-700 p-5 text-white shadow-xl shadow-violet-200 animate-profile-section md:grid-cols-[1fr_auto] md:items-center">
            <div className="flex items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15">
                <AcademicCapIcon className="h-6 w-6" />
              </span>
              <div>
                <p className="text-base font-bold">Formation terminée</p>
                <p className="mt-1 text-base leading-6 text-violet-100">Vous pouvez maintenant lancer le quiz de validation de compétence.</p>
              </div>
            </div>
            <Link
              to={skillQuizHref}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-white px-5 py-2.5 text-base font-bold text-violet-800 transition hover:bg-violet-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-violet-700"
            >
              <QuestionMarkCircleIcon className="h-4 w-4" />
              Quiz de compétence
            </Link>
          </section>
        </div>
      ) : null}

      {programCompleted ? (
        <div className="w-full px-4 pt-3 sm:px-6 lg:px-8">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-base font-bold text-slate-950">Avis sur la formation</p>
                <p className="mt-1 text-base leading-6 text-slate-600">
                  Laissez une note (étoiles) et un commentaire. Cet avis sera visible par le responsable formation.
                </p>
                {reviewSavedAt ? (
                  <p className="mt-2 text-sm text-slate-500">
                    Dernier enregistrement : {new Date(reviewSavedAt).toLocaleString("fr-FR")}
                  </p>
                ) : null}
              </div>
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-50 text-slate-700">
                <StarIcon className="h-5 w-5" />
              </span>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              {Array.from({ length: 5 }).map((_, i) => {
                const value = i + 1;
                const active = value <= reviewRating;
                return (
                  <button
                    key={`star-${value}`}
                    type="button"
                    onClick={() => setReviewRating(value)}
                    className={[
                      "inline-flex h-11 w-11 items-center justify-center rounded-2xl border transition",
                      active ? "border-amber-300 bg-amber-50 text-amber-600" : "border-slate-200 bg-white text-slate-400 hover:bg-slate-50",
                    ].join(" ")}
                    aria-label={`Noter ${value} étoile${value > 1 ? "s" : ""}`}
                  >
                    <StarIcon className="h-5 w-5" />
                  </button>
                );
              })}
              <span className="ml-1 text-base font-bold text-slate-700">
                {reviewRating > 0 ? `${reviewRating}/5` : "Sélectionnez une note"}
              </span>
            </div>

            <div className="mt-4">
              <label className="mb-2 block text-base font-semibold uppercase tracking-wide text-slate-600">
                Commentaire (optionnel)
              </label>
              <textarea
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base leading-6 text-slate-900 placeholder:text-slate-400 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-200"
                rows={4}
                maxLength={2000}
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                placeholder="Ex. Points forts, points à améliorer, recommandations…"
              />
              <p className="mt-1 text-sm text-slate-500">{reviewNote.length}/2000</p>
            </div>

            <div className="mt-4">
              <PrimaryButton
                onClick={() => void submitProgramReview()}
                loading={reviewSaving}
                loadingLabel="Enregistrement..."
                icon={CheckCircleIcon}
              >
                Enregistrer mon avis
              </PrimaryButton>
            </div>
          </section>
        </div>
      ) : null}

      {error ? (
        <div className="w-full px-4 pt-5 sm:px-6 lg:px-8">
          <AlertBox variant="error">{error}</AlertBox>
        </div>
      ) : null}
      </div>

      <div
        className={cn(
          "grid w-full items-start gap-6 px-4 pb-6 pt-3 sm:px-6 lg:px-8",
          modulesSidebarOpen ? "lg:grid-cols-[380px_minmax(0,1fr)_380px]" : "lg:grid-cols-[minmax(0,1fr)_380px]",
        )}
      >
        {modulesSidebarOpen ? (
          <aside className="hidden flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:sticky lg:top-24 lg:flex">
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-100 p-4 pb-3">
            <div>
              <p className="text-base font-bold text-slate-950">Modules</p>
              <p className="text-base text-slate-500">{player.steps.length} étape{player.steps.length > 1 ? "s" : ""}</p>
            </div>
            <button
              type="button"
              onClick={() => setModulesSidebarOpen(false)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
              aria-label="Fermer les modules"
              title="Fermer les modules"
            >
              <ArrowLeftIcon className="h-4 w-4" />
            </button>
          </div>
          <nav
            className="learning-player-inner-scroll space-y-5 px-4 pb-4 pt-2"
            aria-label="Plan du programme"
          >
            {toc.map((part) => (
              <section key={part.partNumber}>
                <div className="mb-2 px-1">
                  <p className="text-base font-semibold uppercase tracking-wide text-violet-700">Module {part.partNumber}</p>
                  <h2 className="mt-1 text-base font-bold leading-5 text-slate-950">{part.courseTitle}</h2>
                </div>
                <ol className="space-y-1">
                  {part.entries.map(({ step, lessonInPart }) => {
                    const globalIndex = player.steps.indexOf(step);
                    return (
                      <StepPlanItem
                        key={stepKey(step)}
                        step={step}
                        index={globalIndex}
                        lessonInPart={lessonInPart}
                        selected={globalIndex === activeIndex}
                        onSelect={() => {
                          if (step.unlocked) setSelectedStepIndex(globalIndex);
                        }}
                      />
                    );
                  })}
                </ol>
              </section>
            ))}
          </nav>
        </aside>
        ) : null}

        <main className="learning-player-inner-scroll flex min-w-0 flex-col space-y-5">
          <div className="lg:hidden">
            <label htmlFor="step-selector" className="mb-2 block text-base font-semibold uppercase tracking-wide text-slate-500">
              Étape de la formation
            </label>
            <select
              id="step-selector"
              value={activeIndex}
              onChange={(e) => setSelectedStepIndex(Number(e.target.value))}
              className="min-h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-base font-bold text-slate-800 shadow-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-200"
            >
              {player.steps.map((step, index) => (
                <option key={stepKey(step)} value={index} disabled={!step.unlocked}>
                  {index + 1}. {step.title} {!step.unlocked ? "(verrouillé)" : step.stepDone ? "(complété)" : ""}
                </option>
              ))}
            </select>
          </div>

          {selectedStep ? (
            <article key={stepKey(selectedStep)} className="flex flex-col rounded-2xl border border-slate-200 bg-white shadow-sm animate-profile-section">
              <div className={cn("h-1.5 bg-gradient-to-r", tone?.accent)} />
              <header className="border-b border-slate-200 p-5 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <KindPill step={selectedStep} />
                    <StatusPill step={selectedStep} />
                    <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-base font-semibold text-slate-600">
                      Module {partNumber(selectedStep)}
                    </span>
                  </div>
                  <span className="text-base font-bold text-slate-500">
                    Étape {activeIndex + 1} sur {player.steps.length}
                  </span>
                </div>

                <div className="mt-5 flex items-start gap-4">
                  <span className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl", tone?.iconBg, tone?.iconText)}>
                    <SelectedIcon className="h-6 w-6" />
                  </span>
                  <div className="min-w-0">
                    <h2 className="text-3xl font-bold leading-tight text-slate-950">{selectedStep.title}</h2>
                    <p className="mt-2 text-base leading-6 text-slate-600">{partTitle(selectedStep)}</p>
                  </div>
                </div>
              </header>

              <div className="flex-1 p-5 sm:p-6">
                {selectedStep.stepKind === "VIDEO" ? (
                  <div className="space-y-5">
                    {!selectedStep.unlocked ? (
                      <LockedPanel />
                    ) : (
                      <>
                        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 shadow-lg shadow-slate-200">
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
                            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-base font-bold text-slate-700 transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
                          >
                            <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                            {selectedStep.uploadedVideoUrl ? "Ouvrir la vidéo" : "Voir sur YouTube"}
                          </a>

                          {selectedStep.quizStatus === "READY" &&
                          !selectedStep.stepDone &&
                          selectedStep.videoUuid != null ? (
                            <Link
                              to={`${base}/learning-programs/quiz/${player.enrollmentUuid}/${selectedStep.videoUuid}`}
                              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-violet-700 px-5 py-2.5 text-base font-bold text-white shadow-lg shadow-violet-200 transition hover:-translate-y-0.5 hover:bg-violet-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2"
                            >
                              <QuestionMarkCircleIcon className="h-4 w-4" />
                              Passer le quiz
                            </Link>
                          ) : null}

                          {selectedStep.quizStatus === "PENDING" && !selectedStep.stepDone ? (
                            <span className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-orange-200 bg-orange-50 px-4 py-2.5 text-base font-bold text-orange-800">
                              <ArrowPathIcon className="h-4 w-4 animate-spin" />
                              Quiz en génération
                            </span>
                          ) : null}
                        </div>

                        {selectedStep.quizStatus === "FAILED" && selectedStep.uploadedVideoUrl && !selectedStep.stepDone ? (
                          <AlertBox variant="warning">Quiz non disponible pour cette vidéo uploadée.</AlertBox>
                        ) : null}

                        {selectedStep.stepDone ? <CompletedPanel label="Quiz validé" /> : null}
                      </>
                    )}
                  </div>
                ) : null}

                {selectedStep.stepKind === "TEXT" ? (
                  <div className="space-y-5">
                    {!selectedStep.unlocked ? (
                      <LockedPanel />
                    ) : (
                      <>
                        <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:p-7">
                          <div className="prose prose-slate max-w-none prose-headings:text-slate-950 prose-p:leading-7 prose-a:text-violet-700">
                            {selectedStep.textArticleBody?.trim() ? (
                              <LearningMarkdownBody markdown={selectedStep.textArticleBody} />
                            ) : (
                              <p className="text-base italic text-slate-500">Aucun contenu renseigné pour cette lecture.</p>
                            )}
                          </div>
                        </section>

                        {selectedStep.stepDone ? (
                          <CompletedPanel label="Lecture validée" />
                        ) : (
                          <PrimaryButton
                            onClick={() => void markTextRead(selectedStep)}
                            loading={textBusy === selectedStep.textArticleUuid}
                            loadingLabel="Enregistrement..."
                            icon={CheckCircleIcon}
                          >
                            Marquer comme lu
                          </PrimaryButton>
                        )}
                      </>
                    )}
                  </div>
                ) : null}

                {selectedStep.stepKind === "ACTIVITY" ? (
                  <div className="space-y-5">
                    {!selectedStep.unlocked ? (
                      <LockedPanel />
                    ) : (
                      <>
                        <div className="flex flex-wrap gap-2">
                          <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-base font-bold text-emerald-800">
                            {selectedStep.activityKind === "PRACTICAL" ? "Activité pratique" : "Exercice"}
                          </span>
                          <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-base font-bold text-slate-700">
                            {submissionModeLabel(selectedStep.activitySubmissionMode)}
                          </span>
                          {activityTimerTotalSeconds != null && activityTimerSeconds != null ? (
                            <span
                              className={[
                                "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-base font-bold",
                                activityTimerExpired ? "border-rose-200 bg-rose-50 text-rose-700" : "border-slate-200 bg-white text-slate-700",
                              ].join(" ")}
                            >
                              <ClockIcon className="h-4 w-4" />
                              {activityTimerExpired ? "Temps écoulé" : `Temps restant : ${formatTime(activityTimerSeconds)}`}
                            </span>
                          ) : selectedStep.activityEstimatedDuration?.trim() ? (
                            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-base font-bold text-slate-700">
                              <ClockIcon className="h-4 w-4" />
                              Durée estimée : {selectedStep.activityEstimatedDuration}
                            </span>
                          ) : null}
                        </div>

                        {selectedStep.activityInstructions?.trim() ? (
                          <section className="rounded-2xl border border-blue-200 bg-blue-50 p-5 text-base leading-6 text-slate-800">
                            <LearningMarkdownBody markdown={selectedStep.activityInstructions} linkBehavior="download" />
                          </section>
                        ) : null}

                        {selectedStep.activityResourceUrl?.trim() ? (
                          <a
                            href={selectedStep.activityResourceUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-violet-200 bg-violet-50 px-4 py-2.5 text-base font-bold text-violet-800 transition hover:bg-violet-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
                          >
                            <TagIcon className="h-4 w-4" />
                            Ressource / consignes en ligne
                            <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" />
                          </a>
                        ) : null}

                        {selectedStep.stepDone ? (
                          <div className="space-y-4">
                            <CompletedPanel label="Activité validée" />
                            {(selectedStep.activityReviewedAt || selectedStep.activityFinalFeedback || selectedStep.activityFinalScore != null) && (
                              <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <h3 className="text-base font-bold text-emerald-950">Correction du responsable formation</h3>
                                    {selectedStep.activityReviewedAt && (
                                      <p className="mt-1 text-sm text-emerald-800">
                                        Validée le {new Date(selectedStep.activityReviewedAt).toLocaleDateString()}
                                      </p>
                                    )}
                                  </div>
                                  <ClipboardDocumentCheckIcon className="h-5 w-5 shrink-0 text-emerald-700" />
                                </div>

                                {selectedStep.activityFinalScore != null && (
                                  <p className="mt-3 text-base font-bold text-emerald-900">
                                    Score final : {selectedStep.activityFinalScore}
                                    {selectedStep.activityTotalPoints != null ? ` / ${selectedStep.activityTotalPoints}` : ""}{" "}
                                    {selectedStep.activityTotalPoints != null ? "points" : "point(s)"}
                                  </p>
                                )}
                                {selectedStep.activityFinalFeedback?.trim() ? (
                                  <p className="mt-3 whitespace-pre-line text-base leading-6 text-emerald-900">
                                    {selectedStep.activityFinalFeedback}
                                  </p>
                                ) : (
                                  <p className="mt-3 text-base text-emerald-900">Aucun feedback rédigé.</p>
                                )}
                              </section>
                            )}
                          </div>
                        ) : selectedStep.activityUuid != null ? (
                          <section className="rounded-2xl border border-violet-200 bg-violet-50 p-5">
                            <div className="mb-4 flex items-center justify-between gap-3">
                              <div>
                                <h3 className="text-base font-bold text-violet-950">Votre soumission</h3>
                                <p className="mt-1 text-base text-violet-800">Complétez le format demandé pour valider l'étape.</p>
                              </div>
                              <ClipboardDocumentCheckIcon className="h-5 w-5 shrink-0 text-violet-700" />
                            </div>

                            {(selectedStep.activitySubmissionMode ?? "TEXT") === "FILE" ? (
                              <div className="space-y-4">
                                <div className="rounded-2xl border-2 border-dashed border-violet-200 bg-white p-6 text-center transition hover:border-violet-400">
                                  <ClipboardDocumentIcon className="mx-auto h-9 w-9 text-violet-500" />
                                  <p className="mt-3 text-base font-bold text-slate-800">Sélectionnez un fichier à téléverser</p>
                                  <label className="mt-4 inline-flex min-h-11 cursor-pointer items-center justify-center rounded-2xl bg-violet-700 px-5 py-2.5 text-base font-bold text-white transition hover:bg-violet-800 focus-within:ring-2 focus-within:ring-violet-600 focus-within:ring-offset-2">
                                    Choisir un fichier
                                    <input
                                      type="file"
                                      className="sr-only"
                                      disabled={uploadBusy === selectedStep.activityUuid}
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) void uploadFile(selectedStep.activityUuid!, file);
                                        e.target.value = "";
                                      }}
                                    />
                                  </label>
                                  {uploadBusy === selectedStep.activityUuid ? (
                                    <p className="mt-3 inline-flex items-center gap-2 text-base font-bold text-violet-700">
                                      <ArrowPathIcon className="h-3.5 w-3.5 animate-spin" />
                                      Téléversement en cours...
                                    </p>
                                  ) : null}
                                  {getDraft(selectedStep.activityUuid).fileUrl ? (
                                    <p className="mt-3 inline-flex items-center gap-2 text-base font-bold text-emerald-700">
                                      <CheckCircleIcon className="h-3.5 w-3.5" />
                                      Fichier prêt pour validation
                                    </p>
                                  ) : null}
                                </div>

                                <div>
                                  <label className="mb-2 block text-base font-semibold uppercase tracking-wide text-slate-600">
                                    Commentaire optionnel
                                  </label>
                                  <textarea
                                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base leading-6 text-slate-900 placeholder:text-slate-400 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-200"
                                    rows={3}
                                    value={getDraft(selectedStep.activityUuid).text}
                                    onChange={(e) => setDraft(selectedStep.activityUuid!, { text: e.target.value })}
                                    placeholder="Ajoutez un commentaire si besoin..."
                                  />
                                </div>
                              </div>
                            ) : null}

                            {(selectedStep.activitySubmissionMode ?? "TEXT") === "TEXT" ? (
                              <div>
                                <label className="mb-2 block text-base font-semibold uppercase tracking-wide text-slate-600">Votre réponse</label>
                                <textarea
                                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-base leading-6 text-slate-900 placeholder:text-slate-400 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-200"
                                  rows={8}
                                  value={getDraft(selectedStep.activityUuid).text}
                                  onChange={(e) => setDraft(selectedStep.activityUuid!, { text: e.target.value })}
                                  placeholder="Rédigez votre réponse ici..."
                                />
                              </div>
                            ) : null}

                            {(selectedStep.activitySubmissionMode ?? "TEXT") === "CODE" ? (
                              <div>
                                <label className="mb-2 block text-base font-semibold uppercase tracking-wide text-slate-600">
                                  Code ou contenu technique
                                </label>
                                <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 shadow-lg">
                                  <div className="flex items-center gap-2 border-b border-slate-800 bg-slate-900 px-4 py-2">
                                    <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                                    <span className="h-2.5 w-2.5 rounded-full bg-orange-400" />
                                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                                    <span className="ml-2 text-base font-bold text-slate-400">submission.ts</span>
                                  </div>
                                  <textarea
                                    className="w-full bg-slate-950 px-4 py-4 font-mono text-base leading-6 text-emerald-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-violet-500"
                                    rows={12}
                                    spellCheck={false}
                                    value={getDraft(selectedStep.activityUuid).text}
                                    onChange={(e) => setDraft(selectedStep.activityUuid!, { text: e.target.value })}
                                    placeholder="// Collez votre code ici..."
                                  />
                                </div>
                              </div>
                            ) : null}

                            <div className="mt-5">
                              <PrimaryButton
                                onClick={() => void submitActivity(selectedStep)}
                                loading={activityBusy === selectedStep.activityUuid}
                                loadingLabel="Validation en cours..."
                                icon={CheckCircleIcon}
                              >
                                Valider l'activité
                              </PrimaryButton>
                            </div>
                          </section>
                        ) : null}
                      </>
                    )}
                  </div>
                ) : null}
              </div>

              <footer className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                <SecondaryButton
                  icon={ArrowLeftIcon}
                  disabled={prevUnlockedIndex == null}
                  onClick={() => {
                    if (prevUnlockedIndex != null) setSelectedStepIndex(prevUnlockedIndex);
                  }}
                >
                  Précédent
                </SecondaryButton>

                <SecondaryButton
                  disabled={nextUnlockedIndex == null}
                  onClick={() => {
                    if (nextUnlockedIndex != null) setSelectedStepIndex(nextUnlockedIndex);
                  }}
                  className="sm:ml-auto"
                >
                  Suivant
                  <ChevronRightIcon className="h-4 w-4" />
                </SecondaryButton>
              </footer>
            </article>
          ) : null}
        </main>

        {selectedStep ? (
          <aside className="learning-player-inner-scroll flex flex-col space-y-4 lg:sticky lg:top-24">
            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <span className={cn("flex h-10 w-10 items-center justify-center rounded-2xl", tone?.iconBg, tone?.iconText)}>
                  <SelectedIcon className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-950">Focus étape</h3>
                  <p className="text-base text-slate-500">{stepKindLabel(selectedStep)}</p>
                </div>
              </div>
              <p className="mt-4 text-base leading-6 text-slate-600">
                {selectedStep.stepKind === "TEXT"
                  ? "Lisez le contenu puis confirmez la lecture pour débloquer la suite."
                  : selectedStep.stepKind === "VIDEO"
                    ? "Regardez la vidéo puis lancez le quiz associé dès qu'il est disponible."
                    : "Suivez les consignes, préparez votre soumission et validez l'activité."}
              </p>
            </section>

            <section
              className={cn(
                "rounded-2xl border p-5 shadow-sm",
                selectedStep.unlocked ? "border-emerald-200 bg-emerald-50" : "border-orange-200 bg-orange-50",
              )}
            >
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white shadow-sm">
                  {selectedStep.unlocked ? (
                    <CheckCircleIcon className="h-5 w-5 text-emerald-700" />
                  ) : (
                    <LockClosedIcon className="h-5 w-5 text-orange-700" />
                  )}
                </span>
                <div>
                  <h3 className={cn("text-base font-bold", selectedStep.unlocked ? "text-emerald-950" : "text-orange-950")}>
                    Accès
                  </h3>
                  <p className={cn("text-base font-bold", selectedStep.unlocked ? "text-emerald-700" : "text-orange-700")}>
                    {selectedStep.unlocked ? "Disponible" : "Verrouillé"}
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-base font-bold text-slate-950">Ressources</h3>
              <div className="mt-4 space-y-2">
                {selectedStep.stepKind === "VIDEO" ? (
                  <a
                    href={selectedStep.uploadedVideoUrl ?? `https://www.youtube.com/watch?v=${selectedStep.youtubeVideoId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex min-h-11 items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-base font-bold text-slate-700 transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                  >
                    <span className="flex items-center gap-2">
                      <PlayCircleIcon className="h-4 w-4" />
                      Vidéo source
                    </span>
                    <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" />
                  </a>
                ) : null}

                {selectedStep.activityResourceUrl?.trim() ? (
                  <a
                    href={selectedStep.activityResourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex min-h-11 items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-base font-bold text-slate-700 transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                  >
                    <span className="flex items-center gap-2">
                      <DocumentTextIcon className="h-4 w-4" />
                      Document associé
                    </span>
                    <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" />
                  </a>
                ) : null}

                {selectedStep.stepKind === "VIDEO" && selectedStep.quizStatus === "READY" && selectedStep.videoUuid != null ? (
                  <Link
                    to={`${base}/learning-programs/quiz/${player.enrollmentUuid}/${selectedStep.videoUuid}`}
                    className="flex min-h-11 items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-base font-bold text-slate-700 transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                  >
                    <span className="flex items-center gap-2">
                      <QuestionMarkCircleIcon className="h-4 w-4" />
                      Quiz vidéo
                    </span>
                    <ChevronRightIcon className="h-4 w-4" />
                  </Link>
                ) : null}

                {selectedStep.stepKind !== "VIDEO" && !selectedStep.activityResourceUrl?.trim() ? (
                  <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-4 text-center text-base text-slate-500">
                    Aucune ressource additionnelle
                  </p>
                ) : null}
              </div>
            </section>

            <section className="mt-auto rounded-2xl border border-violet-200 bg-white p-5 shadow-sm">
              <p className="text-base font-semibold uppercase tracking-wide text-violet-700">Prochaine étape</p>
              {nextUnlockedIndex != null ? (
                <button
                  type="button"
                  onClick={() => setSelectedStepIndex(nextUnlockedIndex)}
                  className="mt-3 w-full rounded-2xl bg-violet-50 p-4 text-left transition hover:bg-violet-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                >
                  <p className="text-base font-bold leading-5 text-slate-950">{player.steps[nextUnlockedIndex]?.title}</p>
                  <p className="mt-2 flex items-center gap-2 text-base font-bold text-violet-700">
                    {stepKindLabel(player.steps[nextUnlockedIndex]!)}
                    <ChevronRightIcon className="h-3.5 w-3.5" />
                  </p>
                </button>
              ) : (
                <p className="mt-3 rounded-2xl bg-slate-50 p-4 text-base leading-6 text-slate-600">Vous êtes sur la dernière étape débloquée.</p>
              )}
            </section>
          </aside>
        ) : null}
      </div>
    </div>
  );
}
