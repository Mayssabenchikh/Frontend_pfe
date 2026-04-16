import { useEffect, useId, useMemo, useState } from "react";
import { XMarkIcon, SparklesIcon } from "../../icons/heroicons/outline";
import {
  matchingApi,
  type EmployeeMatchRowDto,
  type ExplainResponseDto,
  type GapSkillDto,
  type ImprovementSuggestionDto,
  type QuizSuggestionDto,
} from "../../api/matchingApi";
import { assignmentsApi, type AssignmentDto } from "../../api/assignmentsApi";
import { ExplanationBox } from "../../components/matching/ExplanationBox";
import { GapList } from "../../components/matching/GapList";
import { RecommendationList } from "../../components/matching/RecommendationList";
import { SkillBadge } from "../../components/matching/SkillBadge";
import { avatarGradient, avatarInitials, toPercent, toPercentNumber } from "../../components/matching/matchingVisuals";
import { ReasonModal } from "../../components/ReasonModal";

type Props = {
  open: boolean;
  onClose: () => void;
  projectId: number;
  projectTeamSize: number | null;
  row: EmployeeMatchRowDto | null;
  assignments: AssignmentDto[];
  onAssignmentsChange: (next: AssignmentDto[]) => void;
};

export function EmployeeMatchDrawer({ open, onClose, projectId, projectTeamSize, row, assignments, onAssignmentsChange }: Props) {
  const titleId = useId();
  const [gapsLoading, setGapsLoading] = useState(false);
  const [recoLoading, setRecoLoading] = useState(false);
  const [explainLoading, setExplainLoading] = useState(false);
  const [assignLoading, setAssignLoading] = useState(false);
  const [gaps, setGaps] = useState<GapSkillDto[]>([]);
  const [reco, setReco] = useState<{ quizzes: QuizSuggestionDto[]; improvements: ImprovementSuggestionDto[] }>({
    quizzes: [],
    improvements: [],
  });
  const [aiNarrative, setAiNarrative] = useState<string | null>(null);
  const [explain, setExplain] = useState<ExplainResponseDto | null>(null);
  const [withAiReco, setWithAiReco] = useState(false);
  const [removeOpen, setRemoveOpen] = useState(false);

  const topSkills =
    row?.breakdown.requirements
      .slice()
      .sort((a, b) => b.partial_score - a.partial_score)
      .slice(0, 6) ?? [];

  const avatarSeed = row?.email || row?.employee_keycloak_id || row?.display_name || "employee";
  const avatar = avatarGradient(avatarSeed);
  const initials = avatarInitials(row?.display_name, row?.email);

  const activeAssignment = useMemo(() => {
    if (!row) return null;
    const items = assignments.filter(
      (a) => a.projectId === projectId && a.employeeKeycloakId === row.employee_keycloak_id && (a.status === "PENDING" || a.status === "ACCEPTED"),
    );
    return items[0] ?? null;
  }, [assignments, projectId, row]);

  const isProjectFull = useMemo(() => {
    const capacity = Math.max(1, projectTeamSize ?? 1);
    const acceptedCount = assignments.filter((a) => a.projectId === projectId && a.status === "ACCEPTED").length;
    return acceptedCount >= capacity;
  }, [assignments, projectId, projectTeamSize]);

  useEffect(() => {
    if (!open || !row) return;

    setGapsLoading(true);
    setRecoLoading(true);
    setExplainLoading(Boolean(row.match_result_id));
    setExplain(null);
    setAiNarrative(null);
    setWithAiReco(false);

    matchingApi
      .getEmployeeGap(projectId, row.employee_keycloak_id)
      .then((res) => setGaps(res.data.gaps))
      .catch(() => setGaps([]))
      .finally(() => setGapsLoading(false));

    matchingApi
      .getEmployeeRecommendation(projectId, row.employee_keycloak_id, false)
      .then((res) => {
        setReco({ quizzes: res.data.quiz_suggestions, improvements: res.data.improvements });
        setAiNarrative(res.data.ai_narrative ?? null);
      })
      .catch(() => setReco({ quizzes: [], improvements: [] }))
      .finally(() => setRecoLoading(false));

    if (row.match_result_id) {
      matchingApi
        .explainMatch(row.match_result_id)
        .then((res) => setExplain(res.data))
        .catch(() => setExplain(null))
        .finally(() => setExplainLoading(false));
    } else {
      setExplain({
        match_result_id: 0,
        deterministic_summary:
          "Aucun enregistrement de correspondance associé. Rouvrez la page des classements pour régénérer les scores et activer l'explication détaillée.",
        ai_explanation: null,
      });
      setExplainLoading(false);
    }
  }, [open, row, projectId]);

  const loadRecoWithAi = async () => {
    if (!row) return;
    setRecoLoading(true);
    try {
      const res = await matchingApi.getEmployeeRecommendation(projectId, row.employee_keycloak_id, true);
      setReco({ quizzes: res.data.quiz_suggestions, improvements: res.data.improvements });
      setAiNarrative(res.data.ai_narrative ?? null);
      setWithAiReco(true);
    } catch {
      setAiNarrative(null);
    } finally {
      setRecoLoading(false);
    }
  };

  if (!open) return null;

  const handleInvite = async () => {
    if (!row) return;
    setAssignLoading(true);
    try {
      await assignmentsApi.invite(projectId, row.employee_keycloak_id);
      const res = await assignmentsApi.listProjectAssignments(projectId);
      onAssignmentsChange(Array.isArray(res.data) ? res.data : []);
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
      await assignmentsApi.remove(activeAssignment.id, String(reason).trim());
      const res = await assignmentsApi.listProjectAssignments(projectId);
      onAssignmentsChange(Array.isArray(res.data) ? res.data : []);
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
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[430px] flex-col border-l border-violet-100 bg-white shadow-[0_18px_56px_rgba(15,23,42,0.22)]"
      >
        <header className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white shadow-md"
              style={{ background: `linear-gradient(135deg, ${avatar[0]}, ${avatar[1]})` }}
            >
              {initials}
            </div>
            <div className="min-w-0">
              <h2 id={titleId} className="truncate text-2xl font-black leading-none tracking-tight text-slate-800">
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

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
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

              <section className="rounded-2xl border border-violet-100 bg-white p-4">
                <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] text-violet-600">Compétences clés</h3>
                <p className="mt-1 text-[11px] text-slate-500">
                  Niveau pris en compte = dernier niveau validé utilisé dans le score.
                </p>
                <div className="flex flex-wrap gap-2">
                  {topSkills.map((r) => {
                    const hasUnverifiedLevelGap =
                      r.effective_level !== r.employee_level && r.employee_level > r.effective_level;
                    const pendingQuizLevel =
                      r.evidence === "quiz" && r.effective_level === 0 && r.employee_level > 0;
                    const levelDetails = hasUnverifiedLevelGap
                      ? `Pris en compte: L${r.effective_level} · Déclaré: L${r.employee_level}${
                          pendingQuizLevel ? " (quiz en attente)" : ""
                        }`
                      : null;

                    return (
                      <div key={r.skill_id} className="space-y-1 rounded-lg border border-slate-100 bg-slate-50/70 px-2 py-1.5">
                        <SkillBadge
                          name={r.skill_name}
                          level={r.effective_level}
                          evidence={r.evidence}
                          meets={r.meets}
                        />
                        {levelDetails ? <p className="text-[10px] text-slate-600">{levelDetails}</p> : null}
                      </div>
                    );
                  })}
                </div>
                {!topSkills.length ? <p className="mt-2 text-sm text-slate-500">Aucune compétence évaluée.</p> : null}
              </section>

              <section className="rounded-2xl border border-violet-100 bg-white p-4">
                <h3 className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">Écarts identifiés</h3>
                <GapList gaps={gaps} loading={gapsLoading} />
              </section>

              <section className="rounded-2xl border border-violet-100 bg-white p-4">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">Recommandations</h3>
                  <button
                    type="button"
                    onClick={loadRecoWithAi}
                    disabled={recoLoading}
                    className="inline-flex items-center gap-1 rounded-lg border border-violet-200 bg-violet-50 px-2 py-1 text-[11px] font-semibold text-violet-800 transition hover:bg-violet-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 disabled:opacity-50"
                  >
                    <SparklesIcon className="h-3.5 w-3.5" />
                    Narration IA
                  </button>
                </div>
                <RecommendationList quizzes={reco.quizzes} improvements={reco.improvements} loading={recoLoading} />
              </section>

              <section className="rounded-[24px] bg-gradient-to-br from-violet-700 via-fuchsia-600 to-violet-700 p-4 text-white">
                <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] text-violet-100">Synthèse prédictive</h3>
                <p className="mt-2 text-sm leading-6 text-violet-50">
                  {withAiReco && aiNarrative ? aiNarrative : explain?.deterministic_summary || "Synthèse indisponible."}
                </p>
                <p className="mt-3 text-xs text-violet-100/90">
                  {row.meets_mandatory ? "Profil prioritaire." : "Remédiation requise avant affectation."}
                </p>
              </section>

              <section className="rounded-2xl border border-violet-100 bg-white p-4">
                <h3 className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">Explication détaillée</h3>
                <ExplanationBox
                  deterministicSummary={
                    explain?.deterministic_summary ??
                    "Explication déterministe indisponible pour cette correspondance."
                  }
                  aiExplanation={explain?.ai_explanation ?? null}
                  loading={explainLoading && Boolean(row.match_result_id)}
                />
              </section>
            </div>
          )}
        </div>

        <footer className="flex shrink-0 items-center border-t border-slate-100 px-5 py-4">
          {!row ? null : activeAssignment ? (
            <button
              type="button"
              disabled={assignLoading}
              onClick={handleRemove}
              className="w-full rounded-2xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-700 shadow-sm transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {activeAssignment.status === "PENDING" ? "Annuler l’invitation" : "Désaffecter (retirer du projet)"}
            </button>
          ) : (
            <button
              type="button"
              disabled={assignLoading || isProjectFull}
              onClick={handleInvite}
              className="w-full rounded-2xl bg-gradient-to-r from-violet-700 to-fuchsia-600 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_10px_22px_rgba(109,40,217,0.24)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {assignLoading ? "Envoi…" : isProjectFull ? "Équipe complète" : "Inviter sur le projet"}
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
