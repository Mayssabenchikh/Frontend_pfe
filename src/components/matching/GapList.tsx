import type { GapSkillDto } from "../../api/matchingApi";

const gapLabel: Record<GapSkillDto["gap_type"], string> = {
  missing: "Manquante",
  insufficient_level: "Niveau insuffisant",
  unverified_cv_only: "Non validée (CV)",
  quiz_pending_unverified: "Quiz en attente",
  failed_quiz_recent: "Quiz à reprendre",
};

const gapStyle: Record<GapSkillDto["gap_type"], { item: string; badge: string }> = {
  missing: {
    item: "border-rose-100 bg-rose-50/60",
    badge: "bg-rose-100 text-rose-700",
  },
  insufficient_level: {
    item: "border-amber-100 bg-amber-50/60",
    badge: "bg-amber-100 text-amber-700",
  },
  unverified_cv_only: {
    item: "border-slate-200 bg-slate-50/80",
    badge: "bg-slate-200 text-slate-700",
  },
  quiz_pending_unverified: {
    item: "border-sky-100 bg-sky-50/70",
    badge: "bg-sky-100 text-sky-700",
  },
  failed_quiz_recent: {
    item: "border-orange-100 bg-orange-50/70",
    badge: "bg-orange-100 text-orange-700",
  },
};

type Props = {
  gaps: GapSkillDto[];
  loading?: boolean;
};

export function GapList({ gaps, loading }: Props) {
  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-100" />
        ))}
      </div>
    );
  }

  if (!gaps.length) {
    return (
      <p className="rounded-xl border border-emerald-100 bg-emerald-50/80 px-4 py-3 text-sm text-emerald-800">
        Aucun écart par rapport aux exigences du projet.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {gaps.map((g) => (
        <li
          key={`${g.skill_id}-${g.gap_type}`}
          className={`flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-sm ${gapStyle[g.gap_type].item}`}
        >
          <div>
            <p className="font-semibold text-slate-800">{g.skill_name}</p>
            <span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${gapStyle[g.gap_type].badge}`}>
              {gapLabel[g.gap_type]}
            </span>
          </div>
          <div className="text-right text-xs text-slate-600">
            {g.required_level != null ? (
              <span>
                Requis: <strong>L{g.required_level}</strong>
              </span>
            ) : null}
            {g.employee_level != null ? (
              <span className="ml-2"> · </span>
            ) : null}
            {g.employee_level != null ? (
              <span className="ml-2">
                Actuel: <strong>L{g.employee_level}</strong>
              </span>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}
