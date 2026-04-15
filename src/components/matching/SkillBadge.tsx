import type { MatchEvidence } from "../../api/matchingApi";

type Props = {
  name: string;
  level?: number;
  evidence?: MatchEvidence;
  meets?: boolean;
  compact?: boolean;
};

const levelColor = (level: number) => {
  if (level <= 0) return "bg-slate-100 text-slate-600 border-slate-200";
  if (level <= 2) return "bg-amber-50 text-amber-800 border-amber-200";
  if (level <= 4) return "bg-violet-50 text-violet-800 border-violet-200";
  return "bg-emerald-50 text-emerald-800 border-emerald-200";
};

const evidenceLabel: Record<MatchEvidence, string> = {
  quiz: "Quiz",
  cv: "CV",
  none: "—",
};

export function SkillBadge({ name, level = 0, evidence, meets, compact }: Props) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition hover:shadow-sm ${
        meets === false ? "border-rose-200 bg-rose-50 text-rose-800" : levelColor(level)
      } ${compact ? "py-0.5" : ""}`}
    >
      <span className="max-w-[140px] truncate">{name}</span>
      {level !== undefined ? (
        <span className="rounded bg-white/60 px-1 font-semibold tabular-nums">L{level}</span>
      ) : null}
      {evidence && evidence !== "none" ? (
        <span className="rounded border border-white/40 bg-white/50 px-1 text-[10px] text-slate-600">
          {evidenceLabel[evidence]}
        </span>
      ) : null}
    </span>
  );
}
