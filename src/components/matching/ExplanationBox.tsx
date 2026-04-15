type Props = {
  deterministicSummary: string;
  aiExplanation?: Record<string, unknown> | null;
  loading?: boolean;
};

function formatAiBlock(data: Record<string, unknown>) {
  const summary = typeof data.summary === "string" ? data.summary : null;
  const highlights = Array.isArray(data.highlights) ? data.highlights.filter((x) => typeof x === "string") : [];
  const risks = Array.isArray(data.risks) ? data.risks.filter((x) => typeof x === "string") : [];
  const tips = Array.isArray(data.coaching_tips) ? data.coaching_tips.filter((x) => typeof x === "string") : [];
  return { summary, highlights, risks, tips };
}

export function ExplanationBox({ deterministicSummary, aiExplanation, loading }: Props) {
  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-20 animate-pulse rounded-xl bg-slate-100" />
        <div className="h-32 animate-pulse rounded-xl bg-slate-100" />
      </div>
    );
  }

  const ai = aiExplanation ? formatAiBlock(aiExplanation) : null;
  const aiData = ai ?? { summary: null, highlights: [], risks: [], tips: [] };
  const hasAi = Boolean(ai?.summary || (ai && (ai.highlights.length || ai.risks.length || ai.tips.length)));
  const deterministicUnavailable =
    deterministicSummary.startsWith("Explication déterministe indisponible") ||
    deterministicSummary.startsWith("Aucun enregistrement de correspondance associé");

  if (!hasAi && deterministicUnavailable) {
    return <p className="text-xs text-slate-500">Explication indisponible pour cette correspondance.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Synthèse déterministe</p>
        <p className="mt-1 text-sm leading-relaxed text-slate-800">{deterministicSummary}</p>
      </div>

      {hasAi ? (
        <div className="rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50/90 to-white px-4 py-3 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Aide IA</p>
          <p className="mt-2 text-sm text-slate-800">{aiData.summary || "Aide IA disponible."}</p>
        </div>
      ) : (
        <p className="text-xs text-slate-400">Aucune explication IA disponible.</p>
      )}
    </div>
  );
}
