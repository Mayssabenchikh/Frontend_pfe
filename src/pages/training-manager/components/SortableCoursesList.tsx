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
import { Bars3Icon } from "../../../icons/heroicons/outline";
import type { LearningCourseDetail } from "../../../api/learningProgramApi";

function SortableRow({
  course,
  disabled,
  selected,
  children,
}: {
  course: LearningCourseDetail;
  disabled: boolean;
  selected: boolean;
  children: ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: course.uuid,
    disabled,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-stretch gap-2 border bg-white/95 p-3.5 shadow-[0_2px_8px_rgba(15,23,42,0.04)] ring-1 transition-shadow ${
        isDragging ? "scale-[1.01] opacity-95 shadow-lg ring-2 ring-violet-400/50" : "hover:border-slate-300/90 hover:shadow-md"
      } ${selected ? "rounded-3xl border-violet-300/90 ring-violet-200/80" : "rounded-2xl border-slate-200/70 ring-slate-900/[0.02]"
      }`}
    >
      <button
        type="button"
        className="flex w-9 shrink-0 cursor-grab touch-none items-center justify-center rounded-lg border border-slate-100 bg-slate-50 text-slate-400 hover:bg-slate-100 active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-40"
        disabled={disabled}
        aria-label="Réordonner le module"
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
  courses: LearningCourseDetail[];
  disabled: boolean;
  selectedCourseUuid: string | null;
  onSelectCourse: (uuid: string) => void;
  onReorder: (orderedUuids: string[]) => Promise<void>;
  onRenameCourse: (courseUuid: string, title: string) => Promise<void>;
};

export function SortableCoursesList({
  courses,
  disabled,
  selectedCourseUuid,
  onSelectCourse,
  onReorder,
  onRenameCourse,
}: Props) {
  const sorted = useMemo(() => [...courses].sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title)), [courses]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = sorted.findIndex((c) => c.uuid === active.id);
    const newIndex = sorted.findIndex((c) => c.uuid === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const next = arrayMove(sorted, oldIndex, newIndex);
    await onReorder(next.map((c) => c.uuid));
  };

  if (sorted.length === 0) {
    return (
      <div className="tm-empty-state px-5 py-10">
        <p className="text-sm font-medium text-slate-700">Aucun module</p>
        <p className="mt-1 text-xs text-slate-500">Ajoutez un premier module avec le champ ci-dessous.</p>
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => void handleDragEnd(e)}>
      <SortableContext items={sorted.map((c) => c.uuid)} strategy={verticalListSortingStrategy}>
        <ul className="space-y-2">
          {sorted.map((c) => (
            <li key={c.uuid}>
              <SortableRow course={c} disabled={disabled} selected={selectedCourseUuid === c.uuid}>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <label className="flex min-w-0 flex-1 flex-col gap-1 text-xs font-medium uppercase tracking-wide text-slate-500">
                    Titre du module
                    <input
                      defaultValue={c.title}
                      key={c.uuid + c.title}
                      disabled={disabled}
                      onBlur={(e) => {
                        const v = e.target.value.trim();
                        if (v && v !== c.title) void onRenameCourse(c.uuid, v);
                      }}
                      className="tm-input rounded-lg font-normal normal-case"
                    />
                  </label>
                  <label
                    className={`inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold transition ${
                      selectedCourseUuid === c.uuid
                        ? "border-violet-300 bg-violet-50 text-violet-800"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="activeCourse"
                      checked={selectedCourseUuid === c.uuid}
                      onChange={() => onSelectCourse(c.uuid)}
                      className="h-4 w-4 accent-violet-600"
                    />
                    {selectedCourseUuid === c.uuid ? "Module sélectionné" : "Sélectionner ce module"}
                  </label>
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  {c.videos.length} vidéo(s) · {(c.textArticles?.length ?? 0)} texte(s) · {(c.activities?.length ?? 0)} activité(s)
                </p>
              </SortableRow>
            </li>
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}
