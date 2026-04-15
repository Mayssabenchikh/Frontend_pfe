import { UserGroupIcon } from "@heroicons/react/24/outline";
import type { EmployeeMatchRowDto, TeamMemberPickDto } from "../../api/matchingApi";
import { avatarGradient, avatarInitials, toPercent, toPercentNumber } from "./matchingVisuals";

type Props = {
  members: TeamMemberPickDto[];
  avgRedundancy: number;
  teamSize: number;
  memberMatches?: Record<string, EmployeeMatchRowDto>;
  projectName?: string | null;
};

export function TeamCard({ members, avgRedundancy, teamSize, memberMatches = {}, projectName }: Props) {
  const avgMarginalGain =
    members.length > 0
      ? members.reduce((sum, m) => sum + m.marginal_coverage_gain, 0) / members.length
      : 0;

  const selectedConfidences = members
    .map((m) => memberMatches[m.employee_keycloak_id]?.confidence_score)
    .filter((v): v is number => typeof v === "number");
  const avgConfidence =
    selectedConfidences.length > 0
      ? selectedConfidences.reduce((sum, value) => sum + value, 0) / selectedConfidences.length
      : 0;

  const saturationSignal = members.length > 1 ? members[members.length - 1].marginal_coverage_gain : avgMarginalGain;
  const leadName = members[0]?.display_name;

  return (
    <div className="space-y-6">
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
                      <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.11em] text-violet-500">
                        Position #{idx + 1}
                        {row?.rank ? ` · Classement #${row.rank}` : ""}
                      </p>
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

      <div className="grid gap-4 md:grid-cols-3">
        <article className="rounded-[26px] border border-violet-100 bg-white p-5 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-[0.11em] text-slate-400">Apport du dernier profil</p>
          <p className="mt-2 text-2xl font-black leading-none text-violet-700">{toPercent(saturationSignal)}</p>
          <p className="mt-2 text-sm text-slate-500">Ce pourcentage montre ce que le dernier profil apporte encore a l'equipe.</p>
        </article>

        <article className="rounded-[26px] border border-violet-100 bg-white p-5 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-[0.11em] text-slate-400">Fiabilite des scores</p>
          <p className="mt-2 text-2xl font-black leading-none text-emerald-600">{toPercent(avgConfidence)}</p>
          <p className="mt-2 text-sm text-slate-500">C'est la moyenne de fiabilite des profils choisis.</p>
        </article>

        <article className="rounded-[26px] bg-gradient-to-br from-violet-700 via-fuchsia-600 to-violet-700 p-5 text-white shadow-[0_18px_34px_rgba(109,40,217,0.25)]">
          <p className="text-[11px] font-bold uppercase tracking-[0.11em] text-violet-100">Recommandation</p>
          <p className="mt-2 text-xl font-black leading-tight">
            {leadName ? `${leadName} est recommande en premier` : "Equipe recommandee"}
          </p>
          <p className="mt-2 text-sm text-violet-100/95">
            Chevauchement moyen des competences : {toPercent(avgRedundancy)}. Apport moyen des profils : {toPercent(avgMarginalGain)}.
          </p>
        </article>
      </div>
    </div>
  );
}
