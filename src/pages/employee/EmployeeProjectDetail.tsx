import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { AssignmentDto } from "../../api/assignmentsApi";
import { employeeProjectsApi, type ProjectDto, type ProjectRequirementDto } from "../../api/projectsApi";
import {
  ArrowLeftIcon,
  BriefcaseIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ClockIcon,
  EnvelopeIcon,
  ExclamationCircleIcon,
  InboxStackIcon,
  InformationCircleIcon,
  SparklesIcon,
  UserCircleIcon,
  UserGroupIcon,
} from "../../icons/heroicons/outline";
import { getUserFacingApiMessage } from "../../utils/apiUserMessage";
import { getAvatarColor, getDisplayNameInitials } from "../admin/utils";
import { getSkillIconUrl } from "../admin/skillIcons";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function statusMeta(status?: string | null) {
  if (status === "ACTIVE") return { label: "En cours", cls: "border-violet-200 bg-violet-50 text-violet-700", dot: "bg-violet-600" };
  if (status === "CLOSED") return { label: "Terminé", cls: "border-emerald-200 bg-emerald-50 text-emerald-700", dot: "bg-emerald-500" };
  return { label: "Brouillon", cls: "border-slate-200 bg-slate-50 text-slate-600", dot: "bg-slate-400" };
}

function priorityMeta(priority?: string | null) {
  if (priority === "HIGH") return { label: "Haute priorité", cls: "border-orange-200 bg-orange-50 text-orange-700" };
  if (priority === "LOW") return { label: "Priorité basse", cls: "border-blue-200 bg-blue-50 text-blue-700" };
  if (priority === "MEDIUM") return { label: "Priorité moyenne", cls: "border-violet-200 bg-violet-50 text-violet-700" };
  return { label: "Priorité non définie", cls: "border-slate-200 bg-slate-50 text-slate-600" };
}

function assignmentStatusMeta(status?: string | null) {
  if (status === "ACCEPTED") return { label: "Affecté", cls: "border-emerald-200 bg-emerald-50 text-emerald-700" };
  if (status === "PENDING") return { label: "En attente", cls: "border-orange-200 bg-orange-50 text-orange-700" };
  if (status === "REFUSED") return { label: "Refusé", cls: "border-rose-200 bg-rose-50 text-rose-700" };
  return { label: "Retiré", cls: "border-slate-200 bg-slate-50 text-slate-600" };
}

function formatDate(value?: string | null) {
  if (!value) return "Non renseignée";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

function DetailSkeleton() {
  return (
    <div className="w-full px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto grid w-full max-w-[1680px] gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-5">
          <div className="h-72 animate-pulse rounded-lg border border-slate-200 bg-white" />
          <div className="h-96 animate-pulse rounded-lg border border-slate-200 bg-white" />
        </div>
        <div className="h-[520px] animate-pulse rounded-lg border border-slate-200 bg-white" />
      </div>
    </div>
  );
}

function InfoTile({ icon: Icon, label, value }: { icon: typeof CalendarDaysIcon; label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
        <Icon className="h-4 w-4 text-violet-600" />
        {label}
      </div>
      <p className="mt-2 text-base font-extrabold text-slate-950">{value}</p>
    </div>
  );
}

function RequirementCard({ requirement }: { requirement: ProjectRequirementDto }) {
  const iconUrl = getSkillIconUrl(requirement.skillName);

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:border-violet-200 hover:shadow-md hover:shadow-violet-100/60">
      <div className="flex items-start gap-3">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-violet-100 bg-violet-50 p-2">
          {iconUrl ? (
            <img
              src={iconUrl}
              alt=""
              className="h-full w-full object-contain contrast-125 saturate-125"
              loading="lazy"
            />
          ) : (
            <SparklesIcon className="h-7 w-7 text-violet-700" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-lg font-extrabold text-slate-950">{requirement.skillName}</p>
              <p className="mt-1 text-sm font-semibold text-slate-500">{requirement.categoryName || "Catégorie non renseignée"}</p>
            </div>
            <span className="shrink-0 rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">Niveau {requirement.levelMin}</span>
          </div>
        </div>
      </div>
    </article>
  );
}

export function EmployeeProjectDetail() {
  const { id: projectUuid } = useParams<{ id: string }>();
  const [project, setProject] = useState<ProjectDto | null>(null);
  const [team, setTeam] = useState<AssignmentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectUuid || !projectUuid.trim()) {
      setError("ID invalide");
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([employeeProjectsApi.get(projectUuid), employeeProjectsApi.team(projectUuid)])
      .then(([pRes, tRes]) => {
        if (cancelled) return;
        setProject(pRes.data ?? null);
        setTeam(Array.isArray(tRes.data) ? tRes.data : []);
      })
      .catch((err) => {
        if (cancelled) return;
        setProject(null);
        setTeam([]);
        setError(getUserFacingApiMessage(err, "Impossible de charger le projet."));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [projectUuid]);

  const teamMembers = useMemo(() => {
    const items = Array.isArray(team) ? team : [];
    return [...items].sort((a, b) => {
      const an = (a.employeeName || a.employeeEmail || "").toLowerCase();
      const bn = (b.employeeName || b.employeeEmail || "").toLowerCase();
      return an.localeCompare(bn);
    });
  }, [team]);

  if (loading) return <DetailSkeleton />;

  if (error || !project) {
    return (
      <div className="min-h-full w-full bg-[#f8f7ff] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl rounded-lg border border-rose-200 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-rose-50">
              <ExclamationCircleIcon className="h-6 w-6 text-rose-600" />
            </div>
            <div>
              <p className="text-lg font-extrabold text-slate-950">Projet indisponible</p>
              <p className="mt-1 text-sm font-semibold text-rose-700">{error ?? "Projet introuvable"}</p>
              <Link
                to="/employee/projects"
                className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-violet-700 px-4 text-sm font-bold text-white transition hover:bg-violet-800 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
              >
                <ArrowLeftIcon className="h-4 w-4" />
                Retour aux projets
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const status = statusMeta(project.status);
  const priority = priorityMeta(project.priority);
  const requirements = project.requirements ?? [];

  return (
    <section className="min-h-full w-full bg-[#f8f7ff]">
      <div className="w-full px-4 py-5 sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-[1680px] flex-col gap-5">
          <Link
            to="/employee/projects"
            className="inline-flex h-11 w-fit items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-800 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Retour aux projets
          </Link>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
            <main className="flex min-w-0 flex-col gap-5">
              <header className="overflow-hidden rounded-lg border border-violet-100 bg-white shadow-sm">
                <div className="h-1.5 bg-gradient-to-r from-violet-700 via-blue-500 to-rose-500" />
                <div className="p-5 sm:p-6">
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-2 rounded-lg border border-violet-200 bg-violet-50 px-3 py-1.5 text-sm font-bold text-violet-800">
                          <BriefcaseIcon className="h-4 w-4" />
                          Détail projet
                        </span>
                        <span className={cn("inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-bold", status.cls)}>
                          <span className={cn("h-1.5 w-1.5 rounded-full", status.dot)} />
                          {status.label}
                        </span>
                        <span className={cn("inline-flex rounded-md border px-2.5 py-1 text-xs font-bold", priority.cls)}>{priority.label}</span>
                      </div>
                      <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">{project.name}</h1>
                      <p className="mt-3 max-w-4xl text-base leading-7 text-slate-600">{project.description || "Aucune description disponible pour ce projet."}</p>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <InfoTile icon={CalendarDaysIcon} label="Début" value={formatDate(project.startDate)} />
                    <InfoTile icon={ClockIcon} label="Échéance" value={formatDate(project.dueDate)} />
                    <InfoTile icon={SparklesIcon} label="Compétences" value={requirements.length} />
                    <InfoTile icon={UserGroupIcon} label="Taille équipe" value={project.teamSize ?? "Non renseignée"} />
                  </div>
                </div>
              </header>

              <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-950">Exigences en compétences</h2>
                  </div>
                  <span className="w-fit rounded-md border border-violet-200 bg-violet-50 px-3 py-1 text-sm font-bold text-violet-700">
                    {requirements.length} compétence{requirements.length !== 1 ? "s" : ""}
                  </span>
                </div>

                {requirements.length === 0 ? (
                  <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 p-8 text-center">
                    <InboxStackIcon className="h-12 w-12 text-violet-300" />
                    <p className="text-base font-bold text-slate-900">Aucune exigence renseignée</p>
                  </div>
                ) : (
                  <div className="grid gap-4 p-5 md:grid-cols-2">
                    {requirements.map((requirement) => (
                      <RequirementCard key={requirement.uuid} requirement={requirement} />
                    ))}
                  </div>
                )}
              </section>

              <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-950">Membres d'équipe</h2>
                  </div>
                  <span className="w-fit rounded-md border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-bold text-blue-700">
                    {teamMembers.length} membre{teamMembers.length !== 1 ? "s" : ""}
                  </span>
                </div>

                {teamMembers.length === 0 ? (
                  <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 p-8 text-center">
                    <UserGroupIcon className="h-12 w-12 text-violet-300" />
                    <p className="text-base font-bold text-slate-900">Aucun membre d'équipe</p>
                    <p className="max-w-md text-sm leading-6 text-slate-500">Aucun membre accepté n'est renvoyé pour ce projet.</p>
                  </div>
                ) : (
                  <div className="grid gap-4 p-5 md:grid-cols-2">
                    {teamMembers.map((member) => {
                      const name = member.employeeName || member.employeeEmail || "Membre";
                      const seed = member.employeeEmail || name;
                      const initials = getDisplayNameInitials(name);
                      const gradient = getAvatarColor(seed);
                      const memberStatus = assignmentStatusMeta(member.status);
                      return (
                        <article
                          key={member.uuid}
                          className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:border-violet-200 hover:shadow-md hover:shadow-violet-100/60"
                        >
                          <div className="flex items-start gap-3">
                            {member.employeeAvatarUrl ? (
                              <img src={member.employeeAvatarUrl} alt={name} className="h-14 w-14 shrink-0 rounded-lg border border-slate-200 object-cover" />
                            ) : (
                              <div
                                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg text-sm font-extrabold text-white"
                                style={{ background: `linear-gradient(135deg,${gradient[0]},${gradient[1]})` }}
                              >
                                {initials}
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <p className="truncate text-lg font-extrabold text-slate-950">{name}</p>
                                  <p className="mt-1 truncate text-sm text-slate-500">{member.employeeEmail}</p>
                                </div>
                                <span className={cn("rounded-md border px-2.5 py-1 text-xs font-bold", memberStatus.cls)}>{memberStatus.label}</span>
                              </div>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </section>
            </main>

            <aside className="flex flex-col gap-5">
              <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="flex items-center gap-2 text-xl font-extrabold text-slate-950">
                  <InformationCircleIcon className="h-6 w-6 text-violet-700" />
                  Informations
                </h2>
                <div className="mt-5 space-y-3">
                  <InfoTile icon={UserCircleIcon} label="Lead" value={project.leadName || "Non renseigné"} />
                  <InfoTile icon={EnvelopeIcon} label="Email lead" value={project.leadEmail || "Non renseigné"} />
                  <InfoTile icon={CheckCircleIcon} label="Statut" value={status.label} />
                  <InfoTile icon={SparklesIcon} label="Priorité" value={priority.label} />
                </div>
              </section>

            </aside>
          </div>
        </div>
      </div>
    </section>
  );
}
