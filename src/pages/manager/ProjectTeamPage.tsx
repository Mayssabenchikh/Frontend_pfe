import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import { matchingApi, type EmployeeMatchRowDto, type TeamBuildResponseDto } from "../../api/matchingApi";
import { projectsApi, type ProjectDto } from "../../api/projectsApi";
import { TeamCard } from "../../components/matching/TeamCard";
import { TalentWorkspaceShell } from "../../components/matching/TalentWorkspaceShell";
import { AlertBanner } from "../../components/AlertBanner";

export function ProjectTeamPage() {
  const { id } = useParams<{ id: string }>();
  const projectUuid = (id ?? "").trim();

  const [project, setProject] = useState<ProjectDto | null>(null);
  const [teamSize, setTeamSize] = useState(3);
  const [onlyEligible, setOnlyEligible] = useState(true);
  const [team, setTeam] = useState<TeamBuildResponseDto | null>(null);
  const [matchRows, setMatchRows] = useState<Record<string, EmployeeMatchRowDto>>({});
  const [loadingProject, setLoadingProject] = useState(true);
  const [loadingTeam, setLoadingTeam] = useState(false);

  const build = useCallback(
    async (size: number, eligible: boolean) => {
      if (!projectUuid) return;
      setLoadingTeam(true);
      try {
        const res = await matchingApi.buildTeam(projectUuid, {
          team_size: size,
          only_mandatory_eligible: eligible,
        });
        setTeam(res.data);

        try {
          const matchesRes = await matchingApi.getProjectMatches(projectUuid);
          const byId = Object.fromEntries(
            (matchesRes.data.employees ?? []).map((row) => [row.employee_keycloak_id, row]),
          );
          setMatchRows(byId);
        } catch {
          setMatchRows({});
        }
      } catch {
        toast.error("Impossible de calculer l'équipe (service de correspondances)");
        setTeam(null);
        setMatchRows({});
      } finally {
        setLoadingTeam(false);
      }
    },
    [projectUuid],
  );

  useEffect(() => {
    if (!projectUuid) return;
    let cancelled = false;
    setLoadingProject(true);
    projectsApi
      .get(projectUuid)
      .then(async (res) => {
        if (cancelled) return;
        const p = res.data ?? null;
        setProject(p);
        const size = Math.max(1, Math.min(50, p?.teamSize ?? 3));
        setTeamSize(size);
        await build(size, onlyEligible);
      })
      .catch(() => {
        if (!cancelled) setProject(null);
      })
      .finally(() => {
        if (!cancelled) setLoadingProject(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectUuid, build]);

  const onRecalculate = () => {
    void build(teamSize, onlyEligible);
  };

  if (!projectUuid) {
    return (
      <div className="p-6">
        <AlertBanner message="ID invalide" />
      </div>
    );
  }

  return (
    <TalentWorkspaceShell
      title="Équipe suggérée"
      subtitle={
        loadingProject ? (
          "…"
        ) : project?.name ? (
          <>Analyse optimisée pour maximiser le gain marginal sur <span className="font-semibold text-slate-800">{project.name}</span>.</>
        ) : (
          "Besoin introuvable"
        )
      }
      actions={
        <Link
          to={`/manager/matching/${encodeURIComponent(projectUuid)}/workspace`}
          className="inline-flex items-center gap-2 rounded-2xl border border-violet-200 bg-white px-4 py-2.5 text-sm font-semibold text-violet-700 shadow-sm transition hover:bg-violet-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
        >
          Ouvrir workspace
        </Link>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[310px_minmax(0,1fr)] xl:items-start">
        <div className="space-y-4 xl:sticky xl:top-6">
          <div className="rounded-[28px] border border-violet-100 bg-white p-5 shadow-[0_12px_36px_rgba(109,40,217,0.1)]">
            <p className="text-xl font-black tracking-tight text-slate-800">Configuration</p>

            <label className="mt-5 flex flex-col gap-2 text-[11px] font-bold uppercase tracking-[0.1em] text-slate-400">
              Taille de l'équipe
              <input
                type="number"
                min={1}
                max={50}
                value={teamSize}
                readOnly
                disabled
                className="w-full cursor-not-allowed rounded-2xl border border-violet-100 bg-violet-50/80 px-3 py-2.5 text-base font-semibold text-violet-700"
              />
            </label>

            <div className="mt-4 rounded-2xl border border-violet-100 bg-violet-50/50 px-3 py-2.5">
              <label className="inline-flex w-full items-start gap-2 text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={onlyEligible}
                  onChange={(e) => setOnlyEligible(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                />
                Inclure uniquement les profils qui couvrent toutes les exigences obligatoires
              </label>
              <p className="mt-1 pl-6 text-xs text-slate-500">
                Si vous décochez cette option, des profils partiellement compatibles peuvent aussi apparaître.
              </p>
            </div>

            <button
              type="button"
              onClick={onRecalculate}
              disabled={loadingTeam}
              className="mt-5 w-full rounded-2xl bg-gradient-to-r from-violet-700 to-fuchsia-600 px-4 py-3 text-sm font-semibold text-white shadow-[0_10px_22px_rgba(109,40,217,0.24)] transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 disabled:opacity-60"
            >
              {loadingTeam ? "Calcul…" : "Recalculer"}
            </button>
          </div>

        </div>

        <div className="min-w-0 space-y-6">
          {team ? (
            <TeamCard
              members={team.members}
              teamSize={team.team_size}
              memberMatches={matchRows}
              projectName={project?.name ?? null}
            />
          ) : loadingTeam && !loadingProject ? (
            <div className="space-y-3" aria-live="polite" aria-busy="true">
              <p className="text-sm font-medium text-slate-600">Calcul de l&apos;équipe en cours…</p>
              <div className="h-64 animate-pulse rounded-[28px] border border-violet-100/80 bg-white/90 shadow-sm" />
            </div>
          ) : !loadingProject ? (
            <p className="rounded-[28px] border border-violet-100/80 bg-white px-4 py-10 text-center text-sm text-slate-600 shadow-md shadow-violet-100/50">
              Aucun résultat pour ces paramètres. Modifiez le filtre puis relancez le calcul.
            </p>
          ) : null}
        </div>
      </div>
    </TalentWorkspaceShell>
  );
}
