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
  ChartBarSquareIcon,
  TagIcon,
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

  const requiredProjectRecs = recommendations.filter((r) => r.type === "PROJECT");
  const cooldownRecs = recommendations.filter((r) => r.type === "PROGRESSION" && r.mandatory);
  const otherRecs = recommendations.filter((r) => r.type === "PROGRESSION" && !r.mandatory);
  const topRequired = requiredProjectRecs[0] ?? null;
  const remainingRequired = requiredProjectRecs.slice(1);
  const secondaryRecs = [...cooldownRecs, ...otherRecs];

  return (
    <div className="w-full space-y-6 bg-[var(--luxury-light-bg,#f8f7ff)] pb-8">
      <section className="relative overflow-hidden rounded-3xl border border-violet-100 bg-white p-7 shadow-[0_8px_26px_rgba(124,58,237,0.08)]">
        <div className="pointer-events-none absolute -right-10 -top-8 h-40 w-40 rounded-full bg-violet-100/65 blur-2xl" />
        <div className="pointer-events-none absolute left-8 top-4 h-16 w-16 rounded-full bg-indigo-50 blur-xl" />
        <div className="relative flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">Recommandations de Formation</h2>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600 md:text-base">
              Formations personnalisées selon vos projets et votre progression — sélectionnées par IA.
            </p>
          </div>
          <div className="hidden h-24 w-24 items-center justify-center rounded-full bg-violet-50 text-violet-700 md:flex">
            <SparklesIcon className="h-10 w-10" />
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
          <ExclamationCircleIcon className="mx-auto mb-2 h-8 w-8 text-violet-500" />
          <p className="text-sm text-red-700">
            Une erreur est survenue lors du chargement des recommandations.
          </p>
        </div>
      )}

      {/* ── Empty ── */}
      {!loading && !error && recommendations.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
          <RocketLaunchIcon className="mx-auto mb-3 h-10 w-10 text-violet-500" />
          <p className="text-sm font-medium text-slate-600">Aucune recommandation pour le moment.</p>
          <p className="mt-1 text-xs text-slate-400">
            Les recommandations apparaîtront lorsque vous serez affecté à un projet
            ou que vous pourrez progresser dans une compétence.
          </p>
        </div>
      )}

      {/* ── REQUIRED PROJECT section ── */}
      {topRequired && (
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-violet-100 p-2.5 text-violet-700">
                <BriefcaseIcon className="h-5 w-5" />
              </div>
              <h3 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">Formations Obligatoires (Projet)</h3>
            </div>
            <span className="rounded-full bg-red-100 px-4 py-1 text-[11px] font-semibold uppercase tracking-wider text-red-700">
              Obligatoire
            </span>
          </div>
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
            <PrimaryRecommendationCard rec={topRequired} onStart={onStart} startingId={startingId} />
            <ImpactPanel rec={topRequired} />
          </div>
        </section>
      )}

      {remainingRequired.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <BriefcaseIcon className="h-5 w-5 text-violet-600" />
            <h3 className="text-base font-semibold text-slate-900 md:text-lg">Autres Formations Obligatoires</h3>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {remainingRequired.map((rec) => (
              <RecommendationCard
                key={`project-${rec.trainingUuid}-${rec.skillName}-${rec.contextName ?? ""}`}
                rec={rec}
                onStart={onStart}
                startingId={startingId}
                accentClass="border-red-200 hover:shadow-red-200/40"
                badgeClass="bg-red-100 text-red-700"
                badgeLabel="Obligatoire"
                buttonGradient="from-blue-600 to-indigo-600"
                buttonShadow="shadow-[0_8px_18px_rgba(37,99,235,0.28)]"
              />
            ))}
          </div>
        </section>
      )}

      {secondaryRecs.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <ArrowTrendingUpIcon className="h-5 w-5 text-violet-600" />
            <h3 className="text-base font-semibold text-slate-900 md:text-lg">Autres recommandations pour vous</h3>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {secondaryRecs.map((rec) => (
              <RecommendationCard
                key={`secondary-${rec.trainingUuid}-${rec.skillName}-${rec.contextName ?? ""}`}
                rec={rec}
                onStart={onStart}
                startingId={startingId}
                accentClass={rec.mandatory ? "border-amber-200 hover:shadow-amber-200/40" : "border-blue-100 hover:shadow-blue-200/40"}
                badgeClass={rec.mandatory ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"}
                badgeLabel={rec.mandatory ? "À refaire plus tard" : "Progression"}
                buttonGradient="from-blue-600 to-indigo-600"
                buttonShadow="shadow-[0_8px_18px_rgba(37,99,235,0.28)]"
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
          <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${badgeClass}`}>
            {badgeLabel}
          </span>
          {rec.priority === "HIGH" && (
            <span className="flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
              <BoltIcon className="h-3 w-3 text-violet-200" /> HAUTE PRIORITÉ
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="space-y-3 p-5">
        <div>
          <h4 className="line-clamp-2 text-sm font-semibold text-slate-900 md:text-base">
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
          <div className="flex items-center gap-1.5 rounded-lg bg-violet-50 px-2.5 py-1.5 text-xs text-violet-700">
            <BriefcaseIcon className="h-3.5 w-3.5 shrink-0 text-violet-600" />
            <span className="truncate font-medium">{rec.contextName}</span>
          </div>
        )}

        {/* Message */}
          <p className="text-xs leading-relaxed text-slate-600 md:text-sm">{rec.message}</p>

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

function PrimaryRecommendationCard({
  rec,
  onStart,
  startingId,
}: {
  rec: TrainingRecommendation;
  onStart: (rec: TrainingRecommendation) => void;
  startingId: string | null;
}) {
  return (
    <article className="rounded-2xl border border-violet-100 bg-white p-6 shadow-[0_8px_22px_rgba(124,58,237,0.08)]">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-red-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-red-700">Obligatoire</span>
        {rec.priority === "HIGH" && (
          <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-violet-700">
            <BoltIcon className="h-3.5 w-3.5 text-violet-600" /> Haute priorité
          </span>
        )}
      </div>

      <h4 className="mt-5 text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">{rec.trainingTitle}</h4>
      <p className="mt-3 text-sm leading-relaxed text-slate-600 md:text-base">{rec.message}</p>

      <div className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-6">
        {rec.contextName ? (
          <span className="inline-flex items-center gap-2 rounded-xl bg-violet-50 px-3 py-2 text-xs font-semibold text-violet-700 md:text-sm">
            <TagIcon className="h-4 w-4" />
            {rec.contextName}
          </span>
        ) : (
          <span />
        )}
        <button
          type="button"
          onClick={() => onStart(rec)}
          disabled={startingId === rec.trainingUuid}
          className="rounded-xl bg-violet-600 px-8 py-3 text-sm font-semibold text-white shadow-[0_10px_20px_rgba(124,58,237,0.28)] transition hover:bg-violet-500 disabled:opacity-60 md:text-base"
        >
          {startingId === rec.trainingUuid ? "Ouverture..." : "Commencer la formation"}
        </button>
      </div>
    </article>
  );
}

function ImpactPanel({ rec }: { rec: TrainingRecommendation }) {
  return (
    <aside className="space-y-4">
      <div className="rounded-2xl border border-violet-100 bg-white p-6 shadow-[0_8px_22px_rgba(124,58,237,0.08)]">
        <div className="flex items-center gap-2">
          <ChartBarSquareIcon className="h-5 w-5 text-violet-600" />
          <h4 className="text-lg font-semibold text-slate-900 md:text-xl">Impact projet</h4>
        </div>
        <p className="mt-4 text-sm leading-relaxed text-slate-600 md:text-base">
          L'achèvement de cette formation renforcera votre niveau sur <span className="font-semibold text-slate-900">{rec.skillName}</span>
          {rec.contextName ? <> dans le projet <span className="font-semibold text-slate-900">{rec.contextName}</span></> : null}.
        </p>
      </div>
      <div className="relative overflow-hidden rounded-2xl border border-violet-100 bg-gradient-to-br from-slate-900 via-violet-800 to-indigo-800 p-5 text-white shadow-[0_10px_25px_rgba(15,23,42,0.25)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(255,255,255,0.22),transparent_42%)]" />
        <p className="relative text-sm font-semibold md:text-base">Apprentissage recommandé</p>
        <p className="relative mt-2 text-xs text-blue-100 md:text-sm">
          Démarrez cette formation pour accélérer votre progression sur les objectifs du moment.
        </p>
      </div>
    </aside>
  );
}
