import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { UsersIcon } from "@heroicons/react/24/outline";
import { matchingApi, type EmployeeMatchRowDto, type MatchListResponseDto } from "../../api/matchingApi";
import { projectsApi, type ProjectDto } from "../../api/projectsApi";
import { EmployeeCard } from "../../components/matching/EmployeeCard";
import { TalentWorkspaceShell } from "../../components/matching/TalentWorkspaceShell";
import { EmployeeMatchDrawer } from "./EmployeeMatchDrawer";
import { formatFrenchDate } from "../../components/matching/matchingVisuals";
import { AlertBanner } from "../../components/AlertBanner";

export function ProjectMatchesPage() {
  const { id } = useParams<{ id: string }>();
  const projectId = id ? parseInt(id, 10) : NaN;

  const [project, setProject] = useState<ProjectDto | null>(null);
  const [matches, setMatches] = useState<MatchListResponseDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selected, setSelected] = useState<EmployeeMatchRowDto | null>(null);

  useEffect(() => {
    if (Number.isNaN(projectId)) {
      setError("ID besoin invalide");
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([projectsApi.get(projectId).catch(() => null), matchingApi.getProjectMatches(projectId).catch(() => null)])
      .then(([projRes, matchRes]) => {
        if (cancelled) return;
        setProject(projRes?.data ?? null);
        if (!matchRes?.data) {
          setError(
            "Service de correspondances indisponible. Vérifiez que le microservice FastAPI tourne et que le proxy /matching-api est correct.",
          );
          setMatches(null);
        } else {
          setMatches(matchRes.data);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const openDetails = (row: EmployeeMatchRowDto) => {
    setSelected(row);
    setDrawerOpen(true);
  };

  if (Number.isNaN(projectId)) {
    return (
      <div className="p-6">
        <AlertBanner message="ID invalide" />
      </div>
    );
  }

  
  const computedDate = formatFrenchDate(matches?.computed_at);

  return (
    <TalentWorkspaceShell
      title={
        <>
          Profils classés :{" "}
          <span className="text-violet-600">{project?.name || "Projet"}</span>
        </>
      }
      subtitle={
        project ? (
          <>
            Calculé le {computedDate || "--"}
          </>
        ) : (
          "Chargement du contexte…"
        )
      }
      actions={
        <Link
          to={`/manager/matching/${projectId}/team`}
          className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-700 to-fuchsia-600 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_10px_22px_rgba(109,40,217,0.25)] transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
        >
          <UsersIcon className="h-4 w-4" />
          Équipe optimale
        </Link>
      }
    >
      {loading ? (
        <div className="space-y-3" aria-live="polite" aria-busy="true">
          <p className="text-sm font-medium text-slate-600">Chargement du classement en cours…</p>
          <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-44 animate-pulse rounded-[22px] border border-violet-100/80 bg-white/90 shadow-sm" />
          ))}
          </div>
        </div>
      ) : error ? (
        <AlertBanner message={error} />
      ) : !matches?.employees.length ? (
        <p className="rounded-3xl border border-violet-100/80 bg-white px-4 py-12 text-center text-sm text-slate-600 shadow-md shadow-violet-100/50">
          Aucun employé à afficher ou aucune exigence sur ce besoin.
        </p>
      ) : (
        <section className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
          {matches.employees.map((row) => (
            <EmployeeCard key={row.employee_keycloak_id} row={row} onViewDetails={() => openDetails(row)} />
          ))}
          </div>
        </section>
      )}

      <EmployeeMatchDrawer
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setSelected(null);
        }}
        projectId={projectId}
        row={selected}
      />
    </TalentWorkspaceShell>
  );
}
