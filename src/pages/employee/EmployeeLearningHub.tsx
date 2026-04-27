import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { trainingApi, type EmployeeTrainingProgress, type RecommendationItem } from "../../api/trainingApi";
import { MagnifyingGlassIcon } from "../../icons/heroicons/outline";
import { useEmployeeLearningHubData } from "./useEmployeeLearningHubData";

type EmployeeLearningHubProps = {
  basePath?: string;
  title?: string;
  subtitle?: string;
};

export function EmployeeLearningHub({
  basePath = "/employee/learning",
  title = "Catalogue Formations Employé",
  subtitle = "Recommandations personnalisées par compétence avec 3 formations max par bloc.",
}: EmployeeLearningHubProps) {
  const navigate = useNavigate();
  const [startingId, setStartingId] = useState<string | null>(null);
  const {
    groups,
    recentTrainings,
    thumbnailByPlaylist,
    isFetching,
    isError,
    filters,
    setQ,
    setLevel,
    setTrack,
    setDurationBand,
    setFiltersOpen,
  } = useEmployeeLearningHubData();
  const { q, level, track, durationBand, filtersOpen } = filters;

  useEffect(() => {
    if (!isError) return;
    toast.error("Impossible de charger les formations.");
  }, [isError]);

  async function onStart(rec: RecommendationItem) {
    setStartingId(rec.trainingUuid);
    try {
      const { data } = await trainingApi.startTraining(rec.trainingUuid);
      const progress = data as EmployeeTrainingProgress;
      navigate(`${basePath}/course/${progress.progressUuid}`, { state: { progress } });
    } catch {
      toast.error("Impossible de démarrer cette formation.");
    } finally {
      setStartingId(null);
    }
  }

  return (
    <div className="w-full space-y-6">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-violet-700 to-indigo-700 p-8 text-white shadow-[0_20px_40px_rgba(79,70,229,0.35)]">
        <div className="pointer-events-none absolute inset-0 animate-pulse bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.18),transparent_45%),radial-gradient(circle_at_80%_30%,rgba(255,255,255,0.18),transparent_45%)]" />
        <h2 className="relative text-3xl font-bold tracking-tight">{title}</h2>
        <p className="relative mt-2 max-w-2xl text-sm text-violet-100">{subtitle}</p>
      </section>

      <section className={`grid grid-cols-1 gap-5 ${filtersOpen ? "xl:grid-cols-[280px_minmax(0,1fr)]" : ""}`}>
        {filtersOpen && (
          <aside className="self-stretch rounded-2xl border border-violet-100 bg-white px-2.5 py-2 min-h-[46px] shadow-sm">
            <div className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-1.5">
              <span className="text-sm font-semibold text-slate-900">Filtres</span>
              <button
                type="button"
                role="switch"
                aria-checked={filtersOpen}
                aria-label="Ouvrir ou fermer les filtres"
                onClick={() => setFiltersOpen((v) => !v)}
                className={`relative h-7 w-12 rounded-full transition ${filtersOpen ? "bg-violet-600" : "bg-slate-300"}`}
              >
                <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition ${filtersOpen ? "left-[24px]" : "left-[2px]"}`} />
              </button>
            </div>

            <div className="mt-3 space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-500">Parcours</label>
                <input value={track} onChange={(e) => setTrack(e.target.value)} placeholder="Front End, Back End, DevOps..." className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500">Niveau</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {["", "debutant", "intermediaire", "avance"].map((v) => (
                    <button key={v || "all"} type="button" onClick={() => setLevel(v)} className={`rounded-full border px-3 py-1 text-xs ${level === v ? "border-violet-500 bg-violet-100 text-violet-700" : "border-slate-200 text-slate-600"}`}>
                      {v || "Tous"}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500">Durée (heures)</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {[
                    { id: "", label: "Tous" },
                    { id: "0-1", label: "0-1 h" },
                    { id: "1-3", label: "1-3 h" },
                    { id: "3+", label: "+3 h" },
                  ].map((d) => (
                    <button key={d.id || "all"} type="button" onClick={() => setDurationBand(d.id as any)} className={`rounded-full border px-3 py-1 text-xs ${durationBand === d.id ? "border-violet-500 bg-violet-100 text-violet-700" : "border-slate-200 text-slate-600"}`}>
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        )}

        <div className="space-y-2">
          <div className="rounded-2xl border border-violet-100 bg-white px-3 py-[11px] min-h-[54px] shadow-sm">
            <div className="flex items-center gap-3">
              {!filtersOpen && (
                <div className="min-w-[220px] rounded-xl border border-slate-200 px-3 py-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-900">Filtres</span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={filtersOpen}
                      aria-label="Ouvrir ou fermer les filtres"
                      onClick={() => setFiltersOpen((v) => !v)}
                      className={`relative h-7 w-12 rounded-full transition ${filtersOpen ? "bg-violet-600" : "bg-slate-300"}`}
                    >
                      <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition ${filtersOpen ? "left-[24px]" : "left-[2px]"}`} />
                    </button>
                  </div>
                </div>
              )}
              <div className="relative w-full">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <MagnifyingGlassIcon className="h-4 w-4" />
                </span>
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Rechercher Java, React, Spring Boot..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-violet-400 focus:bg-white focus:ring-2 focus:ring-violet-400/20"
                />
              </div>
            </div>
          </div>

          <div className="px-3">
            {groups.map((group) => (
              <section key={`${group.category}-${group.skillName}`} className="space-y-3">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">{group.skillName}</h3>
                  <p className="text-xs text-slate-500">Niveau actuel {group.employeeSkillLevel} • cible {group.targetSkillLevel}</p>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {group.recommendations.map((rec) => (
                    <article key={`${group.skillName}-${rec.trainingUuid}`} className="overflow-hidden rounded-2xl border border-violet-100 bg-white shadow-[0_8px_20px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_24px_rgba(124,58,237,0.18)]">
                      {thumbnailByPlaylist[rec.playlistUrl] ? (
                        <img src={thumbnailByPlaylist[rec.playlistUrl]} alt={rec.courseName} className="h-40 w-full object-cover" />
                      ) : (
                        <div className="h-40 w-full bg-gradient-to-br from-violet-200 via-violet-100 to-indigo-100" />
                      )}
                      <div className="p-5">
                        <div className="mb-2 flex items-center justify-between">
                          <span className="inline-flex rounded-full bg-violet-100 px-2.5 py-1 text-xs font-semibold text-violet-700">{rec.courseLevel}</span>
                          <span className="text-[11px] text-slate-500">{rec.estimatedDurationHours ? `${rec.estimatedDurationHours} h` : "-- h"}</span>
                        </div>
                        <h4 className="line-clamp-2 text-base font-semibold text-slate-900">{rec.courseName}</h4>
                        <p className="mt-1 text-sm text-slate-500">{rec.category} • {rec.skillName}</p>
                        <button
                          type="button"
                          onClick={() => onStart(rec)}
                          disabled={startingId === rec.trainingUuid}
                          className="mt-4 w-full rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-3 py-2.5 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(79,70,229,0.35)] disabled:opacity-60"
                        >
                          {startingId === rec.trainingUuid ? "Ouverture..." : "Ouvrir la formation"}
                        </button>
                      </div>
                    </article>
                  ))}
                  {group.recommendations.length === 0 && (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500">
                      Aucune formation correspondante trouvée pour cette compétence.
                    </div>
                  )}
                </div>
              </section>
            ))}

            {isFetching && <p className="text-sm text-slate-500">Mise a jour des recommandations...</p>}
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-violet-100 bg-white p-6 shadow-[0_12px_28px_rgba(15,23,42,0.06)]">
        <h3 className="text-3xl font-bold tracking-tight text-slate-900">Formations récentes</h3>
        <p className="mt-1 text-sm text-slate-500">Historique des dernières formations ouvertes.</p>
        <div className="mt-5 space-y-3">
          {recentTrainings.length === 0 && <p className="text-sm text-slate-500">Aucune formation récente.</p>}
          {recentTrainings.map((item) => (
            <button
              key={item.progressUuid}
              type="button"
              onClick={() => navigate(`${basePath}/course/${item.progressUuid}`, { state: { progress: item } })}
              className="flex w-full items-center gap-3 rounded-2xl border border-violet-100 bg-white px-3 py-3 text-left transition hover:bg-violet-50/50"
            >
              <div className="h-12 w-20 rounded-lg bg-gradient-to-br from-violet-200 to-indigo-100" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-800">{item.courseName}</p>
                <p className="text-xs text-slate-500">{item.courseLevel} • {Math.max(0, Math.min(100, item.progressPercent ?? 0))}% complété</p>
              </div>
              <div className="w-24">
                <div className="mb-1 flex items-center justify-end text-[11px] font-medium text-violet-700">{Math.max(0, Math.min(100, item.progressPercent ?? 0))}%</div>
                <div className="h-2 w-full rounded-full bg-violet-100">
                  <div className="h-2 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 transition-all" style={{ width: `${Math.max(0, Math.min(100, item.progressPercent ?? 0))}%` }} />
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
