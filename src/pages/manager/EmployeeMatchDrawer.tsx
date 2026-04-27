import { useEffect, useId, useMemo, useState } from "react";
import { toast } from "sonner";
import { XMarkIcon } from "../../icons/heroicons/outline";
import { matchingApi, type EmployeeMatchRowDto, type ExplainResponseDto, type GapSkillDto } from "../../api/matchingApi";
import { assignmentsApi, type AssignmentDto } from "../../api/assignmentsApi";
import { ExplanationBox } from "../../components/matching/ExplanationBox";
import { GapList } from "../../components/matching/GapList";
import { avatarGradient, avatarInitials, toPercent, toPercentNumber } from "../../components/matching/matchingVisuals";
import { ReasonModal } from "../../components/ReasonModal";
import { getUserFacingApiMessage } from "../../utils/apiUserMessage";

type Props = {
  open: boolean;
  onClose: () => void;
  projectUuid: string;
  projectTeamSize: number | null;
  row: EmployeeMatchRowDto | null;
  assignments: AssignmentDto[];
  onAssignmentsChange: (next: AssignmentDto[]) => void;
};

export function EmployeeMatchDrawer({ open, onClose, projectUuid, projectTeamSize, row, assignments, onAssignmentsChange }: Props) {
  const titleId = useId();
  const [gapsLoading, setGapsLoading] = useState(false);
  const [explainLoading, setExplainLoading] = useState(false);
  const [assignLoading, setAssignLoading] = useState(false);
  const [gaps, setGaps] = useState<GapSkillDto[]>([]);
  const [explain, setExplain] = useState<ExplainResponseDto | null>(null);
  const [removeOpen, setRemoveOpen] = useState(false);
  const [employeeAcceptedCount, setEmployeeAcceptedCount] = useState(0);
  const [employeeAcceptedMax, setEmployeeAcceptedMax] = useState(3);

  const avatarSeed = row?.email || row?.employee_keycloak_id || row?.display_name || "employee";
  const avatar = avatarGradient(avatarSeed);
  const initials = avatarInitials(row?.display_name, row?.email);

  const activeAssignment = useMemo(() => {
    if (!row) return null;
    const items = assignments.filter(
      (a) => a.projectUuid === projectUuid && a.employeeKeycloakId === row.employee_keycloak_id && (a.status === "PENDING" || a.status === "ACCEPTED"),
    );
    return items[0] ?? null;
  }, [assignments, projectUuid, row]);

  const isProjectFull = useMemo(() => {
    const capacity = Math.max(1, projectTeamSize ?? 1);
    const acceptedCount = assignments.filter((a) => a.projectUuid === projectUuid && a.status === "ACCEPTED").length;
    return acceptedCount >= capacity;
  }, [assignments, projectUuid, projectTeamSize]);

  useEffect(() => {
    if (!open || !row) return;

    setGapsLoading(true);
    setExplainLoading(Boolean(row.match_result_uuid));
    setExplain(null);

    matchingApi
      .getEmployeeGap(projectUuid, row.employee_keycloak_id)
      .then((res) => setGaps(res.data.gaps))
      .catch(() => setGaps([]))
      .finally(() => setGapsLoading(false));

    if (row.match_result_uuid) {
      matchingApi
        .explainMatch(row.match_result_uuid)
        .then((res) => setExplain(res.data))
        .catch(() => setExplain(null))
        .finally(() => setExplainLoading(false));
    } else {
      setExplain({
        match_result_uuid: "",
        deterministic_summary:
          "Aucun enregistrement de correspondance associé. Rouvrez la page des classements pour régénérer les scores et activer l'explication détaillée.",
        ai_explanation: null,
      });
      setExplainLoading(false);
    }
  }, [open, row, projectUuid]);

  useEffect(() => {
    if (!open || !row) return;
    assignmentsApi
      .employeeAcceptedAssignmentsCount(row.employee_keycloak_id)
      .then((res) => {
        const count = Number(res.data?.count ?? 0);
        const max = Number(res.data?.max ?? 3);
        setEmployeeAcceptedCount(Number.isFinite(count) ? count : 0);
        setEmployeeAcceptedMax(Number.isFinite(max) && max > 0 ? max : 3);
      })
      .catch(() => {
        setEmployeeAcceptedCount(0);
        setEmployeeAcceptedMax(3);
      });
  }, [open, row]);

  if (!open) return null;

  const handleInvite = async () => {
    if (!row) return;
    setAssignLoading(true);
    try {
      await assignmentsApi.invite(projectUuid, row.employee_keycloak_id);
      const res = await assignmentsApi.listProjectAssignments(projectUuid);
      onAssignmentsChange(Array.isArray(res.data) ? res.data : []);
      setEmployeeAcceptedCount((prev) => prev + 1);
    } catch (err) {
      toast.error(getUserFacingApiMessage(err, "Impossible d'affecter cet employé."));
    } finally {
      setAssignLoading(false);
    }
  };

  const handleRemove = async () => {
    if (!activeAssignment) return;
    setRemoveOpen(true);
  };

  const confirmRemove = async (reason: string) => {
    if (!activeAssignment) return;
    setAssignLoading(true);
    try {
      await assignmentsApi.remove(activeAssignment.uuid, String(reason).trim());
      const res = await assignmentsApi.listProjectAssignments(projectUuid);
      onAssignmentsChange(Array.isArray(res.data) ? res.data : []);
      if (activeAssignment.status === "ACCEPTED") {
        setEmployeeAcceptedCount((prev) => Math.max(0, prev - 1));
      }
    } finally {
      setAssignLoading(false);
      setRemoveOpen(false);
    }
  };

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-40 bg-slate-900/35 backdrop-blur-[2px] transition-opacity"
        aria-label="Fermer"
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="fixed inset-y-0 right-0 z-50 flex max-h-[100dvh] w-full max-w-[430px] flex-col border-l border-violet-100 bg-white shadow-[0_18px_56px_rgba(15,23,42,0.22)] pt-[env(safe-area-inset-top,0px)]"
      >
        <header className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-100 px-4 py-3 sm:px-5 sm:py-4">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white shadow-md"
              style={{ background: `linear-gradient(135deg, ${avatar[0]}, ${avatar[1]})` }}
            >
              {initials}
            </div>
            <div className="min-w-0">
              <h2 id={titleId} className="truncate text-xl font-black leading-tight tracking-tight text-slate-800 sm:text-2xl">
                {row?.display_name || "Profil"}
              </h2>
              <p className="mt-1 truncate text-sm text-slate-500">{row?.email || ""}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer le panneau"
            className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3 sm:px-5 sm:py-4">
          {!row ? (
            <p className="text-sm text-slate-500">Aucun employé sélectionné.</p>
          ) : (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <article className="rounded-3xl bg-violet-50 p-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.11em] text-violet-600">Score de correspondance</p>
                  <p className="mt-1 text-2xl font-black leading-none text-violet-700">{toPercent(row.match_score)}</p>
                  <div className="mt-3 h-1.5 rounded-full bg-violet-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-violet-700 to-fuchsia-500"
                      style={{ width: `${toPercentNumber(row.match_score)}%` }}
                    />
                  </div>
                </article>

                <article className="rounded-3xl bg-slate-100/80 p-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.11em] text-slate-500">Confiance</p>
                  <p className="mt-1 text-2xl font-black leading-none text-slate-800">{toPercent(row.confidence_score)}</p>
                  <p className="mt-2 text-[11px] text-slate-500">Basée sur le statut de validation de chaque compétence.</p>
                </article>
              </div>

              <p className="text-xs font-semibold text-slate-600">
                {row.meets_mandatory ? "Exigences obligatoires du projet : conforme." : "Exigences obligatoires du projet : non satisfaites."}
              </p>

              <section className="rounded-2xl border border-violet-100 bg-white p-4">
                <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">Écarts par rapport au projet</h3>
                <div className="mt-2">
                  <GapList gaps={gaps} loading={gapsLoading} />
                </div>
              </section>

              <section className="rounded-2xl border border-violet-100 bg-white p-4">
                <h3 className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">Synthèse</h3>
                <ExplanationBox
                  deterministicSummary={
                    explain?.deterministic_summary ?? "Explication déterministe indisponible pour cette correspondance."
                  }
                  aiExplanation={explain?.ai_explanation ?? null}
                  loading={explainLoading && Boolean(row.match_result_uuid)}
                />
              </section>
              <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                Affectations actives de cet employé: <span className="font-semibold">{employeeAcceptedCount}</span> /{" "}
                <span className="font-semibold">{employeeAcceptedMax}</span>.
              </p>
            </div>
          )}
        </div>

        <footer className="flex shrink-0 items-center border-t border-slate-100 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] sm:px-5 sm:py-4 sm:pb-4">
          {!row ? null : activeAssignment ? (
            <button
              type="button"
              disabled={assignLoading}
              onClick={handleRemove}
              className="w-full rounded-2xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-700 shadow-sm transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {activeAssignment.status === "PENDING" ? "Annuler l’affectation" : "Désaffecter (retirer du projet)"}
            </button>
          ) : (
            <button
              type="button"
              disabled={assignLoading || isProjectFull || employeeAcceptedCount >= employeeAcceptedMax}
              onClick={handleInvite}
              className="w-full rounded-2xl bg-gradient-to-r from-violet-700 to-fuchsia-600 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_10px_22px_rgba(109,40,217,0.24)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {assignLoading
                ? "Envoi…"
                : isProjectFull
                  ? "Équipe complète"
                  : employeeAcceptedCount >= employeeAcceptedMax
                    ? "Limite employé atteinte"
                    : "Affecter au projet"}
            </button>
          )}
        </footer>
      </aside>

      <ReasonModal
        open={removeOpen}
        title="Annuler / Désaffecter"
        description="Un motif est obligatoire et sera journalisé."
        placeholder="Ex: changement de priorité, disponibilité, profil non retenu…"
        confirmLabel="Confirmer"
        cancelLabel="Annuler"
        variant="danger"
        loading={assignLoading}
        onCancel={() => setRemoveOpen(false)}
        onConfirm={confirmRemove}
      />
    </>
  );
}
