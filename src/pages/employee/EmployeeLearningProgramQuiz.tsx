import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { employeeLearningProgramApi, type QuizQuestionLearner, type VideoQuizLearner } from "../../api/learningProgramApi";
import { useLearningProgramBasePath } from "../../hooks/useLearningProgramBasePath";

export function EmployeeLearningProgramQuiz() {
  const base = useLearningProgramBasePath();
  const { enrollmentUuid, videoUuid } = useParams<{ enrollmentUuid: string; videoUuid: string }>();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<VideoQuizLearner | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [cooldownUntil, setCooldownUntil] = useState<string | null>(null);

  const formatUntil = (iso: string | null) => {
    if (!iso) return null;
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString("fr-FR", { dateStyle: "long", timeStyle: "short" });
  };

  useEffect(() => {
    if (!enrollmentUuid || !videoUuid) return;
    employeeLearningProgramApi
      .quiz(enrollmentUuid, videoUuid)
      .then((r) => setQuiz(r.data))
      .catch((e) => setError(e?.response?.data?.error ?? "Quiz indisponible"));
  }, [enrollmentUuid, videoUuid]);

  const submit = async () => {
    if (!enrollmentUuid || !videoUuid || !quiz) return;
    const list = quiz.questions.map((q: QuizQuestionLearner) => ({
      questionUuid: q.questionUuid,
      optionUuid: answers[q.questionUuid],
    }));
    if (list.some((x) => !x.optionUuid)) {
      setError("Répondez à toutes les questions.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      setCooldownUntil(null);
      const { data } = await employeeLearningProgramApi.submitQuiz(enrollmentUuid, videoUuid, list);
      if (data.passed) {
        setResult(data.programCompleted ? "Parcours terminé !" : "Quiz réussi.");
        setTimeout(() => navigate(`${base}/learning-programs/play/${enrollmentUuid}`), 1200);
      } else {
        setResult(`Score ${data.scorePercent}% — seuil 70% requis.`);
        if (data.videoQuizCooldownUntil) {
          setCooldownUntil(data.videoQuizCooldownUntil);
        }
      }
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      setError(err?.response?.data?.error ?? "Envoi impossible");
    } finally {
      setSubmitting(false);
    }
  };

  if (error && !quiz) {
    return (
      <div className="p-6 max-w-xl mx-auto">
        <p className="text-rose-700">{error}</p>
        <Link to={`${base}/learning-programs/play/${enrollmentUuid}`} className="text-indigo-600 text-sm mt-3 inline-block">
          ← Retour au parcours
        </Link>
      </div>
    );
  }

  if (!quiz) {
    return <div className="p-6 text-slate-500">Chargement…</div>;
  }

  return (
    <div className="max-w-xl mx-auto p-6 space-y-6">
      <Link to={`${base}/learning-programs/play/${enrollmentUuid}`} className="text-sm text-indigo-600 hover:underline">
        ← Retour au parcours
      </Link>
      <h1 className="text-xl font-semibold text-slate-900">Quiz vidéo</h1>
      {error && <div className="text-sm text-rose-700 bg-rose-50 rounded-lg px-3 py-2">{error}</div>}
      {result && (
        <div
          className={`text-sm rounded-lg px-3 py-2 ${cooldownUntil ? "text-amber-900 bg-amber-50 border border-amber-100" : "text-emerald-800 bg-emerald-50"}`}
        >
          {result}
          {cooldownUntil && (
            <p className="mt-2 text-xs">
              Prochain essai autorisé après le <strong>{formatUntil(cooldownUntil)}</strong> (cooldown 15 jours).
            </p>
          )}
        </div>
      )}

      <div className="space-y-6">
        {quiz.questions.map((q: QuizQuestionLearner) => (
          <fieldset key={q.questionUuid} className="border border-slate-200 rounded-xl p-4">
            <legend className="text-sm font-medium text-slate-800 px-1">{q.text}</legend>
            <div className="mt-2 space-y-2">
              {q.options.map((o) => (
                <label key={o.optionUuid} className="flex items-start gap-2 text-sm text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name={q.questionUuid}
                    value={o.optionUuid}
                    checked={answers[q.questionUuid] === o.optionUuid}
                    onChange={() => setAnswers((prev) => ({ ...prev, [q.questionUuid]: o.optionUuid }))}
                    className="mt-0.5"
                  />
                  <span>{o.label}</span>
                </label>
              ))}
            </div>
          </fieldset>
        ))}
      </div>

      <button
        type="button"
        disabled={submitting}
        onClick={() => void submit()}
        className="rounded-lg bg-indigo-600 text-white text-sm font-medium px-5 py-2.5 hover:bg-indigo-700 disabled:opacity-50"
      >
        {submitting ? "Envoi…" : "Valider"}
      </button>
    </div>
  );
}
