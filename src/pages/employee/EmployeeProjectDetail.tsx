import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { employeeProjectsApi, type ProjectDto } from "../../api/projectsApi";
import type { AssignmentDto } from "../../api/assignmentsApi";
import { ArrowLeftIcon, InboxStackIcon, SparklesIcon, UserCircleIcon } from "../../icons/heroicons/outline";
import { getAvatarColor, getDisplayNameInitials } from "../admin/utils";
import { getUserFacingApiMessage } from "../../utils/apiUserMessage";

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-md border border-violet-200 bg-violet-50 px-2.5 py-0.5 text-[11px] font-semibold text-violet-700">
      {children}
    </span>
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

  if (loading) {
    return <div className="px-4 py-8 text-sm text-slate-500 sm:px-6">Chargement…</div>;
  }

  if (error || !project) {
    return (
      <div className="px-4 py-8 sm:px-6">
        <p className="text-sm font-semibold text-red-600">{error ?? "Projet introuvable"}</p>
        <Link to="/employee/projects" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-violet-700 hover:text-violet-800">
          <ArrowLeftIcon className="h-4 w-4" />
          Retour à mes projets
        </Link>
      </div>
    );
  }

  const currentStatus = (() => {
    const s = project.status ?? "DRAFT";
    if (s === "ACTIVE") {
      return {
        label: "En cours",
        cls: "border-violet-200 bg-violet-50 text-violet-700",
        dot: "bg-violet-600",
      };
    }
    if (s === "CLOSED") {
      return {
        label: "Terminé",
        cls: "border-emerald-200 bg-emerald-50 text-emerald-700",
        dot: "bg-emerald-600",
      };
    }
    return {
      label: "Brouillon",
      cls: "border-slate-200 bg-slate-50 text-slate-600",
      dot: "bg-slate-400",
    };
  })();

  const currentPriority = (() => {
    const p = project.priority ?? "MEDIUM";
    if (p === "HIGH") {
      return { label: "Haute", cls: "border-amber-200 bg-amber-50 text-amber-700", icon: "⚡" };
    }
    if (p === "LOW") {
      return { label: "Basse", cls: "border-slate-200 bg-slate-50 text-slate-600", icon: "↓" };
    }
    return { label: "Moyenne", cls: "border-indigo-200 bg-indigo-50 text-indigo-700", icon: "•" };
  })();

  return (
    <div className="min-h-full w-full bg-[#f8f7ff] px-3 py-3 sm:px-4 sm:py-4 md:px-6 md:py-6">
      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-4">
        {/* Topbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-1 py-1">
          <Link
            to="/employee/projects"
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-blue-300 hover:text-blue-700"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Retour à mes projets
          </Link>
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
          {/* Left */}
          <section className="flex flex-col gap-4 xl:col-span-8">
            {/* Hero card */}
            <article className="overflow-hidden rounded-3xl border border-violet-100 bg-white shadow-sm">
              <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 via-violet-500 to-pink-500" />
              <div className="p-4 sm:p-5">
                <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-500">Détails du projet</p>
                    <h1 className="mt-1 truncate text-xl font-bold text-slate-800 sm:text-2xl">{project.name}</h1>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${currentStatus.cls}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${currentStatus.dot}`} />
                      {currentStatus.label}
                    </span>
                    <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold ${currentPriority.cls}`}>
                      <span className="text-[10px]">{currentPriority.icon}</span>
                      {currentPriority.label}
                    </span>
                  </div>
                </div>

                {/* Stats strip */}
                <div className="mb-4 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-blue-50 px-4 py-3 text-center">
                    <p className="text-xl font-bold text-blue-600">{project.requirements?.length ?? 0}</p>
                    <p className="text-xs text-blue-400">Compétences</p>
                  </div>
                  <div className="rounded-2xl bg-violet-50 px-4 py-3 text-center">
                    <p className="text-xl font-bold text-violet-600">{project.teamSize ?? 1}</p>
                    <p className="text-xs text-violet-400">Membres</p>
                  </div>
                </div>

                {/* Description */}
                <h2 className="text-sm font-semibold text-slate-800">À propos du projet</h2>
                <p className="mt-2 rounded-2xl bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">
                  {project.description || "Aucune description disponible."}
                </p>
              </div>
            </article>

            {/* Team members */}
            <article className="rounded-3xl border border-violet-100 bg-white p-4 shadow-sm sm:p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 className="flex items-center gap-2 text-base font-semibold text-slate-800">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50">
                    <UserCircleIcon className="h-4 w-4 text-blue-600" />
                  </span>
                  Équipe du projet
                </h2>
                <span className="inline-flex items-center rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
                  {teamMembers.length} membre{teamMembers.length !== 1 ? "s" : ""}
                </span>
              </div>

              {teamMembers.length === 0 ? (
                <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200/80 bg-white px-6 py-16 text-center shadow-[0_10px_28px_rgba(15,23,42,0.06)]">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-violet-500/15 bg-violet-500/10 shadow-sm">
                    <InboxStackIcon className="h-8 w-8 text-violet-700" />
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <p className="text-sm font-bold text-violet-900">Aucun membre</p>
                    <p className="text-xs text-violet-400">L'équipe apparaîtra ici</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {teamMembers.map((m) => {
                    const name = m.employeeName || m.employeeEmail || "—";
                    const seed = m.employeeEmail || name;
                    const initials = getDisplayNameInitials(name);
                    const gradient = getAvatarColor(seed);
                    return (
                      <div
                        key={m.employeeKeycloakId}
                        className="group flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm transition hover:-translate-y-px hover:border-violet-200 hover:shadow-md"
                      >
                        {m.employeeAvatarUrl ? (
                          <img
                            src={m.employeeAvatarUrl}
                            alt={name}
                            className="h-12 w-12 shrink-0 rounded-2xl border border-violet-100 object-cover shadow-sm"
                          />
                        ) : (
                          <div
                            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-[11px] font-bold text-white shadow-sm ring-1 ring-white/40"
                            style={{
                              background: `linear-gradient(135deg,${gradient[0]},${gradient[1]})`,
                              boxShadow: `0 10px 22px ${gradient[0]}20`,
                            }}
                          >
                            {initials}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-slate-900">{name}</p>
                              <p className="truncate text-xs text-slate-500">{m.employeeEmail}</p>
                            </div>
                            <span className="shrink-0 inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                              Affecté
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </article>
          </section>

          {/* Right */}
          <aside className="flex flex-col gap-4 xl:col-span-4">
            <article className="rounded-3xl border border-violet-100 bg-white p-4 shadow-sm sm:p-5">
              <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-800">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-50">
                  <SparklesIcon className="h-4 w-4 text-violet-600" />
                </span>
                Informations
              </h2>

              <div className="grid grid-cols-1 gap-3">
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Lead</p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">{project.leadName || "—"}</p>
                  <p className="text-xs text-slate-500">{project.leadEmail || "—"}</p>
                </div>

                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Dates</p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {project.startDate ?? "—"} → {project.dueDate ?? "—"}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Taille d'équipe</p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">{project.teamSize ?? "—"}</p>
                </div>

                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Ma participation</p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    <Badge>Affecté au projet</Badge>
                  </p>
                </div>
              </div>
            </article>
          </aside>
        </div>
      </div>
    </div>
  );
}

