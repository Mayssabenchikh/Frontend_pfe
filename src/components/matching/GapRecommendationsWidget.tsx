import type { GapSkillDto, ImprovementSuggestionDto, QuizSuggestionDto } from "../../api/matchingApi";
import { GapList } from "./GapList";
import { RecommendationList } from "./RecommendationList";

type Props = {
  gaps: GapSkillDto[];
  quizzes: QuizSuggestionDto[];
  improvements: ImprovementSuggestionDto[];
  gapsLoading?: boolean;
  recoLoading?: boolean;
  title?: string;
};

/** Bloc réutilisable : écarts + recommandations déterministes. */
export function GapRecommendationsWidget({
  gaps,
  quizzes,
  improvements,
  gapsLoading,
  recoLoading,
  title = "Écarts & recommandations",
}: Props) {
  return (
    <div className="space-y-5 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
      <div>
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-700">Écarts</h4>
        <GapList gaps={gaps} loading={gapsLoading} />
      </div>
      <div>
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-violet-700">Actions suggérées</h4>
        <RecommendationList quizzes={quizzes} improvements={improvements} loading={recoLoading} />
      </div>
    </div>
  );
}
