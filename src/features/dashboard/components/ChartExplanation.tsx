export function ChartExplanation({ text }: { text?: string | null }) {
  if (!text) return null;

  return (
    <p className="mt-3 rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2 text-xs leading-relaxed text-slate-500">
      {text}
    </p>
  );
}
