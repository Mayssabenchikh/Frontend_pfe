import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { employeeLearningProgramApi, learningProgramApi, type LearningEnrollmentSummary, type LearningProgramSummary } from "../../api/learningProgramApi";
import { useLearningProgramBasePath } from "../../hooks/useLearningProgramBasePath";

export function EmployeeLearningPrograms() {
  const base = useLearningProgramBasePath();
  const [published, setPublished] = useState<LearningProgramSummary[]>([]);
  const [mine, setMine] = useState<LearningEnrollmentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enrolling, setEnrolling] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    Promise.all([learningProgramApi.listPublished(), employeeLearningProgramApi.my()])
      .then(([pub, my]) => {
        setPublished(pub.data);
        setMine(my.data);
      })
      .catch((e) => setError(e?.response?.data?.error ?? "Chargement impossible"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const enroll = async (programUuid: string) => {
    setEnrolling(programUuid);
    setError(null);
    try {
      const { data } = await employeeLearningProgramApi.enroll(programUuid);
      setMine((prev) => {
        const rest = prev.filter((x) => x.programUuid !== data.programUuid);
        return [data, ...rest];
      });
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      setError(err?.response?.data?.error ?? "Inscription impossible");
    } finally {
      setEnrolling(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-10">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Parcours guidés</h1>
        <p className="text-slate-600 mt-1 text-sm">
          Inscrivez-vous à un parcours, visionnez les vidéos et validez chaque étape par un quiz.
        </p>
      </header>

      {error && <div className="rounded-lg bg-rose-50 text-rose-800 px-4 py-2 text-sm">{error}</div>}

      <section>
        <h2 className="text-lg font-medium text-slate-800 mb-3">Mes parcours</h2>
        {loading ? (
          <p className="text-slate-500 text-sm">Chargement…</p>
        ) : mine.length === 0 ? (
          <p className="text-slate-500 text-sm">Aucun parcours commencé pour le moment.</p>
        ) : (
          <ul className="space-y-2">
            {mine.map((e) => (
              <li key={e.enrollmentUuid}>
                <Link
                  to={`${base}/learning-programs/play/${e.enrollmentUuid}`}
                  className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 hover:border-indigo-300 hover:bg-indigo-50/40 transition-colors"
                >
                  <div>
                    <div className="font-medium text-slate-900">{e.programTitle}</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {e.status} · {e.progressPercent}% complété
                    </div>
                  </div>
                  <span className="text-indigo-600 text-sm font-medium">Continuer →</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-lg font-medium text-slate-800 mb-3">Parcours publiés</h2>
        {loading ? (
          <p className="text-slate-500 text-sm">Chargement…</p>
        ) : published.length === 0 ? (
          <p className="text-slate-500 text-sm">Aucun parcours publié.</p>
        ) : (
          <ul className="space-y-2">
            {published.map((p) => (
              <li
                key={p.uuid}
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 flex flex-wrap items-center justify-between gap-3"
              >
                <div>
                  <div className="font-medium text-slate-900">{p.title}</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {p.skillName ?? "Compétence libre"} · cible niveau {p.targetSkillLevel} · {p.videoCount} vidéo(s)
                  </div>
                </div>
                <button
                  type="button"
                  disabled={Boolean(enrolling)}
                  onClick={() => enroll(p.uuid)}
                  className="rounded-lg bg-indigo-600 text-white text-sm font-medium px-4 py-2 hover:bg-indigo-700 disabled:opacity-50"
                >
                  {enrolling === p.uuid ? "…" : "S’inscrire"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
