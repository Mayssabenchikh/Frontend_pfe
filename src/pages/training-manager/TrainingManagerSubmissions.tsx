import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { trainingManagerSubmissionsApi, type TrainingManagerSubmissionDetail, type TrainingManagerSubmissionSummary } from "../../api/trainingManagerSubmissionsApi";
import { ClipboardDocumentCheckIcon, SparklesIcon } from "../../icons/heroicons/outline";

export function TrainingManagerSubmissions() {
  const [submissions, setSubmissions] = useState<TrainingManagerSubmissionSummary[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<TrainingManagerSubmissionDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [reviewSaving, setReviewSaving] = useState(false);
  const [finalScore, setFinalScore] = useState<number | null>(null);
  const [finalFeedback, setFinalFeedback] = useState("");

  const selectedSummary = useMemo(
    () => submissions.find((s) => s.submissionUuid === selectedId) ?? null,
    [submissions, selectedId],
  );

  useEffect(() => {
    setLoadingList(true);
    setListError(null);
    trainingManagerSubmissionsApi
      .list()
      .then((res) => {
        setSubmissions(res.data);
        if (!selectedId && res.data.length > 0) setSelectedId(res.data[0].submissionUuid);
      })
      .catch((e) => setListError(e?.response?.data?.error ?? "Impossible de charger les soumissions"))
      .finally(() => setLoadingList(false));
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }
    setLoadingDetail(true);
    trainingManagerSubmissionsApi
      .detail(selectedId)
      .then((res) => {
        setDetail(res.data);
        setFinalScore(res.data.finalScore ?? res.data.aiCorrection?.suggestedScore ?? null);
        setFinalFeedback(res.data.finalFeedback ?? res.data.aiCorrection?.personalizedFeedback ?? "");
      })
      .catch((e) => toast.error(e?.response?.data?.error ?? "Impossible de charger la soumission"))
      .finally(() => setLoadingDetail(false));
  }, [selectedId]);

  const runAiCorrection = async () => {
    if (!selectedId) return;
    setAiLoading(true);
    try {
      const { data } = await trainingManagerSubmissionsApi.aiCorrection(selectedId);
      setDetail((prev) => (prev ? { ...prev, aiCorrection: data } : prev));
      if (finalScore == null) setFinalScore(data.suggestedScore);
      if (!finalFeedback) setFinalFeedback(data.personalizedFeedback);
      toast.success("Correction IA générée");
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      toast.error(err?.response?.data?.error ?? "Ollama ne répond pas pour le moment");
    } finally {
      setAiLoading(false);
    }
  };

  const saveReview = async () => {
    if (!selectedId) return;
    setReviewSaving(true);
    try {
      const { data } = await trainingManagerSubmissionsApi.review(selectedId, {
        finalScore,
        finalFeedback: finalFeedback.trim() || null,
      });
      setDetail(data);
      setSubmissions((prev) =>
        prev.map((item) =>
          item.submissionUuid === selectedId
            ? {
                ...item,
                humanReviewed: true,
                finalScore: data.finalScore ?? finalScore,
              }
            : item,
        ),
      );
      toast.success("Validation enregistrée");
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      toast.error(err?.response?.data?.error ?? "Enregistrement impossible");
    } finally {
      setReviewSaving(false);
    }
  };

  return (
    <div className="w-full space-y-8 px-4 pb-10 pt-2 sm:px-6 sm:pt-4">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-violet-700/90">Validation IA</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-3xl">Soumissions a corriger</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
            Lancez une correction IA pour les exercices et activites soumis par les employes et managers.
            La validation finale reste humaine.
          </p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">
          <SparklesIcon className="h-4 w-4" /> IA active
        </span>
      </header>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <section className="tm-card">
          <div className="tm-card-header flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-800">
              <ClipboardDocumentCheckIcon className="h-5 w-5 text-violet-600" />
              <h2 className="text-base font-semibold">Soumissions recentes</h2>
            </div>
            <button
              type="button"
              onClick={() => setSelectedId(null)}
              className="tm-btn tm-btn-ghost"
            >
              Reinitialiser
            </button>
          </div>
          <div className="tm-card-body space-y-4">
            {listError && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">
                {listError}
              </div>
            )}
            {loadingList ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                Chargement des soumissions...
              </div>
            ) : submissions.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                Aucune soumission pour le moment.
              </div>
            ) : (
              <ul className="space-y-3">
                {submissions.map((item) => (
                  <li
                    key={item.submissionUuid}
                    className={`cursor-pointer rounded-xl border px-4 py-3 transition ${
                      item.submissionUuid === selectedId
                        ? "border-violet-300 bg-violet-50/70"
                        : "border-slate-200 bg-white hover:border-violet-200"
                    }`}
                    onClick={() => setSelectedId(item.submissionUuid)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{item.activityTitle}</p>
                        <p className="mt-1 text-xs text-slate-500">{item.programTitle} · {item.courseTitle}</p>
                        <p className="mt-1 text-xs text-slate-500">{item.learnerName}</p>
                      </div>
                      <div className="text-right text-xs uppercase tracking-wide text-slate-400">
                        {new Date(item.submittedAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold uppercase">
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">{item.activityKind}</span>
                      {item.aiCorrectionReady && (
                        <span className="rounded-full bg-violet-100 px-2 py-0.5 text-violet-700">IA prete</span>
                      )}
                      {item.humanReviewed && (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-700">Validee</span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section className="space-y-4">
          <div className="tm-card">
            <div className="tm-card-header flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-slate-800">Detail de soumission</h2>
                {selectedSummary && (
                  <p className="mt-1 text-xs text-slate-500">{selectedSummary.programTitle}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => void runAiCorrection()}
                disabled={!selectedId || aiLoading || loadingDetail}
                className="tm-btn tm-btn-primary"
              >
                {aiLoading ? "Correction..." : "Corriger avec IA"}
              </button>
            </div>
            <div className="tm-card-body">
              {loadingDetail ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                  Chargement de la soumission...
                </div>
              ) : !detail ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                  Selectionnez une soumission a corriger.
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Activite</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{detail.activityTitle}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {detail.courseTitle} · {detail.learnerName}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Consigne</p>
                    <p className="mt-2 whitespace-pre-line text-sm text-slate-700">
                      {detail.instructions || "Aucune consigne specifiee."}
                    </p>
                    {detail.evaluationCriteria.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Criteres d'evaluation</p>
                        <ul className="mt-2 space-y-1 text-sm text-slate-700">
                          {detail.evaluationCriteria.map((criterion, index) => (
                            <li key={`${criterion.criterion}-${index}`}>
                              <span className="font-semibold">{criterion.criterion}</span>
                              {criterion.points ? ` · ${criterion.points} pts` : ""}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="grid gap-4 lg:grid-cols-2">
                    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Reponse apprenant</p>
                        {detail.learnerSubmissionFileUrl && (
                          <a className="text-xs font-semibold text-violet-700 hover:underline" href={detail.learnerSubmissionFileUrl} target="_blank" rel="noreferrer">
                            Ouvrir fichier
                          </a>
                        )}
                      </div>
                      <p className="mt-2 whitespace-pre-line text-sm text-slate-700">
                        {detail.learnerSubmissionText || detail.learnerSubmissionFileUrl || "Aucune reponse texte."}
                      </p>
                    </div>

                    <div className="rounded-xl border border-violet-200 bg-violet-50/50 p-4">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">Correction IA</p>
                        <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-violet-700">
                          Validation humaine obligatoire
                        </span>
                      </div>
                      {detail.aiCorrection ? (
                        <div className="mt-3 space-y-3 text-sm text-slate-700">
                          <div className="flex flex-wrap gap-2">
                            <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                              Score: {detail.aiCorrection.suggestedScore}/{detail.aiCorrection.maxScore}
                            </span>
                            <span className="rounded-full bg-violet-100 px-2.5 py-1 text-xs font-semibold text-violet-700">
                              Confiance: {detail.aiCorrection.confidenceLevel}
                            </span>
                          </div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Resume</p>
                          <p className="text-sm text-slate-700">{detail.aiCorrection.summary}</p>
                          <ResultList title="Points forts" items={detail.aiCorrection.strengths} />
                          <ResultList title="Points faibles" items={detail.aiCorrection.weaknesses} />
                          <ResultList title="Erreurs" items={detail.aiCorrection.mistakes} />
                          <ResultList title="Competences acquises" items={detail.aiCorrection.acquiredSkills} />
                          <ResultList title="Competences a ameliorer" items={detail.aiCorrection.skillsToImprove} />
                          {detail.aiCorrection.personalizedFeedback && (
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Feedback personnalise</p>
                              <p className="mt-1 whitespace-pre-line text-sm text-slate-700">
                                {detail.aiCorrection.personalizedFeedback}
                              </p>
                            </div>
                          )}
                          <ResultList title="Recommandations" items={detail.aiCorrection.recommendations} />
                        </div>
                      ) : (
                        <div className="mt-4 rounded-lg border border-dashed border-violet-200 bg-white px-3 py-6 text-center text-xs text-violet-600">
                          Aucune correction IA generee.
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Validation humaine</p>
                      <button
                        type="button"
                        onClick={() => void saveReview()}
                        disabled={reviewSaving}
                        className="tm-btn tm-btn-primary"
                      >
                        {reviewSaving ? "Enregistrement..." : "Valider manuellement"}
                      </button>
                    </div>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <label className="text-xs font-semibold text-slate-600">
                        Note finale
                        <input
                          type="number"
                          min={0}
                          value={finalScore ?? ""}
                          onChange={(e) => setFinalScore(e.target.value === "" ? null : Number(e.target.value))}
                          className="tm-input mt-1"
                        />
                      </label>
                      <label className="text-xs font-semibold text-slate-600 sm:col-span-2">
                        Feedback final
                        <textarea
                          value={finalFeedback}
                          onChange={(e) => setFinalFeedback(e.target.value)}
                          className="tm-textarea mt-1 min-h-[120px]"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function ResultList({ title, items }: { title: string; items: string[] }) {
  if (!items || items.length === 0) return null;
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
      <ul className="mt-2 space-y-1">
        {items.map((item, index) => (
          <li key={`${title}-${index}`} className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-700">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
