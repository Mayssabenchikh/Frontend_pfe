import { UserGroupIcon } from "../../icons/heroicons/outline";
import type { EmployeeMatchRowDto, TeamMemberPickDto } from "../../api/matchingApi";
import { avatarGradient, avatarInitials, toPercent, toPercentNumber } from "./matchingVisuals";

type Props = {
  members: TeamMemberPickDto[];
  teamSize: number;
  memberMatches?: Record<string, EmployeeMatchRowDto>;
  projectName?: string | null;
  compact?: boolean;
};

export function TeamCard({ members, teamSize, memberMatches = {}, projectName, compact = false }: Props) {
  return (
    <div>
      <article
        className={`overflow-hidden border border-violet-100 bg-white ${
          compact
            ? "rounded-2xl shadow-[0_10px_26px_rgba(100,65,190,0.09)]"
            : "rounded-[30px] shadow-[0_20px_50px_rgba(100,65,190,0.11)]"
        }`}
      >
        <div
          className={`flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 ${
            compact ? "px-3 py-2.5 sm:px-4 sm:py-3" : "px-4 py-4 sm:px-6 sm:py-5"
          }`}
        >
          <div className="flex min-w-0 items-center gap-3">
            <span
              className={`inline-flex items-center justify-center rounded-2xl bg-violet-100 text-violet-700 ${
                compact ? "h-8 w-8" : "h-11 w-11"
              }`}
            >
              <UserGroupIcon className={compact ? "h-4 w-4" : "h-6 w-6"} />
            </span>
            <div>
              <h3
                className={`font-black leading-tight tracking-tight text-slate-800 ${
                  compact ? "text-sm sm:text-base" : "text-lg sm:text-2xl"
                }`}
              >
                Équipe Optimale
              </h3>
              <p className={`mt-1 text-slate-500 ${compact ? "text-xs" : "text-sm"}`}>
                {projectName ? `${projectName} · ` : ""}
                {members.length} membre(s) sélectionné(s) sur {teamSize}
              </p>
            </div>
          </div>
        </div>

        <ul className="divide-y divide-slate-100">
          {members.map((m, idx) => {
            const row = memberMatches[m.employee_keycloak_id];
            const seed = row?.email || m.employee_keycloak_id || m.display_name;
            const initials = avatarInitials(m.display_name, row?.email);
            const avatar = avatarGradient(seed);
            const position = idx + 1;

            return (
              <li
                key={m.employee_keycloak_id}
                className={compact ? "px-3 py-2.5 sm:px-4 sm:py-3" : "px-4 py-4 sm:px-6 sm:py-5"}
              >
                <div className="flex items-center gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className={`flex shrink-0 items-center justify-center rounded-full text-sm font-bold text-white shadow-md ${
                        compact ? "h-9 w-9 text-xs" : "h-12 w-12"
                      }`}
                      style={{ background: `linear-gradient(135deg, ${avatar[0]}, ${avatar[1]})` }}
                    >
                      {initials}
                    </div>

                    <div className="min-w-0">
                      <p
                        className={`truncate font-black leading-tight text-slate-800 ${
                          compact ? "text-xs sm:text-sm" : "text-lg sm:text-xl"
                        }`}
                      >
                        {m.display_name}
                      </p>
                      <p
                        className={`mt-1 font-bold uppercase text-violet-500 ${
                          compact ? "text-[10px] tracking-[0.1em]" : "text-[11px] tracking-[0.11em]"
                        }`}
                      >
                        Position #{position}
                      </p>
                    </div>
                  </div>
                </div>

                <div
                  className={`grid sm:items-center ${
                    compact ? "mt-2 gap-1.5 sm:grid-cols-[1fr_108px]" : "mt-3 gap-3 sm:grid-cols-[1fr_170px]"
                  }`}
                >
                  <div className={`${compact ? "h-1.5" : "h-2"} rounded-full bg-slate-100`}>
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500"
                      style={{ width: `${toPercentNumber(m.marginal_coverage_gain)}%` }}
                    />
                  </div>
                  <p
                    className={`text-right font-black leading-none text-violet-600 ${
                      compact ? "text-base" : "text-xl"
                    }`}
                  >
                    +{toPercent(m.marginal_coverage_gain)}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </article>
    </div>
  );
}
