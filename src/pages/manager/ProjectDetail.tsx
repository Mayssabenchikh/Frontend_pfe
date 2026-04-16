import { useEffect, useState } from "react";
import { useParams, useNavigate, useOutletContext } from "react-router-dom";
import {
  ArrowLeftIcon,
  CalendarDaysIcon,
  PencilSquareIcon,
  PlusIcon,
  UserCircleIcon,
  XMarkIcon,
  SparklesIcon,
} from "../../icons/heroicons/outline";
import { toast } from "sonner";
import { projectsApi, type ProjectDto } from "../../api/projectsApi";
import { skillsApi } from "../../api/skillsApi";
import type { SkillDto } from "../admin/types";

type ManagerOutletContext = {
  managerAvatarUrl: string | null;
  managerName: string;
  managerEmail: string | null;
  currentPath: string;
};

export function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const outletCtx = useOutletContext<ManagerOutletContext | null>();
  const managerAvatarUrl = outletCtx?.managerAvatarUrl ?? null;
  const managerName = outletCtx?.managerName ?? "";
  const managerEmail = outletCtx?.managerEmail ?? null;
  const [project, setProject] = useState<ProjectDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [skills, setSkills] = useState<SkillDto[]>([]);
  const [form, setForm] = useState({
    name: "",
    description: "",
    status: "DRAFT",
    priority: "MEDIUM",
    teamSize: 1,
    startDate: "",
    dueDate: "",
    requirements: [] as { skillId: number; levelMin: number }[],
  });

  const hydrateForm = (p: ProjectDto) => {
    setForm({
      name: p.name ?? "",
      description: p.description ?? "",
      status: p.status ?? "DRAFT",
      priority: p.priority ?? "MEDIUM",
      teamSize: Math.max(1, p.teamSize ?? 1),
      startDate: p.startDate ?? "",
      dueDate: p.dueDate ?? "",
      requirements: (p.requirements ?? []).map((r) => ({
        skillId: r.skillId,
        levelMin: r.levelMin,
      })),
    });
  };

  useEffect(() => {
    const numId = id ? parseInt(id, 10) : NaN;
    if (isNaN(numId)) {
      setError("ID invalide");
      setLoading(false);
      return;
    }
    projectsApi
      .get(numId)
      .then((res) => {
        const data = res.data ?? null;
        setProject(data);
        if (data) hydrateForm(data);
        setError(null);
      })
      .catch(() => {
        setError("Projet non trouvé");
        setProject(null);
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!isEditing || skills.length > 0) return;
    skillsApi
      .listSkills()
      .then((res) => setSkills(res.data ?? []))
      .catch(() => {});
  }, [isEditing, skills.length]);

  if (loading) return <div className="p-6 text-slate-500">Chargement...</div>;
  if (error || !project)
    return <div className="p-6 text-red-500">{error ?? "Projet non trouvé"}</div>;

  const numId = id ? parseInt(id, 10) : NaN;

  const formatDate = (value?: string | null) => {
    if (!value) return "—";
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("fr-FR");
  };

  const createdAtISO = (() => {
    const raw = project?.createdAt ? String(project.createdAt) : "";
    const datePart = raw ? raw.slice(0, 10) : "";
    return /^\d{4}-\d{2}-\d{2}$/.test(datePart) ? datePart : new Date().toISOString().slice(0, 10);
  })();

  const minDueDateISO = (() => {
    if (!form.startDate) return "";
    const d = new Date(form.startDate);
    if (Number.isNaN(d.getTime())) return "";
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  })();

  const validateDates = () => {
    const created = new Date(createdAtISO);
    const start = form.startDate ? new Date(form.startDate) : null;
    const due = form.dueDate ? new Date(form.dueDate) : null;

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

  const statusMeta = (status?: string | null) => {
    if (status === "ACTIVE")
      return {
        label: "En cours",
        dot: "bg-blue-500",
        cls: "bg-blue-50 text-blue-700 border-blue-200",
      };
    if (status === "CLOSED")
      return {
        label: "Terminé",
        dot: "bg-emerald-500",
        cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
      };
    return {
      label: "Brouillon",
      dot: "bg-slate-400",
      cls: "bg-slate-100 text-slate-600 border-slate-200",
    };
  };

  const priorityMeta = (priority?: string | null) => {
    if (priority === "HIGH")
      return {
        label: "Haute",
        icon: "▲",
        cls: "bg-rose-50 text-rose-700 border-rose-200",
      };
    if (priority === "LOW")
      return {
        label: "Basse",
        icon: "▼",
        cls: "bg-slate-100 text-slate-600 border-slate-200",
      };
    return {
      label: "Moyenne",
      icon: "●",
      cls: "bg-violet-50 text-violet-700 border-violet-200",
    };
  };

  const currentStatus = statusMeta(project.status);
  const currentPriority = priorityMeta(project.priority);

  const source =
    project.leadName ||
    project.leadEmail ||
    managerName ||
    managerEmail ||
    "?";
  const leadInitials = source
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleCancelEdit = () => {
    hydrateForm(project);
    setIsEditing(false);
  };

  const handleSave = () => {
    if (!project || Number.isNaN(numId)) return;
    const dateErr = validateDates();
    if (dateErr) {
      toast.error(dateErr);
      return;
    }
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      status: form.status,
      priority: form.priority,
      teamSize: Math.max(1, Number(form.teamSize) || 1),
      startDate: form.startDate || undefined,
      dueDate: form.dueDate || undefined,
      requirements: form.requirements,
    };
    if (!payload.name) {
      toast.error("Le nom du projet est obligatoire");
      return;
    }
    setSaving(true);
    projectsApi
      .update(numId, payload)
      .then((res) => {
        const next = res.data ?? project;
        setProject(next);
        hydrateForm(next);
        setIsEditing(false);
        toast.success("Projet mis à jour");
      })
      .catch(() => toast.error("Erreur lors de la mise à jour du projet"))
      .finally(() => setSaving(false));
  };

  const addRequirement = () => {
    const used = new Set(form.requirements.map((r) => r.skillId));
    const availableSkill = skills.find((s) => !used.has(s.id));
    if (!availableSkill) return;
    setForm((prev) => ({
      ...prev,
      requirements: [
        ...prev.requirements,
        { skillId: availableSkill.id, levelMin: availableSkill.levelMin },
      ],
    }));
  };

  const removeRequirement = (skillId: number) => {
    setForm((prev) => ({
      ...prev,
      requirements: prev.requirements.filter((r) => r.skillId !== skillId),
    }));
  };

  const updateRequirementSkill = (oldSkillId: number, newSkillId: number) => {
    const selected = skills.find((s) => s.id === newSkillId);
    setForm((prev) => ({
      ...prev,
      requirements: prev.requirements.map((r) =>
        r.skillId === oldSkillId
          ? {
              skillId: newSkillId,
              levelMin: selected
                ? Math.max(
                    selected.levelMin,
                    Math.min(r.levelMin, selected.levelMax)
                  )
                : r.levelMin,
            }
          : r
      ),
    }));
  };

  const updateRequirementLevel = (skillId: number, levelMin: number) => {
    setForm((prev) => ({
      ...prev,
      requirements: prev.requirements.map((r) =>
        r.skillId === skillId ? { ...r, levelMin } : r
      ),
    }));
  };

  const infoControlClass =
    "h-8 rounded-xl border border-violet-200/90 bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-200/60";
  const infoSelectClass = `${infoControlClass} min-w-[120px] cursor-pointer`;
  const infoDateClass = `${infoControlClass} min-w-[134px]`;
  const infoNumberClass = `${infoControlClass} w-24 text-center`;

  /* ─── RENDER ─────────────────────────────────────────────────────────── */
  return (
    <div className="min-h-full w-full bg-[#f8f7ff] px-4 py-4 md:px-6 md:py-6">
      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-4">

        {/* ── Topbar ── */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-1 py-1">
          <button
            type="button"
            onClick={() => navigate("/manager/projects")}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-blue-300 hover:text-blue-700"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Retour aux projets
          </button>

          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                >
                  <XMarkIcon className="h-4 w-4" />
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-transparent bg-gradient-to-r from-blue-600 to-violet-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <PencilSquareIcon className="h-4 w-4" />
                  {saving ? "Enregistrement..." : "Enregistrer"}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-transparent bg-gradient-to-r from-blue-600 to-violet-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:shadow-md"
              >
                <PencilSquareIcon className="h-4 w-4" />
                Modifier
              </button>
            )}
          </div>
        </div>

        {/* ── Main grid ── */}
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">

          {/* ── Left column ── */}
          <section className="flex flex-col gap-4 xl:col-span-8">

            {/* Hero card */}
            <article className="overflow-hidden rounded-3xl border border-violet-100 bg-white shadow-sm">
              {/* Accent banner */}
              <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 via-violet-500 to-pink-500" />

              <div className="p-5">
                <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-500">
                      Détails du projet
                    </p>
                    {isEditing ? (
                      <input
                        value={form.name}
                        onChange={(e) =>
                          setForm((prev) => ({ ...prev, name: e.target.value }))
                        }
                        className="mt-1 w-full max-w-xl rounded-xl border border-violet-200 px-3 py-2 text-2xl font-bold text-slate-800 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                        placeholder="Nom du projet"
                      />
                    ) : (
                      <h1 className="mt-1 text-2xl font-bold text-slate-800">
                        {project.name}
                      </h1>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Status badge */}
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${currentStatus.cls}`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${currentStatus.dot}`}
                      />
                      {currentStatus.label}
                    </span>
                    {/* Priority badge */}
                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold ${currentPriority.cls}`}
                    >
                      <span className="text-[10px]">{currentPriority.icon}</span>
                      {currentPriority.label}
                    </span>
                  </div>
                </div>

                {/* Stats strip */}
                <div className="mb-4 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-blue-50 px-4 py-3 text-center">
                    <p className="text-xl font-bold text-blue-600">
                      {project.requirements?.length ?? 0}
                    </p>
                    <p className="text-xs text-blue-400">Compétences</p>
                  </div>
                  <div className="rounded-2xl bg-violet-50 px-4 py-3 text-center">
                    <p className="text-xl font-bold text-violet-600">
                      {project.teamSize ?? 1}
                    </p>
                    <p className="text-xs text-violet-400">Membres</p>
                  </div>
                </div>

                {/* Description */}
                <h2 className="text-sm font-semibold text-slate-800">
                  À propos du projet
                </h2>
                {isEditing ? (
                  <textarea
                    value={form.description}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    rows={4}
                    className="mt-2 w-full rounded-2xl border border-violet-200 px-3 py-3 text-sm text-slate-700 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                    placeholder="Décrivez le projet"
                  />
                ) : (
                  <p className="mt-2 rounded-2xl bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">
                    {project.description || "Aucune description disponible."}
                  </p>
                )}
              </div>
            </article>

            {/* Team card */}
            <article className="rounded-3xl border border-violet-100 bg-white p-5 shadow-sm">
              <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-800">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50">
                  <UserCircleIcon className="h-4 w-4 text-blue-600" />
                </span>
                Membres de l'équipe
              </h2>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {/* Lead */}
                <div className="flex items-center gap-3 rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 to-violet-50 p-3">
                  {managerAvatarUrl ? (
                    <img
                      src={managerAvatarUrl}
                      alt={
                        project.leadName ||
                        project.leadEmail ||
                        managerName ||
                        "Responsable"
                      }
                      className="h-11 w-11 rounded-full object-cover ring-2 ring-blue-200"
                    />
                  ) : (
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-violet-600 text-xs font-bold text-white ring-2 ring-violet-200">
                      {leadInitials}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-800">
                      {project.leadName || managerName || "Responsable"}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {project.leadEmail || managerEmail || "—"}
                    </p>
                    <span className="mt-1 inline-block rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                      Chef de projet
                    </span>
                  </div>
                </div>

                {/* Team size */}
                <div className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50 to-teal-50 p-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 text-sm font-bold text-white">
                    +{project.teamSize ?? 1}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      Équipe technique
                    </p>
                    <p className="text-xs text-slate-500">
                      {project.teamSize ?? 1} développeur(s)
                    </p>
                    <span className="mt-1 inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                      Développement
                    </span>
                  </div>
                </div>
              </div>
            </article>

            {/* Skills card */}
            <article className="rounded-3xl border border-violet-100 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-base font-semibold text-slate-800">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-50">
                    <SparklesIcon className="h-4 w-4 text-violet-600" />
                  </span>
                  Compétences requises
                </h2>
                {isEditing && (
                  <button
                    type="button"
                    onClick={addRequirement}
                    disabled={
                      skills.length === 0 ||
                      form.requirements.length >= skills.length
                    }
                    className="inline-flex items-center gap-1 rounded-lg border border-dashed border-violet-300 px-2.5 py-1 text-xs font-semibold text-violet-700 transition hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <PlusIcon className="h-3.5 w-3.5" />
                    Ajouter
                  </button>
                )}
              </div>

              {!isEditing && project.requirements.length === 0 && (
                <p className="text-sm text-slate-500">
                  Aucune compétence requise définie.
                </p>
              )}

              <div className="space-y-2">
                {(isEditing ? form.requirements : project.requirements).map(
                  (req) => {
                    const skill = skills.find((s) => s.id === req.skillId);
                    const usedIds = new Set(
                      form.requirements.map((r) => r.skillId)
                    );
                    if (isEditing) usedIds.delete(req.skillId);

                    return (
                      <div
                        key={req.skillId}
                        className={`grid grid-cols-1 gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-3 ${
                          isEditing
                            ? "md:grid-cols-[1.6fr_0.7fr_0.35fr]"
                            : "md:grid-cols-[1.7fr_0.8fr]"
                        }`}
                      >
                        {isEditing ? (
                          <select
                            value={req.skillId}
                            onChange={(e) =>
                              updateRequirementSkill(
                                req.skillId,
                                Number(e.target.value)
                              )
                            }
                            className="w-full rounded-xl border border-violet-200 bg-white px-3 py-2 text-sm outline-none focus:border-violet-400"
                          >
                            {skills
                              .filter((s) => !usedIds.has(s.id))
                              .map((s) => (
                                <option key={s.id} value={s.id}>
                                  {s.name} - {s.categoryName}
                                </option>
                              ))}
                          </select>
                        ) : (
                          <div>
                            <p className="text-sm font-semibold text-slate-800">
                              {(req as { skillName?: string }).skillName ||
                                skill?.name ||
                                "Compétence"}
                            </p>
                            <p className="text-xs text-slate-500">
                              {(req as { categoryName?: string }).categoryName ||
                                skill?.categoryName ||
                                "Catégorie"}
                            </p>
                          </div>
                        )}

                        {isEditing ? (
                          <input
                            type="number"
                            min={skill?.levelMin ?? 1}
                            max={skill?.levelMax ?? 5}
                            value={req.levelMin}
                            onChange={(e) =>
                              updateRequirementLevel(
                                req.skillId,
                                Math.max(
                                  skill?.levelMin ?? 1,
                                  Number(e.target.value) || 1
                                )
                              )
                            }
                            className="w-full rounded-xl border border-violet-200 bg-white px-3 py-2 text-sm outline-none focus:border-violet-400"
                          />
                        ) : (
                          /* ── Niveau pill ── */
                          <div className="flex items-center">
                            <span className="inline-flex items-center rounded-xl border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700">
                              Niv. min : {req.levelMin}
                            </span>
                          </div>
                        )}

                        {isEditing && (
                          <button
                            type="button"
                            onClick={() => removeRequirement(req.skillId)}
                            className="rounded-xl border border-rose-200 bg-rose-50 px-2 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                          >
                            Retirer
                          </button>
                        )}
                      </div>
                    );
                  }
                )}

                {isEditing && form.requirements.length === 0 && (
                  <button
                    type="button"
                    onClick={addRequirement}
                    disabled={skills.length === 0}
                    className="w-full rounded-2xl border border-dashed border-violet-300 bg-violet-50/50 py-4 text-sm text-violet-700 transition hover:bg-violet-100/60 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Ajouter une compétence requise
                  </button>
                )}
              </div>
            </article>
          </section>

          {/* ── Right column ── */}
          <aside className="flex flex-col gap-4 xl:col-span-4">

            {/* Meta info card */}
            <article className="rounded-3xl border border-violet-100 bg-white p-5 shadow-sm">
              <h3 className="mb-4 text-base font-semibold text-slate-800">
                Informations
              </h3>

              <div className="space-y-0 divide-y divide-slate-100 text-sm">
                {/* Statut */}
                <div className="flex items-center justify-between gap-3 py-2.5">
                  <span className="text-slate-500">Statut</span>
                  {isEditing ? (
                    <select
                      value={form.status}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          status: e.target.value,
                        }))
                      }
                      className={infoSelectClass}
                    >
                      <option value="DRAFT">Brouillon</option>
                      <option value="ACTIVE">En cours</option>
                      <option value="CLOSED">Terminé</option>
                    </select>
                  ) : (
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${currentStatus.cls}`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${currentStatus.dot}`}
                      />
                      {currentStatus.label}
                    </span>
                  )}
                </div>

                {/* Priorité */}
                <div className="flex items-center justify-between gap-3 py-2.5">
                  <span className="text-slate-500">Priorité</span>
                  {isEditing ? (
                    <select
                      value={form.priority}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          priority: e.target.value,
                        }))
                      }
                      className={infoSelectClass}
                    >
                      <option value="LOW">Basse</option>
                      <option value="MEDIUM">Moyenne</option>
                      <option value="HIGH">Haute</option>
                    </select>
                  ) : (
                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${currentPriority.cls}`}
                    >
                      <span className="text-[10px]">
                        {currentPriority.icon}
                      </span>
                      {currentPriority.label}
                    </span>
                  )}
                </div>

                {/* Créé par */}
                <div className="flex items-center justify-between gap-3 py-2.5">
                  <span className="text-slate-500">Créé par</span>
                  <span className="text-right font-medium text-slate-700">
                    {project.leadName || managerName || "—"}
                  </span>
                </div>

                {/* Date de création */}
                <div className="flex items-center justify-between gap-3 py-2.5">
                  <span className="text-slate-500">Date de création</span>
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-700">
                    <CalendarDaysIcon className="h-3.5 w-3.5 text-slate-400" />
                    {formatDate(project.createdAt)}
                  </span>
                </div>

                {/* Date de début */}
                <div className="flex items-center justify-between gap-3 py-2.5">
                  <span className="text-slate-500">Date de début</span>
                  {isEditing ? (
                    <input
                      type="date"
                      value={form.startDate}
                      min={createdAtISO}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          startDate: e.target.value,
                        }))
                      }
                      className={infoDateClass}
                    />
                  ) : (
                    <span className="text-xs font-medium text-emerald-600">
                      {formatDate(project.startDate)}
                    </span>
                  )}
                </div>

                {/* Date fin */}
                <div className="flex items-center justify-between gap-3 py-2.5">
                  <span className="text-slate-500">Date fin</span>
                  {isEditing ? (
                    <input
                      type="date"
                      value={form.dueDate}
                      min={minDueDateISO || undefined}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          dueDate: e.target.value,
                        }))
                      }
                      className={infoDateClass}
                    />
                  ) : (
                    <span className="text-xs font-medium text-amber-600">
                      {formatDate(project.dueDate)}
                    </span>
                  )}
                </div>

                {/* Taille équipe */}
                <div className="flex items-center justify-between gap-3 py-2.5">
                  <span className="text-slate-500">Taille d'équipe</span>
                  {isEditing ? (
                    <input
                      type="number"
                      min={1}
                      value={form.teamSize}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          teamSize: Math.max(1, Number(e.target.value) || 1),
                        }))
                      }
                      className={infoNumberClass}
                    />
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700">
                      {project.teamSize ?? 1} membre(s)
                    </span>
                  )}
                </div>

              </div>
            </article>

          </aside>
        </div>
      </div>
    </div>
  );
}