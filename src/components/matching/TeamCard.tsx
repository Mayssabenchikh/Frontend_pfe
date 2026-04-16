import { UserGroupIcon } from "../../icons/heroicons/outline";
import type { EmployeeMatchRowDto, TeamMemberPickDto } from "../../api/matchingApi";
import { avatarGradient, avatarInitials, toPercent, toPercentNumber } from "./matchingVisuals";

type Props = {
  members: TeamMemberPickDto[];
  teamSize: number;
  memberMatches?: Record<string, EmployeeMatchRowDto>;
  projectName?: string | null;
};

export function TeamCard({ members, teamSize, memberMatches = {}, projectName }: Props) {
  return (
    <div>
      <article className="overflow-hidden rounded-[30px] border border-violet-100 bg-white shadow-[0_20px_50px_rgba(100,65,190,0.11)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-5">
          <div className="flex min-w-0 items-center gap-3">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
              <UserGroupIcon className="h-6 w-6" />
            </span>
            <div>
              <h3 className="text-2xl font-black leading-none tracking-tight text-slate-800">Équipe Optimale</h3>
              <p className="mt-1 text-sm text-slate-500">
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
              <li key={m.employee_keycloak_id} className="px-6 py-5">
                <div className="flex items-center gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white shadow-md"
                      style={{ background: `linear-gradient(135deg, ${avatar[0]}, ${avatar[1]})` }}
                    >
                      {initials}
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-xl font-black leading-none text-slate-800">{m.display_name}</p>
                      <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.11em] text-violet-500">Position #{position}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_170px] sm:items-center">
                  <div className="h-2 rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500"
                      style={{ width: `${toPercentNumber(m.marginal_coverage_gain)}%` }}
                    />
                  </div>
                  <p className="text-right text-xl font-black leading-none text-violet-600">
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
