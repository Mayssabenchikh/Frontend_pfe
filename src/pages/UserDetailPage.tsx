import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeftIcon,
  BriefcaseIcon,
  BuildingOffice2Icon,
  CalendarDaysIcon,
  ClipboardDocumentCheckIcon,
  ClockIcon,
  EnvelopeIcon,
  InformationCircleIcon,
  PhoneIcon,
  ShieldCheckIcon,
  SparklesIcon,
  UserGroupIcon,
} from "../icons/heroicons/outline";
import { userDetailApi, type UserDetailDto, type UserSkillDetailDto } from "../api/userDetailApi";
import { getAvatarColor, getDisplayNameInitials } from "./admin/utils";
import { getSkillIconUrl } from "./admin/skillIcons";
import { getUserFacingApiMessage } from "../utils/apiUserMessage";

type Source = "admin" | "manager-project" | "employee-project";

type Props = {
  source: Source;
};

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admin",
  MANAGER: "Manager",
  EMPLOYEE: "Employé",
  TRAINING_MANAGER: "Responsable formation",
};

function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

function formatRoleLabel(role?: string | null) {
  if (!role) return "—";
  return ROLE_LABELS[role] ?? role;
}

function assignmentStatusBadge(status?: string | null) {
  if (status === "ACCEPTED") return { label: "Affecté", className: "border-emerald-200 bg-emerald-50 text-emerald-700" };
  if (status === "PENDING") return { label: "En attente", className: "border-amber-200 bg-amber-50 text-amber-700" };
  if (status === "REMOVED") return { label: "Retiré", className: "border-slate-200 bg-slate-50 text-slate-600" };
  return { label: status || "—", className: "border-rose-200 bg-rose-50 text-rose-700" };
}

function InfoField({ label, value, icon }: { label: string; value?: string | null; icon: ReactNode }) {
  if (!value) return null;
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm transition hover:border-violet-200 hover:shadow-md hover:shadow-violet-100/60">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-700 ring-1 ring-violet-100">
          {icon}
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">{label}</p>
          <p className="mt-1 truncate text-sm font-bold text-slate-950">{value}</p>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ icon, title, meta }: { icon: ReactNode; title: string; meta?: string }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-violet-100 bg-violet-50 text-violet-700 shadow-sm">
          {icon}
        </span>
        <div>
          <h2 className="text-xl font-black text-slate-950 sm:text-2xl">{title}</h2>
          <p className="mt-1 text-sm text-slate-500">Vue consolidée pour les équipes techniques</p>
        </div>
      </div>
      {meta ? <span className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-sm font-bold text-violet-700">{meta}</span> : null}
    </div>
  );
}

function SkillCard({ skill }: { skill: UserSkillDetailDto }) {
  const level = Math.max(0, Math.min(5, Number(skill.validatedLevel) || 0));
  const iconUrl = getSkillIconUrl(skill.skillName);

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-md hover:shadow-violet-100/70">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-violet-600 via-fuchsia-500 to-blue-500" />

      <div className="relative flex h-full flex-col gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-50 to-violet-100 ring-1 ring-violet-100">
            {iconUrl ? <img src={iconUrl} alt="" className="h-7 w-7 object-contain" /> : <SparklesIcon className="h-5 w-5 text-violet-700" />}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="break-words text-sm font-black leading-5 text-slate-950 sm:text-base">{skill.skillName}</h3>
            <p className="mt-1 text-xs font-medium text-slate-500">{skill.categoryName}</p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Niveau</p>
              <p className="mt-1 text-lg font-black text-slate-950">{level}/5</p>
            </div>
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, idx) => (
                <span key={idx} className={`h-1.5 w-5 rounded-full ${idx < level ? "bg-violet-700" : "bg-slate-200"}`} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

function UserDetailSkeleton() {
  return (
    <div className="min-h-full bg-[#fbfaff] px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-[1320px] flex-col gap-5">
        <div className="h-14 animate-pulse rounded-2xl bg-white shadow-sm" />
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="h-[360px] animate-pulse rounded-3xl bg-white shadow-sm" />
          <div className="h-[360px] animate-pulse rounded-3xl bg-white shadow-sm" />
        </div>
        <div className="h-72 animate-pulse rounded-3xl bg-white shadow-sm" />
        <div className="h-80 animate-pulse rounded-3xl bg-white shadow-sm" />
      </div>
    </div>
  );
}

export function UserDetailPage({ source }: Props) {
  const params = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState<UserDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const projectId = params.projectId ?? params.id ?? "";
  const employeeId = params.employeeId ?? "";
  const adminUserId = params.userId ?? location.pathname.match(/^\/admin\/users\/([^/]+)\/?$/)?.[1] ?? "";

  const backTo = useMemo(() => {
    if (source === "admin") return "/admin";
    if (source === "manager-project") return `/manager/projects/${projectId}`;
    return `/employee/projects/${projectId}`;
  }, [projectId, source]);

  const backLabel = source === "admin" ? "Retour à la liste" : "Retour";

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setUser(null);

    const request =
      source === "admin"
        ? userDetailApi.adminUser(adminUserId)
        : source === "manager-project"
          ? userDetailApi.managerProjectTeamMember(projectId, employeeId)
          : userDetailApi.employeeProjectTeamMember(projectId, employeeId);

    request
      .then((res) => {
        if (!cancelled) setUser(res.data ?? null);
      })
      .catch((err) => {
        if (!cancelled) setError(getUserFacingApiMessage(err, "Impossible de charger le profil."));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [adminUserId, employeeId, projectId, source]);

  if (loading) return <UserDetailSkeleton />;

  if (error || !user) {
    return (
      <div className="min-h-full bg-[#fbfaff] px-4 py-5 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-[1320px] rounded-3xl border border-rose-200 bg-white p-6 shadow-sm">
          <p className="font-bold text-rose-700">{error ?? "Profil introuvable"}</p>
          <button type="button" onClick={() => navigate(backTo)} className="mt-4 inline-flex items-center rounded-xl bg-violet-700 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-violet-800">
            Retour
          </button>
        </div>
      </div>
    );
  }

  const fullName = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || user.email;
  const initials = getDisplayNameInitials(fullName);
  const gradient = getAvatarColor(user.email || fullName);
  const roleLabel = formatRoleLabel(user.role);
  const professionalItems = [
    user.department ? { label: "Département", value: user.department, icon: <BuildingOffice2Icon className="h-4 w-4" /> } : null,
    user.jobTitle ? { label: "Poste", value: user.jobTitle, icon: <BriefcaseIcon className="h-4 w-4" /> } : null,
    user.hireDate ? { label: "Date d'embauche", value: formatDate(user.hireDate), icon: <CalendarDaysIcon className="h-4 w-4" /> } : null,
  ].filter(Boolean) as { label: string; value: string; icon: ReactNode }[];
  const validatedSkills = user.skills.filter((skill) => skill.status === "VALIDATED").length;
  const totalAssignments = user.assignments.length;

  return (
    <div className="min-h-full overflow-y-auto bg-[#fbfaff] px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-[1320px] space-y-5">
        <div className="flex flex-wrap items-center gap-3 px-0 py-0">
          <button type="button" onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-violet-800">
            <ArrowLeftIcon className="h-5 w-5" />
            {backLabel}
          </button>
          {source === "admin" ? (
            <>
              <span className="h-5 w-px bg-slate-200" />
              <Link to={backTo} className="text-sm font-bold text-slate-400 transition hover:text-violet-700">
                Utilisateurs
              </Link>
            </>
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-violet-500">Fiche interne</p>
          <h1 className="text-2xl font-black text-slate-950 sm:text-3xl">Profil collaborateur</h1>
          <p className="max-w-3xl text-sm leading-6 text-slate-500">
            Vue claire et structurée destinée aux équipes d’ingénierie pour consulter rapidement l’identité, les compétences validées et les affectations projets.
          </p>
        </div>

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
          <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="h-1.5 bg-gradient-to-r from-violet-700 via-fuchsia-500 to-blue-500" />
            <div className="bg-gradient-to-br from-white via-white to-violet-50/50 p-5 sm:p-6">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex min-w-0 flex-1 items-start gap-5">
                  <div className="relative shrink-0 rounded-3xl bg-white p-2 shadow-sm ring-1 ring-violet-100">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt={fullName} className="h-28 w-28 rounded-2xl object-cover shadow-sm ring-1 ring-violet-100 sm:h-32 sm:w-32" />
                    ) : (
                      <div
                        className="flex h-28 w-28 items-center justify-center rounded-2xl text-3xl font-black text-white shadow-sm ring-1 ring-violet-100 sm:h-32 sm:w-32"
                        style={{ background: `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})` }}
                      >
                        {initials}
                      </div>
                    )}
                    <span className={`absolute bottom-3 right-3 h-6 w-6 rounded-full border-4 border-white ${user.enabled ? "bg-emerald-500" : "bg-slate-400"}`} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">{fullName}</h2>
                      <span className={`rounded-full border px-3 py-1 text-xs font-black uppercase tracking-wide ${user.enabled ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-50 text-slate-600"}`}>
                        {user.enabled ? "Actif" : "Inactif"}
                      </span>
                    </div>
                    <p className="mt-3 text-lg font-semibold text-slate-700">{roleLabel}</p>
                    <div className="mt-5 flex flex-wrap gap-3 text-sm text-slate-600">
                      <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 shadow-sm">
                        <EnvelopeIcon className="h-4 w-4 text-violet-600" />
                        {user.email}
                      </span>
                      {user.phone ? (
                        <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 shadow-sm">
                          <PhoneIcon className="h-4 w-4 text-violet-600" />
                          {user.phone}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="grid min-w-[260px] gap-3 sm:grid-cols-2 lg:min-w-[320px] lg:grid-cols-2">
                  <div className="rounded-2xl border border-violet-100 bg-violet-50 px-4 py-4">
                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-violet-500">Compétences validées</p>
                    <p className="mt-2 text-3xl font-black text-violet-950">{validatedSkills}</p>
                  </div>
                  <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-4">
                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-blue-500">Affectations</p>
                    <p className="mt-2 text-3xl font-black text-blue-950">{totalAssignments}</p>
                  </div>
                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-4">
                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-emerald-500">Statut</p>
                    <p className="mt-2 text-xl font-black text-emerald-950">{user.enabled ? "Actif" : "Inactif"}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">Créé le</p>
                    <p className="mt-2 text-xl font-black text-slate-900">{formatDate(user.createdAt)}</p>
                  </div>
                </div>
              </div>

              {professionalItems.length ? (
                <div className="mt-6 grid gap-3 border-t border-slate-200 pt-5 md:grid-cols-3">
                  {professionalItems.map((item) => (
                    <InfoField key={item.label} label={item.label} value={item.value} icon={item.icon} />
                  ))}
                </div>
              ) : null}
            </div>
          </article>

          <aside className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <SectionHeader icon={<InformationCircleIcon className="h-5 w-5" />} title="Résumé du profil" />
            <div className="mt-5 space-y-3">
              <div className="flex items-center gap-3 rounded-2xl border border-violet-100 bg-violet-50 px-4 py-4">
                <ShieldCheckIcon className="h-5 w-5 shrink-0 text-violet-700" />
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.16em] text-violet-500">Rôle</p>
                  <p className="mt-1 text-base font-black text-violet-950">{roleLabel}</p>
                </div>
              </div>
              {user.department ? (
                <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
                  <BuildingOffice2Icon className="h-5 w-5 shrink-0 text-slate-500" />
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">Département</p>
                    <p className="mt-1 text-base font-black text-slate-950">{user.department}</p>
                  </div>
                </div>
              ) : null}
              {user.createdAt ? (
                <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
                  <ClockIcon className="h-5 w-5 shrink-0 text-slate-500" />
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">Créé le</p>
                    <p className="mt-1 text-base font-black text-slate-950">{formatDate(user.createdAt)}</p>
                  </div>
                </div>
              ) : null}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-3 py-4 text-center">
                  <p className="text-xl font-black text-emerald-700">{validatedSkills}</p>
                  <p className="mt-1 text-[11px] font-black uppercase tracking-wide text-emerald-600">Validées</p>
                </div>
                <div className="rounded-2xl border border-violet-100 bg-violet-50 px-3 py-4 text-center">
                  <p className="text-xl font-black text-violet-700">{user.skills.length}</p>
                  <p className="mt-1 text-[11px] font-black uppercase tracking-wide text-violet-600">Compétences</p>
                </div>
              </div>
            </div>
          </aside>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <SectionHeader
            icon={<ClipboardDocumentCheckIcon className="h-5 w-5" />}
            title="Compétences clés"
            meta={`${user.skills.length} compétence${user.skills.length > 1 ? "s" : ""}`}
          />
          {user.skills.length ? (
            <div className="mt-6 grid gap-4 lg:grid-cols-3 2xl:grid-cols-4">
              {user.skills.map((skill) => (
                <SkillCard key={skill.uuid} skill={skill} />
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-dashed border-violet-200 bg-violet-50/30 px-6 py-10 text-center text-sm font-semibold text-slate-500">
              Aucune compétence disponible.
            </div>
          )}
        </section>

        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-gradient-to-r from-white via-white to-violet-50/60 px-5 py-4 sm:px-6">
            <SectionHeader
              icon={<UserGroupIcon className="h-5 w-5" />}
              title="Affectations projets"
              meta={`${user.assignments.length} projet${user.assignments.length > 1 ? "s" : ""}`}
            />
          </div>

          {user.assignments.length ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead className="bg-slate-50 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                  <tr>
                    <th className="px-5 py-3 sm:px-6">Projet</th>
                    <th className="px-5 py-3 sm:px-6">Début</th>
                    <th className="px-5 py-3 sm:px-6">Échéance</th>
                    <th className="px-5 py-3 sm:px-6">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {user.assignments.map((assignment) => {
                    const meta = assignmentStatusBadge(assignment.status);
                    return (
                      <tr key={assignment.uuid} className="transition hover:bg-violet-50/40">
                        <td className="px-5 py-4 text-sm font-bold text-slate-950 sm:px-6">{assignment.projectName}</td>
                        <td className="px-5 py-4 text-sm text-slate-600 sm:px-6">{formatDate(assignment.projectStartDate)}</td>
                        <td className="px-5 py-4 text-sm text-slate-600 sm:px-6">{formatDate(assignment.projectDueDate)}</td>
                        <td className="px-5 py-4 sm:px-6">
                          <span className={`rounded-full border px-3 py-1 text-xs font-black uppercase ${meta.className}`}>{meta.label}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-7 py-10 text-center text-sm font-semibold text-slate-500">Aucune affectation disponible.</div>
          )}
        </section>
      </div>
    </div>
  );
}