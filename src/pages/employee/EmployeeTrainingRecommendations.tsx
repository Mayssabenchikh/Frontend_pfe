import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  trainingRecommendationApi,
  type TrainingRecommendation,
} from "../../api/trainingRecommendationApi";
import { employeeLearningProgramApi } from "../../api/learningProgramApi";
import {
  BoltIcon,
  RocketLaunchIcon,
  ExclamationCircleIcon,
  ArrowTrendingUpIcon,
  BriefcaseIcon,
  SparklesIcon,
} from "../../icons/heroicons/outline";

type EmployeeTrainingRecommendationsProps = {
  basePath?: string;
};

export function EmployeeTrainingRecommendations({
  basePath = "/employee",
}: EmployeeTrainingRecommendationsProps) {
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState<TrainingRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [startingId, setStartingId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(false);
    trainingRecommendationApi
      .getRecommendations()
      .then((res) => setRecommendations(Array.isArray(res.data) ? res.data : []))
      .catch(() => {
        setError(true);
        toast.error("Impossible de charger les recommandations.");
      })
      .finally(() => setLoading(false));
  }, []);

  async function onStart(rec: TrainingRecommendation) {
    setStartingId(rec.trainingUuid);
    try {
      const { data } = await employeeLearningProgramApi.enroll(rec.trainingUuid);
      navigate(`${basePath}/learning-programs/play/${data.enrollmentUuid}`, {
        state: { fromRecommendations: true, backTo: `${basePath}/training-recommendations` },
      });
    } catch {
      toast.error("Impossible de démarrer cette formation.");
    } finally {
      setStartingId(null);
    }
  }

  const projectRecs = recommendations.filter((r) => r.type === "PROJECT");
  const mandatoryRecs = recommendations.filter((r) => r.type === "PROGRESSION" && r.mandatory);
  const progressionRecs = recommendations.filter((r) => r.type === "PROGRESSION" && !r.mandatory);

  return (
    <div className="w-full space-y-6">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-violet-700 to-indigo-700 p-8 text-white shadow-[0_20px_40px_rgba(79,70,229,0.35)]">
        <div className="pointer-events-none absolute inset-0 animate-pulse bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.18),transparent_45%),radial-gradient(circle_at_80%_30%,rgba(255,255,255,0.18),transparent_45%)]" />
        <div className="relative flex items-center gap-3">
          <SparklesIcon className="h-8 w-8 text-amber-300" />
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Recommandations de Formation</h2>
            <p className="mt-1 max-w-2xl text-sm text-violet-100">
              Formations personnalisées selon vos projets et votre progression — sélectionnées par IA.
            </p>
          </div>
        </div>
      </section>

      {/* ── Loading ── */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-violet-200 border-t-violet-600" />
            <p className="text-sm text-slate-500">Analyse de votre profil en cours…</p>
          </div>
        </div>
      )}

      {/* ── Error ── */}
      {error && !loading && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
          <ExclamationCircleIcon className="mx-auto mb-2 h-8 w-8 text-red-400" />
          <p className="text-sm text-red-700">
            Une erreur est survenue lors du chargement des recommandations.
          </p>
        </div>
      )}

      {/* ── Empty ── */}
      {!loading && !error && recommendations.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
          <RocketLaunchIcon className="mx-auto mb-3 h-10 w-10 text-slate-300" />
          <p className="text-sm font-medium text-slate-600">Aucune recommandation pour le moment.</p>
          <p className="mt-1 text-xs text-slate-400">
            Les recommandations apparaîtront lorsque vous serez affecté à un projet
            ou que vous pourrez progresser dans une compétence.
          </p>
        </div>
      )}

      {/* ── PROJECT section ── */}
      {projectRecs.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <BriefcaseIcon className="h-5 w-5 text-red-500" />
            <h3 className="text-lg font-bold text-slate-900">Formations Projet</h3>
            <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-red-700">
              Haute priorité
            </span>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {projectRecs.map((rec) => (
              <RecommendationCard
                key={`project-${rec.trainingUuid}-${rec.skillName}-${rec.contextName ?? ""}`}
                rec={rec}
                onStart={onStart}
                startingId={startingId}
                accentClass="border-red-200 hover:shadow-red-200/40"
                badgeClass="bg-red-100 text-red-700"
                badgeLabel="PROJET"
                buttonGradient="from-red-600 to-rose-600"
                buttonShadow="shadow-[0_8px_18px_rgba(220,38,38,0.35)]"
              />
            ))}
          </div>
        </section>
      )}

      {/* ── MANDATORY / COOLDOWN section ── */}
      {mandatoryRecs.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <BoltIcon className="h-5 w-5 text-amber-500" />
            <h3 className="text-lg font-bold text-slate-900">Formations Obligatoires</h3>
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-amber-700">
              Cooldown actif
            </span>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {mandatoryRecs.map((rec) => (
              <RecommendationCard
                key={`mandatory-${rec.trainingUuid}-${rec.skillName}`}
                rec={rec}
                onStart={onStart}
                startingId={startingId}
                accentClass="border-amber-200 hover:shadow-amber-200/40"
                badgeClass="bg-amber-100 text-amber-700"
                badgeLabel="OBLIGATOIRE"
                buttonGradient="from-amber-600 to-orange-600"
                buttonShadow="shadow-[0_8px_18px_rgba(217,119,6,0.35)]"
              />
            ))}
          </div>
        </section>
      )}

      {/* ── PROGRESSION section ── */}
      {progressionRecs.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <ArrowTrendingUpIcon className="h-5 w-5 text-violet-500" />
            <h3 className="text-lg font-bold text-slate-900">Progression de Compétences</h3>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {progressionRecs.map((rec) => (
              <RecommendationCard
                key={`progression-${rec.trainingUuid}-${rec.skillName}`}
                rec={rec}
                onStart={onStart}
                startingId={startingId}
                accentClass="border-violet-100 hover:shadow-violet-200/40"
                badgeClass="bg-violet-100 text-violet-700"
                badgeLabel="PROGRESSION"
                buttonGradient="from-violet-600 to-indigo-600"
                buttonShadow="shadow-[0_8px_18px_rgba(79,70,229,0.35)]"
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────── */
/*  Recommendation Card                                                  */
/* ────────────────────────────────────────────────────────────────────── */

type RecommendationCardProps = {
  rec: TrainingRecommendation;
  onStart: (rec: TrainingRecommendation) => void;
  startingId: string | null;
  accentClass: string;
  badgeClass: string;
  badgeLabel: string;
  buttonGradient: string;
  buttonShadow: string;
};

function RecommendationCard({
  rec,
  onStart,
  startingId,
  accentClass,
  badgeClass,
  badgeLabel,
  buttonGradient,
  buttonShadow,
}: RecommendationCardProps) {
  return (
    <article
      className={`overflow-hidden rounded-2xl border bg-white shadow-[0_8px_20px_rgba(15,23,42,0.06)] transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${accentClass}`}
    >
      {/* Gradient header */}
      <div
        className={`relative flex h-28 items-end bg-gradient-to-br p-4 ${
          rec.type === "PROJECT"
            ? "from-red-500 via-rose-500 to-pink-500"
            : rec.mandatory
            ? "from-amber-500 via-orange-500 to-yellow-500"
            : "from-violet-500 via-purple-500 to-indigo-500"
        }`}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_70%_10%,rgba(255,255,255,0.2),transparent_60%)]" />
        <div className="relative flex w-full items-center justify-between">
          <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${badgeClass}`}>
            {badgeLabel}
          </span>
          {rec.priority === "HIGH" && (
            <span className="flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
              <BoltIcon className="h-3 w-3" /> HAUTE PRIORITÉ
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="space-y-3 p-5">
        <div>
          <h4 className="line-clamp-2 text-base font-semibold text-slate-900">
            {rec.trainingTitle}
          </h4>
          <p className="mt-0.5 text-xs text-slate-500">{rec.skillName}</p>
        </div>

        {/* Level indicators */}
        <div className="flex items-center gap-3">
          <LevelBadge label="Actuel" level={rec.currentLevel} color="slate" />
          <span className="text-xs text-slate-300">→</span>
          <LevelBadge label="Cible" level={rec.targetLevel} color={rec.type === "PROJECT" ? "red" : "violet"} />
        </div>

        {/* Project name */}
        {rec.contextName && (
          <div className="flex items-center gap-1.5 rounded-lg bg-red-50 px-2.5 py-1.5 text-xs text-red-700">
            <BriefcaseIcon className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate font-medium">{rec.contextName}</span>
          </div>
        )}

        {/* Message */}
        <p className="text-[13px] leading-relaxed text-slate-600">{rec.message}</p>

        {/* Action button */}
        <button
          type="button"
          onClick={() => onStart(rec)}
          disabled={startingId === rec.trainingUuid}
          className={`mt-1 w-full rounded-xl bg-gradient-to-r ${buttonGradient} px-3 py-2.5 text-sm font-semibold text-white transition-all ${buttonShadow} hover:brightness-110 disabled:opacity-60`}
        >
          {startingId === rec.trainingUuid ? "Ouverture…" : "Commencer la formation"}
        </button>
      </div>
    </article>
  );
}

/* ────────────────────────────────────────────────────────────────────── */
/*  Level Badge                                                          */
/* ────────────────────────────────────────────────────────────────────── */

function LevelBadge({
  label,
  level,
  color,
}: {
  label: string;
  level: number;
  color: "slate" | "violet" | "red";
}) {
  const colors = {
    slate: "bg-slate-100 text-slate-700",
    violet: "bg-violet-100 text-violet-700",
    red: "bg-red-100 text-red-700",
  };
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] uppercase tracking-wider text-slate-400">{label}</span>
      <span className={`inline-flex h-6 w-6 items-center justify-center rounded-md text-xs font-bold ${colors[color]}`}>
        {level}
      </span>
    </div>
  );
}
