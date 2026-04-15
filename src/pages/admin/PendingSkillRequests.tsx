import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowPathIcon,
  EnvelopeIcon,
  UserIcon,
  CalendarDaysIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
  SparklesIcon,
  BoltIcon,
  QuestionMarkCircleIcon,
} from "@heroicons/react/24/outline";
import { toast } from "sonner";
import { skillsApi } from "../../api/skillsApi";
import type { PendingSkillRequestDto, SkillCategoryDto, SkillDto } from "./types";
import { getApiError } from "./utils";
import { AlertBanner } from "../../components/AlertBanner";

const PAGE_SIZE = 5;

type PageState = {
  content: PendingSkillRequestDto[];
  totalElements: number;
  totalPages: number;
  page: number;
};

const STATUS_FILTERS = ["ALL", "PENDING", "APPROVED", "MERGED", "REJECTED"] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

const STATUS_BADGE: Record<string, string> = {
  PENDING: "border-amber-200 bg-amber-50 text-amber-700",
  APPROVED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  MERGED: "border-indigo-200 bg-indigo-50 text-indigo-700",
  REJECTED: "border-rose-200 bg-rose-50 text-rose-700",
};

const STATUS_LABEL: Record<string, string> = {
  ALL: "Tous les statuts",
  PENDING: "En attente",
  APPROVED: "Approuvée",
  MERGED: "Fusionnée",
  REJECTED: "Rejetée",
};

type MergeSuggestion = {
  skillId: number;
  confidence: number;
  reason: string;
  source: "ai" | "local";
};

function normalizeKey(raw: string) {
  const s0 = (raw ?? "").trim().toLowerCase();
  if (!s0) return "";
  const noAccents = s0.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const spaced = noAccents
    .replace(/[\s\u00A0]+/g, " ")
    .replace(/["'`.,;:()\[\]{}\\/|_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return spaced;
}

function findCatalogCollision(
  proposedName: string,
  allSkills: SkillDto[],
  opts?: { allowSkillId?: number }
): { type: "skillName" | "synonym"; skill: SkillDto; alias?: string } | null {
  const key = normalizeKey(proposedName);
  if (!key) return null;
  const allowId = opts?.allowSkillId;
  for (const s of allSkills) {
    if (allowId != null && s.id === allowId) continue;
    if (normalizeKey(s.name) === key) return { type: "skillName", skill: s };
  }
  for (const s of allSkills) {
    if (allowId != null && s.id === allowId) continue;
    for (const a of s.synonyms ?? []) {
      if (normalizeKey(a) === key) return { type: "synonym", skill: s, alias: a };
    }
  }
  return null;
}

export function PendingSkillRequests() {
  const [page, setPage] = useState(0);
  const [data, setData] = useState<PageState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resolveModal, setResolveModal] = useState<PendingSkillRequestDto | null>(null);
  const [requestersModal, setRequestersModal] = useState<PendingSkillRequestDto | null>(null);
  const [resolveAction, setResolveAction] = useState<"APPROVE" | "MERGE" | "REJECT">("APPROVE");
  const [resolveCategoryId, setResolveCategoryId] = useState<number | "">("");
  const [resolveSkillId, setResolveSkillId] = useState<number | "">("");
  const [resolveNotes, setResolveNotes] = useState("");
  const [resolveLoading, setResolveLoading] = useState(false);
  const [suggestionLoading, setSuggestionLoading] = useState(false);
  const [mergeSuggestion, setMergeSuggestion] = useState<MergeSuggestion | null>(null);
  const [categories, setCategories] = useState<SkillCategoryDto[]>([]);
  const [skills, setSkills] = useState<SkillDto[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [search, setSearch] = useState("");

  const loadPage = useCallback(() => {
    setLoading(true);
    skillsApi.listPendingSkillRequests({
      page,
      size: PAGE_SIZE,
      status: statusFilter === "ALL" ? undefined : statusFilter,
    })
      .then((res) => {
        const payload = res.data;
        setData(payload ? {
          content: payload.content ?? [],
          totalElements: payload.totalElements ?? 0,
          totalPages: payload.totalPages ?? 0,
          page: payload.page ?? page,
        } : null);
        setError(null);
      })
      .catch((err) => {
        setError(getApiError(err, "Erreur lors du chargement des demandes"));
        setData(null);
      })
      .finally(() => setLoading(false));
  }, [page, statusFilter]);

  useEffect(() => {
    loadPage();
  }, [loadPage]);

  useEffect(() => {
    setPage(0);
  }, [statusFilter]);

  useEffect(() => {
    skillsApi.listCategories()
      .then((res) => setCategories(res.data ?? []))
      .catch(() => setCategories([]));
    skillsApi.listSkills()
      .then((res) => setSkills(res.data ?? []))
      .catch(() => setSkills([]));
  }, []);

  const refresh = () => {
    loadPage();
    toast.success("Liste actualisée");
  };

  const requests = data?.content ?? [];
  const mergeSkills = useMemo(() => {
    if (!skills.length) return [];
    if (!mergeSuggestion?.skillId) return [];
    const suggested = skills.find((s) => s.id === mergeSuggestion.skillId);
    if (!suggested) return [];
    return [suggested];
  }, [skills, mergeSuggestion]);

  const filteredRequests = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return requests;
    return requests.filter((r) => {
      const hay = [
        r.rawSkillName ?? "",
        r.requestedByName ?? "",
        r.requestedByEmail ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [requests, search]);

  const openResolveModal = (req: PendingSkillRequestDto) => {
    setResolveModal(req);
    setResolveAction("APPROVE");
    setResolveCategoryId(categories[0]?.id ?? "");
    setResolveSkillId("");
    setResolveNotes("");
    setMergeSuggestion(null);
  };

  const findLocalSuggestion = useCallback((rawSkillName: string): MergeSuggestion | null => {
    const key = normalizeKey(rawSkillName);
    if (!key) return null;

    for (const skill of skills) {
      if (normalizeKey(skill.name) === key) {
        return {
          skillId: skill.id,
          confidence: 0.99,
          reason: "Correspondance exacte avec une compétence existante",
          source: "local",
        };
      }
      const alias = skill.synonyms?.find((a) => normalizeKey(a) === key);
      if (alias) {
        return {
          skillId: skill.id,
          confidence: 0.97,
          reason: `Correspondance exacte avec le synonyme « ${alias} »`,
          source: "local",
        };
      }
    }

    const tokens = key
      .split(" ")
      .map((t) => t.trim())
      .filter((t) => t.length >= 2);
    if (!tokens.length) return null;
    let best: { skill: SkillDto; score: number } | null = null;
    for (const skill of skills) {
      const pool = [skill.name, ...(skill.synonyms ?? [])]
        .map((v) => normalizeKey(v))
        .join(" ");
      if (!pool) continue;
      const overlap = tokens.filter((t) => pool.includes(t)).length;
      const score = tokens.length === 0 ? 0 : overlap / tokens.length;
      if (!best || score > best.score) {
        best = { skill, score };
      }
    }
    if (!best || best.score < 0.4) return null;
    return {
      skillId: best.skill.id,
      confidence: Number(best.score.toFixed(2)),
      reason: "Suggestion locale basée sur similarité de termes",
      source: "local",
    };
  }, [skills]);

  const loadMergeSuggestion = useCallback(async (req: PendingSkillRequestDto) => {
    const local = findLocalSuggestion(req.rawSkillName);
    if (local) {
      setMergeSuggestion(local);
      setResolveSkillId(local.skillId);
      setResolveAction("MERGE");
    }

    setSuggestionLoading(true);
    try {
      const res = await skillsApi.suggestMergeForPendingSkillRequest(req.id);
      const payload = res.data;
      if (!payload?.suggestedSkillId) return;
      const reason = payload.reason?.trim() || "Suggestion IA basée sur similarité sémantique";
      setMergeSuggestion({
        skillId: payload.suggestedSkillId,
        confidence: Number(payload.confidence ?? 0),
        reason,
        source: "ai",
      });
      setResolveSkillId(payload.suggestedSkillId);
      setResolveAction("MERGE");
    } catch {
      // Fallback silencieux vers la suggestion locale.
    } finally {
      setSuggestionLoading(false);
    }
  }, [findLocalSuggestion]);

  useEffect(() => {
    if (!resolveModal) return;
    void loadMergeSuggestion(resolveModal);
  }, [resolveModal, loadMergeSuggestion]);

  const submitResolve = () => {
    if (!resolveModal) return;
    if (resolveAction === "APPROVE" && !resolveCategoryId) {
      toast.error("Sélectionnez une catégorie");
      return;
    }
    if (resolveAction === "MERGE" && !resolveSkillId) {
      toast.error("Sélectionnez une compétence cible pour fusionner");
      return;
    }
    // UX pre-check: avoid approving if the raw name already exists (name/synonym)
    if (resolveAction === "APPROVE") {
      const hit = findCatalogCollision(resolveModal.rawSkillName, skills);
      if (hit) {
        if (hit.type === "skillName") {
          toast.error(`Doublon: « ${resolveModal.rawSkillName} » existe déjà (catégorie: ${hit.skill.categoryName}).`);
        } else {
          toast.error(`Doublon: « ${resolveModal.rawSkillName} » correspond déjà au synonyme « ${hit.alias} » de « ${hit.skill.name} » (catégorie: ${hit.skill.categoryName}).`);
        }
        return;
      }
    }
    if (resolveAction === "MERGE") {
      const hit = findCatalogCollision(resolveModal.rawSkillName, skills, { allowSkillId: Number(resolveSkillId) });
      if (hit) {
        if (hit.type === "skillName") {
          toast.error(`Doublon: « ${resolveModal.rawSkillName} » existe déjà comme compétence (« ${hit.skill.name} », catégorie: ${hit.skill.categoryName}).`);
        } else {
          toast.error(`Doublon: « ${resolveModal.rawSkillName} » est déjà utilisé comme synonyme de « ${hit.skill.name} » (catégorie: ${hit.skill.categoryName}).`);
        }
        return;
      }
    }

    setResolveLoading(true);
    skillsApi.resolvePendingSkillRequest(resolveModal.id, {
      action: resolveAction,
      categoryId: resolveAction === "APPROVE" ? Number(resolveCategoryId) : undefined,
      existingSkillId: resolveAction === "MERGE" ? Number(resolveSkillId) : undefined,
      adminNotes: resolveNotes.trim() || undefined,
    })
      .then(() => {
        toast.success("Demande traitée avec succès");
        setResolveModal(null);
        // refresh requests + catalog (names/synonyms may change after APPROVE)
        loadPage();
        skillsApi.listSkills()
          .then((res) => setSkills(res.data ?? []))
          .catch(() => {});
      })
      .catch((err) => toast.error(getApiError(err, "Échec du traitement de la demande")))
      .finally(() => setResolveLoading(false));
  };

  const isConfirmDisabled =
    resolveLoading ||
    (resolveAction === "MERGE" && !resolveSkillId);

  return (
    <section className="relative flex min-h-0 w-full flex-1 flex-col overflow-hidden bg-[#f8f7ff]">
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 0.3s ease both; }
      `}</style>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[#f8f7ff] px-6 py-4">
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
          <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
            <div className="grid grid-cols-1 items-end gap-3 px-4 py-3 lg:grid-cols-[1fr_220px_auto]">
              <div className="min-w-0">
                <label className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Rechercher</label>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher…"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/15"
                />
              </div>

              <div className="w-full">
                <label className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Statut</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                  className="mt-1 w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/15"
                >
                  {STATUS_FILTERS.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABEL[s]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-wrap items-center justify-start gap-2 lg:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setStatusFilter("ALL");
                  }}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                  title="Réinitialiser"
                >
                  Réinitialiser
                </button>

                <button
                  type="button"
                  onClick={refresh}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  <ArrowPathIcon className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                  Actualiser
                </button>
              </div>
            </div>
          </div>

          <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
            <div className="relative min-h-0 flex-1 overflow-auto px-3 py-3 md:px-4 lg:px-6">

              {loading && (
                <div className="space-y-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-20 animate-pulse rounded-xl border border-violet-500/10 bg-white" />
                  ))}
                </div>
              )}

              {!loading && error && (
                <AlertBanner message={error} />
              )}

              {!loading && !error && filteredRequests.length === 0 && (
                <div className="flex flex-col items-center rounded-2xl border-2 border-dashed border-violet-200 bg-white px-4 py-14 text-center">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50">
                    <QuestionMarkCircleIcon className="h-7 w-7 text-violet-300" />
                  </div>
                  <p className="text-sm font-semibold text-slate-700">Aucune demande pour ce filtre</p>
                  <p className="mt-1 text-xs text-slate-500">Les demandes apparaitront ici apres extraction.</p>
                </div>
              )}

              {!loading && !error && filteredRequests.length > 0 && (
                <div className="grid gap-2">
                  {filteredRequests.map((req, index) => (
                    <article
                      key={req.id}
                      className="fade-up group relative overflow-hidden rounded-xl border border-violet-500/10 bg-white p-3.5 shadow-sm transition-all duration-300 hover:-translate-y-px hover:shadow-md hover:shadow-violet-100"
                      style={{ animationDelay: `${index * 35}ms` }}
                    >
                      <div className={`absolute bottom-0 left-0 top-0 w-1 ${
                        req.status === "PENDING"
                          ? "bg-amber-400"
                          : req.status === "APPROVED"
                            ? "bg-emerald-400"
                            : "bg-rose-400"
                      }`} />
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <div className="min-w-0 flex-1">
                          <div className="mb-2 flex flex-wrap items-center gap-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-violet-50">
                              <SparklesIcon className="h-3.5 w-3.5 text-violet-600" />
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-[13px] font-bold text-slate-900">{req.rawSkillName}</p>
                              <p className="text-[11px] text-slate-500">Compétence détectée par IA</p>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold ${STATUS_BADGE[req.status] ?? "border-slate-200 bg-slate-50 text-slate-700"}`}>
                              {STATUS_LABEL[req.status] ?? req.status}
                            </span>
                            <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-50 px-2 py-1 text-xs text-slate-600">
                              <UserIcon className="h-3.5 w-3.5 text-violet-500" />
                              {req.requestersCount > 1 ? `${req.requestersCount} utilisateurs` : req.requestedByName}
                            </span>
                            {req.requestersCount <= 1 ? (
                              <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-50 px-2 py-1 text-xs text-slate-600">
                                <EnvelopeIcon className="h-3.5 w-3.5 text-violet-500" />
                                {req.requestedByEmail}
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setRequestersModal(req)}
                                className="inline-flex items-center gap-1.5 rounded-md border border-violet-200 bg-violet-50 px-2 py-1 text-xs font-semibold text-violet-700 transition hover:bg-violet-100"
                              >
                                <EnvelopeIcon className="h-3.5 w-3.5 text-violet-500" />
                                Voir les demandeurs
                              </button>
                            )}
                            <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-50 px-2 py-1 text-xs text-slate-600">
                              <CalendarDaysIcon className="h-3.5 w-3.5 text-violet-500" />
                              {new Date(req.createdAt).toLocaleDateString("fr-FR", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </span>
                          </div>
                          {(req.adminNotes || req.resolvedAt) && req.status !== "PENDING" ? (
                            <div className="mt-2 overflow-hidden rounded-xl border border-violet-200/70 bg-gradient-to-r from-violet-50/70 to-indigo-50/60 shadow-sm">
                              <div className="flex items-center justify-between border-b border-violet-200/50 px-3 py-1.5">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-violet-700">
                                  Détails de traitement
                                </span>
                                <span className="rounded-full border border-violet-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-violet-600">
                                  {req.status === "APPROVED" ? "Approuvée" : req.status === "MERGED" ? "Fusionnée" : "Rejetée"}
                                </span>
                              </div>

                              <div className="space-y-1.5 px-3 py-2">
                                {req.adminNotes ? (
                                  <p className="text-[11px] leading-relaxed text-slate-700">
                                    <span className="font-semibold text-slate-800">Note: </span>
                                    {req.adminNotes}
                                  </p>
                                ) : (
                                  <p className="text-[11px] italic text-slate-500">Aucune note fournie.</p>
                                )}

                                {req.resolvedAt ? (
                                  <p className="inline-flex items-center rounded-md border border-white/70 bg-white/80 px-2 py-1 text-[10px] font-medium text-slate-600">
                                    Traité le {new Date(req.resolvedAt).toLocaleString("fr-FR")}
                                  </p>
                                ) : null}
                              </div>
                            </div>
                          ) : null}
                        </div>
                        <div className="shrink-0">
                          {req.status === "PENDING" && (
                            <button
                              type="button"
                              onClick={() => openResolveModal(req)}
                              className="inline-flex items-center gap-1.5 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 px-3.5 py-1.5 text-[11px] font-semibold text-white shadow-sm shadow-violet-300 transition hover:shadow-violet-400"
                            >
                              <BoltIcon className="h-3.5 w-3.5" />
                              Traiter
                            </button>
                          )}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>

            {!loading && !error && (data?.totalPages ?? 0) > 1 ? (
              <div className="flex shrink-0 items-center justify-between gap-3 border-t border-violet-500/10 px-6 pb-3 pt-2">
                <p className="text-sm text-slate-400">
                  Page {(data?.page ?? 0) + 1} sur {data?.totalPages ?? 1}
                  {" · "}
                  {Math.min((data?.page ?? 0) * PAGE_SIZE + 1, data?.totalElements ?? 0)}–{Math.min(((data?.page ?? 0) + 1) * PAGE_SIZE, data?.totalElements ?? 0)} sur {data?.totalElements ?? 0}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={(data?.page ?? 0) === 0 || loading}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-500 shadow-sm transition-all duration-150 hover:border-violet-300 hover:text-violet-600 focus:outline-none focus:ring-2 focus:ring-violet-300 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:text-slate-500"
                  >
                    <ChevronLeftIcon className="h-4 w-4" />
                    Précédent
                  </button>
                  <button
                    type="button"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={(data?.page ?? 0) >= (data?.totalPages ?? 1) - 1 || loading}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(124,58,237,0.35)] transition-all duration-150 active:scale-[0.97] focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Suivant
                    <ChevronRightIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {resolveModal && (
        <div className="app-modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0" onClick={() => !resolveLoading && setResolveModal(null)} />
          <div className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-violet-200 bg-white shadow-[0_24px_70px_rgba(76,29,149,0.25)]">
            <div className="flex items-center justify-between border-b border-violet-100 bg-violet-50 px-5 py-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-violet-500">Skill request</p>
                <h3 className="text-sm font-bold text-slate-900">Traiter "{resolveModal.rawSkillName}"</h3>
              </div>
              <button
                type="button"
                onClick={() => !resolveLoading && setResolveModal(null)}
                className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-500 transition hover:bg-slate-50"
                aria-label="Fermer"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 px-5 py-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Action</label>
                <select
                  value={resolveAction}
                  onChange={(e) => setResolveAction(e.target.value as "APPROVE" | "MERGE" | "REJECT")}
                  className="w-full rounded-xl border border-violet-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-300/40"
                >
                  <option value="APPROVE">Créer nouvelle compétence</option>
                  <option value="MERGE">Fusionner avec une compétence existante</option>
                  <option value="REJECT">Rejeter la demande</option>
                </select>
              </div>

              {resolveAction === "MERGE" && (
                <div className="rounded-xl border border-violet-100 bg-violet-50/40 px-3 py-2 text-xs text-slate-700">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-violet-700">
                      {mergeSuggestion
                        ? `Suggestion ${mergeSuggestion.source === "ai" ? "IA" : "auto"} appliquée à la liste`
                        : "Aucune suggestion fiable, sélection manuelle"}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        if (!resolveModal || suggestionLoading) return;
                        void loadMergeSuggestion(resolveModal);
                      }}
                      disabled={suggestionLoading || !resolveModal}
                      className="inline-flex items-center gap-1 rounded-lg border border-violet-200 bg-white px-2 py-1 text-[11px] font-semibold text-violet-700 transition hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {suggestionLoading ? (
                        <>
                          <ArrowPathIcon className="h-3.5 w-3.5 animate-spin text-violet-600" />
                          Suggestions...
                        </>
                      ) : (
                        "Refaire la suggestion"
                      )}
                    </button>
                  </div>
                </div>
              )}

              {resolveAction === "APPROVE" && (
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">Catégorie cible</label>
                  <select
                    value={resolveCategoryId}
                    onChange={(e) => setResolveCategoryId(e.target.value ? Number(e.target.value) : "")}
                    className="w-full rounded-xl border border-violet-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-300/40"
                  >
                    <option value="">Sélectionner une catégorie</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {resolveAction === "MERGE" && (
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">Compétence cible</label>
                  <select
                    value={resolveSkillId}
                    onChange={(e) => setResolveSkillId(e.target.value ? Number(e.target.value) : "")}
                    disabled={!mergeSuggestion}
                    className="w-full rounded-xl border border-violet-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-300/40"
                  >
                    <option value="">
                      {mergeSuggestion ? "Sélectionner la suggestion" : "Aucune suggestion disponible"}
                    </option>
                    {mergeSkills.map((skill) => (
                      <option key={skill.id} value={skill.id}>
                        ⭐ Suggestion - {skill.name} - {skill.categoryName}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Note admin (optionnel)</label>
                <textarea
                  value={resolveNotes}
                  onChange={(e) => setResolveNotes(e.target.value)}
                  rows={3}
                  placeholder="Ajouter une note de validation ou de rejet..."
                  className="w-full resize-none rounded-xl border border-violet-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-300/40"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-violet-100 px-5 py-3">
              <button
                type="button"
                onClick={() => setResolveModal(null)}
                disabled={resolveLoading}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={submitResolve}
                disabled={isConfirmDisabled}
                className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-3 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                {resolveLoading && <ArrowPathIcon className="h-3.5 w-3.5 animate-spin" />}
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

      {requestersModal && (
        <div className="app-modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0" onClick={() => setRequestersModal(null)} />
          <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-violet-200 bg-white shadow-[0_24px_70px_rgba(76,29,149,0.25)]">
            <div className="flex items-center justify-between border-b border-violet-100 bg-gradient-to-r from-violet-50 to-indigo-50 px-5 py-3.5">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-violet-500">Demandeurs</p>
                <h3 className="text-sm font-bold text-slate-900">
                  {requestersModal.rawSkillName} ({requestersModal.requestersCount})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setRequestersModal(null)}
                className="rounded-xl border border-slate-200 bg-white p-1.5 text-slate-500 transition hover:bg-slate-50"
                aria-label="Fermer"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
            <div className="max-h-[62vh] space-y-2.5 overflow-y-auto px-5 py-4">
              {requestersModal.requesters.map((r) => (
                <div key={r.keycloakId} className="rounded-2xl border border-violet-100 bg-gradient-to-r from-white to-violet-50/60 px-3.5 py-2.5 shadow-sm">
                  <p className="text-sm font-semibold text-slate-900">{r.name || "Utilisateur"}</p>
                  <p className="text-xs text-slate-600">{r.email}</p>
                  {r.requestedAt && (
                    <p className="mt-1 text-[11px] text-slate-500">
                      {new Date(r.requestedAt).toLocaleString("fr-FR")}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

// (KPI cards removed per UI request)
