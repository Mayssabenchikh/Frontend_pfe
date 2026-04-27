import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ChartBarSquareIcon,
  RocketLaunchIcon,
  CircleStackIcon,
  CommandLineIcon,
} from "../../icons/heroicons/outline";
import { projectsApi, type ProjectDto } from "../../api/projectsApi";
import { AlertBanner } from "../../components/AlertBanner";

const statusLabel = (status?: string | null) =>
  status === "ACTIVE" ? "En cours" : status === "CLOSED" ? "Terminé" : "Brouillon";

const statusClass = (status?: string | null) =>
  status === "ACTIVE"
    ? "bg-emerald-100 text-emerald-700"
    : status === "CLOSED"
      ? "bg-slate-200 text-slate-600"
      : "bg-violet-100 text-violet-700";

const projectGlyphs = [RocketLaunchIcon, CircleStackIcon, CommandLineIcon];

const requirementTagClasses = [
  "border-sky-200 bg-sky-50 text-sky-700",
  "border-emerald-200 bg-emerald-50 text-emerald-700",
  "border-amber-200 bg-amber-50 text-amber-700",
  "border-rose-200 bg-rose-50 text-rose-700",
  "border-indigo-200 bg-indigo-50 text-indigo-700",
  "border-cyan-200 bg-cyan-50 text-cyan-700",
];

export function ManagerMatchingHub() {
  const [projects, setProjects] = useState<ProjectDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    projectsApi
      .list({ size: 200, order: "recent" })
      .then((res) => setProjects(res.data?.content ?? []))
      .catch(() => setError("Impossible de charger les projets."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="min-h-full w-full" style={{ background: "var(--luxury-light-bg, #f8f7ff)" }}>
      <div className="mx-auto w-full max-w-[1680px] px-3 py-2.5 sm:px-8 sm:py-4 lg:px-12 lg:py-5 xl:px-14">
        <header className="mb-4 sm:mb-5">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Profils et équipes</h1>
          <p className="text-sm text-slate-600">
            Gérez vos projets et trouvez les meilleurs profils selon les compétences demandées.
          </p>
        </header>

        {loading ? (
          <div className="space-y-3" aria-live="polite" aria-busy="true">
            <p className="text-sm font-medium text-slate-600">Chargement des besoins en cours…</p>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-64 animate-pulse rounded-[26px] border border-violet-100/80 bg-white/80 shadow-sm shadow-violet-100/40"
                />
              ))}
            </div>
          </div>
        ) : error ? (
          <AlertBanner message={error} />
        ) : !projects.length ? (
          <p className="rounded-3xl border border-violet-100/80 bg-white px-6 py-12 text-center text-sm text-slate-600 shadow-md shadow-violet-100/50">
            Aucun besoin enregistré. Créez un projet depuis l&apos;onglet{" "}
            <Link
              to="/manager/projects"
              className="rounded-lg font-medium text-violet-700 underline-offset-2 transition hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
            >
              Projets
            </Link>
            .
          </p>
        ) : (
          <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {projects.map((p, idx) => {
              const Glyph = projectGlyphs[idx % projectGlyphs.length];
              const requirements = p.requirements ?? [];
              return (
              <li
                key={p.uuid}
                className="group relative flex min-h-[270px] min-w-0 flex-col overflow-hidden rounded-[26px] border border-violet-100/80 bg-white p-5 shadow-[0_12px_30px_rgba(110,86,207,0.1)] transition hover:-translate-y-1 hover:border-violet-200 hover:shadow-[0_16px_34px_rgba(110,86,207,0.14)]"
              >
                <div className="pointer-events-none absolute inset-x-5 bottom-5 h-16 rounded-[22px] bg-gradient-to-r from-violet-100/45 to-transparent blur-2xl" />

                <div className="relative flex items-start justify-between gap-4">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                    <Glyph className="h-5 w-5" />
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass(p.status)}`}>
                    {statusLabel(p.status)}
                  </span>
                </div>

                <div className="relative mt-5 min-w-0 flex-1">
                  <h2 className="line-clamp-2 text-xl font-black leading-tight tracking-tight text-slate-800">{p.name}</h2>
                  <p className="mt-1.5 line-clamp-2 text-sm leading-5 text-slate-500">{p.description || "Aucune description disponible."}</p>

                  <div className="mt-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.13em] text-slate-400">Compétences</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {requirements.length ? (
                        requirements.map((req, reqIdx) => (
                          <span
                            key={`${p.uuid}-${req.uuid}`}
                            className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${requirementTagClasses[(idx + reqIdx) % requirementTagClasses.length]}`}
                          >
                            {req.skillName}
                          </span>
                        ))
                      ) : (
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-500">
                          Aucune compétence définie
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="relative mt-5 flex flex-wrap gap-2">
                  <Link
                    to={`/manager/matching/${encodeURIComponent(p.uuid)}/workspace`}
                    className="inline-flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-2xl bg-gradient-to-r from-violet-700 to-fuchsia-600 px-3 py-2 text-sm font-semibold text-white transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
                  >
                    <ChartBarSquareIcon className="h-4 w-4 shrink-0" />
                    Profils & équipe
                  </Link>
                </div>
              </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
