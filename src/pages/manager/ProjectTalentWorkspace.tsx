import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeftIcon } from "../../icons/heroicons/outline";
import { matchingApi, type EmployeeMatchRowDto, type MatchListResponseDto, type TeamBuildResponseDto } from "../../api/matchingApi";
import { projectsApi, type ProjectDto } from "../../api/projectsApi";
import { assignmentsApi, type AssignmentDto } from "../../api/assignmentsApi";
import { EmployeeCard } from "../../components/matching/EmployeeCard";
import { TeamCard } from "../../components/matching/TeamCard";
import { TalentWorkspaceShell } from "../../components/matching/TalentWorkspaceShell";
import { EmployeeMatchDrawer } from "./EmployeeMatchDrawer";
import { formatFrenchDate } from "../../components/matching/matchingVisuals";
import { AlertBanner } from "../../components/AlertBanner";

export function ProjectTalentWorkspace() {
  const { id } = useParams<{ id: string }>();
  const projectId = id ? parseInt(id, 10) : NaN;

  const [project, setProject] = useState<ProjectDto | null>(null);
  const [matches, setMatches] = useState<MatchListResponseDto | null>(null);
  const [assignments, setAssignments] = useState<AssignmentDto[]>([]);

  const [loadingProject, setLoadingProject] = useState(true);
  const [loadingMatches, setLoadingMatches] = useState(true);
  const [loadingTeam, setLoadingTeam] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selected, setSelected] = useState<EmployeeMatchRowDto | null>(null);

  const [teamSize, setTeamSize] = useState(3);
  const [onlyEligible, setOnlyEligible] = useState(true);
  const [team, setTeam] = useState<TeamBuildResponseDto | null>(null);
  const [matchRows, setMatchRows] = useState<Record<string, EmployeeMatchRowDto>>({});

  const computedDate = useMemo(() => formatFrenchDate(matches?.computed_at), [matches?.computed_at]);

  const openDetails = (row: EmployeeMatchRowDto) => {
    setSelected(row);
    setDrawerOpen(true);
  };

  const buildTeam = useCallback(
    async (size: number, eligible: boolean) => {
      if (Number.isNaN(projectId)) return;
      setLoadingTeam(true);
      try {
        const res = await matchingApi.buildTeam(projectId, {
          team_size: size,
          only_mandatory_eligible: eligible,
        });
        setTeam(res.data);
      } catch {
        toast.error("Impossible de calculer l'équipe (service de correspondances)");
        setTeam(null);
      } finally {
        setLoadingTeam(false);
      }
    },
    [projectId],
  );

  useEffect(() => {
    if (Number.isNaN(projectId)) {
      setError("ID invalide");
      setLoadingProject(false);
      setLoadingMatches(false);
      return;
    }

    let cancelled = false;
    setError(null);
    setLoadingProject(true);
    setLoadingMatches(true);

    Promise.all([
      projectsApi.get(projectId).catch(() => null),
      matchingApi.getProjectMatches(projectId).catch(() => null),
      assignmentsApi.listProjectAssignments(projectId).catch(() => null),
    ])
      .then(async ([projRes, matchRes, assignRes]) => {
        if (cancelled) return;

        const p = projRes?.data ?? null;
        setProject(p);

        if (!matchRes?.data) {
          setError(
            "Service de correspondances indisponible. Vérifiez que le microservice FastAPI tourne et que le proxy /matching-api est correct.",
          );
          setMatches(null);
          setMatchRows({});
        } else {
          setMatches(matchRes.data);
          const byId = Object.fromEntries((matchRes.data.employees ?? []).map((row) => [row.employee_keycloak_id, row]));
          setMatchRows(byId);
        }

        setAssignments(Array.isArray(assignRes?.data) ? assignRes!.data : []);

        const size = Math.max(1, Math.min(50, p?.teamSize ?? 3));
        setTeamSize(size);
        await buildTeam(size, onlyEligible);
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingProject(false);
          setLoadingMatches(false);
        }
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, buildTeam]);

  const onRecalculate = () => {
    void buildTeam(teamSize, onlyEligible);
  };

  if (Number.isNaN(projectId)) {
    return (
      <div className="p-6">
        <AlertBanner message="ID invalide" />
      </div>
    );
  }

  return (
    <TalentWorkspaceShell
      kicker="Correspondances"
      title={<span className="text-slate-900">{project?.name || "Projet"}</span>}
      subtitle={
        loadingProject ? (
          "Chargement du contexte…"
        ) : (
          <>
            Classement et équipe suggérée{computedDate ? <> · Calculé le {computedDate}</> : null}
          </>
        )
      }
      actions={
        <Link
          to="/manager/matching"
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Retour
        </Link>
      }
    >
      {error ? (
        <AlertBanner message={error} />
      ) : (
        <div className="grid gap-6 xl:grid-cols-12 xl:items-start">
          {/* Left: ranking */}
          <section className="xl:col-span-7">
            <article className="rounded-[28px] border border-violet-100 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">Classement</p>
                  <p className="mt-1 text-sm text-slate-600">
                    Cliquez sur <span className="font-semibold text-slate-800">Détails</span> pour inviter / annuler / désaffecter.
                  </p>
                </div>
                <span className="shrink-0 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
                  {matches?.employees?.length ?? 0} profil(s)
                </span>
              </div>

              {loadingMatches ? (
                <div className="space-y-3" aria-live="polite" aria-busy="true">
                  <p className="text-sm font-medium text-slate-600">Chargement du classement en cours…</p>
                  <div className="grid gap-4 md:grid-cols-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="h-44 animate-pulse rounded-[22px] border border-violet-100/80 bg-white/90 shadow-sm" />
                    ))}
                  </div>
                </div>
              ) : !matches?.employees.length ? (
                <p className="rounded-3xl border border-violet-100/80 bg-white px-4 py-12 text-center text-sm text-slate-600 shadow-md shadow-violet-100/50">
                  Aucun employé à afficher ou aucune exigence sur ce besoin.
                </p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {matches.employees.map((row) => (
                    <EmployeeCard key={row.employee_keycloak_id} row={row} onViewDetails={() => openDetails(row)} />
                  ))}
                </div>
              )}
            </article>
          </section>

          {/* Right: team */}
          <aside className="xl:col-span-5">
            <div className="space-y-4 xl:sticky xl:top-6">
              <article className="rounded-[28px] border border-violet-100 bg-white p-5 shadow-[0_12px_36px_rgba(109,40,217,0.08)]">
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
              </article>

              <div className="min-w-0">
                {team ? (
                  <TeamCard members={team.members} teamSize={team.team_size} memberMatches={matchRows} projectName={project?.name ?? null} />
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
          </aside>
        </div>
      )}

      <EmployeeMatchDrawer
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setSelected(null);
        }}
        projectId={projectId}
        projectTeamSize={project?.teamSize ?? null}
        row={selected}
        assignments={assignments}
        onAssignmentsChange={setAssignments}
      />
    </TalentWorkspaceShell>
  );
}

