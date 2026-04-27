import { ArrowTopRightOnSquareIcon, StarIcon } from "../../icons/heroicons/outline";
import type { EmployeeMatchRowDto } from "../../api/matchingApi";
import { avatarGradient, avatarInitials, toPercent, toPercentNumber } from "./matchingVisuals";

type Props = {
  row: EmployeeMatchRowDto;
  onViewDetails?: () => void;
  compact?: boolean;
};

export function EmployeeCard({ row, onViewDetails, compact = false }: Props) {
  const missing = row.breakdown.mandatory_failed.length;
  const met = row.breakdown.requirements.filter((r) => r.meets).length;
  const total = row.breakdown.requirements.length || 1;
  const seed = row.email || row.employee_keycloak_id || row.display_name;
  const avatar = avatarGradient(seed);
  const initials = avatarInitials(row.display_name, row.email);
  const matchPercent = toPercent(row.match_score);
  const confidencePercent = toPercent(row.confidence_score);

  const statusBadge = row.meets_mandatory
    ? {
        label: "Couverture complete",
        className: "bg-emerald-100 text-emerald-700",
      }
    : {
        label: "Exigences non couvertes",
        className: "bg-slate-200 text-slate-600",
      };

  return (
    <article
      className={`group relative overflow-hidden rounded-[22px] border bg-white transition hover:-translate-y-0.5 ${
        compact
          ? "p-2.5 shadow-[0_8px_22px_rgba(111,76,255,0.08)] hover:shadow-[0_12px_28px_rgba(111,76,255,0.1)]"
          : "p-4 shadow-[0_12px_30px_rgba(111,76,255,0.09)] hover:shadow-[0_16px_34px_rgba(111,76,255,0.12)]"
      } ${
        row.rank === 1 ? "border-amber-300 shadow-[0_18px_44px_rgba(217,119,6,0.14)]" : "border-violet-100/80"
      }`}
    >
      <div className={`flex flex-wrap items-start justify-between ${compact ? "gap-2" : "gap-3"}`}>
        <div className={`flex min-w-0 flex-1 items-start ${compact ? "gap-2" : "gap-3"}`}>
          <div className={`relative shrink-0 ${compact ? "h-9 w-9" : "h-12 w-12"}`}>
            <div
              className={`flex items-center justify-center rounded-full text-sm font-bold text-white shadow-[0_6px_14px_rgba(91,33,182,0.22)] ring-2 ring-violet-50 ${
                compact ? "h-9 w-9 text-xs" : "h-12 w-12"
              }`}
              style={{ background: `linear-gradient(135deg, ${avatar[0]}, ${avatar[1]})` }}
              aria-hidden
            >
              {initials}
            </div>
            {row.rank === 1 ? (
              <span
                className={`absolute -bottom-1 -right-1 inline-flex items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-white ring-2 ring-white shadow-[0_6px_14px_rgba(217,119,6,0.45)] ${
                  compact ? "h-5 w-5" : "h-6 w-6"
                }`}
              >
                <StarIcon className={compact ? "h-3 w-3" : "h-3.5 w-3.5"} />
              </span>
            ) : null}
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3
                className={`truncate font-bold leading-tight tracking-tight text-slate-800 ${
                  compact ? "text-sm sm:text-base" : "text-lg sm:text-xl md:text-2xl"
                }`}
              >
                {row.display_name || row.email}
              </h3>
              <span
                className={`rounded-full font-bold uppercase ${
                  compact ? "px-2 py-0.5 text-[9px] tracking-[0.07em]" : "px-2.5 py-1 text-[10px] tracking-[0.08em]"
                } ${statusBadge.className}`}
              >
                {statusBadge.label}
              </span>
            </div>
            <p className={`mt-0.5 truncate font-medium text-slate-400 ${compact ? "text-xs" : "text-sm"}`}>{row.email}</p>
            <p
              className={`font-semibold uppercase text-slate-400 ${
                compact ? "mt-1 text-[9px] tracking-[0.1em]" : "mt-1.5 text-[10px] tracking-[0.12em]"
              }`}
            >
              Couverture: {met}/{total}
              {missing > 0 ? ` · Bloquantes: ${missing}` : " · Complete"}
            </p>
          </div>
        </div>

        {onViewDetails ? (
          <button
            type="button"
            onClick={onViewDetails}
            aria-label={`Voir le détail de ${row.display_name || row.email}`}
            className={`inline-flex w-full shrink-0 items-center justify-center gap-1.5 rounded-xl border border-violet-200 bg-white font-semibold text-violet-700 transition hover:border-violet-300 hover:bg-violet-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 sm:w-auto sm:justify-start ${
              compact ? "px-2 py-1.5 text-[11px]" : "px-3 py-2 text-sm"
            }`}
          >
            Détails
            <ArrowTopRightOnSquareIcon className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
          </button>
        ) : null}
      </div>

      <div className={`grid gap-2.5 sm:grid-cols-2 ${compact ? "mt-2.5" : "mt-4"}`}>
        <div>
          <div className="mb-1.5 flex items-baseline justify-between">
            <span className={`font-bold uppercase tracking-[0.1em] text-slate-500 ${compact ? "text-[10px]" : "text-[11px]"}`}>
              Score de correspondance
            </span>
            <span className={`font-extrabold leading-none text-violet-600 ${compact ? "text-lg" : "text-xl"}`}>{matchPercent}</span>
          </div>
          <div className={`${compact ? "h-1.5" : "h-2"} rounded-full bg-violet-100`}>
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500"
              style={{ width: `${toPercentNumber(row.match_score)}%` }}
            />
          </div>
        </div>
        <div>
          <div className="mb-1.5 flex items-baseline justify-between">
            <span className={`font-bold uppercase tracking-[0.1em] text-slate-500 ${compact ? "text-[10px]" : "text-[11px]"}`}>
              Confiance
            </span>
            <span className={`font-extrabold leading-none text-emerald-600 ${compact ? "text-lg" : "text-xl"}`}>{confidencePercent}</span>
          </div>
          <div className={`${compact ? "h-1.5" : "h-2"} rounded-full bg-emerald-100`}>
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
              style={{ width: `${toPercentNumber(row.confidence_score)}%` }}
            />
          </div>
        </div>
      </div>
    </article>
  );
}
