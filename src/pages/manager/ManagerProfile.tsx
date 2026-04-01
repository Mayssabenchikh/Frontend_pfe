import { useState, useRef, useCallback, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { useKeycloak } from "@react-keycloak/web";
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
  SparklesIcon,
  DocumentTextIcon,
  BeakerIcon,
  ArrowDownTrayIcon,
  XMarkIcon,
  EyeIcon,
  EyeSlashIcon,
  LockClosedIcon,
} from "@heroicons/react/24/outline";
import { toast } from "sonner";
import { http } from "../../api/http";
import { getAvatarColor } from "../admin/utils";

const styles = `
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes fadeInLeft {
    from {
      opacity: 0;
      transform: translateX(-20px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
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

  .luxury-animate-in {
    animation: fadeInUp 0.6s ease-out;
  }

  .luxury-animate-in-left {
    animation: fadeInLeft 0.6s ease-out;
  }

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

  .profile-saas-card {
    background: var(--luxury-card);
    border: 1px solid rgba(148, 163, 184, 0.12);
    box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04), 0 8px 24px rgba(124, 58, 237, 0.06);
    transition: box-shadow 0.25s ease, border-color 0.25s ease, transform 0.2s ease;
  }
  .profile-saas-card:hover {
    box-shadow: 0 4px 12px rgba(15, 23, 42, 0.06), 0 16px 40px rgba(124, 58, 237, 0.08);
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

  .profile-ai-glow {
    animation: aiPulse 3s ease-in-out infinite;
  }
`;

if (typeof document !== "undefined" && !document.getElementById("manager-profile-styles")) {
  const styleSheet = document.createElement("style");
  styleSheet.id = "manager-profile-styles";
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}

type ProfileData = {
  phone: string | null;
  department: string | null;
  jobTitle: string | null;
  hireDate: string | null;
};

type TokenParsed = {
  given_name?: string;
  family_name?: string;
  email?: string;
  picture?: string;
};

type ManagerOutletContext = {
  onAvatarUpdate?: (url: string) => void;
};

type EmployeeSkillItem = {
  id: number;
  skillId: number;
  skillName: string;
  categoryName: string;
  level: number;
  status: "EXTRACTED" | "QUIZ_PENDING" | "VALIDATED" | "FAILED" | string;
  source: string;
};

type Section = "personal" | "cv";
type CvMetadata = { fileName: string | null; cvUrl: string | null; uploadedAt: string | null };
type ExtractionResult = {
  matchedSkills: { skillName: string; categoryName: string }[];
  unmatchedSkills: string[];
  pendingRequestsCreated: number;
};

const MANAGER_PROFILE_ENDPOINT = "/api/manager/me";
const MANAGER_CV_ENDPOINT = "/api/manager/me/cv";
const MANAGER_CV_EXTRACT_ENDPOINT = "/api/manager/me/cv/extract";
const MANAGER_AVATAR_ENDPOINT = "/api/manager/me/avatar";
const MANAGER_PROFILE_UPDATE_ENDPOINT = "/api/manager/me/profile";

// Manager peut lire ses skills via les endpoints employee (autorisés dans SecurityConfig)
const EMPLOYEE_SKILLS_ENDPOINT = "/api/employee/me/skills";
const EMPLOYEE_PENDING_SKILLS_ENDPOINT = "/api/employee/me/pending-skills";

const DEFAULT_CV_FILE_NAME = "cv.pdf";

function normalizeCvFilename(file: File): string {
  return file.name || DEFAULT_CV_FILE_NAME;
}

function isAcceptedCvFile(file: File): boolean {
  return file.type === "application/pdf" || file.name.endsWith(".pdf") || file.name.endsWith(".docx");
}

export function ManagerProfile() {
  const { keycloak } = useKeycloak();
  const token = keycloak.tokenParsed as TokenParsed | undefined;
  const managerKeycloakId = keycloak.subject;

  const { onAvatarUpdate } = useOutletContext<ManagerOutletContext>() || {};

  const firstName = token?.given_name ?? "";
  const lastName = token?.family_name ?? "";
  const email = token?.email ?? "";

  const [editedFirstName, setEditedFirstName] = useState(firstName);
  const [editedLastName, setEditedLastName] = useState(lastName);
  const [isEditing, setIsEditing] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  const [extraData, setExtraData] = useState<ProfileData>({ phone: null, department: null, jobTitle: null, hireDate: null });
  const [loadingExtra, setLoadingExtra] = useState(true);

  useEffect(() => {
    setLoadingExtra(true);
    http.get<ProfileData>("/api/manager/me")
      .then((res) => setExtraData(res.data))
      .catch(() => {})
      .finally(() => setLoadingExtra(false));
  }, []);

  const displayFirst = isEditing ? editedFirstName : (editedFirstName || firstName);
  const displayLast = isEditing ? editedLastName : (editedLastName || lastName);
  const fullName = [displayFirst, displayLast].filter(Boolean).join(" ") || "Manager";
  const initials = `${displayFirst[0] ?? ""}${displayLast[0] ?? ""}`.trim().toUpperCase() || "MG";
  const gradient = getAvatarColor(email);

  const [section, setSection] = useState<Section>("personal");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(token?.picture ?? null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    http.get<{ avatarUrl?: string }>(MANAGER_PROFILE_ENDPOINT)
      .then((res) => {
        if (res.data?.avatarUrl) setAvatarUrl(res.data.avatarUrl);
      })
      .catch(() => {});
  }, []);

  const handleSaveProfile = useCallback(async () => {
    const fn = editedFirstName.trim();
    const ln = editedLastName.trim();
    if (!fn || fn.length < 2) { toast.error("Le prénom doit contenir au moins 2 caractères."); return; }
    if (!ln || ln.length < 2) { toast.error("Le nom doit contenir au moins 2 caractères."); return; }
    setSavingProfile(true);
    try {
      await http.put(MANAGER_PROFILE_UPDATE_ENDPOINT, { firstName: fn, lastName: ln });
      setIsEditing(false);
      toast.success("Profil mis à jour.");
    } catch {
      toast.error("Erreur lors de la mise à jour du profil.");
    } finally {
      setSavingProfile(false);
    }
  }, [editedFirstName, editedLastName]);

  const handleCancelEdit = useCallback(() => {
    setEditedFirstName(firstName);
    setEditedLastName(lastName);
    setIsEditing(false);
  }, [firstName, lastName]);

  const handleExtraUpdate = useCallback((updated: ProfileData) => {
    setExtraData(updated);
  }, []);

  const handleAvatarChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !managerKeycloakId) return;
    if (!file.type.startsWith("image/")) { toast.error("Veuillez sélectionner une image."); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("L'image ne doit pas dépasser 5 Mo."); return; }

    const reader = new FileReader();
    reader.onload = (ev) => setAvatarUrl(ev.target?.result as string);
    reader.readAsDataURL(file);

    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await http.post<{ avatarUrl: string }>(MANAGER_AVATAR_ENDPOINT, formData, {
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
  }, [managerKeycloakId, token?.picture, onAvatarUpdate]);

  // CV extraction state
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [cvFileName, setCvFileName] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const cvInputRef = useRef<HTMLInputElement>(null);

  // CV extraction result
  const [extractionResult, setExtractionResult] = useState<ExtractionResult | null>(null);
  const [employeeSkills, setEmployeeSkills] = useState<EmployeeSkillItem[]>([]);
  const [pendingUnrecognizedSkills, setPendingUnrecognizedSkills] = useState<string[]>([]);

  useEffect(() => {
    if (!managerKeycloakId) return;
    http.get<CvMetadata>(MANAGER_CV_ENDPOINT)
      .then((res) => {
        setCvFileName(res.data?.fileName ?? null);
      })
      .catch(() => {});
  }, [managerKeycloakId]);

  const loadEmployeeSkills = useCallback(() => {
    http.get<EmployeeSkillItem[]>(EMPLOYEE_SKILLS_ENDPOINT)
      .then((res) => setEmployeeSkills(res.data ?? []))
      .catch(() => setEmployeeSkills([]));
  }, []);

  useEffect(() => {
    loadEmployeeSkills();
  }, [loadEmployeeSkills]);

  const loadPendingUnrecognizedSkills = useCallback(() => {
    http.get<string[]>(EMPLOYEE_PENDING_SKILLS_ENDPOINT)
      .then((res) => setPendingUnrecognizedSkills(res.data ?? []))
      .catch(() => setPendingUnrecognizedSkills([]));
  }, []);

  useEffect(() => {
    loadPendingUnrecognizedSkills();
  }, [loadPendingUnrecognizedSkills]);

  const handleCvDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && isAcceptedCvFile(file)) {
      setCvFile(file);
      setCvFileName(normalizeCvFilename(file));
      setExtractionResult(null);
    } else {
      toast.error("Veuillez déposer un fichier PDF ou DOCX.");
    }
  };

  const handleCvSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCvFile(file);
      setCvFileName(normalizeCvFilename(file));
      setExtractionResult(null);
    }
  };

  const handleExtractSkills = async () => {
    if (!cvFile) return;
    setExtracting(true);
    setExtractionResult(null);

    const form = new FormData();
    form.append("file", cvFile);

    try {
      const res = await http.post<ExtractionResult>(MANAGER_CV_EXTRACT_ENDPOINT, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setExtractionResult(res.data);
      const matched = res.data.matchedSkills?.length ?? 0;
      const unmatched = res.data.unmatchedSkills?.length ?? 0;
      if (matched > 0) {
        toast.success(`${matched} compétence(s) ajoutée(s) à votre profil !`);
      }
      if (unmatched > 0) {
        toast.info(`${unmatched} compétence(s) non reconnue(s) envoyée(s) à l'administrateur.`);
      }
      setCvFileName(normalizeCvFilename(cvFile));
      loadEmployeeSkills();
      loadPendingUnrecognizedSkills();
    } catch {
      toast.error("Erreur lors de l'extraction des compétences.");
    } finally {
      setExtracting(false);
    }
  };

  const SECTIONS: { id: Section; label: string; icon: React.ReactNode }[] = [
    { id: "personal", label: "Informations personnelles", icon: <UserIcon className="w-4 h-4" /> },
    { id: "cv", label: "Extraction CV", icon: <SparklesIcon className="w-4 h-4" /> },
  ];

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden" style={{ background: "var(--luxury-light-bg)" }}>
      <div className="mx-auto flex h-full min-h-0 w-full max-w-7xl flex-col gap-2 px-3 py-1 md:gap-3 md:px-4 md:py-2">
        <header className="profile-saas-card luxury-animate-in shrink-0 rounded-2xl px-3.5 py-2.5 md:px-4 md:py-3">
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
                  <h1 className="text-2xl font-normal tracking-tight sm:text-3xl md:text-4xl" style={{ color: "#1e293b" }}>
                    {displayFirst}
                  </h1>
                  <h2 className="text-2xl font-normal tracking-tight sm:text-3xl md:text-4xl" style={{ color: "#1e293b" }}>
                    {displayLast}
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-0.5 w-6 rounded-full" style={{ background: "var(--luxury-primary)" }} />
                  <p className="text-xs font-medium uppercase tracking-widest" style={{ color: "var(--luxury-text-muted)" }}>
                    Profil Manager
                  </p>
                </div>
              </div>
            </div>
            <div className="flex w-fit shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-xs shadow-sm transition-transform duration-200 hover:scale-[1.02]" style={{ background: "rgba(16, 185, 129, 0.08)", borderColor: "var(--luxury-success)" }}>
              <CheckCircleIcon className="h-3 w-3 shrink-0" style={{ color: "var(--luxury-success)" }} />
              <span className="font-semibold" style={{ color: "var(--luxury-success)" }}>
                Compte actif
              </span>
            </div>
          </div>
        </header>

        <nav
          className="profile-saas-card luxury-animate-in flex shrink-0 gap-1 overflow-x-auto rounded-2xl p-1 md:p-1.5"
          style={{ animationDelay: "0.05s" }}
          aria-label="Sections du profil"
        >
          {SECTIONS.map((s, idx) => {
            const active = section === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setSection(s.id)}
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

        <main className="min-h-0 flex-1 overflow-hidden luxury-animate-in" style={{ animationDelay: "0.1s" }}>
          <div className="profile-saas-card flex h-full min-h-0 flex-col overflow-hidden rounded-2xl">
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 md:p-4">
              {section === "personal" && (
                <PersonalSection
                  firstName={editedFirstName || firstName}
                  lastName={editedLastName || lastName}
                  email={email}
                  isEditing={isEditing}
                  saving={savingProfile}
                  onEditedFirstNameChange={setEditedFirstName}
                  onEditedLastNameChange={setEditedLastName}
                  onEdit={() => { setEditedFirstName(firstName); setEditedLastName(lastName); setIsEditing(true); }}
                  onSave={handleSaveProfile}
                  onCancel={handleCancelEdit}
                  extraData={extraData}
                  loadingExtra={loadingExtra}
                  onExtraUpdate={handleExtraUpdate}
                />
              )}

              {section === "cv" && (
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
                />
              )}
          </div>
          </div>
        </main>
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
    <section className={`profile-saas-card rounded-2xl ${compact ? "p-3 md:p-3.5" : "p-4 md:p-5"}`}>
      {title ? (
        <div className={`${compact ? "mb-2.5 pb-2" : "mb-4 pb-3"} border-b border-slate-200/80`}>
          <h3 className="text-lg font-bold" style={{ color: "#1e293b" }}>
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

/* ─── Personal Section ─────────────────────────────────────────────────────── */

function PersonalSection({
  firstName, lastName, email,
  isEditing, saving,
  onEditedFirstNameChange, onEditedLastNameChange,
  onEdit, onSave, onCancel,
  extraData, loadingExtra, onExtraUpdate,
}: {
  firstName: string; lastName: string; email: string;
  isEditing: boolean; saving: boolean;
  onEditedFirstNameChange: (v: string) => void;
  onEditedLastNameChange: (v: string) => void;
  onEdit: () => void; onSave: () => Promise<void>; onCancel: () => void;
  extraData: ProfileData;
  loadingExtra: boolean;
  onExtraUpdate: (data: ProfileData) => void;
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
      const res = await http.put<ProfileData>("/api/manager/me/extra", {
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
          <h2 className="mb-0.5 text-lg font-bold" style={{ color: "#1e293b" }}>
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
                  <EditableField label="Prénom" icon={<UserIcon className="h-4 w-4" />} value={firstName} onChange={onEditedFirstNameChange} placeholder="Prénom" autoFocus />
                  <EditableField label="Nom" icon={<UserIcon className="h-4 w-4" />} value={lastName} onChange={onEditedLastNameChange} placeholder="Nom" />
                </>
              ) : (
                <>
                  <ReadonlyField icon={<UserIcon className="h-4 w-4" />} label="Prénom" value={firstName || "—"} />
                  <ReadonlyField icon={<UserIcon className="h-4 w-4" />} label="Nom" value={lastName || "—"} />
                </>
              )}
            </div>
            <ReadonlyField
              icon={<EnvelopeIcon className="h-4 w-4" />}
              label="Adresse e-mail"
              value={email || "—"}
              badge={
                <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold shadow-sm" style={{ background: "rgba(16, 185, 129, 0.08)", color: "var(--luxury-success)", border: "1px solid rgba(16, 185, 129, 0.3)" }}>
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
                  <EditableField icon={<PhoneIcon className="h-4 w-4" />} label="Téléphone" value={editPhone} onChange={setEditPhone} placeholder="+216 20 123 456" type="tel" />
                ) : (
                  <ReadonlyField icon={<PhoneIcon className="h-4 w-4" />} label="Téléphone" value={extraData.phone || "—"} />
                )}
                {isEditing ? (
                  <EditableField icon={<CalendarDaysIcon className="h-4 w-4" />} label="Date d'embauche" value={editHire} onChange={setEditHire} type="date" />
                ) : (
                  <ReadonlyField icon={<CalendarDaysIcon className="h-4 w-4" />} label="Date d'embauche" value={extraData.hireDate || "—"} />
                )}
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {isEditing ? (
                  <EditableField icon={<BuildingOffice2Icon className="h-4 w-4" />} label="Département" value={editDept} onChange={setEditDept} placeholder="ex: Ingénierie" />
                ) : (
                  <ReadonlyField icon={<BuildingOffice2Icon className="h-4 w-4" />} label="Département" value={extraData.department || "—"} />
                )}
                {isEditing ? (
                  <EditableField icon={<BriefcaseIcon className="h-4 w-4" />} label="Poste" value={editJob} onChange={setEditJob} placeholder="ex: Développeur" />
                ) : (
                  <ReadonlyField icon={<BriefcaseIcon className="h-4 w-4" />} label="Poste" value={extraData.jobTitle || "—"} />
                )}
              </div>
            </div>
          )}
        </ProfileSectionCard>
      </div>

      <ProfileSectionCard compact title="Sécurité & Mot de passe" description="Modifiez votre mot de passe de connexion.">
        <SecuritySection embedded />
      </ProfileSectionCard>
    </div>
  );
}

/* ─── Security Section ─────────────────────────────────────────────────────── */

function passwordStrength(pwd: string): { score: number; label: string; color: string; tw: string } {
  if (!pwd) return { score: 0, label: "", color: "", tw: "bg-slate-200" };
  let score = 0;
  if (pwd.length >= 8) score++;
  if (pwd.length >= 12) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  if (score <= 1) return { score, label: "Très faible", color: "text-red-500", tw: "bg-red-500" };
  if (score === 2) return { score, label: "Faible", color: "text-orange-500", tw: "bg-orange-500" };
  if (score === 3) return { score, label: "Moyen", color: "text-yellow-500", tw: "bg-yellow-400" };
  if (score === 4) return { score, label: "Fort", color: "text-green-500", tw: "bg-green-500" };
  return { score, label: "Très fort", color: "text-green-700", tw: "bg-green-600" };
}

function PasswordField({ id, label, value, show, onToggle, onChange, error, placeholder, autoComplete }: {
  id: string; label: string; value: string; show: boolean;
  onToggle: () => void; onChange: (v: string) => void;
  error?: string; placeholder?: string; autoComplete?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-widest" style={{ color: "var(--luxury-text-muted)" }}>
        <LockClosedIcon className="w-3 h-3" style={{ color: "var(--luxury-primary)" }} /> {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="w-full rounded-xl px-3 py-2.5 pr-9 text-xs transition-all duration-300"
          style={{
            background: error ? "rgba(239, 68, 68, 0.05)" : "var(--luxury-input)",
            border: `1px solid ${error ? "var(--luxury-error)" : "rgba(148, 163, 184, 0.2)"}`,
            color: "var(--luxury-text)",
            outline: "none",
          }}
        />
        <button type="button" onClick={onToggle}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 transition-colors duration-300"
          style={{ color: "var(--luxury-text-muted)" }}>
          {show ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
        </button>
      </div>
      {error && (
        <div className="flex items-center gap-1 mt-0.5">
          <XMarkIcon className="w-3 h-3 text-red-500" />
          <span className="text-xs text-red-500">{error}</span>
        </div>
      )}
    </div>
  );
}

function SecuritySection({ embedded = false }: { embedded?: boolean }) {
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
      await http.post("/api/manager/me/change-password", { currentPassword, newPassword, confirmPassword });
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
      setFieldErrors({});
      toast.success("Mot de passe modifié avec succès.");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? "Erreur lors du changement de mot de passe.";
      if (msg.toLowerCase().includes("incorrect")) {
        setFieldErrors({ current: "Mot de passe actuel incorrect." });
      } else {
        toast.error(msg);
      }
    } finally {
      setSaving(false);
    }
  }, [currentPassword, newPassword, confirmPassword]);

  return (
    <div className={`flex flex-col ${embedded ? "gap-4" : "p-6 md:p-8 gap-6"}`}>
      {!embedded ? (
        <div>
          <h2 className="mb-0.5 text-lg font-bold" style={{ color: "#1e293b" }}>Sécurité & Mot de passe</h2>
          <p className="text-sm" style={{ color: "var(--luxury-text-muted)" }}>Modifiez votre mot de passe de connexion.</p>
        </div>
      ) : null}

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <PasswordField
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
            <PasswordField
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
            <div className="mt-3 flex flex-col gap-1.5">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className={`flex-1 h-1 rounded-full transition-all ${i <= strength.score ? strength.tw : "bg-slate-200"}`} />
                  ))}
                </div>
                {strength.label && <span className={`text-xs font-semibold ${strength.color}`}>{strength.label}</span>}
              </div>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 border-t border-slate-200/80 pt-4 md:grid-cols-[1fr_auto] md:items-end">
          <PasswordField
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

          <button type="submit" disabled={saving}
            className="flex h-fit items-center justify-center gap-2 rounded-xl border-none bg-gradient-to-r from-indigo-700 to-violet-700 px-5 py-2.5 text-sm font-bold text-white shadow-md transition-all duration-200 hover:shadow-lg active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70">
            {saving ? <ArrowPathIcon className="w-4 h-4 animate-spin" /> : <LockClosedIcon className="w-4 h-4" />}
            {saving ? "Modification..." : "Modifier le mot de passe"}
          </button>
        </div>
      </form>

    </div>
  );
}

/* ─── Shared field components ──────────────────────────────────────────────── */

function EditableField({ icon, label, value, onChange, placeholder, type = "text", autoFocus }: {
  icon: React.ReactNode; label: string; value: string;
  onChange: (v: string) => void; placeholder?: string; type?: string; autoFocus?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-widest" style={{ color: "var(--luxury-text-muted)" }}>
        <span style={{ color: "var(--luxury-primary)" }}>{icon}</span> {label}
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

function ReadonlyField({ icon, label, value, badge }: {
  icon: React.ReactNode; label: string; value: string; badge?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-widest" style={{ color: "var(--luxury-text-muted)" }}>
        <span style={{ color: "var(--luxury-primary)" }}>{icon}</span> {label}
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

/* ─── CV Section ───────────────────────────────────────────────────────────── */

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
}) {
  const handleDownloadCv = useCallback(async () => {
    try {
      const fileName = cvFile?.name ?? cvFileName ?? "cv.pdf";
      const res = await http.get("/api/manager/me/cv/download", { responseType: "blob" });
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
      // `responseType: "blob"` means backend JSON errors arrive as a Blob.
      try {
        const data = err?.response?.data;
        if (data instanceof Blob) {
          const text = await data.text();
          const parsed = JSON.parse(text);
          const msg = parsed?.error || parsed?.message;
          if (msg) {
            toast.error(String(msg));
            return;
          }
        } else {
          const msg = data?.error || data?.message;
          if (msg) {
            toast.error(String(msg));
            return;
          }
        }
      } catch {
        // ignore
      }
      toast.error("Impossible de télécharger le CV.");
    }
  }, [cvFile?.name, cvFileName]);

  const hasRightPanel =
    Boolean(extractionResult) || employeeSkills.length > 0 || pendingUnrecognizedSkills.length > 0;

  return (
    <div
      className={`grid min-h-0 grid-cols-1 gap-5 ${hasRightPanel ? "lg:grid-cols-12 lg:gap-6 lg:items-start" : ""}`}
    >
      <div className={`order-2 shrink-0 ${hasRightPanel ? "lg:order-1 lg:col-span-5" : ""}`}>
        <div
          className="profile-saas-card relative overflow-x-hidden overflow-y-auto overscroll-contain rounded-2xl p-5 transition-all duration-300 md:p-6 lg:h-[min(32rem,calc(100vh-14rem))]"
          style={{
            border: dragOver ? "2px dashed var(--luxury-primary)" : "1px solid rgba(148, 163, 184, 0.14)",
            background: dragOver
              ? "linear-gradient(145deg, rgba(124, 58, 237, 0.1) 0%, rgba(255, 255, 255, 0.95) 45%, rgba(248, 247, 255, 0.98) 100%)"
              : "linear-gradient(145deg, rgba(124, 58, 237, 0.04) 0%, #ffffff 40%, rgba(248, 247, 255, 0.6) 100%)",
            boxShadow: dragOver ? "0 12px 40px rgba(124, 58, 237, 0.15)" : undefined,
          }}
          onDragOver={(e) => {
            e.preventDefault();
            onDragOver(true);
          }}
          onDragLeave={() => onDragOver(false)}
          onDrop={onCvDrop}
        >
          <div
            className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-40 profile-ai-glow"
            style={{ background: "radial-gradient(circle, rgba(124, 58, 237, 0.35) 0%, transparent 70%)" }}
          />
          <div className="relative flex min-h-full flex-col items-center justify-center px-2 py-4 text-center md:px-4 md:py-6">
            <div className="w-full max-w-md">
              <div
                className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl shadow-md md:mb-5 md:h-16 md:w-16"
                style={{
                  background: extracting ? "rgba(124, 58, 237, 0.15)" : "rgba(124, 58, 237, 0.1)",
                  border: "1px solid rgba(124, 58, 237, 0.25)",
                }}
              >
                {extracting ? (
                  <ArrowPathIcon className="h-7 w-7 animate-spin md:h-8 md:w-8" style={{ color: "var(--luxury-primary)" }} />
                ) : (
                  <SparklesIcon className="h-7 w-7 md:h-8 md:w-8" style={{ color: "var(--luxury-primary)" }} />
                )}
              </div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider md:text-[13px]" style={{ color: "var(--luxury-primary)" }}>
                Extraction assistée
              </p>
              <h3 className="mb-2 text-base font-bold md:text-lg" style={{ color: "#1e293b" }}>
                Importez votre CV
              </h3>
              <p className="mb-5 max-w-sm text-center text-xs leading-relaxed md:mb-6 md:text-sm" style={{ color: "var(--luxury-text-muted)" }}>
                Glissez-déposez votre CV (PDF ou DOCX) pour analyser vos compétences
              </p>

              {cvFile || cvFileName ? (
                <div
                  className="mx-auto mb-5 flex w-full max-w-full items-center gap-3 rounded-xl px-4 py-3 shadow-sm transition-all duration-200 hover:shadow-md"
                  style={{ background: "rgba(124, 58, 237, 0.06)", border: "1px solid rgba(124, 58, 237, 0.2)" }}
                >
                  <DocumentTextIcon className="h-5 w-5 shrink-0" style={{ color: "var(--luxury-primary)" }} />
                  <button
                    type="button"
                    onClick={handleDownloadCv}
                    className="min-w-0 flex-1 truncate text-left text-sm font-medium underline decoration-transparent transition-colors hover:decoration-inherit disabled:cursor-not-allowed disabled:opacity-70"
                    style={{ color: "var(--luxury-text)" }}
                    title="Télécharger"
                    disabled={!cvFileName && !cvFile}
                  >
                    {cvFile?.name ?? cvFileName}
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadCv}
                    className="shrink-0 rounded-lg p-2 transition-colors hover:bg-violet-50 disabled:opacity-60"
                    style={{ color: "var(--luxury-primary)" }}
                    title="Télécharger"
                    disabled={!cvFileName && !cvFile}
                  >
                    <ArrowDownTrayIcon className="h-5 w-5" />
                  </button>
                </div>
              ) : null}

              <div className="flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
                <button
                  type="button"
                  onClick={() => cvInputRef.current?.click()}
                  style={{ border: "1.5px solid var(--luxury-primary)" }}
                  className="rounded-xl px-5 py-3 text-sm font-semibold transition-all duration-200 hover:bg-violet-50 active:scale-[0.98]"
                >
                  <span style={{ color: "var(--luxury-primary)" }}>Choisir un fichier</span>
                </button>
                <button
                  type="button"
                  onClick={onExtract}
                  disabled={!cvFile || extracting}
                  style={{ background: "var(--luxury-primary)" }}
                  className="flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white shadow-md transition-all duration-200 hover:shadow-lg active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {extracting ? (
                    <>
                      <ArrowPathIcon className="h-5 w-5 animate-spin" />
                      Extraction en cours…
                    </>
                  ) : (
                    <>
                      <SparklesIcon className="h-5 w-5" />
                      Extraire
                    </>
                  )}
                </button>
              </div>
              <input ref={cvInputRef} type="file" accept=".pdf,.docx" className="hidden" onChange={onCvSelect} />
            </div>
          </div>
        </div>
      </div>

      {hasRightPanel ? (
        <div className="order-1 flex min-h-0 flex-col lg:order-2 lg:col-span-7">
          <div className="profile-saas-card min-h-0 flex-1 overflow-y-auto overscroll-contain rounded-2xl lg:max-h-[min(32rem,calc(100vh-14rem))]">
            <div className="p-4 md:p-5">
              <ExtractionResultsSection
                extractionResult={extractionResult}
                employeeSkills={employeeSkills}
                pendingUnrecognizedSkills={pendingUnrecognizedSkills}
              />
            </div>
          </div>
        </div>
      ) : null}
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

  return (
    <div className="flex min-h-0 flex-col gap-5">
      {extractionResult || employeeSkills.length > 0 || pendingUnrecognizedSkills.length > 0 ? (
        <>
          {employeeSkills.length > 0 ? (
            <div className="rounded-2xl border border-slate-200/90 bg-white/90 p-4 shadow-sm md:p-5">
              <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3">
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-sm"
                    style={{ background: "rgba(124, 58, 237, 0.1)", border: "1px solid rgba(124, 58, 237, 0.2)" }}
                  >
                    <BeakerIcon className="h-6 w-6" style={{ color: "var(--luxury-primary)" }} />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold leading-tight" style={{ color: "#1e293b" }}>
                      Compétences extraites ({employeeSkills.length})
                    </h3>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span
                    className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold shadow-sm"
                    style={{ background: "rgba(16, 185, 129, 0.1)", color: "var(--luxury-success)", border: "1px solid var(--luxury-success)" }}
                  >
                    Validées: {validatedCount}
                  </span>
                  <span
                    className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold shadow-sm"
                    style={{ background: "rgba(249, 115, 22, 0.1)", color: "#C2410C", border: "1px solid rgba(249, 115, 22, 0.45)" }}
                  >
                    En attente: {pendingQuizCount}
                  </span>
                  <span
                    className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold shadow-sm"
                    style={{ background: "rgba(239, 68, 68, 0.1)", color: "var(--luxury-error)", border: "1px solid var(--luxury-error)" }}
                  >
                    À repasser: {failedCount}
                  </span>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {pagedSkills.map((skill) => {
                  const isValidated = skill.status === "VALIDATED";
                  const statusStyle =
                    skill.status === "VALIDATED"
                      ? { background: "rgba(16, 185, 129, 0.1)", color: "var(--luxury-success)", border: "1px solid var(--luxury-success)" }
                      : skill.status === "FAILED"
                        ? { background: "rgba(239, 68, 68, 0.1)", color: "var(--luxury-error)", border: "1px solid var(--luxury-error)" }
                        : { background: "rgba(249, 115, 22, 0.1)", color: "#C2410C", border: "1px solid rgba(249, 115, 22, 0.45)" };
                  const statusLabel = skill.status === "VALIDATED" ? "Validée" : skill.status === "FAILED" ? "À repasser" : "Quiz en attente";

                  return (
                    <div
                      key={skill.id}
                      className="group flex cursor-default items-center justify-between gap-4 rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm transition-all duration-200 hover:border-violet-200/80 hover:shadow-md"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold" style={{ color: "#1e293b" }}>
                          {skill.skillName}
                        </p>
                        <p className="mt-1 text-[11px] leading-relaxed" style={{ color: "var(--luxury-text-muted)" }}>
                          {skill.categoryName} · Niveau {skill.level}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-2 sm:flex-row sm:items-center">
                        <span className="inline-flex rounded-lg px-2.5 py-1 text-[10px] font-bold" style={statusStyle}>
                          {statusLabel}
                        </span>
                        {!isValidated ? (
                          <button
                            type="button"
                            onClick={() => toast.info("Quiz bientôt disponible")}
                            style={{ background: "rgba(124, 58, 237, 0.08)", border: "1px solid var(--luxury-primary)" }}
                            className="rounded-lg px-2.5 py-1 text-[10px] font-semibold transition-all duration-200 hover:bg-violet-100/80 active:scale-95"
                          >
                            <span style={{ color: "var(--luxury-primary)" }}>Quiz</span>
                          </button>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>

              {totalSkillPages > 1 ? (
                <div className="mt-4 flex items-center justify-center gap-2">
                  {Array.from({ length: totalSkillPages }).map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSkillsPage(idx)}
                      aria-label={`Aller à la page ${idx + 1}`}
                      className="h-2 rounded-full transition-all duration-200 hover:opacity-90"
                      style={{
                        width: skillsPage === idx ? "1.25rem" : "0.5rem",
                        background: skillsPage === idx ? "var(--luxury-primary)" : "rgba(148, 163, 184, 0.28)",
                      }}
                    />
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}

          {pendingUnrecognizedSkills.length > 0 || (extractionResult?.unmatchedSkills.length ?? 0) > 0 ? (
            <div
              className="rounded-2xl border p-4 shadow-sm md:p-5"
              style={{
                background: "linear-gradient(135deg, rgba(249, 115, 22, 0.06) 0%, rgba(255, 255, 255, 0.95) 100%)",
                borderColor: "rgba(249, 115, 22, 0.28)",
              }}
            >
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-lg"
                    style={{ background: "rgba(249, 115, 22, 0.12)", border: "1px solid rgba(249, 115, 22, 0.35)" }}
                  >
                    <ArrowPathIcon className="h-4 w-4" style={{ color: "#EA580C" }} />
                  </div>
                  <span className="text-xs font-bold" style={{ color: "#1e293b" }}>
                    En attente de validation
                  </span>
                </div>
                <span
                  className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold"
                  style={{ background: "rgba(249, 115, 22, 0.12)", color: "#C2410C", border: "1px solid rgba(249, 115, 22, 0.4)" }}
                >
                  {pendingUnrecognizedSkills.length > 0 ? pendingUnrecognizedSkills.length : (extractionResult?.unmatchedSkills.length ?? 0)} compétence(s)
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {(pendingUnrecognizedSkills.length > 0 ? pendingUnrecognizedSkills : (extractionResult?.unmatchedSkills ?? [])).map((skill, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center rounded-lg border border-slate-200/90 bg-white px-3 py-1.5 text-[11px] font-medium shadow-sm transition-all duration-200 hover:border-orange-200/80 hover:shadow"
                    style={{ color: "var(--luxury-text)" }}
                  >
                    {skill}
                  </span>
                ))}
              </div>

              <p className="mt-3 text-[11px] leading-relaxed" style={{ color: "var(--luxury-text-muted)" }}>
                Ces compétences seront examinées par un administrateur et ajoutées au référentiel si validées.
              </p>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
