import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { learningProgramApi, type LearningProgramSummary } from "../../api/learningProgramApi";
import { ChevronRightIcon, PlusIcon } from "../../icons/heroicons/outline";

function ProgramCardSkeleton() {
  return (
    <div className="h-40 animate-pulse rounded-2xl border border-slate-200/60 bg-gradient-to-br from-slate-100 to-slate-50/80" />
  );
}

export function TrainingManagerPrograms() {
  const [items, setItems] = useState<LearningProgramSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [size] = useState(12);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  useEffect(() => {
    setLoading(true);
    learningProgramApi
      .managerList({ page, size })
      .then((r) => {
        setError(null);
        setItems(r.data.items);
        setTotalPages(r.data.totalPages);
        setTotalElements(r.data.totalElements);
      })
      .catch((e) => setError(e?.response?.data?.error ?? "Chargement impossible"))
      .finally(() => setLoading(false));
  }, [page, size]);

  return (
    <div className="w-full space-y-10 px-4 pb-0 pt-2 sm:px-6 sm:pt-4">
      <header className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-violet-700/90">Catalogue interne</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Mes parcours</h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-600 sm:text-base">
            Créez des formations modulaires, mélangez vidéos, lectures et activités, puis publiez pour le catalogue
            employés.
          </p>
        </div>
        <Link to="/training-manager/programs/new" className="tm-btn tm-btn-primary rounded-2xl px-6 py-3.5 text-sm font-bold">
          <PlusIcon className="h-5 w-5" />
          Nouveau parcours
        </Link>
      </header>

      {error && (
        <div className="rounded-2xl border border-rose-200/80 bg-rose-50 px-5 py-4 text-sm text-rose-900 shadow-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <ProgramCardSkeleton />
          <ProgramCardSkeleton />
          <ProgramCardSkeleton />
        </div>
      ) : items.length === 0 ? (
        <div className="tm-empty-state relative overflow-hidden rounded-3xl px-8 py-20">
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-300/50 to-transparent"
            aria-hidden
          />
          <p className="text-base font-semibold text-slate-800">Aucun parcours pour l’instant</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
            Lancez votre première formation : titre, compétence cible, puis modules et contenus dans l’éditeur.
          </p>
          <Link to="/training-manager/programs/new" className="tm-btn tm-btn-primary mt-8 rounded-2xl px-6 py-3 text-sm font-bold">
            <PlusIcon className="h-5 w-5" />
            Créer le premier parcours
          </Link>
        </div>
      ) : (
        <div className="flex min-h-[calc(100vh-18rem)] flex-col">
          <ul className="grid gap-5 pb-8 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((p) => (
              <li key={p.uuid}>
                <Link
                  to={`/training-manager/programs/${p.uuid}`}
                  className="group relative flex h-full min-h-[200px] flex-col overflow-hidden rounded-2xl border border-slate-200/70 bg-white/95 p-6 shadow-[0_2px_8px_rgba(15,23,42,0.04)] ring-1 ring-slate-900/[0.02] transition-all duration-200 hover:-translate-y-0.5 hover:border-violet-300/60 hover:shadow-[0_12px_40px_-16px_rgba(99,102,241,0.22)]"
                >
                  <span
                    className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-violet-500 via-indigo-500 to-teal-500 opacity-90 transition-opacity group-hover:opacity-100"
                    aria-hidden
                  />
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="line-clamp-2 min-w-0 flex-1 text-lg font-bold leading-snug text-slate-900 transition-colors group-hover:text-violet-900">
                      {p.title}
                    </h2>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ring-1 ${
                        p.published
                          ? "bg-emerald-50 text-emerald-800 ring-emerald-200/80"
                          : "bg-amber-50 text-amber-900 ring-amber-200/80"
                      }`}
                    >
                      {p.published ? "Publié" : "Brouillon"}
                    </span>
                  </div>
                  {p.skillName && (
                    <p className="mt-3 inline-flex max-w-full items-center rounded-lg bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-800 ring-1 ring-violet-100">
                      {p.skillName}
                    </p>
                  )}
                  <p className="mt-3 line-clamp-2 flex-1 text-sm leading-relaxed text-slate-600">
                    {p.description || "Aucune description — à compléter dans l’éditeur."}
                  </p>
                  <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 text-xs text-slate-500">
                    <div className="flex flex-wrap gap-x-3 gap-y-1">
                      <span>
                        Niveau <strong className="font-semibold text-slate-800">{p.targetSkillLevel}</strong>
                      </span>
                      <span className="text-slate-300" aria-hidden>
                        ·
                      </span>
                      <span>
                        {p.courseCount} module{p.courseCount > 1 ? "s" : ""} · {p.videoCount} vidéo
                        {p.videoCount > 1 ? "s" : ""}
                      </span>
                    </div>
                    <span className="flex items-center gap-0.5 text-sm font-semibold text-violet-700 transition group-hover:gap-1">
                      Éditer
                      <ChevronRightIcon className="h-4 w-4" />
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
          <div className="sticky bottom-0 mt-auto pt-4">
            <div className="-mx-1 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/70 bg-white/95 px-5 py-3 text-sm shadow-[0_-10px_24px_-18px_rgba(15,23,42,0.35)] backdrop-blur">
              <p className="text-slate-600">
                {totalElements} parcours au total — page {page + 1} / {Math.max(1, totalPages)}
              </p>
              <div className="flex items-center gap-2">
                <button type="button" disabled={page <= 0} onClick={() => setPage((p) => Math.max(0, p - 1))} className="tm-btn tm-btn-secondary rounded-lg px-3 py-1.5 font-semibold">
                  Précédent
                </button>
                <button type="button" disabled={page + 1 >= totalPages} onClick={() => setPage((p) => p + 1)} className="tm-btn tm-btn-secondary rounded-lg px-3 py-1.5 font-semibold">
                  Suivant
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
