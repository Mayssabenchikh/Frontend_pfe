import type { ImprovementSuggestionDto, QuizSuggestionDto } from "../../api/matchingApi";

type Props = {
  quizzes: QuizSuggestionDto[];
  improvements: ImprovementSuggestionDto[];
  loading?: boolean;
};

export function RecommendationList({ quizzes, improvements, loading }: Props) {
  if (loading) {
    return (
      <div className="space-y-2">
        <div className="h-16 animate-pulse rounded-xl bg-slate-100" />
        <div className="h-16 animate-pulse rounded-xl bg-slate-100" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {quizzes.length > 0 ? (
        <div>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-violet-600">Quiz suggérés</h4>
          <ul className="space-y-2">
            {quizzes.map((q) => (
              <li
                key={q.skill_id}
                className="rounded-xl border border-violet-100 bg-violet-50/50 px-3 py-2 text-sm text-slate-800"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium">{q.skill_name}</span>
                  <span className="rounded bg-white/80 px-1.5 text-[10px] font-semibold text-violet-700">
                    {q.suggested_quiz_kind}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {improvements.length > 0 ? (
        <div>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Pistes d&apos;amélioration</h4>
          <ul className="space-y-2">
            {improvements.map((im, idx) => (
              <li key={idx} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm">
                <p className="font-medium text-slate-800">{im.title}</p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {!quizzes.length && !improvements.length ? (
        <p className="text-sm text-slate-500">Aucune recommandation supplémentaire.</p>
      ) : null}
    </div>
  );
}
