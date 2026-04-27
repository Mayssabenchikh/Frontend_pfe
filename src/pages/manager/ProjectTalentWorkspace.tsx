import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { ChevronLeftIcon, ChevronRightIcon } from "../../icons/heroicons/outline";
import {
  matchingApi,
  type EmployeeMatchRowDto,
  type MatchListResponseDto,
  type TeamBuildResponseDto,
} from "../../api/matchingApi";
import { projectsApi, type ProjectDto } from "../../api/projectsApi";
import { assignmentsApi, type AssignmentDto } from "../../api/assignmentsApi";
import { EmployeeCard } from "../../components/matching/EmployeeCard";
import { TeamCard } from "../../components/matching/TeamCard";
import { TalentWorkspaceShell } from "../../components/matching/TalentWorkspaceShell";
import { EmployeeMatchDrawer } from "./EmployeeMatchDrawer";
import { AlertBanner } from "../../components/AlertBanner";

const RANKING_PAGE_SIZE = 4;
const TEAM_PAGE_SIZE = 3;

export function ProjectTalentWorkspace() {
  const { id } = useParams<{ id: string }>();
  const projectUuid = (id ?? "").trim();

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
  const [rankingPage, setRankingPage] = useState(1);
  const [teamPage, setTeamPage] = useState(1);

  const openDetails = (row: EmployeeMatchRowDto) => {
    setSelected(row);
    setDrawerOpen(true);
  };

  const buildTeam = useCallback(
    async (size: number, eligible: boolean, page: number) => {
      if (!projectUuid) return;
      setLoadingTeam(true);
      try {
        const res = await matchingApi.buildTeam(
          projectUuid,
          {
            team_size: size,
            only_mandatory_eligible: eligible,
          },
          {
            page,
            page_size: TEAM_PAGE_SIZE,
          },
        );
        setTeam(res.data);
        setTeamPage(res.data.page);
      } catch {
        toast.error("Impossible de calculer l'équipe (service de correspondances)");
        setTeam(null);
      } finally {
        setLoadingTeam(false);
      }
    },
    [projectUuid],
  );

  const loadMatchesPage = useCallback(
    async (page: number, showToast = true) => {
      if (!projectUuid) return;
      setLoadingMatches(true);
      try {
        const res = await matchingApi.getProjectMatches(projectUuid, {
          page,
          page_size: RANKING_PAGE_SIZE,
        });
        setMatches(res.data);
        setRankingPage(res.data.page);
        setMatchRows((prev) => ({
          ...prev,
          ...Object.fromEntries(
            (res.data.employees ?? []).map((row) => [row.employee_keycloak_id, row]),
          ),
        }));
      } catch {
        if (showToast) {
          toast.error("Impossible de charger cette page du classement");
        }
      } finally {
        setLoadingMatches(false);
      }
    },
    [projectUuid],
  );

  useEffect(() => {
    if (!projectUuid) {
      setError("Identifiant de projet invalide");
      setLoadingProject(false);
      setLoadingMatches(false);
      return;
    }

    let cancelled = false;
    setError(null);
    setLoadingProject(true);
    setLoadingMatches(true);
    setRankingPage(1);
    setTeamPage(1);

    Promise.all([
      projectsApi.get(projectUuid).catch(() => null),
      matchingApi
        .getProjectMatches(projectUuid, { page: 1, page_size: RANKING_PAGE_SIZE })
        .catch(() => null),
      assignmentsApi.listProjectAssignments(projectUuid).catch(() => null),
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
          setRankingPage(matchRes.data.page);
          const byId = Object.fromEntries(
            (matchRes.data.employees ?? []).map((row) => [row.employee_keycloak_id, row]),
          );
          setMatchRows(byId);
        }

        setAssignments(Array.isArray(assignRes?.data) ? assignRes!.data : []);

        const size = Math.max(1, Math.min(50, p?.teamSize ?? 3));
        setTeamSize(size);
        await buildTeam(size, onlyEligible, 1);
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingProject(false);
          setLoadingMatches(false);
        }
      });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectUuid, buildTeam]);

  const onRecalculate = () => {
    void buildTeam(teamSize, onlyEligible, 1);
  };

  if (!projectUuid) {
    return <div className="p-6"><AlertBanner message="Identifiant de projet invalide" /></div>;
  }

  const employeeCount = matches?.total_employees ?? matches?.employees?.length ?? 0;

  return (
    <TalentWorkspaceShell
      title={
        loadingProject
          ? "Chargement…"
          : (
            <span className="inline-flex flex-col items-start gap-1 font-sans sm:flex-row sm:flex-wrap sm:items-baseline sm:gap-2">
              <span className="text-[20px] font-extrabold leading-tight text-slate-900 sm:text-[26px] md:text-[34px]">
                Classement et équipe :
              </span>
              <span className="text-[20px] font-extrabold leading-tight text-violet-700 sm:text-[26px] md:text-[34px]">
                {project?.name || "Projet"}
              </span>
            </span>
          )
      }
      actionsPosition="left"
      headerClassName="bg-transparent shadow-none"
      showAccentUnderline={false}
      fullWidth
      contentClassName="pt-0 pb-0 sm:pt-0 sm:pb-0 lg:pt-0 lg:pb-0"
    >
      {error ? (
        <AlertBanner message={error} />
      ) : (
        <div className="font-sans">
          {/* ══════════════════════════════
              TWO-COLUMN BODY
          ══════════════════════════════ */}
          <div className="flex flex-col gap-2.5 xl:flex-row xl:items-stretch">

            {/* LEFT — Employee list */}
            <section className="min-w-0 flex-1 xl:flex xl:basis-3/5 xl:flex-none">
              <div className="overflow-hidden rounded-2xl border border-violet-100 bg-white shadow-sm xl:flex xl:min-h-0 xl:flex-1 xl:flex-col">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-2">
                  <div className="flex items-center gap-2.5">
                    <span className="h-4 w-[3px] rounded-full bg-violet-500" />
                    <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400">
                      Profils classés
                    </span>
                    {!loadingMatches && (
                      <span className="rounded-full border border-violet-200 bg-violet-50 px-2.5 py-0.5 text-xs font-semibold text-violet-600">
                        {employeeCount} profil{employeeCount > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                  {!loadingMatches && employeeCount > 0 && (
                    <span className="text-xs text-slate-400">
                      Cliquez sur <span className="font-medium text-slate-500">Détails</span> pour affecter / désaffecter
                    </span>
                  )}
                </div>

                <div className="p-3.5 xl:min-h-0 xl:flex-1">
                  {loadingMatches ? (
                    <div className="space-y-2" aria-live="polite" aria-busy="true">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div
                          key={i}
                          className="h-[88px] animate-pulse rounded-2xl border border-violet-100 bg-white"
                          style={{ opacity: 1 - i * 0.18 }}
                        />
                      ))}
                    </div>
                  ) : !employeeCount ? (
                    <div className="rounded-2xl border border-dashed border-violet-200 bg-white px-6 py-14 text-center">
                      <p className="text-sm text-slate-400">
                        Aucun employé à afficher ou aucune exigence sur ce besoin.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {matches!.employees.map((row) => (
                        <EmployeeCard
                          key={row.employee_keycloak_id}
                          row={row}
                          onViewDetails={() => openDetails(row)}
                          compact
                        />
                      ))}
                    </div>
                  )}
                </div>
                {matches && matches.total_pages > 1 && (
                  <div className="border-t border-violet-100 bg-violet-50/40 px-4 py-2.5">
                    <div className="flex items-center justify-between gap-3">
                      <p className="min-w-0 text-xs font-semibold text-slate-500">
                        Page {matches.page} sur {matches.total_pages}
                      </p>
                      <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => void loadMatchesPage(rankingPage - 1)}
                        disabled={!matches.has_previous || loadingMatches}
                        aria-label="Page précédente profils classés"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-45"
                      >
                        <ChevronLeftIcon className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => void loadMatchesPage(rankingPage + 1)}
                        disabled={!matches.has_next || loadingMatches}
                        aria-label="Page suivante profils classés"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600 text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-violet-300 disabled:text-violet-100"
                      >
                        <ChevronRightIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  </div>
                )}
              </div>
            </section>

            {/* RIGHT — Config + Équipe */}
            <aside className="w-full xl:flex xl:basis-2/5 xl:shrink-0">
              <div className="flex flex-col gap-2.5 xl:min-h-0 xl:flex-1">

                {/* Config card */}
                <div className="overflow-hidden rounded-2xl border border-violet-100 bg-white shadow-sm">
                  <div className="flex h-10 items-center gap-2.5 border-b border-slate-100 px-4">
                    <span className="h-4 w-[3px] rounded-full bg-violet-500" />
                    <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400">
                      Configuration
                    </span>
                  </div>

                  <div className="space-y-3 p-3.5">
                    <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3.5 py-2.5">
                      <span className="text-sm text-slate-500">Taille de l'équipe</span>
                      <span className="rounded-md bg-violet-100 px-2.5 py-0.5 text-sm font-bold text-violet-700">
                        {teamSize}
                      </span>
                    </div>

                    <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-violet-100 bg-violet-50/50 p-3 transition hover:bg-violet-50">
                      <input
                        type="checkbox"
                        checked={onlyEligible}
                        onChange={(e) => setOnlyEligible(e.target.checked)}
                        className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium leading-snug text-slate-700">
                          Exigences obligatoires uniquement
                        </p>
                        <p className="mt-0.5 text-xs leading-relaxed text-slate-400">
                          Désactivez pour inclure les profils partiellement compatibles.
                        </p>
                      </div>
                    </label>

                    <button
                      type="button"
                      onClick={onRecalculate}
                      disabled={loadingTeam}
                      className="w-full rounded-xl bg-gradient-to-r from-violet-700 to-fuchsia-600 px-4 py-2 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(109,40,217,0.28)] transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 disabled:opacity-60"
                    >
                      {loadingTeam ? "Calcul en cours…" : "Recalculer l'équipe"}
                    </button>
                  </div>
                </div>

                {/* Team result card */}
                <div className="overflow-hidden rounded-2xl border border-violet-100 bg-white shadow-sm xl:flex xl:min-h-0 xl:flex-1 xl:flex-col">
                  <div className="flex h-10 items-center gap-2.5 border-b border-slate-100 px-4">
                    <span className="h-4 w-[3px] rounded-full bg-fuchsia-500" />
                    <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400">
                      Équipe suggérée
                    </span>
                  </div>

                  <div className="p-3.5 xl:flex-1">
                    {team ? (
                      <TeamCard
                        members={team.members}
                        teamSize={team.team_size}
                        memberMatches={matchRows}
                        projectName={project?.name ?? null}
                        compact
                      />
                    ) : loadingTeam && !loadingProject ? (
                      <div className="space-y-2 py-1" aria-live="polite" aria-busy="true">
                        {[1, 2].map((i) => (
                          <div
                            key={i}
                            className="h-14 animate-pulse rounded-xl bg-violet-50"
                            style={{ opacity: 1 - i * 0.3 }}
                          />
                        ))}
                      </div>
                    ) : !loadingProject ? (
                      <p className="py-8 text-center text-sm text-slate-400">
                        Aucun résultat pour ces paramètres.
                        <br />
                        Modifiez le filtre puis relancez.
                      </p>
                    ) : null}
                  </div>
                  {team && team.total_pages > 1 && (
                    <div className="border-t border-violet-100 bg-violet-50/40 px-4 py-2.5">
                      <div className="flex items-center justify-between gap-3">
                        <p className="min-w-0 text-xs font-semibold text-slate-500">
                          Page {team.page} sur {team.total_pages}
                        </p>
                        <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => void buildTeam(teamSize, onlyEligible, teamPage - 1)}
                          disabled={!team.has_previous || loadingTeam}
                          aria-label="Page précédente équipe"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-45"
                        >
                          <ChevronLeftIcon className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => void buildTeam(teamSize, onlyEligible, teamPage + 1)}
                          disabled={!team.has_next || loadingTeam}
                          aria-label="Page suivante équipe"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600 text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-violet-300 disabled:text-violet-100"
                        >
                          <ChevronRightIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    </div>
                  )}
                </div>

              </div>
            </aside>
          </div>
        </div>
      )}

      <EmployeeMatchDrawer
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setSelected(null);
        }}
        projectUuid={projectUuid}
        projectTeamSize={project?.teamSize ?? null}
        row={selected}
        assignments={assignments}
        onAssignmentsChange={setAssignments}
      />
    </TalentWorkspaceShell>
  );
}
