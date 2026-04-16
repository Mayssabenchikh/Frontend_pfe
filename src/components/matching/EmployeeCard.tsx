import { ArrowTopRightOnSquareIcon, StarIcon } from "../../icons/heroicons/outline";
import type { EmployeeMatchRowDto } from "../../api/matchingApi";
import { avatarGradient, avatarInitials, toPercent, toPercentNumber } from "./matchingVisuals";

type Props = {
  row: EmployeeMatchRowDto;
  onViewDetails?: () => void;
};

export function EmployeeCard({ row, onViewDetails }: Props) {
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
      className={`group relative overflow-hidden rounded-[22px] border bg-white p-4 shadow-[0_12px_30px_rgba(111,76,255,0.09)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_34px_rgba(111,76,255,0.12)] ${
        row.rank === 1 ? "border-amber-300 shadow-[0_18px_44px_rgba(217,119,6,0.14)]" : "border-violet-100/80"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <div className="relative h-12 w-12 shrink-0">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold text-white shadow-[0_6px_14px_rgba(91,33,182,0.22)] ring-2 ring-violet-50"
              style={{ background: `linear-gradient(135deg, ${avatar[0]}, ${avatar[1]})` }}
              aria-hidden
            >
              {initials}
            </div>
            {row.rank === 1 ? (
              <span className="absolute -bottom-1 -right-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-white ring-2 ring-white shadow-[0_6px_14px_rgba(217,119,6,0.45)]">
                <StarIcon className="h-3.5 w-3.5" />
              </span>
            ) : null}
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-xl font-bold leading-none tracking-tight text-slate-800 sm:text-2xl">
                {row.display_name || row.email}
              </h3>
              <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] ${statusBadge.className}`}>
                {statusBadge.label}
              </span>
            </div>
            <p className="mt-0.5 truncate text-sm font-medium text-slate-400">{row.email}</p>
            <p className="mt-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
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
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-violet-200 bg-white px-3 py-2 text-sm font-semibold text-violet-700 transition hover:border-violet-300 hover:bg-violet-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
          >
            Détails
            <ArrowTopRightOnSquareIcon className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <div className="mb-1.5 flex items-baseline justify-between">
            <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500">Score de correspondance</span>
            <span className="text-xl font-extrabold leading-none text-violet-600">{matchPercent}</span>
          </div>
          <div className="h-2 rounded-full bg-violet-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500"
              style={{ width: `${toPercentNumber(row.match_score)}%` }}
            />
          </div>
        </div>
        <div>
          <div className="mb-1.5 flex items-baseline justify-between">
            <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500">Confiance</span>
            <span className="text-xl font-extrabold leading-none text-emerald-600">{confidencePercent}</span>
          </div>
          <div className="h-2 rounded-full bg-emerald-100">
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
