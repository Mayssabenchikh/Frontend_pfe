import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowLeftIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  ExclamationCircleIcon,
  PencilSquareIcon,
  PlusIcon,
  SparklesIcon,
  UserCircleIcon,
  UserGroupIcon,
  XMarkIcon,
} from "../../icons/heroicons/outline";
import { assignmentsApi, type AssignmentDto } from "../../api/assignmentsApi";
import {
  matchingApi,
  type EmployeeMatchRowDto,
  type MatchListResponseDto,
  type TeamBuildResponseDto,
} from "../../api/matchingApi";
import { projectsApi, type ProjectDto } from "../../api/projectsApi";
import { skillsApi } from "../../api/skillsApi";
import { AlertBanner } from "../../components/AlertBanner";
import { TeamCard } from "../../components/matching/TeamCard";
import { avatarGradient, avatarInitials, toPercent, toPercentNumber } from "../../components/matching/matchingVisuals";
import type { SkillDto } from "../admin/types";
import { getApiError } from "../admin/utils";
import { EmployeeMatchDrawer } from "./EmployeeMatchDrawer";

const MATCH_PAGE_SIZE = 4;

type ManagerOutletContext = {
  managerAvatarUrl: string | null;
  managerName: string;
  managerEmail: string | null;
  currentPath: string;
};

type ProjectForm = {
  name: string;
  description: string;
  status: string;
  priority: string;
  teamSize: number;
  startDate: string;
  dueDate: string;
  requirements: { skillUuid: string; levelMin: number }[];
};

function formatDate(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("fr-FR");
}

function statusMeta(status?: string | null) {
  if (status === "ACTIVE") {
    return { label: "En cours", dot: "bg-blue-600", cls: "border-blue-200 bg-blue-50 text-blue-700" };
  }
  if (status === "CLOSED") {
    return { label: "Terminé", dot: "bg-emerald-500", cls: "border-emerald-200 bg-emerald-50 text-emerald-700" };
  }
  return { label: "Brouillon", dot: "bg-slate-500", cls: "border-slate-200 bg-slate-50 text-slate-700" };
}

function RequirementChip({ name, level }: { name: string; level: number }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-md border border-violet-100 bg-violet-50 px-3 py-2 text-sm font-semibold text-violet-700">
      <SparklesIcon className="h-3.5 w-3.5" />
      {name}
      <span className="rounded bg-white/80 px-1.5 py-0.5 text-[11px] text-violet-600">Niv. {level}</span>
    </span>
  );
}

function AssignmentRow({ assignment, onOpenProfile }: { assignment: AssignmentDto; onOpenProfile: () => void }) {
  const initials = avatarInitials(assignment.employeeName, assignment.employeeEmail);
  const avatar = avatarGradient(assignment.employeeEmail || assignment.employeeKeycloakId);

  return (
    <li>
      <button
        type="button"
        onClick={onOpenProfile}
        className="flex w-full items-center justify-between gap-3 rounded-[10px] border border-slate-100 bg-white px-3 py-3 text-left transition hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-md hover:shadow-violet-100/60 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
      >
      <div className="flex min-w-0 items-center gap-3">
        {assignment.employeeAvatarUrl ? (
          <img src={assignment.employeeAvatarUrl} alt={assignment.employeeName} className="h-11 w-11 rounded-full object-cover" />
        ) : (
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
            style={{ background: `linear-gradient(135deg, ${avatar[0]}, ${avatar[1]})` }}
          >
            {initials}
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-slate-900">{assignment.employeeName || assignment.employeeEmail}</p>
          <p className="truncate text-xs text-slate-500">{assignment.employeeEmail}</p>
        </div>
      </div>
      <span className="shrink-0 rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-800">
        Affecté
      </span>
      </button>
    </li>
  );
}

function MatchCard({
  row,
  assigned,
  assigning,
  teamFull,
  onAssign,
  onView,
}: {
  row: EmployeeMatchRowDto;
  assigned: AssignmentDto | null;
  assigning: boolean;
  teamFull: boolean;
  onAssign: () => void;
  onView: () => void;
}) {
  const met = row.breakdown.requirements.filter((r) => r.meets).length;
  const gaps = row.breakdown.requirements.filter((r) => !r.meets).length;
  const missingMandatory = row.breakdown.mandatory_failed.length;
  const initials = avatarInitials(row.display_name, row.email);
  const avatar = avatarGradient(row.email || row.employee_keycloak_id);
  const avatarUrl = assigned?.employeeAvatarUrl || row.avatar_url || null;
  const score = toPercentNumber(row.match_score);

  return (
    <article className="grid overflow-hidden rounded-[10px] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md lg:grid-cols-[1fr_124px]">
      <button type="button" onClick={onView} className="min-w-0 p-3 text-left">
        <div className="flex min-w-0 gap-2.5">
          {avatarUrl ? (
            <img src={avatarUrl} alt={row.display_name || row.email} className="h-10 w-10 shrink-0 rounded-[10px] object-cover shadow-sm" />
          ) : (
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] text-[11px] font-bold text-white shadow-sm"
              style={{ background: `linear-gradient(135deg, ${avatar[0]}, ${avatar[1]})` }}
            >
              {initials}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-sm font-bold text-slate-950 sm:text-base">{row.display_name || row.email}</h3>
              {row.rank === 1 ? (
                <span className="rounded-full border border-violet-200 bg-violet-50 px-1.5 py-0.5 text-[10px] font-bold text-violet-700">
                  Top match
                </span>
              ) : null}
              {assigned ? (
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
                  Déjà affecté
                </span>
              ) : null}
            </div>
            <p className="truncate text-xs text-slate-600">{row.email}</p>

            <div className="mt-1.5">
              <p className="text-xs font-bold text-violet-800">Justification</p>
              <p className="mt-0.5 line-clamp-1 text-xs leading-5 text-slate-600">
                {row.meets_mandatory
                  ? "Ce profil couvre les exigences obligatoires du projet avec un bon niveau de confiance."
                  : missingMandatory > 0
                    ? `${missingMandatory} exigence(s) obligatoire(s) restent à couvrir avant une affectation idéale.`
                    : "Profil partiellement compatible, à vérifier selon les besoins du projet."}
              </p>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-2.5 text-xs font-semibold">
              <span className="inline-flex items-center gap-1.5 text-emerald-700">
                <CheckCircleIcon className="h-3.5 w-3.5" />
                {met} compétence{met > 1 ? "s" : ""} matchée{met > 1 ? "s" : ""}
              </span>
              <span className={`inline-flex items-center gap-1.5 ${gaps ? "text-orange-600" : "text-slate-500"}`}>
                <ExclamationCircleIcon className="h-3.5 w-3.5" />
                {gaps} gap{gaps > 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </div>
      </button>

      <div className="flex items-center justify-between gap-2.5 border-t border-slate-100 bg-violet-50/30 p-3 lg:flex-col lg:justify-center lg:border-l lg:border-t-0">
        <div className="relative grid h-14 w-14 shrink-0 place-items-center rounded-full bg-white">
          <div
            className="absolute inset-0 rounded-full"
            style={{ background: `conic-gradient(#6d28d9 ${score * 3.6}deg, #eee7ff 0deg)` }}
          />
          <div className="relative grid h-11 w-11 place-items-center rounded-full bg-white text-sm font-black text-violet-700">
            {toPercent(row.match_score)}
          </div>
        </div>
        <div className="flex w-full max-w-[108px] flex-col gap-1.5">
          <button
            type="button"
            onClick={assigned ? onView : onAssign}
            disabled={assigning || (!assigned && teamFull)}
            className="rounded-md bg-violet-800 px-2.5 py-1.5 text-[11px] font-bold text-white shadow-sm transition hover:bg-violet-900 disabled:cursor-not-allowed disabled:opacity-55"
          >
            {assigning ? "Affectation..." : assigned ? "Voir affectation" : teamFull ? "Équipe complète" : "Affecter"}
          </button>
          <button
            type="button"
            onClick={onView}
            className="rounded-md border border-violet-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-violet-800 transition hover:bg-violet-50"
          >
            Voir profil
          </button>
        </div>
      </div>
    </article>
  );
}

export function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const projectUuid = (id ?? "").trim();
  const navigate = useNavigate();
  const outletCtx = useOutletContext<ManagerOutletContext | null>();

  const managerAvatarUrl = outletCtx?.managerAvatarUrl ?? null;
  const managerName = outletCtx?.managerName ?? "";
  const managerEmail = outletCtx?.managerEmail ?? null;

  const [project, setProject] = useState<ProjectDto | null>(null);
  const [matches, setMatches] = useState<MatchListResponseDto | null>(null);
  const [suggestedTeam, setSuggestedTeam] = useState<TeamBuildResponseDto | null>(null);
  const [assignments, setAssignments] = useState<AssignmentDto[]>([]);
  const [skills, setSkills] = useState<SkillDto[]>([]);
  const [loadingProject, setLoadingProject] = useState(true);
  const [loadingMatches, setLoadingMatches] = useState(true);
  const [loadingTeam, setLoadingTeam] = useState(true);
  const [matchingError, setMatchingError] = useState<string | null>(null);
  const [teamError, setTeamError] = useState<string | null>(null);
  const [projectError, setProjectError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [matchPage, setMatchPage] = useState(1);
  const [selected, setSelected] = useState<EmployeeMatchRowDto | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [form, setForm] = useState<ProjectForm>({
    name: "",
    description: "",
    status: "DRAFT",
    priority: "MEDIUM",
    teamSize: 1,
    startDate: "",
    dueDate: "",
    requirements: [],
  });

  const hydrateForm = useCallback((p: ProjectDto) => {
    setForm({
      name: p.name ?? "",
      description: p.description ?? "",
      status: p.status ?? "DRAFT",
      priority: p.priority ?? "MEDIUM",
      teamSize: Math.max(1, p.teamSize ?? 1),
      startDate: p.startDate ?? "",
      dueDate: p.dueDate ?? "",
      requirements: (p.requirements ?? []).map((r) => ({
        skillUuid: r.skillUuid,
        levelMin: r.levelMin,
      })),
    });
  }, []);

  const loadProjectBundle = useCallback(async () => {
    if (!projectUuid) {
      setProjectError("Identifiant de projet invalide");
      setLoadingProject(false);
      setLoadingMatches(false);
      return;
    }

    setLoadingProject(true);
    setLoadingMatches(true);
    setLoadingTeam(true);
    setProjectError(null);
    setMatchingError(null);
    setTeamError(null);

    const projectRes = await projectsApi.get(projectUuid).catch(() => null);

    const p = projectRes?.data ?? null;
    if (!p) {
      setProject(null);
      setProjectError("Projet non trouvé");
      setLoadingProject(false);
      setLoadingMatches(false);
      setLoadingTeam(false);
      return;
    } else {
      setProject(p);
      hydrateForm(p);
    }

    setLoadingProject(false);

    const teamSize = Math.max(1, Math.min(50, p.teamSize ?? 1));
    const [assignmentRes, matchRes, teamRes] = await Promise.all([
      assignmentsApi.listProjectAssignments(projectUuid).catch(() => null),
      matchingApi.getProjectMatches(projectUuid, { page: 1, page_size: MATCH_PAGE_SIZE }).catch(() => null),
      matchingApi
        .buildTeam(projectUuid, { team_size: teamSize, only_mandatory_eligible: true }, { page: 1, page_size: teamSize })
        .catch(() => null),
    ]);

    setAssignments(Array.isArray(assignmentRes?.data) ? assignmentRes.data : []);

    if (matchRes?.data) {
      setMatches(matchRes.data);
      setMatchPage(matchRes.data.page);
    } else {
      setMatches(null);
      setMatchingError("Service de correspondances indisponible. La page détails reste disponible, mais les recommandations ne peuvent pas être chargées.");
    }

    if (teamRes?.data) {
      setSuggestedTeam(teamRes.data);
    } else {
      setSuggestedTeam(null);
      setTeamError("Impossible de calculer l'équipe suggérée pour ce projet.");
    }

    setLoadingMatches(false);
    setLoadingTeam(false);
  }, [hydrateForm, projectUuid]);

  useEffect(() => {
    void loadProjectBundle();
  }, [loadProjectBundle]);

  useEffect(() => {
    if (!isEditing || skills.length > 0) return;
    skillsApi
      .listSkills()
      .then((res) => setSkills(res.data ?? []))
      .catch(() => {});
  }, [isEditing, skills.length]);

  const loadMatchesPage = async (page: number) => {
    if (!projectUuid) return;
    setLoadingMatches(true);
    try {
      const res = await matchingApi.getProjectMatches(projectUuid, { page, page_size: MATCH_PAGE_SIZE });
      setMatches(res.data);
      setMatchPage(res.data.page);
      setMatchingError(null);
    } catch {
      setMatchingError("Impossible de charger cette page de correspondances.");
    } finally {
      setLoadingMatches(false);
    }
  };

  const activeAssignments = useMemo(
    () => assignments.filter((a) => a.status === "PENDING" || a.status === "ACCEPTED"),
    [assignments],
  );

  const assignmentByEmployee = useMemo(() => {
    return new Map(activeAssignments.map((a) => [a.employeeKeycloakId, a]));
  }, [activeAssignments]);

  const teamCapacity = Math.max(1, project?.teamSize ?? 1);
  const assignedCount = activeAssignments.length;
  const isTeamFull = assignedCount >= teamCapacity;
  const matchRows = useMemo(
    () => Object.fromEntries((matches?.employees ?? []).map((row) => [row.employee_keycloak_id, row])),
    [matches?.employees],
  );

  const currentStatus = statusMeta(project?.status);
  const leadSource = project?.leadName || project?.leadEmail || managerName || managerEmail || "?";
  const leadInitials = leadSource
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

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
    if (start && start < created) return `La date de début doit être ≥ la date de création (${createdAtISO}).`;
    if (due && !start) return "Veuillez d’abord renseigner la date de début avant la date de fin.";
    if (start && due && !(due > start)) return "La date de fin doit être strictement supérieure à la date de début.";
    return null;
  };

  const handleSave = async () => {
    if (!project || !projectUuid) return;
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
    try {
      const res = await projectsApi.update(projectUuid, payload);
      const next = res.data ?? project;
      setProject(next);
      hydrateForm(next);
      setIsEditing(false);
      toast.success("Projet mis à jour");
    } catch (err) {
      toast.error(getApiError(err, "Erreur lors de la mise à jour du projet."));
    } finally {
      setSaving(false);
    }
  };

  const addRequirement = () => {
    const used = new Set(form.requirements.map((r) => r.skillUuid));
    const availableSkill = skills.find((s) => !used.has(s.uuid));
    if (!availableSkill) return;
    setForm((prev) => ({
      ...prev,
      requirements: [...prev.requirements, { skillUuid: availableSkill.uuid, levelMin: availableSkill.levelMin }],
    }));
  };

  const updateRequirementSkill = (oldSkillUuid: string, newSkillUuid: string) => {
    const selectedSkill = skills.find((s) => s.uuid === newSkillUuid);
    setForm((prev) => ({
      ...prev,
      requirements: prev.requirements.map((r) =>
        r.skillUuid === oldSkillUuid
          ? {
              skillUuid: newSkillUuid,
              levelMin: selectedSkill
                ? Math.max(selectedSkill.levelMin, Math.min(r.levelMin, selectedSkill.levelMax))
                : r.levelMin,
            }
          : r,
      ),
    }));
  };

  const updateRequirementLevel = (skillUuid: string, levelMin: number) => {
    setForm((prev) => ({
      ...prev,
      requirements: prev.requirements.map((r) => (r.skillUuid === skillUuid ? { ...r, levelMin } : r)),
    }));
  };

  const handleAssign = async (row: EmployeeMatchRowDto) => {
    if (!projectUuid || assignmentByEmployee.has(row.employee_keycloak_id)) {
      setSelected(row);
      setDrawerOpen(true);
      return;
    }
    if (isTeamFull) {
      toast.error("L'équipe est déjà complète.");
      return;
    }

    setAssigningId(row.employee_keycloak_id);
    try {
      await assignmentsApi.invite(projectUuid, row.employee_keycloak_id);
      const res = await assignmentsApi.listProjectAssignments(projectUuid);
      setAssignments(Array.isArray(res.data) ? res.data : []);
      toast.success("Affectation envoyée");
    } catch (err) {
      toast.error(getApiError(err, "Impossible d'affecter cet employé."));
    } finally {
      setAssigningId(null);
    }
  };

  const openDetails = (row: EmployeeMatchRowDto) => {
    setSelected(row);
    setDrawerOpen(true);
  };

  const openAssignmentProfile = (assignment: AssignmentDto) => {
    if (!projectUuid) return;
    navigate(`/manager/projects/${encodeURIComponent(projectUuid)}/team/${encodeURIComponent(assignment.employeeKeycloakId)}`);
  };

  if (loadingProject) {
    return (
      <div className="min-h-full bg-slate-50 p-6">
        <div className="w-full space-y-4">
          <div className="h-24 animate-pulse rounded-[10px] bg-white" />
          <div className="grid gap-5 lg:grid-cols-[380px_1fr]">
            <div className="h-96 animate-pulse rounded-[10px] bg-white" />
            <div className="h-96 animate-pulse rounded-[10px] bg-white" />
          </div>
        </div>
      </div>
    );
  }

  if (projectError || !project) {
    return <div className="p-6 text-red-500">{projectError ?? "Projet non trouvé"}</div>;
  }

  const controlClass =
    "h-10 rounded-[10px] border border-violet-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100";

  return (
    <div className="min-h-full overflow-y-auto bg-slate-50 px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <div className="flex w-full flex-col gap-6">
        <header className="flex flex-col gap-5 pb-6">
          <button
            type="button"
            onClick={() => navigate("/manager/projects")}
            className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-violet-800"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Retour
          </button>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              {isEditing ? (
                <input
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="mt-4 w-full max-w-3xl rounded-[10px] border border-violet-200 bg-white px-3 py-2 text-3xl font-black text-slate-950 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                  placeholder="Nom du projet"
                />
              ) : (
                <h1 className="mt-4 text-3xl font-black leading-tight text-slate-950 sm:text-4xl">{project.name}</h1>
              )}
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-bold ${currentStatus.cls}`}>
                  <span className={`h-2 w-2 rounded-full ${currentStatus.dot}`} />
                  {currentStatus.label}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-violet-100 bg-violet-50 px-3 py-1.5 text-sm font-bold text-slate-700">
                  <CalendarDaysIcon className="h-4 w-4 text-violet-700" />
                  Deadline: {formatDate(project.dueDate)}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              {isEditing ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      hydrateForm(project);
                      setIsEditing(false);
                    }}
                    className="inline-flex items-center gap-2 rounded-[10px] border border-violet-200 bg-white px-5 py-3 text-sm font-bold text-violet-800 transition hover:bg-violet-50"
                  >
                    <XMarkIcon className="h-4 w-4" />
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-[10px] bg-violet-800 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-violet-900/15 transition hover:bg-violet-900 disabled:opacity-60"
                  >
                    <PencilSquareIcon className="h-4 w-4" />
                    {saving ? "Enregistrement..." : "Enregistrer"}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center gap-2 rounded-[10px] bg-violet-800 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-violet-900/15 transition hover:bg-violet-900"
                >
                  <PencilSquareIcon className="h-4 w-4" />
                  Modifier le projet
                </button>
              )}
            </div>
          </div>
        </header>

        <div className="grid w-full gap-6 xl:grid-cols-[minmax(360px,420px)_minmax(0,1fr)] 2xl:grid-cols-[minmax(400px,460px)_minmax(0,1fr)]">
          <aside className="space-y-6">
            <section className="rounded-[10px] border border-violet-100 bg-violet-50/40 p-6 shadow-sm">
              <h2 className="text-2xl font-bold text-slate-950">Résumé</h2>
              {isEditing ? (
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  rows={6}
                  className="mt-5 w-full rounded-[10px] border border-violet-200 bg-white px-3 py-3 text-sm leading-6 text-slate-700 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                  placeholder="Description du projet"
                />
              ) : (
                <p className="mt-5 text-base leading-8 text-slate-600">{project.description || "Aucune description disponible."}</p>
              )}

              <div className="mt-6 grid gap-3">
                <div className="flex items-center justify-between rounded-[10px] bg-violet-50 px-4 py-4">
                  <span className="inline-flex items-center gap-3 text-sm text-slate-700">
                    <ClockIcon className="h-5 w-5 text-violet-700" />
                    Date de début
                  </span>
                  {isEditing ? (
                    <input
                      type="date"
                      value={form.startDate}
                      min={createdAtISO}
                      onChange={(e) => setForm((prev) => ({ ...prev, startDate: e.target.value }))}
                      className={controlClass}
                    />
                  ) : (
                    <span className="font-bold text-violet-900">{formatDate(project.startDate)}</span>
                  )}
                </div>
                <div className="flex items-center justify-between rounded-[10px] bg-violet-50 px-4 py-4">
                  <span className="inline-flex items-center gap-3 text-sm text-slate-700">
                    <UserGroupIcon className="h-5 w-5 text-violet-700" />
                    Taille d'équipe
                  </span>
                  {isEditing ? (
                    <input
                      type="number"
                      min={1}
                      value={form.teamSize}
                      onChange={(e) => setForm((prev) => ({ ...prev, teamSize: Math.max(1, Number(e.target.value) || 1) }))}
                      className={`${controlClass} w-24 text-center`}
                    />
                  ) : (
                    <span className="font-bold text-violet-900">{project.teamSize ?? 1} membre(s)</span>
                  )}
                </div>
                {isEditing ? (
                  <div className="grid gap-3 rounded-[10px] border border-violet-100 bg-white p-4">
                    <label className="text-sm font-semibold text-slate-600">
                      Statut
                      <select
                        value={form.status}
                        onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
                        className={`${controlClass} mt-2 w-full`}
                      >
                        <option value="DRAFT">Brouillon</option>
                        <option value="ACTIVE">En cours</option>
                        <option value="CLOSED">Terminé</option>
                      </select>
                    </label>
                    <label className="text-sm font-semibold text-slate-600">
                      Priorité
                      <select
                        value={form.priority}
                        onChange={(e) => setForm((prev) => ({ ...prev, priority: e.target.value }))}
                        className={`${controlClass} mt-2 w-full`}
                      >
                        <option value="LOW">Basse</option>
                        <option value="MEDIUM">Moyenne</option>
                        <option value="HIGH">Haute</option>
                      </select>
                    </label>
                    <label className="text-sm font-semibold text-slate-600">
                      Date fin
                      <input
                        type="date"
                        value={form.dueDate}
                        min={minDueDateISO || undefined}
                        onChange={(e) => setForm((prev) => ({ ...prev, dueDate: e.target.value }))}
                        className={`${controlClass} mt-2 w-full`}
                      />
                    </label>
                  </div>
                ) : null}
              </div>
            </section>

            <section className="rounded-[10px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-2xl font-bold text-slate-950">Compétences requises</h2>
                {isEditing ? (
                    <button
                    type="button"
                    onClick={addRequirement}
                    disabled={skills.length === 0 || form.requirements.length >= skills.length}
                      className="inline-flex items-center gap-2 rounded-[10px] border border-violet-200 bg-white px-3 py-2 text-sm font-bold text-violet-800 hover:bg-violet-50 disabled:opacity-50"
                  >
                    <PlusIcon className="h-4 w-4" />
                    Ajouter
                  </button>
                ) : null}
              </div>

              {isEditing ? (
                <div className="mt-5 space-y-3">
                  {form.requirements.map((req) => {
                    const skill = skills.find((s) => s.uuid === req.skillUuid);
                    const used = new Set(form.requirements.map((r) => r.skillUuid));
                    used.delete(req.skillUuid);
                    return (
                      <div key={req.skillUuid} className="min-w-0 rounded-[10px] border border-violet-100 bg-white p-3 shadow-sm">
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-xs font-black uppercase tracking-[0.12em] text-violet-500">Compétence</p>
                            <p className="mt-0.5 truncate text-sm font-bold text-slate-900">{skill?.name ?? "Compétence requise"}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setForm((prev) => ({ ...prev, requirements: prev.requirements.filter((r) => r.skillUuid !== req.skillUuid) }))}
                            className="shrink-0 rounded-[10px] border border-red-100 bg-red-50 px-2.5 py-1.5 text-xs font-bold text-red-700 transition hover:border-red-200 hover:bg-red-100"
                          >
                            Retirer
                          </button>
                        </div>

                        <div className="grid min-w-0 gap-3 sm:grid-cols-[minmax(0,1fr)_78px]">
                          <label className="min-w-0 text-xs font-bold text-slate-500">
                            Nom et catégorie
                            <select
                              value={req.skillUuid}
                              onChange={(e) => updateRequirementSkill(req.skillUuid, e.target.value)}
                              className={`${controlClass} mt-1.5 min-w-0 w-full`}
                            >
                              {skills
                                .filter((s) => !used.has(s.uuid))
                                .map((s) => (
                                  <option key={s.uuid} value={s.uuid}>
                                    {s.name} - {s.categoryName}
                                  </option>
                                ))}
                            </select>
                          </label>
                          <label className="text-xs font-bold text-slate-500">
                            Niveau
                            <input
                              type="number"
                              min={skill?.levelMin ?? 1}
                              max={skill?.levelMax ?? 5}
                              value={req.levelMin}
                              onChange={(e) => updateRequirementLevel(req.skillUuid, Math.max(skill?.levelMin ?? 1, Number(e.target.value) || 1))}
                              className={`${controlClass} mt-1.5 w-full text-center`}
                            />
                          </label>
                        </div>
                      </div>
                    );
                  })}
                  {!form.requirements.length ? (
                    <p className="rounded-[10px] border border-dashed border-violet-200 bg-violet-50/50 px-4 py-6 text-center text-sm text-slate-500">
                      Aucune compétence dans le formulaire.
                    </p>
                  ) : null}
                </div>
              ) : (
                <div className="mt-5 flex flex-wrap gap-3">
                  {project.requirements.length ? (
                    project.requirements.map((req) => <RequirementChip key={req.uuid} name={req.skillName} level={req.levelMin} />)
                  ) : (
                    <p className="text-sm text-slate-500">Aucune compétence requise définie.</p>
                  )}
                </div>
              )}
            </section>

            <section className="rounded-[10px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-2xl font-bold text-slate-950">Équipe projet</h2>
                <span className="text-sm font-bold text-violet-800">{assignedCount}/{teamCapacity}</span>
              </div>

              <div className="mt-5 flex items-center gap-3 rounded-md bg-violet-50 px-3 py-3">
                {managerAvatarUrl ? (
                  <img src={managerAvatarUrl} alt={project.leadName || managerName || "Responsable"} className="h-12 w-12 rounded-full object-cover" />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-800 text-xs font-bold text-white">
                    {leadInitials}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-slate-950">{project.leadName || managerName || "Responsable"}</p>
                  <p className="truncate text-xs text-slate-500">{project.leadEmail || managerEmail || "—"}</p>
                  <span className="mt-1 inline-flex rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-violet-800">Chef de projet</span>
                </div>
              </div>

              {activeAssignments.length ? (
                <ul className="mt-4 space-y-3">
                  {activeAssignments.map((assignment) => (
                    <AssignmentRow
                      key={assignment.uuid}
                      assignment={assignment}
                      onOpenProfile={() => openAssignmentProfile(assignment)}
                    />
                  ))}
                </ul>
              ) : (
                <p className="mt-4 rounded-[10px] border border-dashed border-violet-200 bg-violet-50/40 px-4 py-8 text-center text-sm text-slate-500">
                  Aucun membre affecté pour le moment.
                </p>
              )}

            </section>

            <section className="rounded-[10px] border border-violet-100 bg-violet-50/60 p-6 shadow-sm">
              <h2 className="text-xl font-black text-violet-950">Comment lire les scores ?</h2>
              <div className="mt-4 space-y-4 text-sm leading-6 text-slate-700">
                <p>
                  <span className="font-bold text-slate-950">Score compétence :</span> compare le niveau validé de l'employé avec le niveau demandé par le projet. Si le projet demande niveau 4 et que l'employé a niveau 3, la couverture est de 75%.
                </p>
                <p>
                  <span className="font-bold text-slate-950">Score matching :</span> résume toutes les compétences du projet en un seul pourcentage. Une compétence plus importante peut compter davantage grâce à son poids.
                </p>
                <p>
                  <span className="font-bold text-slate-950">Score confiance :</span> indique la fiabilité des données utilisées. Il augmente quand la compétence est validée par quiz, récente et cohérente avec le niveau attendu.
                </p>
              </div>
              <div className="mt-5 rounded-[10px] border border-violet-200 bg-white p-4">
                <p className="text-sm font-black text-violet-900">Formules</p>
                <div className="mt-3 space-y-2 text-xs leading-5 text-slate-600">
                  <p>
                    <span className="font-bold text-slate-800">Score compétence</span> = niveau validé employé / niveau requis, limité entre 0 et 1.
                  </p>
                  <p>
                    <span className="font-bold text-slate-800">Score matching</span> = somme(poids x score compétence) / somme(poids).
                  </p>
                  <p>
                    <span className="font-bold text-slate-800">Confiance</span> = 0.55 x état + 0.20 x quiz + 0.15 x niveau + 0.10 x récence.
                  </p>
                </div>
              </div>
            </section>
          </aside>

          <main className="min-w-0 space-y-6">
            <section>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-3xl font-black text-slate-950">Correspondance & recommandations</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Matching intégré aux détails du projet, basé sur les données réelles du service de correspondance.
                  </p>
                </div>
                <div className="inline-flex w-fit rounded-md border border-slate-200 bg-white p-1">
                  <span className="rounded bg-violet-100 px-4 py-2 text-sm font-bold text-violet-800">Profils classés</span>
                  <span className="px-4 py-2 text-sm font-bold text-slate-400">{matches?.total_employees ?? 0} profils</span>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="h-4 w-1 rounded-full bg-violet-700" />
                  <h3 className="text-lg font-black text-slate-950">Profils classés</h3>
                </div>
                {matchingError ? <AlertBanner message={matchingError} /> : null}
                {loadingMatches ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-56 animate-pulse rounded-[10px] border border-slate-200 bg-white" />
                    ))}
                  </div>
                ) : matches?.employees?.length ? (
                  matches.employees.map((row) => (
                    <MatchCard
                      key={row.employee_keycloak_id}
                      row={row}
                      assigned={assignmentByEmployee.get(row.employee_keycloak_id) ?? null}
                      assigning={assigningId === row.employee_keycloak_id}
                      teamFull={isTeamFull}
                      onAssign={() => void handleAssign(row)}
                      onView={() => openDetails(row)}
                    />
                  ))
                ) : !matchingError ? (
                  <div className="rounded-[10px] border border-dashed border-violet-200 bg-violet-50/50 px-6 py-16 text-center">
                    <UserCircleIcon className="mx-auto h-10 w-10 text-violet-300" />
                    <p className="mt-4 font-bold text-slate-900">Aucun candidat correspondant</p>
                    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                      Aucun profil n'est retourné pour les exigences actuelles de ce projet.
                    </p>
                  </div>
                ) : null}
              </div>

              {matches && matches.total_pages > 1 ? (
                <div className="mt-5 flex items-center justify-between rounded-[10px] border border-slate-200 bg-white px-4 py-3">
                  <p className="text-sm font-semibold text-slate-500">
                    Page {matches.page} sur {matches.total_pages}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => void loadMatchesPage(matchPage - 1)}
                      disabled={!matches.has_previous || loadingMatches}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-violet-50 disabled:opacity-45"
                    >
                      <ChevronLeftIcon className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => void loadMatchesPage(matchPage + 1)}
                      disabled={!matches.has_next || loadingMatches}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-violet-800 text-white hover:bg-violet-900 disabled:opacity-45"
                    >
                      <ChevronRightIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ) : null}

              <div className="mt-6 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="h-4 w-1 rounded-full bg-fuchsia-600" />
                  <h3 className="text-lg font-black text-slate-950">Équipe suggérée</h3>
                </div>
                {teamError ? <AlertBanner message={teamError} /> : null}
                {loadingTeam ? (
                  <div className="h-56 animate-pulse rounded-[10px] border border-slate-200 bg-white" />
                ) : suggestedTeam?.members?.length ? (
                  <TeamCard
                    members={suggestedTeam.members}
                    teamSize={suggestedTeam.team_size}
                    memberMatches={matchRows}
                    projectName={project.name}
                    compact
                  />
                ) : !teamError ? (
                  <div className="rounded-[10px] border border-dashed border-violet-200 bg-violet-50/50 px-6 py-12 text-center">
                    <UserGroupIcon className="mx-auto h-10 w-10 text-violet-300" />
                    <p className="mt-4 font-bold text-slate-900">Aucune équipe suggérée</p>
                    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                      Le service de matching n'a pas trouvé de combinaison éligible pour les exigences actuelles.
                    </p>
                  </div>
                ) : null}
              </div>
            </section>
          </main>
        </div>
      </div>

      <EmployeeMatchDrawer
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setSelected(null);
        }}
        projectUuid={projectUuid}
        projectTeamSize={project.teamSize ?? null}
        row={selected}
        assignments={assignments}
        onAssignmentsChange={setAssignments}
      />
    </div>
  );
}
