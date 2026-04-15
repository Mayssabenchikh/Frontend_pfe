type Props = {
  value: number;
  max?: number;
  label?: string;
  tone?: "violet" | "emerald" | "amber" | "slate";
  className?: string;
};

const toneBar: Record<NonNullable<Props["tone"]>, string> = {
  violet: "bg-gradient-to-r from-violet-500 to-indigo-500",
  emerald: "bg-gradient-to-r from-emerald-500 to-teal-500",
  amber: "bg-gradient-to-r from-amber-400 to-orange-400",
  slate: "bg-gradient-to-r from-slate-400 to-slate-500",
};

export function ScoreBar({ value, max = 1, label, tone = "violet", className = "" }: Props) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className={className}>
      {label ? (
        <div className="mb-1 flex justify-between text-xs text-slate-500">
          <span>{label}</span>
          <span className="font-medium text-slate-700">{Math.round(pct)}%</span>
        </div>
      ) : null}
      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100 shadow-inner">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${toneBar[tone]}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
