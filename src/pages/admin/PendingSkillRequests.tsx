import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowPathIcon,
  EnvelopeIcon,
  CalendarDaysIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  QuestionMarkCircleIcon,
} from "../../icons/heroicons/outline";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBoltLightning,
  faCircleCheck,
  faCircleInfo,
  faFilter,
  faMagnifyingGlass,
  faRotateRight,
  faTriangleExclamation,
  faUserClock,
  faUsers,
  faXmark,
  faWandMagicSparkles,
  faCodeMerge,
} from "@fortawesome/free-solid-svg-icons";
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
  skillUuid: string;
  confidence: number;
  reason: string;
  source: "ai" | "local";
};

type MergeCandidate = MergeSuggestion & {
  skill: SkillDto;
};

const SUGGESTION_MIN_CONFIDENCE = 0.62;
const AUTO_SELECT_MIN_CONFIDENCE = 0.82;
const TECH_STOP_WORDS = new Set([
  "de",
  "des",
  "du",
  "la",
  "le",
  "les",
  "en",
  "et",
  "avec",
  "pour",
  "sur",
  "aux",
  "au",
  "a",
  "the",
  "of",
  "and",
  "in",
  "to",
]);

const SEMANTIC_SKILL_RELATIONS: Record<string, string[]> = {
  pandas: ["python"],
  numpy: ["python"],
  scipy: ["python"],
  sklearn: ["python"],
  scikitlearn: ["python"],
  matplotlib: ["python"],
  seaborn: ["python"],
  fastapi: ["python"],
  django: ["python"],
  flask: ["python"],
  pytest: ["python"],
  springweb: ["spring boot", "spring"],
  springmvc: ["spring boot", "spring"],
  springsecurity: ["spring boot", "spring"],
  springdata: ["spring boot", "spring"],
  springcloud: ["spring boot", "spring"],
  springbatch: ["spring boot", "spring"],
  hibernate: ["java", "spring boot"],
  jpa: ["java", "spring boot"],
  maven: ["java"],
  gradle: ["java"],
  junit: ["java"],
  gitops: ["git"],
  githubactions: ["github", "ci cd"],
  gitlabci: ["gitlab", "ci cd"],
  jenkins: ["ci cd"],
  dockercompose: ["docker"],
  kubernetes: ["docker"],
  k8s: ["kubernetes"],
  helm: ["kubernetes"],
  terraform: [],
  ansible: [],
  reactrouter: ["react"],
  redux: ["react", "javascript"],
  nextjs: ["react", "javascript"],
  vite: ["javascript", "typescript", "react"],
  nestjs: ["nodejs", "typescript"],
  express: ["nodejs", "javascript"],
  expressjs: ["nodejs", "javascript"],
  angularmaterial: ["angular"],
  rxjs: ["angular", "javascript"],
  tailwindcss: ["css"],
  bootstrap: ["css"],
  sass: ["css"],
  scss: ["css"],
  laravel: ["php"],
  symfony: ["php"],
  aspnet: ["csharp", ".net"],
  aspnetcore: ["csharp", ".net"],
  entityframework: ["csharp", ".net"],
  dotnet: ["csharp", ".net"],
  rails: ["ruby"],
  rubyonrails: ["ruby"],
  androidjetpack: ["kotlin"],
  jetpackcompose: ["kotlin"],
  swiftui: ["swift"],
  powerbi: [],
  tableau: [],
};

function normalizeKey(raw: string) {
  const s0 = (raw ?? "").trim().toLowerCase();
  if (!s0) return "";
  const noAccents = s0.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const spaced = noAccents
    .replace(/[\s\u00A0]+/g, " ")
    .replace(/["'`.,;:()[\]{}\\/|_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return spaced;
}

function normalizeSkillName(raw: string) {
  const protectedTerms = (raw ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/(^|\s)c\s*#(?=\s|$)/g, " csharp ")
    .replace(/(^|\s)f\s*#(?=\s|$)/g, " fsharp ")
    .replace(/(^|\s)c\+\+(?=\s|$)/g, " cpp ");

  return normalizeKey(protectedTerms)
    .replace(/\bc\s*sharp\b/g, "csharp")
    .replace(/\bf\s*sharp\b/g, "fsharp")
    .replace(/\bc\s*plus\s*plus\b/g, "cpp")
    .replace(/\bnode\s*js\b/g, "nodejs")
    .replace(/\breact\s*js\b/g, "react")
    .replace(/\bvue\s*js\b/g, "vue")
    .replace(/\bangular\s*js\b/g, "angularjs")
    .replace(/\bjs\b/g, "javascript")
    .replace(/\bts\b/g, "typescript")
    .replace(/\bpy\b/g, "python")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenizeSkill(raw: string) {
  return normalizeSkillName(raw)
    .split(" ")
    .map((t) => t.trim())
    .filter((t) => t.length >= 2 && !TECH_STOP_WORDS.has(t));
}

function compactTechnicalKey(raw: string) {
  return normalizeSkillName(raw).replace(/[^a-z0-9]/g, "");
}

function semanticTargetNames(rawSkillName: string) {
  const rawCompact = compactTechnicalKey(rawSkillName);
  if (!rawCompact) return [];
  const targets = new Set<string>();

  for (const [concept, targetNames] of Object.entries(SEMANTIC_SKILL_RELATIONS)) {
    if (rawCompact === concept || rawCompact.includes(concept)) {
      targetNames.forEach((target) => targets.add(normalizeSkillName(target)));
    }
  }

  return Array.from(targets);
}

function semanticRelationScore(rawSkillName: string, skill: SkillDto) {
  const targets = semanticTargetNames(rawSkillName);
  if (!targets.length) return 0;
  if (normalizeSkillName(skill.name) === normalizeSkillName(skill.categoryName)) return 0;

  const names = [skill.name, ...(skill.synonyms ?? [])].map((name) => normalizeSkillName(name));
  return names.some((name) => targets.includes(name)) ? 0.9 : 0;
}

function acronymOf(raw: string) {
  return tokenizeSkill(raw)
    .map((t) => t[0])
    .join("");
}

function levenshtein(a: string, b: string) {
  if (a === b) return 0;
  if (!a) return b.length;
  if (!b) return a.length;
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  const curr = Array.from({ length: b.length + 1 }, () => 0);
  for (let i = 1; i <= a.length; i += 1) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    for (let j = 0; j <= b.length; j += 1) prev[j] = curr[j];
  }
  return prev[b.length];
}

function editSimilarity(a: string, b: string) {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 0;
  return 1 - levenshtein(a, b) / maxLen;
}

function tokenSimilarity(raw: string, candidate: string) {
  const rawTokens = tokenizeSkill(raw);
  const candidateTokens = tokenizeSkill(candidate);
  if (!rawTokens.length || !candidateTokens.length) return 0;

  const candidateSet = new Set(candidateTokens);
  const exactOverlap = rawTokens.filter((t) => candidateSet.has(t)).length;
  const fuzzyOverlap = rawTokens.filter((t) =>
    candidateTokens.some((ct) => t === ct || (t.length >= 4 && ct.length >= 4 && editSimilarity(t, ct) >= 0.84))
  ).length;
  const containment = fuzzyOverlap / rawTokens.length;
  const union = new Set([...rawTokens, ...candidateTokens]).size;
  const jaccard = union ? exactOverlap / union : 0;
  const lengthBalance = Math.min(rawTokens.length, candidateTokens.length) / Math.max(rawTokens.length, candidateTokens.length);

  return Math.max(containment * 0.72 + lengthBalance * 0.18 + jaccard * 0.1, jaccard);
}

function scoreSkillCandidate(rawSkillName: string, skill: SkillDto): { score: number; reason: string } {
  const raw = normalizeSkillName(rawSkillName);
  const skillName = normalizeSkillName(skill.name);
  if (!raw || !skillName) return { score: 0, reason: "" };

  if (raw === skillName) {
    return { score: 0.99, reason: "Correspondance exacte avec une compétence existante" };
  }

  for (const alias of skill.synonyms ?? []) {
    if (raw === normalizeSkillName(alias)) {
      return { score: 0.97, reason: `Correspondance exacte avec le synonyme « ${alias} »` };
    }
  }

  const semanticScore = semanticRelationScore(rawSkillName, skill);
  if (semanticScore > 0) {
    return {
      score: semanticScore,
      reason: `Relation technique: « ${rawSkillName} » appartient à l'écosystème de « ${skill.name} »`,
    };
  }

  const rawAcronym = acronymOf(rawSkillName);
  const nameAcronym = acronymOf(skill.name);
  if (raw.length >= 2 && raw === nameAcronym && nameAcronym.length >= 2) {
    return { score: 0.9, reason: `Acronyme probable de « ${skill.name} »` };
  }
  if (rawAcronym.length >= 2 && rawAcronym === skillName) {
    return { score: 0.88, reason: `Nom proche de l'acronyme « ${rawAcronym.toUpperCase()} »` };
  }

  const names = [skill.name, ...(skill.synonyms ?? [])];
  const scored = names.map((name) => {
    const normalized = normalizeSkillName(name);
    const tokenScore = tokenSimilarity(rawSkillName, name);
    const editScore = raw.length >= 4 && normalized.length >= 4 ? editSimilarity(raw, normalized) : 0;
    const score = Math.max(tokenScore, editScore * 0.88);
    return { name, score };
  });
  const best = scored.reduce((acc, item) => (item.score > acc.score ? item : acc), { name: "", score: 0 });
  const rawTokenCount = tokenizeSkill(rawSkillName).length;
  const adjustedScore = rawTokenCount <= 1 && best.score < 0.9 ? best.score * 0.82 : best.score;

  return {
    score: Number(adjustedScore.toFixed(2)),
    reason: best.name && best.name !== skill.name
      ? `Similarité avec le synonyme « ${best.name} »`
      : "Similarité forte avec le nom de la compétence",
  };
}

function findCatalogCollision(
  proposedName: string,
  allSkills: SkillDto[],
  opts?: { allowSkillUuid?: string }
): { type: "skillName" | "synonym"; skill: SkillDto; alias?: string } | null {
  const key = normalizeKey(proposedName);
  if (!key) return null;
  const allowUuid = opts?.allowSkillUuid;
  for (const s of allSkills) {
    if (allowUuid != null && s.uuid === allowUuid) continue;
    if (normalizeKey(s.name) === key) return { type: "skillName", skill: s };
  }
  for (const s of allSkills) {
    if (allowUuid != null && s.uuid === allowUuid) continue;
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
  const [resolveCategoryId, setResolveCategoryId] = useState<string>("");
  const [resolveSkillId, setResolveSkillId] = useState<string>("");
  const [resolveNotes, setResolveNotes] = useState("");
  const [resolveLoading, setResolveLoading] = useState(false);
  const [suggestionLoading, setSuggestionLoading] = useState(false);
  const [aiRecommendations, setAiRecommendations] = useState<MergeSuggestion[]>([]);
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
      search: search.trim() || undefined,
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
  }, [page, statusFilter, search]);

  useEffect(() => {
    loadPage();
  }, [loadPage]);

  useEffect(() => {
    setPage(0);
  }, [statusFilter, search]);

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
  const mergeCandidates = useMemo<MergeCandidate[]>(() => {
    if (!skills.length || !resolveModal) return [];

    const byUuid = new Map<string, MergeCandidate>();
    for (const skill of skills) {
      const local = scoreSkillCandidate(resolveModal.rawSkillName, skill);
      if (local.score >= SUGGESTION_MIN_CONFIDENCE) {
        byUuid.set(skill.uuid, {
          skill,
          skillUuid: skill.uuid,
          confidence: local.score,
          reason: local.reason,
          source: "local",
        });
      }
    }

    for (const recommendation of aiRecommendations) {
      const aiSkill = skills.find((s) => s.uuid === recommendation.skillUuid);
      if (!aiSkill) continue;
      const existing = byUuid.get(aiSkill.uuid);
      byUuid.set(aiSkill.uuid, {
        skill: aiSkill,
        skillUuid: aiSkill.uuid,
        confidence: Math.max(existing?.confidence ?? 0, recommendation.confidence),
        reason: recommendation.reason || existing?.reason || "Recommandation IA depuis le référentiel",
        source: recommendation.source,
      });
    }

    return Array.from(byUuid.values())
      .sort((a, b) => b.confidence - a.confidence || a.skill.name.localeCompare(b.skill.name))
      .slice(0, 5);
  }, [skills, resolveModal, aiRecommendations]);

  const skillsByCategory = useMemo(() => {
    const groups = new Map<string, SkillDto[]>();
    for (const skill of [...skills].sort((a, b) => a.name.localeCompare(b.name))) {
      const category = skill.categoryName || "Sans catégorie";
      groups.set(category, [...(groups.get(category) ?? []), skill]);
    }
    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [skills]);

  const filteredRequests = requests;

  const openResolveModal = (req: PendingSkillRequestDto) => {
    setResolveModal(req);
    setResolveAction("APPROVE");
    setResolveCategoryId("");
    setResolveSkillId("");
    setResolveNotes("");
    setAiRecommendations([]);
  };

  const findLocalSuggestion = useCallback((rawSkillName: string): MergeSuggestion | null => {
    let best: { skill: SkillDto; score: number; reason: string } | null = null;
    for (const skill of skills) {
      const scored = scoreSkillCandidate(rawSkillName, skill);
      if (!best || scored.score > best.score) {
        best = { skill, score: scored.score, reason: scored.reason };
      }
    }
    if (!best || best.score < SUGGESTION_MIN_CONFIDENCE) return null;
    return {
      skillUuid: best.skill.uuid,
      confidence: best.score,
      reason: best.reason,
      source: "local",
    };
  }, [skills]);

  const loadMergeSuggestion = useCallback(async (req: PendingSkillRequestDto) => {
    const local = findLocalSuggestion(req.rawSkillName);
    if (local) {
      setAiRecommendations([local]);
      if (local.confidence >= AUTO_SELECT_MIN_CONFIDENCE) {
        setResolveSkillId(local.skillUuid);
      }
      setResolveAction("MERGE");
    }

    setSuggestionLoading(true);
    try {
      const res = await skillsApi.suggestMergeForPendingSkillRequest(req.uuid);
      const payload = res.data;
      if (!payload?.suggestedSkillUuid) return;
      const aiSkill = skills.find((s) => s.uuid === payload.suggestedSkillUuid);
      if (!aiSkill) return;
      const localScore = scoreSkillCandidate(req.rawSkillName, aiSkill);
      const aiConfidence = Number(payload.confidence ?? 0);
      const confidence = Number(Math.max(aiConfidence, localScore.score).toFixed(2));
      if (confidence < SUGGESTION_MIN_CONFIDENCE) return;
      const reason = payload.reason?.trim() || "Suggestion IA basée sur similarité sémantique";
      const primaryRecommendation: MergeSuggestion = {
        skillUuid: payload.suggestedSkillUuid,
        confidence,
        reason: localScore.score >= AUTO_SELECT_MIN_CONFIDENCE ? localScore.reason : reason,
        source: "ai",
      };
      const alternativeRecommendations = (payload.alternatives ?? [])
        .filter((alt) => alt.skillUuid && alt.skillUuid !== payload.suggestedSkillUuid)
        .map((alt): MergeSuggestion => ({
          skillUuid: alt.skillUuid,
          confidence: Number(alt.confidence ?? 0),
          reason: alt.reason?.trim() || "Alternative recommandée par l'IA",
          source: "ai",
        }))
        .filter((alt) => skills.some((s) => s.uuid === alt.skillUuid));
      setAiRecommendations([primaryRecommendation, ...alternativeRecommendations]);
      if (confidence >= AUTO_SELECT_MIN_CONFIDENCE) {
        setResolveSkillId(payload.suggestedSkillUuid);
      }
      setResolveAction("MERGE");
    } catch {
      // Fallback silencieux vers la suggestion locale.
    } finally {
      setSuggestionLoading(false);
    }
  }, [findLocalSuggestion, skills]);

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
      const hit = findCatalogCollision(resolveModal.rawSkillName, skills, { allowSkillUuid: resolveSkillId });
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
    skillsApi.resolvePendingSkillRequest(resolveModal.uuid, {
      action: resolveAction,
      categoryUuid: resolveAction === "APPROVE" ? resolveCategoryId : undefined,
      existingSkillUuid: resolveAction === "MERGE" ? resolveSkillId : undefined,
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

  const resolveActionMeta = {
    APPROVE: {
      title: "Créer une nouvelle compétence",
      description: "Générer une entrée propre dans le référentiel.",
      icon: faCircleCheck,
      accent: "from-emerald-500 to-teal-500",
      tone: "border-emerald-200 bg-emerald-50 text-emerald-700",
    },
    MERGE: {
      title: "Fusionner avec une compétence existante",
      description: "Rattacher la demande à une compétence déjà présente.",
      icon: faCodeMerge,
      accent: "from-indigo-500 to-violet-600",
      tone: "border-indigo-200 bg-indigo-50 text-indigo-700",
    },
    REJECT: {
      title: "Rejeter la demande",
      description: "Clore la demande avec une explication interne.",
      icon: faTriangleExclamation,
      accent: "from-rose-500 to-red-500",
      tone: "border-rose-200 bg-rose-50 text-rose-700",
    },
  }[resolveAction];

  return (
    <section className="relative flex w-full flex-col overflow-visible app-page-bg">
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 0.3s ease both; }
      `}</style>
      <div className="w-full app-page-bg px-6 py-4">
        <div className="flex w-full flex-col gap-4">
          <div className="rounded-3xl border border-violet-100/70 bg-white shadow-[0_8px_24px_rgba(124,58,237,0.06)]">
            <div className="grid grid-cols-1 items-end gap-3 px-4 py-4 lg:grid-cols-[1fr_220px_auto] lg:px-5">
              <div className="min-w-0">
                <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-violet-500">
                  <FontAwesomeIcon icon={faMagnifyingGlass} className="h-3 w-3" />
                  Rechercher
                </label>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher…"
                  className="mt-1 w-full rounded-2xl border border-violet-100 bg-slate-50/80 px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-500/10"
                />
              </div>

              <div className="w-full">
                <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-violet-500">
                  <FontAwesomeIcon icon={faFilter} className="h-3 w-3" />
                  Statut
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                  className="mt-1 w-full cursor-pointer rounded-2xl border border-violet-100 bg-slate-50/80 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-500/10"
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
                  className="inline-flex items-center gap-2 rounded-2xl border border-violet-100 bg-white px-4 py-3 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700"
                  title="Réinitialiser"
                >
                  <FontAwesomeIcon icon={faRotateRight} className="h-4 w-4" />
                  Réinitialiser
                </button>

                <button
                  type="button"
                  onClick={refresh}
                  className="inline-flex items-center gap-2 rounded-2xl border border-violet-100 bg-white px-4 py-3 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700"
                >
                  <ArrowPathIcon className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                  Actualiser
                </button>
              </div>
            </div>
          </div>

          <div className="relative w-full overflow-hidden rounded-3xl border border-violet-100/70 bg-white shadow-[0_8px_30px_rgba(124,58,237,0.07)]">
            <div className="relative px-3 py-3 md:px-4 lg:px-6">

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
                      key={req.uuid}
                      className="fade-up group relative overflow-hidden rounded-2xl border border-violet-100/80 bg-gradient-to-r from-white to-violet-50/30 p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-[0_10px_30px_rgba(124,58,237,0.10)]"
                      style={{ animationDelay: `${index * 35}ms` }}
                    >
                      <div className={`absolute bottom-0 left-0 top-0 w-1.5 ${
                        req.status === "PENDING"
                          ? "bg-amber-400"
                          : req.status === "APPROVED"
                            ? "bg-emerald-400"
                            : "bg-rose-400"
                      }`} />
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="mb-2 flex flex-wrap items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-violet-50 text-violet-600 ring-1 ring-violet-100">
                              <FontAwesomeIcon icon={faWandMagicSparkles} className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-slate-900 sm:text-base">{req.rawSkillName}</p>
                              <p className="text-xs text-slate-500">Compétence détectée par IA</p>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold ${STATUS_BADGE[req.status] ?? "border-slate-200 bg-slate-50 text-slate-700"}`}>
                              {STATUS_LABEL[req.status] ?? req.status}
                            </span>
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-3 py-1.5 text-xs text-slate-600 ring-1 ring-slate-100">
                              <FontAwesomeIcon icon={faUserClock} className="h-3.5 w-3.5 text-violet-500" />
                              {req.requestersCount > 1 ? `${req.requestersCount} utilisateurs` : req.requestedByName}
                            </span>
                            {req.requestersCount <= 1 ? (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-3 py-1.5 text-xs text-slate-600 ring-1 ring-slate-100">
                                <EnvelopeIcon className="h-3.5 w-3.5 text-violet-500" />
                                {req.requestedByEmail}
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setRequestersModal(req)}
                                className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700 transition hover:bg-violet-100"
                              >
                                <FontAwesomeIcon icon={faUsers} className="h-3.5 w-3.5" />
                                Voir les demandeurs
                              </button>
                            )}
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-3 py-1.5 text-xs text-slate-600 ring-1 ring-slate-100">
                              <CalendarDaysIcon className="h-3.5 w-3.5 text-violet-500" />
                              {new Date(req.createdAt).toLocaleDateString("fr-FR", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </span>
                          </div>
                          {(req.adminNotes || req.resolvedAt) && req.status !== "PENDING" ? (
                            <div className="mt-3 overflow-hidden rounded-2xl border border-violet-200/70 bg-gradient-to-r from-violet-50/70 via-white to-indigo-50/60 shadow-sm">
                              <div className="flex items-center justify-between border-b border-violet-200/50 px-3 py-2">
                                <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-violet-700">
                                  <FontAwesomeIcon icon={faCircleInfo} className="h-3 w-3" />
                                  Détails de traitement
                                </span>
                                <span className="rounded-full border border-violet-200 bg-white px-2.5 py-1 text-xs font-semibold text-violet-600">
                                  {req.status === "APPROVED" ? "Approuvée" : req.status === "MERGED" ? "Fusionnée" : "Rejetée"}
                                </span>
                              </div>

                              <div className="space-y-2 px-3 py-3">
                                {req.adminNotes ? (
                                  <p className="text-xs leading-relaxed text-slate-700">
                                    <span className="font-semibold text-slate-800">Note: </span>
                                    {req.adminNotes}
                                  </p>
                                ) : (
                                  <p className="text-xs italic text-slate-500">Aucune note fournie.</p>
                                )}

                                {req.resolvedAt ? (
                                  <p className="inline-flex items-center gap-1.5 rounded-full border border-white/70 bg-white/85 px-2.5 py-1.5 text-xs font-medium text-slate-600">
                                    <FontAwesomeIcon icon={faCircleCheck} className="h-3 w-3 text-emerald-500" />
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
                              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-[0_8px_18px_rgba(124,58,237,0.28)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_24px_rgba(124,58,237,0.34)]"
                            >
                              <FontAwesomeIcon icon={faBoltLightning} className="h-3.5 w-3.5" />
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
        <div className="app-modal-backdrop fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-4">
          <div className="absolute inset-0" onClick={() => !resolveLoading && setResolveModal(null)} />
          <div className="relative w-full max-w-2xl overflow-hidden rounded-[28px] border border-violet-200 bg-white shadow-[0_24px_70px_rgba(76,29,149,0.25)]">
            <div className={`flex items-start justify-between gap-4 bg-gradient-to-r ${resolveActionMeta.accent} px-5 py-4 text-white`}>
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20">
                  <FontAwesomeIcon icon={resolveActionMeta.icon} className="h-5 w-5 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-widest text-white/80">Traitement de demande</p>
                  <h3 className="mt-1 text-lg font-bold leading-tight">{resolveModal.rawSkillName}</h3>
                  <p className="mt-1 text-sm text-white/85">{resolveActionMeta.description}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => !resolveLoading && setResolveModal(null)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/15 text-white transition hover:bg-white/25 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Fermer"
              >
                <FontAwesomeIcon icon={faXmark} className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 px-5 py-5">
              <div className={`rounded-2xl border px-4 py-3 ${resolveActionMeta.tone}`}>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Action</label>
                <select
                  value={resolveAction}
                  onChange={(e) => setResolveAction(e.target.value as "APPROVE" | "MERGE" | "REJECT")}
                  className="w-full rounded-2xl border border-violet-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-300/25"
                >
                  <option value="APPROVE">Créer nouvelle compétence</option>
                  <option value="MERGE">Fusionner avec une compétence existante</option>
                  <option value="REJECT">Rejeter la demande</option>
                </select>
              </div>

              {resolveAction === "MERGE" && (
                <div className="rounded-2xl border border-violet-100 bg-violet-50/40 px-4 py-3 text-xs text-slate-700">
                  <div className="flex items-center justify-between gap-2">
                    <p className="inline-flex items-center gap-2 font-semibold text-violet-700">
                      <FontAwesomeIcon icon={faWandMagicSparkles} className="h-3.5 w-3.5" />
                      {mergeCandidates.length
                        ? `${mergeCandidates.length} recommandation${mergeCandidates.length > 1 ? "s" : ""} proposée${mergeCandidates.length > 1 ? "s" : ""} depuis le référentiel`
                        : "Aucune recommandation automatique, sélection manuelle"}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        if (!resolveModal || suggestionLoading) return;
                        void loadMergeSuggestion(resolveModal);
                      }}
                      disabled={suggestionLoading || !resolveModal}
                      className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-white px-3 py-1.5 text-xs font-semibold text-violet-700 transition hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {suggestionLoading ? (
                        <>
                          <ArrowPathIcon className="h-3.5 w-3.5 animate-spin text-violet-600" />
                          Recommandation IA...
                        </>
                      ) : (
                        "Relancer l'IA"
                      )}
                    </button>
                  </div>
                </div>
              )}

              {resolveAction === "APPROVE" && (
                <div className="rounded-2xl border border-violet-100 bg-white p-4 shadow-sm">
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Catégorie cible</label>
                  <select
                    value={resolveCategoryId}
                    onChange={(e) => setResolveCategoryId(e.target.value)}
                    className="w-full rounded-2xl border border-violet-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-300/25"
                  >
                    <option value="">Sélectionner une catégorie</option>
                    {categories.map((cat) => (
                      <option key={cat.uuid} value={cat.uuid}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {resolveAction === "MERGE" && (
                <div className="rounded-2xl border border-violet-100 bg-white p-4 shadow-sm">
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Compétence cible</label>
                  <select
                    value={resolveSkillId}
                    onChange={(e) => setResolveSkillId(e.target.value)}
                    disabled={skills.length === 0}
                    className="w-full rounded-2xl border border-violet-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-300/25 disabled:cursor-not-allowed disabled:bg-slate-50"
                  >
                    <option value="">
                      {skills.length ? "Sélectionner une compétence du référentiel" : "Aucune compétence disponible"}
                    </option>
                    {mergeCandidates.length > 0 && (
                      <optgroup label={mergeCandidates.some((candidate) => candidate.source === "ai") ? "Recommandations IA" : "Recommandations du référentiel"}>
                        {mergeCandidates.map((candidate) => (
                          <option key={`suggestion-${candidate.skill.uuid}`} value={candidate.skill.uuid}>
                            {candidate.source === "ai" ? "IA recommande" : "Recommandé"} - {candidate.skill.name} - {candidate.skill.categoryName}
                          </option>
                        ))}
                      </optgroup>
                    )}
                    {skillsByCategory.map(([category, list]) => (
                      <optgroup key={category} label={category}>
                        {list.map((skill) => (
                          <option key={skill.uuid} value={skill.uuid}>
                            {skill.name}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  {resolveSkillId && (
                    <p className="mt-2 text-xs text-slate-500">
                      {mergeCandidates.find((c) => c.skillUuid === resolveSkillId)?.reason
                        ?? "Sélection manuelle depuis le référentiel compétences."}
                    </p>
                  )}
                </div>
              )}

              <div className="rounded-2xl border border-violet-100 bg-slate-50/70 p-4 shadow-sm">
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Note admin (optionnel)</label>
                <textarea
                  value={resolveNotes}
                  onChange={(e) => setResolveNotes(e.target.value)}
                  rows={3}
                  placeholder="Ajouter une note de validation ou de rejet..."
                  className="w-full resize-none rounded-2xl border border-violet-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-violet-500 focus:ring-4 focus:ring-violet-300/25"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-violet-100 bg-white px-5 py-4">
              <button
                type="button"
                onClick={() => setResolveModal(null)}
                disabled={resolveLoading}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <FontAwesomeIcon icon={faXmark} className="h-3.5 w-3.5" />
                Annuler
              </button>
              <button
                type="button"
                onClick={submitResolve}
                disabled={isConfirmDisabled}
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-[0_8px_18px_rgba(124,58,237,0.28)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_24px_rgba(124,58,237,0.34)] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {resolveLoading && <ArrowPathIcon className="h-3.5 w-3.5 animate-spin" />}
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

      {requestersModal && (
        <div className="app-modal-backdrop fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-4">
          <div className="absolute inset-0" onClick={() => setRequestersModal(null)} />
          <div className="relative w-full max-w-2xl overflow-hidden rounded-[28px] border border-violet-200 bg-white shadow-[0_24px_70px_rgba(76,29,149,0.25)]">
            <div className="flex items-center justify-between border-b border-violet-100 bg-gradient-to-r from-violet-50 to-indigo-50 px-5 py-3.5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-violet-500">Demandeurs</p>
                <h3 className="text-sm font-semibold text-slate-900">
                  {requestersModal.rawSkillName} ({requestersModal.requestersCount})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setRequestersModal(null)}
                className="rounded-full border border-slate-200 bg-white p-2 text-slate-500 transition hover:bg-slate-50 hover:text-violet-700"
                aria-label="Fermer"
              >
                <FontAwesomeIcon icon={faXmark} className="h-4 w-4" />
              </button>
            </div>
            <div className="no-visible-scrollbar max-h-[62vh] space-y-2.5 overflow-y-auto px-5 py-4">
              {requestersModal.requesters.map((r) => (
                <div key={r.keycloakId} className="rounded-2xl border border-violet-100 bg-gradient-to-r from-white to-violet-50/60 px-4 py-3 shadow-sm">
                  <p className="text-sm font-semibold text-slate-900">{r.name || "Utilisateur"}</p>
                  <p className="text-xs text-slate-600">{r.email}</p>
                  {r.requestedAt && (
                    <p className="mt-1 text-xs text-slate-500">
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
