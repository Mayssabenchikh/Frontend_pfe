import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { skillsApi } from "../../api/skillsApi";
import type { SkillDto } from "../admin/types";
import type { ProjectDto } from "../../api/projectsApi";

type Props = {
  onClose: () => void;
  onSubmit: (data: { name: string; description?: string; status?: string; priority?: string; teamSize?: number; startDate?: string; dueDate?: string; requirements?: { skillId: number; levelMin: number }[] }) => Promise<void>;
  initialProject?: ProjectDto | null;
  leadAvatarUrl?: string | null;
  leadName?: string | null;
  leadEmail?: string | null;
};

/** Segmented level picker — 5 dots, filled up to levelMin */
function LevelPicker({
  value,
  min,
  max,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  const total = 5;
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: total }).map((_, i) => {
        const level = i + 1;
        const active = level <= value;
        const inRange = level >= min && level <= max;
        return (
          <button
            key={i}
            type="button"
            disabled={!inRange}
            onClick={() => inRange && onChange(level)}
            title={`Niveau ${level}`}
            className={[
              "h-2 w-4 rounded-full transition-all duration-150",
              active
                ? "bg-gradient-to-r from-indigo-500 to-violet-500 shadow-sm"
                : inRange
                ? "bg-slate-200 hover:bg-slate-300"
                : "bg-slate-100 opacity-40 cursor-not-allowed",
            ].join(" ")}
          />
        );
      })}
      <span className="ml-1 text-[11px] font-semibold text-slate-500 w-3">{value}</span>
    </div>
  );
}

/** Category color dot */
function CategoryDot({ name }: { name?: string }) {
  const colors: Record<string, string> = {
    default: "bg-violet-400",
    tech: "bg-indigo-400",
    design: "bg-pink-400",
    data: "bg-amber-400",
    management: "bg-emerald-400",
    communication: "bg-sky-400",
  };
  const key = name?.toLowerCase().trim() ?? "default";
  const found = Object.keys(colors).find((k) => key.includes(k));
  return (
    <span
      className={[
        "inline-block h-2 w-2 rounded-full flex-shrink-0",
        colors[found ?? "default"],
      ].join(" ")}
    />
  );
}

export function CreateProjectModal({ onClose, onSubmit, initialProject, leadAvatarUrl, leadName, leadEmail }: Props) {
  const isEdit = !!initialProject;
  const [name, setName] = useState(initialProject?.name ?? "");
  const [description, setDescription] = useState(initialProject?.description ?? "");
  const [status, setStatus] = useState(initialProject?.status ?? "DRAFT");
  const [priority, setPriority] = useState(initialProject?.priority ?? "MEDIUM");
  const [teamSize, setTeamSize] = useState(initialProject?.teamSize ?? 1);
  const [startDate, setStartDate] = useState(initialProject?.startDate ?? "");
  const [dueDate, setDueDate] = useState(initialProject?.dueDate ?? "");
  const [skills, setSkills] = useState<SkillDto[]>([]);
  const [requirements, setRequirements] = useState<{ skillId: number; levelMin: number }[]>(
    initialProject?.requirements?.map((r) => ({ skillId: r.skillId, levelMin: r.levelMin })) ?? []
  );
  const [loading, setLoading] = useState(false);
  const [dateError, setDateError] = useState<string | null>(null);

  const createdAtISO = useMemo(() => {
    const todayISO = new Date().toISOString().slice(0, 10);
    const raw = initialProject?.createdAt ? String(initialProject.createdAt) : "";
    const datePart = raw ? raw.slice(0, 10) : "";
    return /^\d{4}-\d{2}-\d{2}$/.test(datePart) ? datePart : todayISO;
  }, [initialProject?.createdAt]);

  const minDueDateISO = useMemo(() => {
    if (!startDate) return "";
    const d = new Date(startDate);
    if (Number.isNaN(d.getTime())) return "";
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  }, [startDate]);

  const validateDates = (s?: string, d?: string) => {
    const start = s ? new Date(s) : null;
    const due = d ? new Date(d) : null;
    const created = new Date(createdAtISO);

    if (start && Number.isNaN(start.getTime())) return "La date de début est invalide.";
    if (due && Number.isNaN(due.getTime())) return "La date de fin est invalide.";

    if (start && start < created) {
      return `La date de début doit être ≥ la date de création (${createdAtISO}).`;
    }

    if (due && !start) {
      return "Veuillez d’abord renseigner la date de début avant la date de fin.";
    }

    if (start && due && !(due > start)) {
      return "La date de fin doit être strictement supérieure à la date de début (au moins +1 jour).";
    }

    return null;
  };

  useEffect(() => {
    skillsApi.listSkills().then((r) => setSkills(r.data ?? [])).catch(() => {});
  }, []);

  const addRequirement = () => {
    const used = new Set(requirements.map((r) => r.skillId));
    const skill = skills.find((s) => !used.has(s.id));
    if (!skill) return;
    setRequirements((prev) => [...prev, { skillId: skill.id, levelMin: skill.levelMin }]);
  };

  const removeRequirement = (skillId: number) => {
    setRequirements((prev) => prev.filter((x) => x.skillId !== skillId));
  };

  const setReqLevel = (skillId: number, levelMin: number) => {
    setRequirements((prev) =>
      prev.map((x) => (x.skillId === skillId ? { ...x, levelMin } : x))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const err = validateDates(startDate || undefined, dueDate || undefined);
    setDateError(err);
    if (err) return;
    setLoading(true);
    onSubmit({
      name: name.trim(),
      description: description.trim() || undefined,
      status: status || "DRAFT",
      priority,
      teamSize,
      startDate: startDate || undefined,
      dueDate: dueDate || undefined,
      requirements: requirements.length ? requirements : undefined,
    })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const modalContent = (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/40 px-4">
      <div className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl">
        {/* Header */}
        <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              {isEdit ? "Modifier le projet" : "Nouveau projet"}
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              {isEdit
                ? "Mettez à jour les informations du projet."
                : "Renseignez les détails du nouveau projet."}
            </p>
          </div>
          {(initialProject || leadAvatarUrl || leadName || leadEmail) && (
            <div className="flex items-center gap-2">
              {leadAvatarUrl ? (
                <img
                  src={leadAvatarUrl}
                  alt={initialProject?.leadName || initialProject?.leadEmail || leadName || leadEmail || ""}
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-[11px] font-semibold text-white">
                  {(
                    initialProject?.leadName ||
                    initialProject?.leadEmail ||
                    leadName ||
                    leadEmail ||
                    "?"
                  )
                    .split(" ")
                    .map((part) => part[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
              )}
              <div className="hidden sm:block">
                <p className="text-xs font-semibold text-slate-800 truncate max-w-[120px]">
                  {initialProject?.leadName || leadName || "—"}
                </p>
                <p className="text-[11px] text-slate-400">Lead du projet</p>
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {/* Nom */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">
              Nom du projet
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex. Atlas V2"
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-200"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brève description du projet…"
              rows={3}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-200"
            />
          </div>

          {/* Statut */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">Statut</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-200"
            >
              <option value="DRAFT">Brouillon</option>
              <option value="ACTIVE">En cours</option>
              <option value="CLOSED">Clôturé</option>
            </select>
          </div>

          {/* Priorité + Taille */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">Priorité</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-200"
              >
                <option value="LOW">Basse</option>
                <option value="MEDIUM">Moyenne</option>
                <option value="HIGH">Haute</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">Taille équipe</label>
              <input
                type="number"
                min={1}
                value={teamSize}
                onChange={(e) => setTeamSize(Math.max(1, Number(e.target.value) || 1))}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-200"
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">Date de début</label>
              <input
                type="date"
                value={startDate || ""}
                min={createdAtISO}
                onChange={(e) => {
                  const next = e.target.value;
                  setStartDate(next);
                  setDateError(validateDates(next || undefined, dueDate || undefined));
                }}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-200"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">Date de fin</label>
              <input
                type="date"
                value={dueDate || ""}
                min={minDueDateISO || undefined}
                onChange={(e) => {
                  const next = e.target.value;
                  setDueDate(next);
                  setDateError(validateDates(startDate || undefined, next || undefined));
                }}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-200"
              />
            </div>
          </div>
          {dateError && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
              {dateError}
            </div>
          )}

          {/* ── COMPÉTENCES REQUISES ── */}
          <div>
            {/* Section header */}
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-5 w-5 items-center justify-center rounded-md bg-gradient-to-br from-indigo-100 to-violet-100">
                  {/* spark icon */}
                  <svg className="h-3 w-3 text-violet-600" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M8 1l1.5 4.5H14l-3.5 2.5 1.5 4.5L8 10l-4 2.5 1.5-4.5L2 5.5h4.5z" />
                  </svg>
                </div>
                <span className="text-xs font-semibold text-slate-700">Compétences requises</span>
                {requirements.length > 0 && (
                  <span className="inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-violet-100 px-1.5 text-[10px] font-bold text-violet-700">
                    {requirements.length}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={addRequirement}
                disabled={skills.length === 0 || requirements.length >= skills.length}
                className="group flex items-center gap-1 rounded-lg border border-dashed border-slate-300 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-500 transition-all hover:border-violet-400 hover:bg-violet-50 hover:text-violet-700 disabled:pointer-events-none disabled:opacity-40"
              >
                <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 1v10M1 6h10" strokeLinecap="round" />
                </svg>
                Ajouter
              </button>
            </div>

            {/* List */}
            <div className="space-y-2">
              {requirements.map((r) => {
                const skill = skills.find((s) => s.id === r.skillId);
                const usedIds = new Set(requirements.map((req) => req.skillId));
                usedIds.delete(r.skillId);

                return (
                  <div
                    key={r.skillId}
                    className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-50 to-white p-3 transition-shadow hover:shadow-sm hover:border-slate-300"
                  >
                    {/* Row number badge */}
                    <span className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl bg-gradient-to-b from-indigo-400 to-violet-500" />

                    <div className="pl-2 flex flex-col gap-2.5">
                      {/* Top row: skill select + remove */}
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 flex-1 min-w-0">
                          <CategoryDot name={skill?.categoryName} />
                          <select
                            value={r.skillId}
                            onChange={(e) => {
                              const sid = Number(e.target.value);
                              setRequirements((prev) => {
                                const rest = prev.filter((x) => x.skillId !== r.skillId);
                                const s = skills.find((x) => x.id === sid);
                                return [...rest, { skillId: sid, levelMin: s ? s.levelMin : 1 }];
                              });
                            }}
                            className="flex-1 min-w-0 truncate rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-800 focus:border-violet-400 focus:outline-none focus:ring-1 focus:ring-violet-200"
                          >
                            {skills
                              .filter((s) => !usedIds.has(s.id))
                              .map((s) => (
                                <option key={s.id} value={s.id}>
                                  {s.name} — {s.categoryName}
                                </option>
                              ))}
                          </select>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeRequirement(r.skillId)}
                          className="flex-shrink-0 flex h-6 w-6 items-center justify-center rounded-lg text-slate-300 transition-colors hover:bg-rose-50 hover:text-rose-500"
                          title="Supprimer"
                        >
                          <svg viewBox="0 0 12 12" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M1 1l10 10M11 1L1 11" strokeLinecap="round" />
                          </svg>
                        </button>
                      </div>

                      {/* Bottom row: level label + dot picker */}
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-slate-400 font-medium">
                          Niveau minimum requis
                        </span>
                        <LevelPicker
                          value={r.levelMin}
                          min={skill?.levelMin ?? 1}
                          max={skill?.levelMax ?? 5}
                          onChange={(v) => setReqLevel(r.skillId, v)}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Empty state */}
              {requirements.length === 0 && (
                <button
                  type="button"
                  onClick={addRequirement}
                  disabled={skills.length === 0}
                  className="w-full flex flex-col items-center gap-2 rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 py-5 text-center transition-colors hover:border-violet-300 hover:bg-violet-50/40 disabled:pointer-events-none disabled:opacity-50"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white shadow-sm border border-slate-100">
                    <svg className="h-4 w-4 text-slate-400" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <circle cx="8" cy="8" r="6" />
                      <path d="M8 5v6M5 8h6" strokeLinecap="round" />
                    </svg>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    Aucune compétence — <span className="text-violet-500 font-medium">cliquez pour en ajouter</span>
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim() || !!dateError}
              className="rounded-xl bg-gradient-to-r from-indigo-700 to-violet-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:shadow-md disabled:opacity-60"
            >
              {loading ? (isEdit ? "Enregistrement..." : "Création...") : isEdit ? "Enregistrer" : "Créer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  if (typeof document === "undefined") return modalContent;
  return createPortal(modalContent, document.body);
}