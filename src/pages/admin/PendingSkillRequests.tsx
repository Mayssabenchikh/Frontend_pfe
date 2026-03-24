import { useCallback, useEffect, useState } from "react";
import {
  ArrowPathIcon,
  EnvelopeIcon,
  UserIcon,
  CalendarDaysIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
  SparklesIcon,
  CheckCircleIcon,
  ArrowsRightLeftIcon,
  XCircleIcon,
  ClockIcon,
  BoltIcon,
  QuestionMarkCircleIcon,
} from "@heroicons/react/24/outline";
import { toast } from "sonner";
import { skillsApi } from "../../api/skillsApi";
import type { PendingSkillRequestDto, SkillCategoryDto, SkillDto } from "./types";
import { getApiError } from "./utils";

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
  APPROVED: "Approuve",
  MERGED: "Fusionne",
  REJECTED: "Rejete",
};

const STATUS_PILL: Record<string, string> = {
  ALL: "text-slate-700",
  PENDING: "text-amber-700",
  APPROVED: "text-emerald-700",
  MERGED: "text-indigo-700",
  REJECTED: "text-rose-700",
};

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
  const [categories, setCategories] = useState<SkillCategoryDto[]>([]);
  const [skills, setSkills] = useState<SkillDto[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [stats, setStats] = useState<Record<"PENDING" | "APPROVED" | "MERGED" | "REJECTED", number>>({
    PENDING: 0,
    APPROVED: 0,
    MERGED: 0,
    REJECTED: 0,
  });

  const loadStats = useCallback(() => {
    skillsApi.getPendingSkillRequestsStats()
      .then((res) => {
        const payload = res.data;
        setStats({
          PENDING: payload?.PENDING ?? 0,
          APPROVED: payload?.APPROVED ?? 0,
          MERGED: payload?.MERGED ?? 0,
          REJECTED: payload?.REJECTED ?? 0,
        });
      })
      .catch(() => {
        setStats({ PENDING: 0, APPROVED: 0, MERGED: 0, REJECTED: 0 });
      });
  }, []);

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
    loadStats();
  }, [loadStats]);

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
    loadStats();
    loadPage();
    toast.success("Liste actualisée");
  };

  const filteredRequests = data?.content ?? [];
  const pendingCount = stats.PENDING;
  const approvedCount = stats.APPROVED;
  const mergedCount = stats.MERGED;
  const rejectedCount = stats.REJECTED;
  const statusCount: Record<StatusFilter, number> = {
    ALL: pendingCount + approvedCount + mergedCount + rejectedCount,
    PENDING: pendingCount,
    APPROVED: approvedCount,
    MERGED: mergedCount,
    REJECTED: rejectedCount,
  };

  const openResolveModal = (req: PendingSkillRequestDto) => {
    setResolveModal(req);
    setResolveAction("APPROVE");
    setResolveCategoryId(categories[0]?.id ?? "");
    setResolveSkillId("");
    setResolveNotes("");
  };

  const submitResolve = () => {
    if (!resolveModal) return;
    if (resolveAction === "APPROVE" && !resolveCategoryId) {
      toast.error("Sélectionnez une catégorie");
      return;
    }
    if (resolveAction === "MERGE" && !resolveSkillId) {
      toast.error("Sélectionnez une compétence existante");
      return;
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
        loadStats();
        loadPage();
      })
      .catch((err) => toast.error(getApiError(err, "Échec du traitement de la demande")))
      .finally(() => setResolveLoading(false));
  };

  return (
    <section className="relative flex min-h-0 w-full flex-1 flex-col overflow-hidden bg-[#f8f7ff]">
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 0.3s ease both; }
      `}</style>
      <div className="relative min-h-0 flex-1 overflow-auto px-3 py-3 md:px-4 lg:px-6">
        <div className="mb-3 flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div />
            <button
              type="button"
              onClick={refresh}
              className="inline-flex items-center gap-1.5 rounded-2xl border border-violet-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-violet-700 transition hover:bg-violet-50"
            >
              <ArrowPathIcon className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              Actualiser
            </button>
          </div>

          <div className="grid w-full grid-cols-2 gap-2 lg:grid-cols-4">
            <StatCard label="En attente" value={pendingCount} icon={<ClockIcon className="h-5 w-5 text-amber-600" />} bg="bg-amber-50" />
            <StatCard label="Approuvees" value={approvedCount} icon={<CheckCircleIcon className="h-5 w-5 text-emerald-600" />} bg="bg-emerald-50" />
            <StatCard label="Fusionnees" value={mergedCount} icon={<ArrowsRightLeftIcon className="h-5 w-5 text-indigo-600" />} bg="bg-indigo-50" />
            <StatCard label="Rejetees" value={rejectedCount} icon={<XCircleIcon className="h-5 w-5 text-rose-600" />} bg="bg-rose-50" />
          </div>

          <div className="mx-auto flex w-fit flex-wrap items-center gap-1 rounded-2xl border border-violet-200/60 bg-white/95 p-1.5 shadow-[0_6px_20px_rgba(139,92,246,0.08)] backdrop-blur-sm">
            {STATUS_FILTERS.map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-[11px] font-semibold transition-all duration-200 ${
                  statusFilter === status
                    ? "border-violet-500 bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-200"
                    : `border-transparent bg-transparent ${STATUS_PILL[status]} hover:border-violet-200 hover:bg-violet-50`
                }`}
              >
                {STATUS_LABEL[status]}
                <span
                  className={`inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                    statusFilter === status
                      ? "bg-white/20 text-white"
                      : "bg-white text-slate-600"
                  }`}
                >
                  {statusCount[status]}
                </span>
              </button>
            ))}
          </div>
        </div>

        {loading && (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-xl border border-violet-500/10 bg-white" />
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
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
                className="fade-up group relative overflow-hidden rounded-xl border border-violet-500/10 bg-white p-3.5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md hover:shadow-violet-100"
                style={{ animationDelay: `${index * 35}ms` }}
              >
                <div className={`absolute bottom-0 left-0 top-0 w-1 ${
                  req.status === "PENDING"
                    ? "bg-amber-400"
                    : req.status === "APPROVED"
                      ? "bg-emerald-400"
                      : req.status === "MERGED"
                        ? "bg-indigo-400"
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
                        <p className="text-[11px] text-slate-500">Competence detectee par IA</p>
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

      {!loading && !error && (data?.totalPages ?? 0) > 1 && (
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
      )}

      {resolveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-violet-900/25 p-4 backdrop-blur-[4px]">
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
                  <option value="APPROVE">APPROVE (créer nouvelle compétence)</option>
                  <option value="MERGE">MERGE (fusionner avec une compétence existante)</option>
                  <option value="REJECT">REJECT (rejeter)</option>
                </select>
              </div>

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
                  <label className="mb-1 block text-xs font-semibold text-slate-600">Compétence existante</label>
                  <select
                    value={resolveSkillId}
                    onChange={(e) => setResolveSkillId(e.target.value ? Number(e.target.value) : "")}
                    className="w-full rounded-xl border border-violet-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-300/40"
                  >
                    <option value="">Sélectionner une compétence</option>
                    {skills.map((skill) => (
                      <option key={skill.id} value={skill.id}>
                        {skill.name} - {skill.categoryName}
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
                disabled={resolveLoading}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-violet-900/25 p-4 backdrop-blur-[4px]">
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

function StatCard({ label, value, icon, bg }: { label: string; value: number; icon: React.ReactNode; bg: string }) {
  return (
    <div className="rounded-2xl border border-violet-200/70 bg-white/95 p-3 shadow-[0_6px_20px_rgba(139,92,246,0.08)] backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_26px_rgba(139,92,246,0.14)]">
      <div className="flex items-center gap-2.5">
        <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${bg} border border-white/60 shadow-sm`}>
          {icon}
        </div>
        <div>
          <p className="text-lg font-extrabold leading-none tracking-tight text-slate-900">{value}</p>
          <p className="mt-0.5 text-[10px] font-medium text-slate-500">{label}</p>
        </div>
      </div>
    </div>
  );
}
