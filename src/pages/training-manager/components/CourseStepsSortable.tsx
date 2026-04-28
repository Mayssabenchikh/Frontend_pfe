import { useMemo, type ReactNode } from "react";
import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Bars3Icon,
  BookOpenIcon,
  ClipboardDocumentListIcon,
  PlayCircleIcon,
} from "../../../icons/heroicons/outline";
import type { CourseStepOrderItem, LearningActivityDetail, LearningCourseDetail, QuizGenerationStatus } from "../../../api/learningProgramApi";
import { youtubeThumbUrl } from "../utils/youtube";

type StepKind = CourseStepOrderItem["kind"];

export type MergedCourseStep = {
  dndId: string;
  kind: StepKind;
  uuid: string;
  title: string;
  sortOrder: number;
  /** Vidéo uniquement */
  youtubeVideoId?: string;
  thumbnailUrl?: string | null;
  quizStatus?: QuizGenerationStatus;
  activityKind?: LearningActivityDetail["kind"];
};

function typeRank(k: StepKind): number {
  if (k === "VIDEO") return 0;
  if (k === "TEXT") return 1;
  return 2;
}

export function mergeCourseSteps(course: LearningCourseDetail): MergedCourseStep[] {
  const rows: MergedCourseStep[] = [];
  for (const v of course.videos) {
    rows.push({
      dndId: `VIDEO:${v.uuid}`,
      kind: "VIDEO",
      uuid: v.uuid,
      title: v.title,
      sortOrder: v.sortOrder,
      youtubeVideoId: v.youtubeVideoId,
      thumbnailUrl: v.thumbnailUrl,
      quizStatus: v.quizStatus,
    });
  }
  for (const t of course.textArticles ?? []) {
    rows.push({
      dndId: `TEXT:${t.uuid}`,
      kind: "TEXT",
      uuid: t.uuid,
      title: t.title,
      sortOrder: t.sortOrder,
    });
  }
  for (const a of course.activities) {
    rows.push({
      dndId: `ACTIVITY:${a.uuid}`,
      kind: "ACTIVITY",
      uuid: a.uuid,
      title: a.title,
      sortOrder: a.sortOrder,
      activityKind: a.kind,
    });
  }
  rows.sort((x, y) => x.sortOrder - y.sortOrder || typeRank(x.kind) - typeRank(y.kind));
  return rows;
}

function KindBadge({ kind }: { kind: StepKind }) {
  if (kind === "VIDEO") {
    return (
      <span className="rounded-md bg-sky-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-sky-900 ring-1 ring-sky-200/80">
        Vidéo
      </span>
    );
  }
  if (kind === "TEXT") {
    return (
      <span className="rounded-md bg-indigo-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-indigo-900 ring-1 ring-indigo-200/80">
        Lecture
      </span>
    );
  }
  return (
    <span className="rounded-md bg-teal-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-teal-900 ring-1 ring-teal-200/80">
      Activité
    </span>
  );
}

function QuizMini({ status }: { status: QuizGenerationStatus }) {
  const map: Record<QuizGenerationStatus, string> = {
    PENDING: "text-amber-800 bg-amber-50 ring-amber-200",
    READY: "text-emerald-800 bg-emerald-50 ring-emerald-200",
    FAILED: "text-rose-800 bg-rose-50 ring-rose-200",
  };
  const labels: Record<QuizGenerationStatus, string> = {
    PENDING: "Quiz",
    READY: "Quiz prêt",
    FAILED: "Quiz",
  };
  return (
    <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ring-1 ${map[status]}`}>{labels[status]}</span>
  );
}

function SortableStepRow({
  step,
  disabled,
  children,
}: {
  step: MergedCourseStep;
  disabled: boolean;
  children: ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: step.dndId,
    disabled,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 20 : undefined,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-stretch gap-3 rounded-2xl border border-slate-200/90 bg-gradient-to-r from-white to-slate-50/90 p-3 shadow-sm ring-slate-900/5 transition-shadow ${
        isDragging ? "scale-[1.01] opacity-95 shadow-lg ring-2 ring-violet-400/60" : "hover:border-slate-300 hover:shadow-md"
      }`}
    >
      <button
        type="button"
        className="flex w-10 shrink-0 cursor-grab touch-none items-center justify-center text-slate-400 transition-colors hover:text-violet-700 active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-40"
        disabled={disabled}
        aria-label="Glisser pour réordonner"
        {...attributes}
        {...listeners}
      >
        <Bars3Icon className="h-4 w-4" />
      </button>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

type Props = {
  course: LearningCourseDetail;
  disabled: boolean;
  onReorder: (steps: CourseStepOrderItem[]) => Promise<void>;
};

export function CourseStepsSortable({ course, disabled, onReorder }: Props) {
  const merged = useMemo(() => mergeCourseSteps(course), [course]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = merged.findIndex((s) => s.dndId === active.id);
    const newIndex = merged.findIndex((s) => s.dndId === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const next = arrayMove(merged, oldIndex, newIndex);
    const steps: CourseStepOrderItem[] = next.map((s, i) => ({
      kind: s.kind,
      uuid: s.uuid,
      sortOrder: i,
    }));
    await onReorder(steps);
  };

  if (merged.length === 0) {
    return (
      <div className="tm-empty-state bg-gradient-to-b from-slate-50 to-white px-5 py-12">
        <p className="text-sm font-semibold text-slate-800">Aucune étape dans ce module</p>
        <p className="mx-auto mt-2 max-w-sm text-xs leading-relaxed text-slate-600">
          Ajoutez des vidéos, des lectures ou des activités — puis ordonnez-les dans cette liste.
        </p>
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => void handleDragEnd(e)}>
      <SortableContext items={merged.map((s) => s.dndId)} strategy={verticalListSortingStrategy}>
        <ol className="space-y-2.5">
          {merged.map((step, index) => (
            <li key={step.dndId}>
              <SortableStepRow step={step} disabled={disabled}>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-600 ring-1 ring-slate-200">
                    {index + 1}
                  </span>
                  {step.kind === "VIDEO" && step.youtubeVideoId && (
                    <img
                      src={step.thumbnailUrl || youtubeThumbUrl(step.youtubeVideoId)}
                      alt=""
                      className="h-11 w-[4.5rem] shrink-0 rounded-lg object-cover ring-1 ring-slate-200/80"
                    />
                  )}
                  {step.kind === "TEXT" && (
                    <div className="flex h-11 w-[4.5rem] shrink-0 items-center justify-center rounded-lg bg-indigo-100 ring-1 ring-indigo-200/80">
                      <BookOpenIcon className="h-5 w-5 text-indigo-700" />
                    </div>
                  )}
                  {step.kind === "ACTIVITY" && (
                    <div className="flex h-11 w-[4.5rem] shrink-0 items-center justify-center rounded-lg bg-teal-100 ring-1 ring-teal-200/80">
                      <ClipboardDocumentListIcon className="h-5 w-5 text-teal-800" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <KindBadge kind={step.kind} />
                      {step.kind === "VIDEO" && step.quizStatus && <QuizMini status={step.quizStatus} />}
                      {step.kind === "VIDEO" && (
                        <PlayCircleIcon className="hidden h-4 w-4 text-slate-400 sm:inline" aria-hidden />
                      )}
                      {step.kind === "ACTIVITY" && step.activityKind && (
                        <span className="text-[10px] font-semibold uppercase text-teal-700">
                          {step.activityKind === "PRACTICAL" ? "Pratique" : "Exercice"}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-sm font-semibold text-slate-900">{step.title}</p>
                  </div>
                </div>
              </SortableStepRow>
            </li>
          ))}
        </ol>
      </SortableContext>
    </DndContext>
  );
}
