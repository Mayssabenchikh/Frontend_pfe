import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { assignmentsApi, type AssignmentDto } from "../../api/assignmentsApi";
import { employeeProjectsApi, type ProjectDto } from "../../api/projectsApi";
import {
  ArrowTopRightOnSquareIcon,
  BriefcaseIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ClockIcon,
  FolderIcon,
  InboxStackIcon,
  SparklesIcon,
  UserGroupIcon,
} from "../../icons/heroicons/outline";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function statusMeta(status?: string | null) {
  if (status === "ACTIVE") return { label: "En cours", cls: "border-violet-200 bg-violet-50 text-violet-700", dot: "bg-violet-600" };
  if (status === "CLOSED") return { label: "Terminé", cls: "border-emerald-200 bg-emerald-50 text-emerald-700", dot: "bg-emerald-500" };
  return { label: "Brouillon", cls: "border-slate-200 bg-slate-50 text-slate-600", dot: "bg-slate-400" };
}

function assignmentStatusMeta(status?: string | null) {
  if (status === "ACCEPTED") return { label: "Acceptée", cls: "border-emerald-200 bg-emerald-50 text-emerald-700" };
  if (status === "PENDING") return { label: "En attente", cls: "border-orange-200 bg-orange-50 text-orange-700" };
  if (status === "REFUSED") return { label: "Refusée", cls: "border-rose-200 bg-rose-50 text-rose-700" };
  return { label: "Clôturée", cls: "border-slate-200 bg-slate-50 text-slate-600" };
}

function formatDate(value?: string | null) {
  if (!value) return "Non renseignée";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

function LoadingDashboard() {
  return (
    <div className="grid gap-4 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="h-32 animate-pulse rounded-lg border border-slate-200 bg-white p-4">
          <div className="h-4 w-24 rounded-full bg-violet-100" />
          <div className="mt-6 h-8 w-16 rounded-full bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

export function EmployeeDashboard() {
  const [projects, setProjects] = useState<ProjectDto[]>([]);
  const [assignments, setAssignments] = useState<AssignmentDto[]>([]);
  const [projectTotal, setProjectTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([
      employeeProjectsApi.list({ page: 0, size: 100, order: "recent" }),
      assignmentsApi.myAssignments({ page: 0, size: 6, order: "recent" }),
    ])
      .then(([projectsRes, assignmentsRes]) => {
        if (cancelled) return;
        setProjects(projectsRes.data?.content ?? []);
        setProjectTotal(projectsRes.data?.totalElements ?? projectsRes.data?.content?.length ?? 0);
        setAssignments(assignmentsRes.data?.content ?? []);
      })
      .catch(() => {
        if (cancelled) return;
        setProjects([]);
        setAssignments([]);
        setProjectTotal(0);
        setError("Impossible de charger votre tableau de bord projets.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const stats = useMemo(() => {
    const active = projects.filter((project) => project.status === "ACTIVE").length;
    const closed = projects.filter((project) => project.status === "CLOSED").length;
    const requirements = projects.reduce((sum, project) => sum + (project.requirements?.length ?? 0), 0);
    const teamSlots = projects.reduce((sum, project) => sum + (project.teamSize ?? 0), 0);
    return { active, closed, requirements, teamSlots };
  }, [projects]);

  const recentProjects = projects.slice(0, 5);

  return (
    <section className="min-h-full w-full bg-[#f8f7ff]">
      <div className="w-full px-4 py-5 sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-[1680px] flex-col gap-5">
          <header className="rounded-lg border border-violet-100 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-lg border border-violet-200 bg-violet-50 px-3 py-1.5 text-sm font-bold text-violet-800">
                  <BriefcaseIcon className="h-4 w-4" />
                  Dashboard employee
                </div>
                <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">Vue projets</h1>
                <p className="mt-2 max-w-3xl text-base leading-7 text-slate-600">
                  Une synthèse claire de vos projets, affectations et compétences attendues avec les données disponibles dans la plateforme.
                </p>
              </div>
              <Link
                to="/employee/projects"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-violet-700 px-5 text-sm font-bold text-white shadow-sm shadow-violet-700/20 transition hover:bg-violet-800 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
              >
                Voir tous les projets
                <ArrowTopRightOnSquareIcon className="h-4 w-4" />
              </Link>
            </div>
          </header>

          {error ? (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">{error}</div>
          ) : null}

          {loading ? (
            <LoadingDashboard />
          ) : (
            <div className="grid gap-4 lg:grid-cols-4">
              {[
                { label: "Projets assignés", value: projectTotal, icon: FolderIcon, cls: "border-violet-200 bg-violet-50 text-violet-800" },
                { label: "En cours", value: stats.active, icon: ClockIcon, cls: "border-blue-200 bg-blue-50 text-blue-800" },
                { label: "Terminés", value: stats.closed, icon: CheckCircleIcon, cls: "border-emerald-200 bg-emerald-50 text-emerald-800" },
                { label: "Compétences attendues", value: stats.requirements, icon: SparklesIcon, cls: "border-orange-200 bg-orange-50 text-orange-800" },
              ].map((stat) => {
                const Icon = stat.icon;
                return (
                  <article key={stat.label} className={cn("rounded-lg border p-5 shadow-sm", stat.cls)}>
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-bold uppercase tracking-wide opacity-80">{stat.label}</p>
                      <Icon className="h-6 w-6 opacity-80" />
                    </div>
                    <p className="mt-4 text-4xl font-extrabold">{stat.value}</p>
                  </article>
                );
              })}
            </div>
          )}

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(360px,0.75fr)]">
            <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-950">Projets récents</h2>
                  <p className="mt-1 text-sm text-slate-500">Les derniers projets renvoyés par l'API employee.</p>
                </div>
                <Link to="/employee/projects" className="text-sm font-bold text-violet-700 hover:text-violet-900">
                  Tout voir
                </Link>
              </div>

              {loading ? (
                <div className="space-y-3 p-5">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="h-20 animate-pulse rounded-lg bg-slate-100" />
                  ))}
                </div>
              ) : recentProjects.length === 0 ? (
                <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 p-8 text-center">
                  <InboxStackIcon className="h-12 w-12 text-violet-300" />
                  <p className="text-base font-bold text-slate-900">Aucun projet assigné</p>
                  <p className="text-sm text-slate-500">Vos projets apparaîtront ici dès qu'ils seront disponibles.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {recentProjects.map((project) => {
                    const status = statusMeta(project.status);
                    return (
                      <Link
                        key={project.uuid}
                        to={`/employee/projects/${project.uuid}`}
                        className="group flex flex-col gap-3 px-5 py-4 transition hover:bg-violet-50/50 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={cn("inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-bold", status.cls)}>
                              <span className={cn("h-1.5 w-1.5 rounded-full", status.dot)} />
                              {status.label}
                            </span>
                            <span className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-600">
                              <SparklesIcon className="h-3.5 w-3.5" />
                              {project.requirements?.length ?? 0} compétence{(project.requirements?.length ?? 0) !== 1 ? "s" : ""}
                            </span>
                          </div>
                          <h3 className="mt-2 truncate text-lg font-extrabold text-slate-950">{project.name}</h3>
                          <p className="mt-1 line-clamp-1 text-sm text-slate-500">{project.description || "Aucune description disponible."}</p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2 text-sm font-semibold text-slate-600">
                          <CalendarDaysIcon className="h-4 w-4 text-slate-400" />
                          {formatDate(project.startDate)} → {formatDate(project.dueDate)}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </section>

            <aside className="rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-5 py-4">
                <h2 className="text-xl font-extrabold text-slate-950">Affectations</h2>
                <p className="mt-1 text-sm text-slate-500">Statuts réels de vos invitations et participations.</p>
              </div>

              {loading ? (
                <div className="space-y-3 p-5">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="h-16 animate-pulse rounded-lg bg-slate-100" />
                  ))}
                </div>
              ) : assignments.length === 0 ? (
                <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 p-8 text-center">
                  <UserGroupIcon className="h-12 w-12 text-violet-300" />
                  <p className="text-base font-bold text-slate-900">Aucune affectation</p>
                  <p className="text-sm text-slate-500">Les affectations employee apparaîtront ici.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {assignments.map((assignment) => {
                    const status = assignmentStatusMeta(assignment.status);
                    return (
                      <div key={assignment.uuid} className="px-5 py-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-base font-extrabold text-slate-950">{assignment.projectName}</p>
                            <p className="mt-1 text-sm text-slate-500">Invitation: {formatDate(assignment.invitedAt)}</p>
                          </div>
                          <span className={cn("shrink-0 rounded-md border px-2.5 py-1 text-xs font-bold", status.cls)}>{status.label}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </aside>
          </div>
        </div>
      </div>
    </section>
  );
}
