import { useState, useRef, useCallback, useEffect } from "react";
import { useOutletContext, useSearchParams } from "react-router-dom";
import { useKeycloak } from "@react-keycloak/web";
import type { AxiosResponse } from "axios";
import {
  CameraIcon,
  ArrowPathIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  BuildingOffice2Icon,
  BriefcaseIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  PencilSquareIcon,
  ArrowDownTrayIcon,
  ArrowTopRightOnSquareIcon,
  XMarkIcon,
  EyeIcon,
  EyeSlashIcon,
  LockClosedIcon,
  SparklesIcon,
  DocumentTextIcon,
  BeakerIcon,
  CommandLineIcon,
  InformationCircleIcon,
} from "../../icons/heroicons/outline";
import { toast } from "sonner";
import { http } from "../../api/http";
import { meApi } from "../../api/meApi";
import { getAvatarColor } from "../admin/utils";
import { getUserFacingApiMessage, translateApiMessageToFrench } from "../../utils/apiUserMessage";

const STYLE_ELEMENT_ID = "role-profile-luxury-styles";
const MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024;
const DEFAULT_CV_FILE_NAME = "cv.pdf";

const styles = `
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes fadeInLeft {
    from { opacity: 0; transform: translateX(-20px); }
    to { opacity: 1; transform: translateX(0); }
  }

  @keyframes cardHover {
    to { transform: translateY(-3px); }
  }

  @keyframes shimmer {
    0% { background-position: -1000px 0; }
    100% { background-position: 1000px 0; }
  }

  :root {
    --luxury-primary: #7C3AED;
    --luxury-secondary: #6366F1;
    --luxury-light-bg: #f8f7ff;
    --luxury-card: #FFFFFF;
    --luxury-input: #FFFFFF;
    --luxury-text: #1E293B;
    --luxury-text-muted: #64748B;
    --luxury-border: rgba(124, 58, 237, 0.15);
    --luxury-success: #10B981;
    --luxury-error: #EF4444;
    --luxury-accent: #8B5CF6;
  }

  .luxury-animate-in { animation: fadeInUp 0.6s ease-out; }
  .luxury-animate-in-left { animation: fadeInLeft 0.6s ease-out; }

  .luxury-card {
    background: var(--luxury-card);
    border: 1px solid rgba(148, 163, 184, 0.15);
    color: var(--luxury-text);
    box-shadow: 0 2px 8px rgba(124, 58, 237, 0.06), 0 0 1px rgba(0, 0, 0, 0.05);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .luxury-card:hover {
    box-shadow: 0 4px 16px rgba(124, 58, 237, 0.1), 0 0 1px rgba(0, 0, 0, 0.08);
  }

  .luxury-input {
    background: var(--luxury-input);
    border: 1.5px solid rgba(124, 58, 237, 0.15);
    color: var(--luxury-text);
    transition: all 0.2s ease;
  }

  .luxury-input::placeholder { color: var(--luxury-text-muted); }

  .luxury-input:focus {
    border-color: var(--luxury-primary);
    box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.08), 0 2px 8px rgba(124, 58, 237, 0.08);
    outline: none;
    background: linear-gradient(135deg, rgba(255, 255, 255, 1), rgba(248, 247, 255, 0.5));
  }

  .luxury-input:hover:not(:focus) {
    border-color: rgba(124, 58, 237, 0.3);
  }

  @keyframes aiPulse {
    0%, 100% { opacity: 0.45; transform: scale(1); }
    50% { opacity: 0.85; transform: scale(1.02); }
  }

  .profile-saas-card {
    background: var(--luxury-card);
    border: 1px solid rgba(148, 163, 184, 0.12);
    box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04), 0 8px 24px rgba(124, 58, 237, 0.06);
    transition: box-shadow 0.25s ease, border-color 0.25s ease, transform 0.2s ease;
  }

  .profile-saas-card:hover {
    box-shadow: 0 4px 12px rgba(15, 23, 42, 0.06), 0 16px 40px rgba(124, 58, 237, 0.08);
  }

  .profile-ai-glow { animation: aiPulse 3s ease-in-out infinite; }
`;

if (typeof document !== "undefined" && !document.getElementById(STYLE_ELEMENT_ID)) {
  const styleSheet = document.createElement("style");
  styleSheet.id = STYLE_ELEMENT_ID;
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}

type ProfileData = {
  phone: string | null;
  department: string | null;
  jobTitle: string | null;
  hireDate: string | null;
};

type ProfileGetRequestState = {
  inFlight: Promise<AxiosResponse<unknown>> | null;
  cacheAt: number;
  cachedValue: AxiosResponse<unknown> | null;
};

const PROFILE_GET_DEDUPE_TTL_MS = 3000;
const profileGetRequestState = new Map<string, ProfileGetRequestState>();

function dedupedProfileGet<T>(endpoint: string, options?: { force?: boolean }): Promise<AxiosResponse<T>> {
  const force = options?.force ?? false;
  const now = Date.now();
  const state = profileGetRequestState.get(endpoint);

  if (!force && state?.cachedValue && now - state.cacheAt < PROFILE_GET_DEDUPE_TTL_MS) {
    return Promise.resolve(state.cachedValue as AxiosResponse<T>);
  }

  if (!force && state?.inFlight) {
    return state.inFlight as Promise<AxiosResponse<T>>;
  }

  const request = http.get<T>(endpoint).finally(() => {
    const current = profileGetRequestState.get(endpoint);
    if (!current) return;
    current.inFlight = null;
  });

  profileGetRequestState.set(endpoint, {
    inFlight: request,
    cacheAt: state?.cacheAt ?? 0,
    cachedValue: state?.cachedValue ?? null,
  });

  return request.then((res) => {
    profileGetRequestState.set(endpoint, {
      inFlight: null,
      cacheAt: Date.now(),
      cachedValue: res,
    });
    return res;
  });
}

type ProfileMeResponse = ProfileData & {
  avatarUrl?: string | null;
};

type TokenParsed = {
  given_name?: string;
  family_name?: string;
  email?: string;
  picture?: string;
};

type ProfileOutletContext = {
  onAvatarUpdate?: (url: string) => void;
};

type EmployeeSkillItem = {
  id: number;
  skillId: number;
  skillName: string;
  categoryName: string;
  level: number;
  status: "EXTRACTED" | "QUIZ_PENDING" | "VALIDATED" | "FAILED" | string;
};

type Section = "personal" | "cv";
type CvMetadata = { fileName: string | null; cvUrl: string | null; uploadedAt: string | null };
type ExtractionResult = {
  matchedSkills: { skillName: string; categoryName: string }[];
  unmatchedSkills: string[];
  pendingRequestsCreated: number;
  isCv?: boolean | null;
  cvScore?: number | null;
  cvMessage?: string | null;
};

export type RoleProfileConfig = {
  roleDisplayLabel: string;
  fallbackName: string;
  fallbackInitials: string;
  profileEndpoint: string;
  profileUpdateEndpoint: string;
  extraUpdateEndpoint: string;
  avatarEndpoint: string;
  changePasswordEndpoint: string;
  /** When false, hide CV / extraction / skills UI and do not call CV-related APIs. */
  showCvSection?: boolean;
  cvEndpoint?: string;
  cvExtractEndpoint?: string;
  cvDownloadEndpoint?: string;
  skillsEndpoint?: string;
  pendingSkillsEndpoint?: string;
};

function normalizeCvFilename(file: File): string {
  return file.name || DEFAULT_CV_FILE_NAME;
}

function isAcceptedCvFile(file: File): boolean {
  const lowerName = file.name.toLowerCase();
  const acceptedMimeTypes = new Set([
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ]);
  return acceptedMimeTypes.has(file.type) || lowerName.endsWith(".pdf") || lowerName.endsWith(".docx");
}

function getCvValidationError(file: File): string | null {
  if (!isAcceptedCvFile(file)) {
    return `Le fichier "${file.name}" n'est pas pris en charge. Veuillez choisir un CV au format PDF ou DOCX.`;
  }
  return null;
}

function isCvSectionEnabled(config: RoleProfileConfig): boolean {
  if (config.showCvSection === false) return false;
  return Boolean(
    config.cvEndpoint &&
      config.cvExtractEndpoint &&
      config.cvDownloadEndpoint &&
      config.skillsEndpoint &&
      config.pendingSkillsEndpoint,
  );
}

function pickArrayPayload(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== "object") return [];

  const record = data as Record<string, unknown>;
  const candidates = [record.content, record.items, record.skills, record.pendingSkills, record.data, record.results];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
  }
  return [];
}

function normalizeEmployeeSkillsPayload(data: unknown): EmployeeSkillItem[] {
  return pickArrayPayload(data).filter((item): item is EmployeeSkillItem => {
    if (!item || typeof item !== "object") return false;
    const row = item as Partial<EmployeeSkillItem>;
    return typeof row.skillName === "string" && typeof row.status === "string";
  });
}

function normalizePendingSkillsPayload(data: unknown): string[] {
  return pickArrayPayload(data)
    .map((item) => String(item ?? "").trim())
    .filter(Boolean);
}

export function RoleProfilePage({ config }: { config: RoleProfileConfig }) {
  const { keycloak } = useKeycloak();
  const token = keycloak.tokenParsed as TokenParsed | undefined;
  const userId = keycloak.subject;
  const { onAvatarUpdate } = useOutletContext<ProfileOutletContext>() || {};
  const cvEnabled = isCvSectionEnabled(config);
  const [searchParams, setSearchParams] = useSearchParams();

  const firstName = token?.given_name ?? "";
  const lastName = token?.family_name ?? "";
  const email = token?.email ?? "";

  const [editedFirstName, setEditedFirstName] = useState(firstName);
  const [editedLastName, setEditedLastName] = useState(lastName);
  const [isEditing, setIsEditing] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  const [extraData, setExtraData] = useState<ProfileData>({
    phone: null,
    department: null,
    jobTitle: null,
    hireDate: null,
  });
  const [loadingExtra, setLoadingExtra] = useState(true);

  useEffect(() => {
    setLoadingExtra(true);
    meApi
      .byEndpoint<ProfileMeResponse>(config.profileEndpoint)
      .then((res) => {
        setExtraData({
          phone: res.data?.phone ?? null,
          department: res.data?.department ?? null,
          jobTitle: res.data?.jobTitle ?? null,
          hireDate: res.data?.hireDate ?? null,
        });
        if (res.data?.avatarUrl) {
          setAvatarUrl(res.data.avatarUrl);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingExtra(false));
  }, [config.profileEndpoint]);

  const displayFirst = isEditing ? editedFirstName : (editedFirstName || firstName);
  const displayLast = isEditing ? editedLastName : (editedLastName || lastName);
  const fullName = [displayFirst, displayLast].filter(Boolean).join(" ") || config.fallbackName;
  const initials = `${displayFirst[0] ?? ""}${displayLast[0] ?? ""}`.trim().toUpperCase() || config.fallbackInitials;
  const gradient = getAvatarColor(email);

  const [section, setSection] = useState<Section>(() => {
    const requested = searchParams.get("section");
    if (cvEnabled && requested === "cv") return "cv";
    return "personal";
  });

  useEffect(() => {
    if (!cvEnabled && section === "cv") {
      setSection("personal");
      const next = new URLSearchParams(searchParams);
      next.delete("section");
      setSearchParams(next, { replace: true });
      return;
    }

    const requested = searchParams.get("section");
    const target: Section = cvEnabled && requested === "cv" ? "cv" : "personal";
    if (target !== section) setSection(target);
  }, [cvEnabled, section, searchParams, setSearchParams]);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(token?.picture ?? null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [cvFile, setCvFile] = useState<File | null>(null);
  const [cvFileName, setCvFileName] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const cvInputRef = useRef<HTMLInputElement>(null);

  const [extractionResult, setExtractionResult] = useState<ExtractionResult | null>(null);
  const [employeeSkills, setEmployeeSkills] = useState<EmployeeSkillItem[]>([]);
  const [pendingUnrecognizedSkills, setPendingUnrecognizedSkills] = useState<string[]>([]);

  const handleSaveProfile = useCallback(async () => {
    const fn = editedFirstName.trim();
    const ln = editedLastName.trim();
    if (!fn || fn.length < 2) { toast.error("Le prénom doit contenir au moins 2 caractères."); return; }
    if (!ln || ln.length < 2) { toast.error("Le nom doit contenir au moins 2 caractères."); return; }
    setSavingProfile(true);
    try {
      await http.put(config.profileUpdateEndpoint, { firstName: fn, lastName: ln });
      setIsEditing(false);
      toast.success("Profil mis à jour.");
    } catch {
      toast.error("Erreur lors de la mise à jour du profil.");
    } finally {
      setSavingProfile(false);
    }
  }, [config.profileUpdateEndpoint, editedFirstName, editedLastName]);

  const handleCancelEdit = useCallback(() => {
    setEditedFirstName(firstName);
    setEditedLastName(lastName);
    setIsEditing(false);
  }, [firstName, lastName]);

  const handleAvatarChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;
    if (!file.type.startsWith("image/")) { toast.error("Veuillez sélectionner une image."); return; }
    if (file.size > MAX_AVATAR_SIZE_BYTES) { toast.error("L'image ne doit pas dépasser 5 Mo."); return; }

    const reader = new FileReader();
    reader.onload = (ev) => setAvatarUrl(ev.target?.result as string);
    reader.readAsDataURL(file);

    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await http.post<{ avatarUrl: string }>(config.avatarEndpoint, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setAvatarUrl(res.data.avatarUrl);
      onAvatarUpdate?.(res.data.avatarUrl);
      toast.success("Photo de profil mise à jour.");
    } catch {
      toast.error("Erreur lors de l'upload de la photo.");
      setAvatarUrl(token?.picture ?? null);
    } finally {
      setUploadingAvatar(false);
    }
  }, [config.avatarEndpoint, onAvatarUpdate, token?.picture, userId]);

  useEffect(() => {
    if (!cvEnabled || !userId || !config.cvEndpoint) return;
    dedupedProfileGet<CvMetadata>(config.cvEndpoint)
      .then((res) => {
        setCvFileName(res.data?.fileName ?? null);
      })
      .catch(() => {});
  }, [config.cvEndpoint, userId, cvEnabled]);

  const loadEmployeeSkills = useCallback(
    (force = false) => {
      if (!cvEnabled || !config.skillsEndpoint) return;
      dedupedProfileGet<EmployeeSkillItem[]>(config.skillsEndpoint, { force })
        .then((res) => setEmployeeSkills(normalizeEmployeeSkillsPayload(res.data)))
        .catch(() => setEmployeeSkills([]));
    },
    [config.skillsEndpoint, cvEnabled],
  );

  useEffect(() => {
    if (!cvEnabled) {
      setEmployeeSkills([]);
      return;
    }
    loadEmployeeSkills();
  }, [loadEmployeeSkills, cvEnabled]);

  const loadPendingUnrecognizedSkills = useCallback(
    (force = false) => {
      if (!cvEnabled || !config.pendingSkillsEndpoint) return;
      dedupedProfileGet<string[]>(config.pendingSkillsEndpoint, { force })
        .then((res) => setPendingUnrecognizedSkills(normalizePendingSkillsPayload(res.data)))
        .catch(() => setPendingUnrecognizedSkills([]));
    },
    [config.pendingSkillsEndpoint, cvEnabled],
  );

  useEffect(() => {
    if (!cvEnabled) {
      setPendingUnrecognizedSkills([]);
      return;
    }
    loadPendingUnrecognizedSkills();
  }, [loadPendingUnrecognizedSkills, cvEnabled]);

  const handleCvDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    const validationError = getCvValidationError(file);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    if (file) {
      setCvFile(file);
      setCvFileName(normalizeCvFilename(file));
      setExtractionResult(null);
    }
  };

  const handleCvSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validationError = getCvValidationError(file);
    if (validationError) {
      toast.error(validationError);
      e.target.value = "";
      return;
    }

    setCvFile(file);
    setCvFileName(normalizeCvFilename(file));
    setExtractionResult(null);
  };

  const handleExtractSkills = async () => {
    if (!config.cvExtractEndpoint) return;
    if (!cvFile) {
      toast.info("Veuillez d'abord sélectionner un CV (PDF ou DOCX), puis cliquer sur Extraire.");
      return;
    }
    setExtracting(true);
    setExtractionResult(null);
    const form = new FormData();
    form.append("file", cvFile);

    try {
      const res = await http.post<ExtractionResult>(config.cvExtractEndpoint, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setExtractionResult(res.data);
      const matched = res.data.matchedSkills?.length ?? 0;
      const unmatched = res.data.unmatchedSkills?.length ?? 0;
      const isCv = res.data.isCv ?? matched > 0;
      const cvMessage = (res.data.cvMessage ?? "").trim();
      if (!isCv) {
        toast.warning(cvMessage || "Ce document ne semble pas être un CV exploitable. Veuillez importer un CV clair au format PDF ou DOCX.");
      } else if (matched > 0) {
        toast.success(`${matched} compétence(s) ajoutée(s) à votre profil !`);
      } else {
        toast.info("CV détecté, mais aucune compétence technique exploitable n'a été trouvée.");
      }
      if (unmatched > 0) toast.info(`${unmatched} compétence(s) non reconnue(s) envoyée(s) à l'administrateur.`);
      setCvFileName(normalizeCvFilename(cvFile));
      loadEmployeeSkills(true);
      loadPendingUnrecognizedSkills(true);
    } catch (err: unknown) {
      const apiMessage = getUserFacingApiMessage(err, "Impossible d'analyser ce document.");
      toast.error(translateApiMessageToFrench(apiMessage));
    } finally {
      setExtracting(false);
    }
  };

  const sections: { id: Section; label: string; icon: React.ReactNode }[] = [
    { id: "personal", label: "Informations personnelles", icon: <UserIcon className="w-4 h-4" /> },
    ...(cvEnabled ? [{ id: "cv" as const, label: "Analyse du CV", icon: <SparklesIcon className="w-4 h-4" /> }] : []),
  ];

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden" style={{ background: "var(--luxury-light-bg)" }}>
      <div className="mx-auto flex h-full min-h-0 w-full max-w-7xl flex-col gap-2 px-2 py-1 sm:px-3 md:gap-3 md:px-4 md:py-2">
        <header className="profile-saas-card luxury-animate-in shrink-0 rounded-2xl px-3 py-2.5 sm:px-3.5 md:px-4 md:py-3">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-5">
              <div className="relative shrink-0 group">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={fullName}
                    className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl object-cover shadow-md transition-all duration-300 group-hover:shadow-xl group-hover:-translate-y-0.5"
                  />
                ) : (
                  <div
                    className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl text-xl font-semibold text-white shadow-md transition-all duration-300 group-hover:shadow-xl group-hover:-translate-y-0.5 sm:text-2xl"
                    style={{ background: `linear-gradient(135deg,${gradient[0]},${gradient[1]})` }}
                  >
                    {initials}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  title="Changer la photo"
                  className="absolute -bottom-2 -right-2 rounded-xl border border-slate-200/80 bg-white/90 p-2 shadow-md backdrop-blur transition-all duration-300 hover:scale-105 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-70 active:scale-95"
                >
                  {uploadingAvatar ? (
                    <ArrowPathIcon className="h-4 w-4 animate-spin" style={{ color: "var(--luxury-primary)" }} />
                  ) : (
                    <CameraIcon className="h-4 w-4" style={{ color: "var(--luxury-primary)" }} />
                  )}
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              </div>
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex flex-wrap items-baseline gap-2">
                  <h1 className="text-xl font-normal tracking-tight sm:text-2xl md:text-3xl lg:text-4xl" style={{ color: "#1e293b" }}>
                    {displayFirst}
                  </h1>
                  <h2 className="text-xl font-normal tracking-tight sm:text-2xl md:text-3xl lg:text-4xl" style={{ color: "#1e293b" }}>
                    {displayLast}
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-0.5 w-6 rounded-full" style={{ background: "var(--luxury-primary)" }} />
                  <p className="text-xs font-medium uppercase tracking-widest" style={{ color: "var(--luxury-text-muted)" }}>
                    {config.roleDisplayLabel}
                  </p>
                </div>
              </div>
            </div>
            <div
              className="flex w-fit shrink-0 items-center gap-2 self-start rounded-full border px-3 py-1.5 text-xs shadow-sm transition-transform duration-200 hover:scale-[1.02] sm:self-auto"
              style={{ background: "rgba(16, 185, 129, 0.08)", borderColor: "var(--luxury-success)" }}
            >
              <CheckCircleIcon className="h-3 w-3 shrink-0" style={{ color: "var(--luxury-success)" }} />
              <span className="font-semibold" style={{ color: "var(--luxury-success)" }}>
                Compte actif
              </span>
            </div>
          </div>
        </header>

        {sections.length > 1 ? (
          <nav
            className="profile-saas-card luxury-animate-in flex shrink-0 gap-1 overflow-x-auto rounded-2xl p-1 md:p-1.5"
            style={{ animationDelay: "0.05s" }}
            aria-label="Sections du profil"
          >
            {sections.map((s, idx) => {
              const active = section === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    setSection(s.id);
                    const next = new URLSearchParams(searchParams);
                    if (s.id === "cv") next.set("section", "cv");
                    else next.delete("section");
                    setSearchParams(next, { replace: true });
                  }}
                  style={{
                    animation: `fadeInUp 0.6s ease-out ${idx * 0.05}s both`,
                    background: active ? "rgba(124, 58, 237, 0.12)" : "transparent",
                    color: active ? "var(--luxury-primary)" : "var(--luxury-text-muted)",
                    border: active ? "1px solid rgba(124, 58, 237, 0.25)" : "1px solid transparent",
                  }}
                  className="flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium whitespace-nowrap transition-all duration-200 hover:bg-violet-50/80 md:px-4 md:text-sm md:font-medium active:scale-[0.98]"
                >
                  {s.icon}
                  {s.label}
                </button>
              );
            })}
          </nav>
        ) : null}

        <main className="min-h-0 flex-1 overflow-hidden luxury-animate-in" style={{ animationDelay: "0.1s" }}>
          <div className="profile-saas-card flex h-full min-h-0 flex-col overflow-hidden rounded-2xl">
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2 sm:p-3 md:p-4">
              {section === "personal" && (
                <PersonalSection
                  firstName={editedFirstName || firstName}
                  lastName={editedLastName || lastName}
                  email={email}
                  isEditing={isEditing}
                  saving={savingProfile}
                  onEditedFirstNameChange={setEditedFirstName}
                  onEditedLastNameChange={setEditedLastName}
                  onEdit={() => {
                    setEditedFirstName(firstName);
                    setEditedLastName(lastName);
                    setIsEditing(true);
                  }}
                  onSave={handleSaveProfile}
                  onCancel={handleCancelEdit}
                  extraData={extraData}
                  loadingExtra={loadingExtra}
                  onExtraUpdate={setExtraData}
                  extraUpdateEndpoint={config.extraUpdateEndpoint}
                  changePasswordEndpoint={config.changePasswordEndpoint}
                />
              )}
              {section === "cv" && cvEnabled && config.cvDownloadEndpoint && (
                <CVSection
                  cvFile={cvFile}
                  cvFileName={cvFileName}
                  dragOver={dragOver}
                  extracting={extracting}
                  cvInputRef={cvInputRef}
                  onDragOver={setDragOver}
                  onCvDrop={handleCvDrop}
                  onCvSelect={handleCvSelect}
                  onExtract={handleExtractSkills}
                  extractionResult={extractionResult}
                  employeeSkills={employeeSkills}
                  pendingUnrecognizedSkills={pendingUnrecognizedSkills}
                  cvDownloadEndpoint={config.cvDownloadEndpoint}
                />
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export function RoleCvExtractionPage({ config }: { config: RoleProfileConfig }) {
  const { keycloak } = useKeycloak();
  const userId = keycloak.subject;
  const cvEnabled = isCvSectionEnabled(config);

  const [cvFile, setCvFile] = useState<File | null>(null);
  const [cvFileName, setCvFileName] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const cvInputRef = useRef<HTMLInputElement>(null);
  const [extractionResult, setExtractionResult] = useState<ExtractionResult | null>(null);
  const [employeeSkills, setEmployeeSkills] = useState<EmployeeSkillItem[]>([]);
  const [pendingUnrecognizedSkills, setPendingUnrecognizedSkills] = useState<string[]>([]);

  useEffect(() => {
    if (!cvEnabled || !userId || !config.cvEndpoint) return;
    dedupedProfileGet<CvMetadata>(config.cvEndpoint)
      .then((res) => setCvFileName(res.data?.fileName ?? null))
      .catch(() => {});
  }, [config.cvEndpoint, userId, cvEnabled]);

  const loadEmployeeSkills = useCallback(
    (force = false) => {
      if (!cvEnabled || !config.skillsEndpoint) return;
      dedupedProfileGet<EmployeeSkillItem[]>(config.skillsEndpoint, { force })
        .then((res) => setEmployeeSkills(normalizeEmployeeSkillsPayload(res.data)))
        .catch(() => setEmployeeSkills([]));
    },
    [config.skillsEndpoint, cvEnabled],
  );

  const loadPendingUnrecognizedSkills = useCallback(
    (force = false) => {
      if (!cvEnabled || !config.pendingSkillsEndpoint) return;
      dedupedProfileGet<string[]>(config.pendingSkillsEndpoint, { force })
        .then((res) => setPendingUnrecognizedSkills(normalizePendingSkillsPayload(res.data)))
        .catch(() => setPendingUnrecognizedSkills([]));
    },
    [config.pendingSkillsEndpoint, cvEnabled],
  );

  useEffect(() => {
    if (!cvEnabled) return;
    loadEmployeeSkills();
    loadPendingUnrecognizedSkills();
  }, [cvEnabled, loadEmployeeSkills, loadPendingUnrecognizedSkills]);

  const handleCvDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    const validationError = getCvValidationError(file);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setCvFile(file);
    setCvFileName(normalizeCvFilename(file));
    setExtractionResult(null);
  };

  const handleCvSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validationError = getCvValidationError(file);
    if (validationError) {
      toast.error(validationError);
      e.target.value = "";
      return;
    }

    setCvFile(file);
    setCvFileName(normalizeCvFilename(file));
    setExtractionResult(null);
  };

  const handleExtractSkills = async () => {
    if (!config.cvExtractEndpoint) return;
    if (!cvFile) {
      toast.info("Veuillez d'abord sélectionner un CV (PDF ou DOCX), puis cliquer sur Extraire.");
      return;
    }
    setExtracting(true);
    setExtractionResult(null);
    const form = new FormData();
    form.append("file", cvFile);

    try {
      const res = await http.post<ExtractionResult>(config.cvExtractEndpoint, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setExtractionResult(res.data);
      const matched = res.data.matchedSkills?.length ?? 0;
      const unmatched = res.data.unmatchedSkills?.length ?? 0;
      const isCv = res.data.isCv ?? matched > 0;
      const cvMessage = (res.data.cvMessage ?? "").trim();
      if (!isCv) {
        toast.warning(cvMessage || "Ce document ne semble pas être un CV exploitable. Veuillez importer un CV clair au format PDF ou DOCX.");
      } else if (matched > 0) {
        toast.success(`${matched} compétence(s) ajoutée(s) à votre profil !`);
      } else {
        toast.info("CV détecté, mais aucune compétence technique exploitable n'a été trouvée.");
      }
      if (unmatched > 0) toast.info(`${unmatched} compétence(s) non reconnue(s) envoyée(s) à l'administrateur.`);
      setCvFileName(normalizeCvFilename(cvFile));
      loadEmployeeSkills(true);
      loadPendingUnrecognizedSkills(true);
    } catch (err: unknown) {
      const apiMessage = getUserFacingApiMessage(err, "Impossible d'analyser ce document.");
      toast.error(translateApiMessageToFrench(apiMessage));
    } finally {
      setExtracting(false);
    }
  };

  if (!cvEnabled || !config.cvDownloadEndpoint) {
    return (
      <div className="flex min-h-full w-full items-center justify-center bg-[#f8f7ff] p-6">
        <div className="rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm">
          <p className="text-base font-bold text-slate-900">Analyse du CV indisponible</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full w-full overflow-auto bg-[#f6f7fc] px-4 py-7 sm:px-6 lg:px-9">
      <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-7">
        <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <h1 className="text-4xl font-extrabold leading-tight text-[#2b087f] sm:text-[42px]">Analyser un CV et extraire les compétences</h1>
            <p className="mt-2 max-w-3xl text-base leading-7 text-slate-600">
              Importez un CV PDF ou DOCX pour analyser automatiquement les expertises de vos talents grâce à notre moteur IA propriétaire.
            </p>
          </div>
          {cvFileName ? (
            <span className="inline-flex w-fit items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-semibold text-emerald-700">
              <CheckCircleIcon className="h-4 w-4" />
              CV disponible
            </span>
          ) : (
            <span className="inline-flex w-fit items-center gap-2 rounded-lg border border-orange-200 bg-orange-50 px-5 py-3 text-sm font-semibold text-orange-700">
              <DocumentTextIcon className="h-4 w-4" />
              Aucun CV
            </span>
          )}
        </header>

        <CVSection
          cvFile={cvFile}
          cvFileName={cvFileName}
          dragOver={dragOver}
          extracting={extracting}
          cvInputRef={cvInputRef}
          onDragOver={setDragOver}
          onCvDrop={handleCvDrop}
          onCvSelect={handleCvSelect}
          onExtract={handleExtractSkills}
          extractionResult={extractionResult}
          employeeSkills={employeeSkills}
          pendingUnrecognizedSkills={pendingUnrecognizedSkills}
          cvDownloadEndpoint={config.cvDownloadEndpoint}
        />
      </div>
    </div>
  );
}

function ProfileSectionCard({
  title,
  description,
  compact = false,
  children,
}: {
  title?: string;
  description?: string;
  compact?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className={`profile-saas-card rounded-2xl ${compact ? "p-2.5 sm:p-3 md:p-3.5" : "p-3 sm:p-4 md:p-5"}`}>
      {title ? (
        <div className={`${compact ? "mb-2.5 pb-2" : "mb-4 pb-3"} border-b border-slate-200/80`}>
          <h3 className="text-base font-bold sm:text-lg" style={{ color: "#1e293b" }}>
            {title}
          </h3>
          {description ? (
            <p className="mt-0.5 text-sm" style={{ color: "var(--luxury-text-muted)" }}>
              {description}
            </p>
          ) : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}

function PersonalSection({
  firstName, lastName, email,
  isEditing, saving,
  onEditedFirstNameChange, onEditedLastNameChange,
  onEdit, onSave, onCancel,
  extraData, loadingExtra, onExtraUpdate,
  extraUpdateEndpoint,
  changePasswordEndpoint,
}: {
  firstName: string; lastName: string; email: string;
  isEditing: boolean; saving: boolean;
  onEditedFirstNameChange: (v: string) => void;
  onEditedLastNameChange: (v: string) => void;
  onEdit: () => void; onSave: () => Promise<void>; onCancel: () => void;
  extraData: ProfileData;
  loadingExtra: boolean;
  onExtraUpdate: (data: ProfileData) => void;
  extraUpdateEndpoint: string;
  changePasswordEndpoint: string;
}) {
  const [editPhone, setEditPhone] = useState(extraData.phone ?? "");
  const [editDept, setEditDept] = useState(extraData.department ?? "");
  const [editJob, setEditJob] = useState(extraData.jobTitle ?? "");
  const [editHire, setEditHire] = useState(extraData.hireDate ?? "");
  const [savingExtra, setSavingExtra] = useState(false);

  useEffect(() => {
    if (!isEditing) {
      setEditPhone(extraData.phone ?? "");
      setEditDept(extraData.department ?? "");
      setEditJob(extraData.jobTitle ?? "");
      setEditHire(extraData.hireDate ?? "");
    }
  }, [extraData, isEditing]);

  const handleSaveExtra = async () => {
    setSavingExtra(true);
    try {
      const res = await http.put<ProfileData>(extraUpdateEndpoint, {
        phone: editPhone.trim() || null,
        department: editDept.trim() || null,
        jobTitle: editJob.trim() || null,
        hireDate: editHire || null,
      });
      onExtraUpdate(res.data);
      toast.success("Informations mises à jour.");
    } catch {
      toast.error("Erreur lors de la mise à jour.");
    } finally {
      setSavingExtra(false);
    }
  };

  const handleSaveAll = async () => {
    await onSave();
    if (loadingExtra) return;
    const next: ProfileData = {
      phone: editPhone.trim() || null,
      department: editDept.trim() || null,
      jobTitle: editJob.trim() || null,
      hireDate: editHire || null,
    };
    const unchanged =
      next.phone === (extraData.phone ?? null) &&
      next.department === (extraData.department ?? null) &&
      next.jobTitle === (extraData.jobTitle ?? null) &&
      next.hireDate === (extraData.hireDate ?? null);
    if (!unchanged) {
      await handleSaveExtra();
    }
  };

  return (
    <div className="flex flex-col gap-3 lg:gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="mb-0.5 text-base font-bold sm:text-lg" style={{ color: "#1e293b" }}>
            Informations personnelles
          </h2>
          <p className="text-sm" style={{ color: "var(--luxury-text-muted)" }}>
            {isEditing ? "Modifiez votre profil et enregistrez les modifications." : "Gérez vos informations de base."}
          </p>
        </div>
        {!isEditing ? (
          <button
            type="button"
            onClick={onEdit}
            style={{ background: "rgba(124, 58, 237, 0.08)", border: "1.5px solid var(--luxury-primary)" }}
            className="flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-200 hover:shadow-md active:scale-[0.98]"
          >
            <PencilSquareIcon className="h-4 w-4" style={{ color: "var(--luxury-primary)" }} />
            <span style={{ color: "var(--luxury-primary)" }}>Modifier</span>
          </button>
        ) : (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={saving}
              style={{ border: "1.5px solid rgba(148, 163, 184, 0.25)" }}
              className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-200 hover:bg-slate-50 active:scale-[0.98] disabled:opacity-50"
            >
              <XMarkIcon className="h-4 w-4" />
              Annuler
            </button>
            <button
              type="button"
              onClick={() => {
                void handleSaveAll();
              }}
              disabled={saving || savingExtra}
              style={{ background: "var(--luxury-primary)" }}
              className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold text-white transition-all duration-200 hover:shadow-lg active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving || savingExtra ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : <ArrowDownTrayIcon className="h-4 w-4" />}
              {saving || savingExtra ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 lg:gap-4 lg:items-start">
        <ProfileSectionCard title="Identité & contact" compact>
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {isEditing ? (
                <>
                  <LuxuryEditableField label="Prénom" icon={<UserIcon className="h-4 w-4" />} value={firstName} onChange={onEditedFirstNameChange} placeholder="Prénom" autoFocus />
                  <LuxuryEditableField label="Nom" icon={<UserIcon className="h-4 w-4" />} value={lastName} onChange={onEditedLastNameChange} placeholder="Nom" />
                </>
              ) : (
                <>
                  <LuxuryReadonlyField icon={<UserIcon className="h-4 w-4" />} label="Prénom" value={firstName || "—"} />
                  <LuxuryReadonlyField icon={<UserIcon className="h-4 w-4" />} label="Nom" value={lastName || "—"} />
                </>
              )}
            </div>
            <LuxuryReadonlyField
              icon={<EnvelopeIcon className="h-4 w-4" />}
              label="Adresse e-mail"
              value={email || "—"}
              badge={
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold shadow-sm"
                  style={{ background: "rgba(16, 185, 129, 0.08)", color: "var(--luxury-success)", border: "1px solid rgba(16, 185, 129, 0.3)" }}
                >
                  <CheckCircleIcon className="h-3 w-3" /> Vérifié
                </span>
              }
            />
          </div>
        </ProfileSectionCard>

        <ProfileSectionCard title="Informations professionnelles" compact>
          {loadingExtra ? (
            <div className="flex justify-center py-10">
              <ArrowPathIcon className="h-5 w-5 animate-spin" style={{ color: "var(--luxury-primary)" }} />
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {isEditing ? (
                  <LuxuryEditableField
                    icon={<PhoneIcon className="h-4 w-4" />}
                    label="Téléphone"
                    value={editPhone}
                    onChange={setEditPhone}
                    placeholder="+216 20 123 456"
                    type="tel"
                  />
                ) : (
                  <LuxuryReadonlyField icon={<PhoneIcon className="h-4 w-4" />} label="Téléphone" value={extraData.phone || "—"} />
                )}
                {isEditing ? (
                  <LuxuryEditableField
                    icon={<CalendarDaysIcon className="h-4 w-4" />}
                    label="Date d'embauche"
                    value={editHire}
                    onChange={setEditHire}
                    type="date"
                  />
                ) : (
                  <LuxuryReadonlyField icon={<CalendarDaysIcon className="h-4 w-4" />} label="Date d'embauche" value={extraData.hireDate || "—"} />
                )}
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {isEditing ? (
                  <LuxuryEditableField
                    icon={<BuildingOffice2Icon className="h-4 w-4" />}
                    label="Département"
                    value={editDept}
                    onChange={setEditDept}
                    placeholder="ex: Ingénierie"
                  />
                ) : (
                  <LuxuryReadonlyField icon={<BuildingOffice2Icon className="h-4 w-4" />} label="Département" value={extraData.department || "—"} />
                )}
                {isEditing ? (
                  <LuxuryEditableField
                    icon={<BriefcaseIcon className="h-4 w-4" />}
                    label="Poste"
                    value={editJob}
                    onChange={setEditJob}
                    placeholder="ex: Développeur"
                  />
                ) : (
                  <LuxuryReadonlyField icon={<BriefcaseIcon className="h-4 w-4" />} label="Poste" value={extraData.jobTitle || "—"} />
                )}
              </div>
            </div>
          )}
        </ProfileSectionCard>
      </div>

      <ProfileSectionCard compact title="Sécurité & Mot de passe" description="Modifiez votre mot de passe de connexion.">
        <SecuritySection embedded changePasswordEndpoint={changePasswordEndpoint} />
      </ProfileSectionCard>
    </div>
  );
}

function passwordStrength(pwd: string): { score: number; label: string } {
  if (!pwd) return { score: 0, label: "" };
  let score = 0;
  if (pwd.length >= 8) score++;
  if (pwd.length >= 12) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  if (score <= 1) return { score, label: "Très faible" };
  if (score === 2) return { score, label: "Faible" };
  if (score === 3) return { score, label: "Moyen" };
  if (score === 4) return { score, label: "Fort" };
  return { score, label: "Très fort" };
}

function SecuritySection({ embedded = false, changePasswordEndpoint }: { embedded?: boolean; changePasswordEndpoint: string }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ current?: string; newPwd?: string; confirm?: string }>({});

  const strength = passwordStrength(newPassword);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: typeof fieldErrors = {};
    if (!currentPassword) errs.current = "Requis.";
    if (!newPassword || newPassword.length < 8) errs.newPwd = "Minimum 8 caractères.";
    if (newPassword === currentPassword) errs.newPwd = "Le nouveau mot de passe doit être différent de l'ancien.";
    if (!confirmPassword) errs.confirm = "Requis.";
    else if (newPassword !== confirmPassword) errs.confirm = "Les mots de passe ne correspondent pas.";
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSaving(true);
    try {
      await http.post(changePasswordEndpoint, { currentPassword, newPassword, confirmPassword });
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
      setFieldErrors({});
      toast.success("Mot de passe modifié avec succès.");
    } catch (err: unknown) {
      const msg = getUserFacingApiMessage(err, "Erreur lors du changement de mot de passe.");
      if (/incorrect|mot de passe actuel|identifiants/i.test(msg)) {
        setFieldErrors({ current: "Mot de passe actuel incorrect." });
      } else {
        toast.error(msg);
      }
    } finally {
      setSaving(false);
    }
  }, [changePasswordEndpoint, confirmPassword, currentPassword, newPassword]);

  return (
    <div className={`flex w-full flex-col gap-4 ${embedded ? "" : "mx-auto max-w-3xl"}`}>
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <LuxuryPasswordField
            id="sec-current"
            label="Mot de passe actuel"
            value={currentPassword}
            show={showCurrent}
            onToggle={() => setShowCurrent((v) => !v)}
            onChange={setCurrentPassword}
            error={fieldErrors.current}
            placeholder="Votre mot de passe actuel"
            autoComplete="current-password"
          />

          <div>
            <LuxuryPasswordField
              id="sec-new"
              label="Nouveau mot de passe"
              value={newPassword}
              show={showNew}
              onToggle={() => setShowNew((v) => !v)}
              onChange={setNewPassword}
              error={fieldErrors.newPwd}
              placeholder="Minimum 8 caractères"
              autoComplete="new-password"
            />

            {newPassword ? (
              <div className="mt-2.5 flex flex-col gap-1.5">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className="h-1 flex-1 rounded-full transition-all duration-300"
                      style={{
                        background:
                          i <= strength.score
                            ? `rgba(124, 58, 237, ${0.28 + strength.score * 0.1})`
                            : "rgba(148, 163, 184, 0.22)",
                      }}
                    />
                  ))}
                </div>
                {strength.label ? (
                  <span className="text-xs font-semibold" style={{ color: "var(--luxury-text-muted)" }}>
                    {strength.label}
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 border-t border-slate-200/80 pt-3 md:grid-cols-[1fr_auto] md:items-end">
          <LuxuryPasswordField
            id="sec-confirm"
            label="Confirmer le nouveau mot de passe"
            value={confirmPassword}
            show={showConfirm}
            onToggle={() => setShowConfirm((v) => !v)}
            onChange={setConfirmPassword}
            error={fieldErrors.confirm}
            placeholder="Répétez le nouveau mot de passe"
            autoComplete="new-password"
          />

          <button
            type="submit"
            disabled={saving}
            style={{ background: "var(--luxury-primary)" }}
            className="flex h-fit items-center justify-center gap-2 rounded-xl px-5 py-2 text-sm font-bold text-white transition-all duration-200 hover:shadow-lg active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : <LockClosedIcon className="h-4 w-4" />}
            {saving ? "Modification..." : "Modifier le mot de passe"}
          </button>
        </div>
      </form>
    </div>
  );
}

function CVSection({
  cvFile,
  cvFileName,
  dragOver,
  extracting,
  cvInputRef,
  onDragOver,
  onCvDrop,
  onCvSelect,
  onExtract,
  extractionResult,
  employeeSkills,
  pendingUnrecognizedSkills,
  cvDownloadEndpoint,
}: {
  cvFile: File | null;
  cvFileName: string | null;
  dragOver: boolean;
  extracting: boolean;
  cvInputRef: React.RefObject<HTMLInputElement | null>;
  onDragOver: (v: boolean) => void;
  onCvDrop: (e: React.DragEvent) => void;
  onCvSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onExtract: () => void;
  extractionResult: {
    matchedSkills: { skillName: string; categoryName: string }[];
    unmatchedSkills: string[];
    pendingRequestsCreated: number;
  } | null;
  employeeSkills: EmployeeSkillItem[];
  pendingUnrecognizedSkills: string[];
  cvDownloadEndpoint: string;
}) {
  const handleDownloadCv = useCallback(async () => {
    try {
      const fileName = cvFile?.name ?? cvFileName ?? "cv.pdf";
      const res = await http.get(cvDownloadEndpoint, { responseType: "blob" });
      const blob = new Blob([res.data], { type: res.headers?.["content-type"] || "application/octet-stream" });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      try {
        const data = err?.response?.data;
        if (data instanceof Blob) {
          const text = await data.text();
          const parsed = JSON.parse(text);
          const msg = parsed?.error || parsed?.message;
          if (msg) {
            toast.error(translateApiMessageToFrench(String(msg)));
            return;
          }
        } else {
          const msg = data?.error || data?.message;
          if (msg) {
            toast.error(translateApiMessageToFrench(String(msg)));
            return;
          }
        }
      } catch {
        // ignore parse errors
      }
      toast.error("Impossible de télécharger le CV.");
    }
  }, [cvDownloadEndpoint, cvFile?.name, cvFileName]);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const previewFileName = cvFile?.name ?? cvFileName;
  const canPreviewPdf = Boolean(previewUrl && (cvFile?.type === "application/pdf" || previewFileName?.toLowerCase().endsWith(".pdf")));

  const handleOpenCvInNewTab = useCallback(() => {
    if (!previewUrl) {
      toast.info("L'aperçu du CV n'est pas encore disponible.");
      return;
    }
    window.open(previewUrl, "_blank", "noopener,noreferrer");
  }, [previewUrl]);

  useEffect(() => {
    let active = true;
    let objectUrl: string | null = null;

    setPreviewUrl(null);

    if (cvFile) {
      objectUrl = window.URL.createObjectURL(cvFile);
      setPreviewUrl(objectUrl);
      return () => {
        window.URL.revokeObjectURL(objectUrl as string);
      };
    }

    if (!cvFileName) return;

    http
      .get(cvDownloadEndpoint, { responseType: "blob" })
      .then((res) => {
        if (!active) return;
        const blob = new Blob([res.data], { type: res.headers?.["content-type"] || "application/octet-stream" });
        objectUrl = window.URL.createObjectURL(blob);
        setPreviewUrl(objectUrl);
      })
      .catch(() => {
        if (active) setPreviewUrl(null);
      });

    return () => {
      active = false;
      if (objectUrl) window.URL.revokeObjectURL(objectUrl);
    };
  }, [cvDownloadEndpoint, cvFile, cvFileName]);

  return (
    <div className="grid min-h-0 grid-cols-1 gap-7 lg:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.95fr)] lg:items-start">
      <div className="flex min-w-0 flex-col gap-7">
        <div
          className="relative overflow-hidden rounded-xl border-2 border-dashed bg-white px-5 py-8 text-center transition-all duration-300 sm:px-9 sm:py-10"
          style={{
            borderColor: dragOver ? "#7c3aed" : "#dbe3f1",
            boxShadow: dragOver ? "0 20px 45px rgba(76, 29, 149, 0.12)" : "0 1px 2px rgba(15, 23, 42, 0.03)",
          }}
          onDragOver={(e) => {
            e.preventDefault();
            onDragOver(true);
          }}
          onDragLeave={() => onDragOver(false)}
          onDrop={onCvDrop}
        >
          <div className="mx-auto flex max-w-[520px] flex-col items-center">
            <div className="flex h-[88px] w-[88px] items-center justify-center rounded-full bg-[#e8e0fb] text-[#7c3aed]">
              {extracting ? <ArrowPathIcon className="h-8 w-8 animate-spin" /> : <SparklesIcon className="h-8 w-8" />}
            </div>
            <h3 className="mt-7 text-lg font-semibold text-[#2b087f]">Prêt pour l’extraction</h3>
            <p className="mt-3 max-w-[470px] text-base leading-7 text-slate-600">
              Faites glisser votre fichier ici ou utilisez le bouton ci-dessous. Formats acceptés : PDF, DOCX (Max 10Mo).
            </p>

            <div className="mt-8 grid w-full gap-4 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => cvInputRef.current?.click()}
                className="inline-flex min-h-[80px] items-center justify-center gap-3 rounded-lg border border-violet-200 bg-white px-5 text-base font-bold text-[#2b087f] transition hover:border-violet-300 hover:bg-violet-50"
              >
                <DocumentTextIcon className="h-5 w-5" />
                <span>Choisir un fichier</span>
              </button>
              <button
                type="button"
                onClick={onExtract}
                disabled={extracting}
                className="inline-flex min-h-[80px] items-center justify-center gap-3 rounded-lg bg-[#3b007d] px-6 text-base font-bold text-white shadow-[0_14px_24px_rgba(59,0,125,0.22)] transition hover:bg-[#31006a] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {extracting ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : <SparklesIcon className="h-5 w-5" />}
                <span>{extracting ? "Extraction..." : "Extraire"}</span>
              </button>
            </div>

            {cvFile || cvFileName ? (
              <div className="mt-8 flex w-full items-center gap-4 rounded-xl border border-slate-200 bg-white px-4 py-4 text-left shadow-sm">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-red-50 text-red-600">
                  <DocumentTextIcon className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-slate-950">{cvFile?.name ?? cvFileName}</p>
                  <p className="mt-1 truncate text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    {cvFile ? `${(cvFile.size / 1024 / 1024).toFixed(1)} MB` : "CV enregistré"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadCv}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-50 hover:text-[#2b087f] disabled:opacity-50"
                  title="Télécharger"
                  disabled={!cvFileName && !cvFile}
                >
                  <ArrowDownTrayIcon className="h-5 w-5" />
                </button>
              </div>
            ) : null}
            <input ref={cvInputRef} type="file" accept=".pdf,.docx" className="hidden" onChange={onCvSelect} />
          </div>
        </div>

        {cvFile || cvFileName ? (
          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-2 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <h3 className="text-base font-extrabold text-slate-950">Aperçu du CV</h3>
                <p className="mt-1 truncate text-xs font-semibold text-slate-400">{previewFileName}</p>
              </div>
              <button
                type="button"
                onClick={handleOpenCvInNewTab}
                disabled={!previewUrl}
                className="inline-flex w-fit items-center gap-2 rounded-lg border border-violet-200 bg-white px-4 py-2 text-sm font-bold text-[#2b087f] transition hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                Ouvrir dans une nouvelle page
              </button>
            </div>
            <div className="flex min-h-[620px] items-center justify-center bg-gradient-to-b from-slate-100 via-slate-50 to-white p-4 sm:p-7">
              {canPreviewPdf ? (
                <iframe title="Aperçu du CV" src={previewUrl ?? undefined} className="h-[575px] w-full max-w-[520px] rounded-lg bg-white shadow-2xl ring-1 ring-slate-200" />
              ) : (
                <div className="flex h-[575px] w-full max-w-[520px] flex-col items-center justify-center rounded-lg bg-white p-8 text-center shadow-2xl ring-1 ring-slate-200">
                  <DocumentTextIcon className="h-16 w-16 text-slate-300" />
                  <p className="mt-4 max-w-xs truncate text-sm font-bold text-slate-700">{previewFileName}</p>
                  <p className="mt-2 text-xs leading-5 text-slate-500">Aperçu disponible uniquement pour les fichiers PDF.</p>
                </div>
              )}
            </div>
            <div className="flex flex-col gap-3 bg-white px-5 py-5 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={handleOpenCvInNewTab}
                disabled={!previewUrl}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#e9e1f3] px-8 py-3 text-sm font-bold text-[#2b087f] transition hover:bg-[#ded2ee] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                Ouvrir le CV complet
              </button>
            </div>
          </section>
        ) : null}
      </div>

      <ExtractionResultsSection
        extractionResult={extractionResult}
        employeeSkills={employeeSkills}
        pendingUnrecognizedSkills={pendingUnrecognizedSkills}
      />
    </div>
  );
}

function ExtractionResultsSection({
  extractionResult,
  employeeSkills,
  pendingUnrecognizedSkills,
}: {
  extractionResult: {
    matchedSkills: { skillName: string; categoryName: string }[];
    unmatchedSkills: string[];
    pendingRequestsCreated: number;
  } | null;
  employeeSkills: EmployeeSkillItem[];
  pendingUnrecognizedSkills: string[];
}) {
  const [skillsPage, setSkillsPage] = useState(0);
  const SKILLS_PER_PAGE = 6;

  useEffect(() => {
    const maxPage = Math.max(0, Math.ceil(employeeSkills.length / SKILLS_PER_PAGE) - 1);
    if (skillsPage > maxPage) setSkillsPage(maxPage);
  }, [employeeSkills.length, skillsPage]);

  const validatedCount = employeeSkills.filter((s) => s.status === "VALIDATED").length;
  const pendingQuizCount = employeeSkills.filter((s) => s.status === "QUIZ_PENDING" || s.status === "EXTRACTED").length;
  const failedCount = employeeSkills.filter((s) => s.status === "FAILED").length;
  const totalSkillPages = Math.max(1, Math.ceil(employeeSkills.length / SKILLS_PER_PAGE));
  const pagedSkills = employeeSkills.slice(skillsPage * SKILLS_PER_PAGE, (skillsPage + 1) * SKILLS_PER_PAGE);
  const pageOffset = skillsPage * SKILLS_PER_PAGE;
  const displayedPendingSkills =
    pendingUnrecognizedSkills.length > 0 ? pendingUnrecognizedSkills : (extractionResult?.unmatchedSkills ?? []);
  const remainingSkillsCount = Math.max(0, employeeSkills.length - pagedSkills.length);

  return (
    <aside className="flex min-w-0 flex-col gap-7">
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-6">
          <h2 className="text-lg font-medium text-[#2b087f]">Compétences extraites</h2>
          <span className="rounded-md bg-violet-100 px-2.5 py-1 text-xs font-bold text-[#6d28d9]">{employeeSkills.length}</span>
        </div>

        <div className="grid grid-cols-3 gap-3 border-b border-slate-100 px-6 py-7">
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-4 text-center">
            <p className="text-[11px] font-extrabold uppercase text-emerald-900">Validées</p>
            <p className="mt-1 text-2xl font-extrabold text-emerald-600">{validatedCount}</p>
          </div>
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-4 text-center">
            <p className="text-[11px] font-extrabold uppercase text-amber-800">En attente</p>
            <p className="mt-1 text-2xl font-extrabold text-amber-600">{pendingQuizCount}</p>
          </div>
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-4 text-center">
            <p className="text-[11px] font-extrabold uppercase text-red-800">À repasser</p>
            <p className="mt-1 text-2xl font-extrabold text-red-600">{failedCount}</p>
          </div>
        </div>

        <div className="flex flex-col gap-3 px-5 py-6">
          {pagedSkills.length > 0 ? (
            pagedSkills.map((skill, idx) => {
              const isValidated = skill.status === "VALIDATED";
              const isFailed = skill.status === "FAILED";
              const statusLabel = isValidated ? "Validée" : isFailed ? "À repasser" : skill.status === "QUIZ_PENDING" ? "Quiz en attente" : "Extraite";
              const badgeClass = isValidated
                ? "bg-emerald-100 text-emerald-700"
                : isFailed
                  ? "bg-red-100 text-red-600"
                  : "bg-amber-100 text-amber-700";
              const iconClass = isValidated
                ? "bg-violet-50 text-[#2b087f]"
                : isFailed
                  ? "bg-red-50 text-red-700"
                  : "bg-violet-50 text-[#6d28d9]";

              return (
                <div
                  key={`skill-card-${skill.id}-${skill.skillId}-${pageOffset + idx}`}
                  className="flex min-h-[86px] items-center gap-4 rounded-xl border border-slate-200 bg-white px-5 py-4"
                >
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${iconClass}`}>
                    {isFailed ? <CommandLineIcon className="h-5 w-5" /> : isValidated ? <BeakerIcon className="h-5 w-5" /> : <InformationCircleIcon className="h-5 w-5" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 items-start justify-between gap-3">
                      <p className="min-w-0 whitespace-normal text-base font-extrabold leading-5 text-slate-950">{skill.skillName}</p>
                      <span className={`shrink-0 rounded-full px-3 py-1 text-[10px] font-extrabold uppercase ${badgeClass}`}>{statusLabel}</span>
                    </div>
                    <p className="mt-2 text-[11px] font-bold uppercase tracking-wide text-slate-400">
                      {skill.categoryName} <span className="mx-1 text-slate-300">•</span> Niveau {skill.level}
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center">
              <p className="text-sm font-semibold text-slate-500">Aucune compétence extraite pour le moment.</p>
            </div>
          )}
        </div>

        {totalSkillPages > 1 ? (
          <div className="flex items-center justify-center gap-2 border-t border-slate-100 px-5 py-4">
            {Array.from({ length: totalSkillPages }).map((_, idx) => (
              <button
                key={`skills-page-${idx + 1}`}
                type="button"
                onClick={() => setSkillsPage(idx)}
                aria-label={`Aller à la page ${idx + 1}`}
                className="h-2 rounded-full transition-all duration-200 hover:opacity-90"
                style={{
                  width: skillsPage === idx ? "1.25rem" : "0.5rem",
                  background: skillsPage === idx ? "#3b007d" : "rgba(148, 163, 184, 0.35)",
                }}
              />
            ))}
          </div>
        ) : remainingSkillsCount > 0 ? (
          <div className="border-t border-slate-100 px-5 py-4 text-center text-sm font-bold text-[#2b087f]">
            Afficher les {remainingSkillsCount} autres compétences
          </div>
        ) : null}
      </section>

      {displayedPendingSkills.length > 0 ? (
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <ArrowPathIcon className="h-5 w-5 text-orange-500" />
              <h3 className="text-base font-extrabold text-slate-950">En attente de validation</h3>
            </div>
            <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">{displayedPendingSkills.length}</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {displayedPendingSkills.map((skill, idx) => (
              <span key={`pending-skill-${skill}-${idx + 1}`} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600">
                {skill}
              </span>
            ))}
          </div>

          <div className="mt-5 flex gap-3 rounded-lg bg-violet-50 px-4 py-4 text-sm leading-6 text-[#5b21b6]">
            <InformationCircleIcon className="mt-1 h-4 w-4 shrink-0" />
            <p>Ces compétences n'ont pas pu être matchées avec le référentiel standard de l'entreprise. Elles nécessitent une validation manuelle par un administrateur RH pour être indexées.</p>
          </div>
        </section>
      ) : null}

    </aside>
  );
}

function LuxuryEditableField({
  icon,
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  autoFocus,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  autoFocus?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="flex items-center gap-1 text-[11px] uppercase tracking-widest font-semibold" style={{ color: "var(--luxury-text-muted)" }}>
        <span style={{ color: "var(--luxury-primary)" }}>{icon}</span>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="luxury-input rounded-xl px-3 py-2 text-xs transition-all duration-300"
        style={{ animation: "none" }}
      />
    </div>
  );
}

function LuxuryReadonlyField({
  icon,
  label,
  value,
  badge,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  badge?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="flex items-center gap-1 text-[11px] uppercase tracking-widest font-semibold" style={{ color: "var(--luxury-text-muted)" }}>
        <span style={{ color: "var(--luxury-primary)" }}>{icon}</span>
        {label}
      </label>
      <div
        className="flex items-center justify-between rounded-xl px-3 py-2 text-xs transition-all duration-200 hover:border-violet-200/70 hover:shadow-sm"
        style={{
          background: "var(--luxury-input)",
          border: "1px solid rgba(148, 163, 184, 0.2)",
          color: value === "—" ? "var(--luxury-text-muted)" : "var(--luxury-text)",
        }}
      >
        <span className={value === "—" ? "" : "font-medium"}>{value}</span>
        {badge}
      </div>
    </div>
  );
}

function LuxuryPasswordField({
  id,
  label,
  value,
  show,
  onToggle,
  onChange,
  error,
  placeholder,
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  show: boolean;
  onToggle: () => void;
  onChange: (v: string) => void;
  error?: string;
  placeholder?: string;
  autoComplete?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="flex items-center gap-1 text-[11px] uppercase tracking-widest font-semibold" style={{ color: "var(--luxury-text-muted)" }}>
        <LockClosedIcon className="w-3 h-3" style={{ color: "var(--luxury-primary)" }} />
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="luxury-input w-full rounded-xl px-3 py-2 pr-9 text-xs transition-all duration-300"
          style={{
            background: error ? "rgba(239, 68, 68, 0.05)" : "var(--luxury-input)",
            borderColor: error ? "var(--luxury-error)" : "rgba(148, 163, 184, 0.2)",
          }}
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 transition-colors duration-300"
          style={{ color: "var(--luxury-text-muted)" }}
        >
          {show ? <EyeSlashIcon className="w-3 h-3" /> : <EyeIcon className="w-3 h-3" />}
        </button>
      </div>
      {error && (
        <div className="flex items-center gap-1 mt-0.5">
          <XMarkIcon className="w-3 h-3" style={{ color: "var(--luxury-error)" }} />
          <span className="text-xs" style={{ color: "var(--luxury-error)" }}>
            {error}
          </span>
        </div>
      )}
    </div>
  );
}
