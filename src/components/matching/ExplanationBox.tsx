type Props = {
  aiExplanation?: Record<string, unknown> | null;
  loading?: boolean;
};

function formatAiBlock(data: Record<string, unknown>) {
  const pickString = (...keys: string[]) => {
    for (const key of keys) {
      const value = data[key];
      if (typeof value === "string" && value.trim()) return value.trim();
    }
    return null;
  };
  const summary = pickString("summary", "synthese", "synthesis", "resume", "résumé");
  return { summary };
}

export function ExplanationBox({ aiExplanation, loading }: Props) {
  const ai = aiExplanation ? formatAiBlock(aiExplanation) : null;
  const summary = ai?.summary ?? null;

  return (
    <div>
      {summary ? (
        <p className="rounded-xl border border-indigo-100 bg-indigo-50/80 px-4 py-3 text-sm leading-relaxed text-slate-800">
          {summary}
        </p>
      ) : loading ? (
        <div className="rounded-xl border border-indigo-100 bg-indigo-50/70 px-4 py-3 text-xs font-medium text-indigo-700">
          Synthèse IA en cours de génération...
        </div>
      ) : (
        <p className="text-xs text-slate-500">Synthèse IA indisponible pour cette correspondance.</p>
      )}
    </div>
  );
}
