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
  ShieldCheckIcon,
  CheckCircleIcon,
  PencilSquareIcon,
  ArrowDownTrayIcon,
  XMarkIcon,
  EyeIcon,
  EyeSlashIcon,
  LockClosedIcon,
  SparklesIcon,
  DocumentTextIcon,
  CloudArrowUpIcon,
  BeakerIcon,
} from "@heroicons/react/24/outline";
import { toast } from "sonner";
import { http } from "../../api/http";
import { getAvatarColor } from "../admin/utils";

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

type EmployeeOutletContext = {
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

type Section = "personal" | "security" | "cv";

export function EmployeeMyProfile() {
  const { keycloak } = useKeycloak();
  const token = keycloak.tokenParsed as TokenParsed | undefined;
  const employeeKeycloakId = keycloak.subject;

  const { onAvatarUpdate } = useOutletContext<EmployeeOutletContext>() || {};

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
    http.get<ProfileData>("/api/employee/me")
      .then((res) => setExtraData(res.data))
      .catch(() => {})
      .finally(() => setLoadingExtra(false));
  }, []);

  const displayFirst = isEditing ? editedFirstName : (editedFirstName || firstName);
  const displayLast = isEditing ? editedLastName : (editedLastName || lastName);
  const fullName = [displayFirst, displayLast].filter(Boolean).join(" ") || "Employé";
  const initials = `${displayFirst[0] ?? ""}${displayLast[0] ?? ""}`.trim().toUpperCase() || "EM";
  const gradient = getAvatarColor(email);

  const [section, setSection] = useState<Section>("personal");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(token?.picture ?? null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // CV extraction state
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [cvFileName, setCvFileName] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const cvInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    http.get<{ avatarUrl?: string }>("/api/employee/me")
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
      await http.put("/api/employee/me/profile", { firstName: fn, lastName: ln });
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
    if (!file || !employeeKeycloakId) return;
    if (!file.type.startsWith("image/")) { toast.error("Veuillez sélectionner une image."); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("L'image ne doit pas dépasser 5 Mo."); return; }

    const reader = new FileReader();
    reader.onload = (ev) => setAvatarUrl(ev.target?.result as string);
    reader.readAsDataURL(file);

    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await http.post<{ avatarUrl: string }>("/api/employee/me/avatar", formData, {
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
  }, [employeeKeycloakId, token?.picture, onAvatarUpdate]);

  // CV extraction result
  const [extractionResult, setExtractionResult] = useState<{
    matchedSkills: { skillName: string; categoryName: string }[];
    unmatchedSkills: string[];
    pendingRequestsCreated: number;
  } | null>(null);
  const [employeeSkills, setEmployeeSkills] = useState<EmployeeSkillItem[]>([]);
  const [pendingUnrecognizedSkills, setPendingUnrecognizedSkills] = useState<string[]>([]);

  useEffect(() => {
    if (!employeeKeycloakId) return;
    http.get<{ fileName: string | null; cvUrl: string | null; uploadedAt: string | null }>("/api/employee/me/cv")
      .then((res) => {
        setCvFileName(res.data?.fileName ?? null);
      })
      .catch(() => {});
  }, [employeeKeycloakId]);

  const loadEmployeeSkills = useCallback(() => {
    http.get<EmployeeSkillItem[]>("/api/employee/me/skills")
      .then((res) => setEmployeeSkills(res.data ?? []))
      .catch(() => setEmployeeSkills([]));
  }, []);

  useEffect(() => {
    loadEmployeeSkills();
  }, [loadEmployeeSkills]);

  const loadPendingUnrecognizedSkills = useCallback(() => {
    http.get<string[]>("/api/employee/me/pending-skills")
      .then((res) => setPendingUnrecognizedSkills(res.data ?? []))
      .catch(() => setPendingUnrecognizedSkills([]));
  }, []);

  useEffect(() => {
    loadPendingUnrecognizedSkills();
  }, [loadPendingUnrecognizedSkills]);

  // CV handlers
  const handleCvDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && (file.type === "application/pdf" || file.name.endsWith(".pdf") || file.name.endsWith(".docx"))) {
      setCvFile(file);
      setCvFileName(file.name);
      setExtractionResult(null);
    } else {
      toast.error("Veuillez déposer un fichier PDF ou DOCX.");
    }
  };

  const handleCvSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCvFile(file);
      setCvFileName(file.name);
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
      const res = await http.post<{
        matchedSkills: { skillName: string; categoryName: string }[];
        unmatchedSkills: string[];
        pendingRequestsCreated: number;
      }>("/api/employee/me/cv/extract", form, {
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
      setCvFileName(cvFile.name);
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
    { id: "security", label: "Sécurité & Mot de passe", icon: <ShieldCheckIcon className="w-4 h-4" /> },
  ];

  return (
    <div className="flex-1 overflow-y-auto -mt-4 px-4 pb-0 pt-0 md:-mt-6 md:px-8 md:pb-0 md:pt-1">
      <div className="flex flex-col lg:flex-row gap-4 max-w-5xl mx-auto">

        {/* Left panel */}
        <div className="lg:w-64 shrink-0 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-2.5 px-5 pt-6 pb-5 bg-gradient-to-b from-violet-50 to-white border-b border-slate-100">
            <div className="relative">
              {avatarUrl ? (
                <img src={avatarUrl} alt={fullName} className="h-[88px] w-[88px] rounded-full object-cover border-4 border-violet-100 shadow-lg" />
              ) : (
                <div
                  className="flex h-[88px] w-[88px] items-center justify-center rounded-full border-4 border-violet-100 text-3xl font-bold text-white shadow-lg"
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
                className="absolute bottom-0.5 right-0.5 w-7 h-7 rounded-full bg-gradient-to-br from-indigo-700 to-violet-700 border-2 border-white flex items-center justify-center text-white shadow-md disabled:cursor-not-allowed"
              >
                {uploadingAvatar
                  ? <ArrowPathIcon className="w-3.5 h-3.5 animate-spin" />
                  : <CameraIcon className="w-3.5 h-3.5" />
                }
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-indigo-950">{fullName}</p>
              <p className="text-xs text-slate-400 mt-0.5">Employé</p>
            </div>
            <div className="flex items-center gap-1.5 bg-green-50 border border-green-200 rounded-full px-3 py-1">
              <CheckCircleIcon className="w-3 h-3 text-green-600" />
              <span className="text-xs font-semibold text-green-600">Compte actif</span>
            </div>
          </div>

          {/* Nav */}
          <nav className="p-2.5 flex flex-col gap-1">
            {SECTIONS.map((s) => {
              const active = section === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSection(s.id)}
                  className={`relative flex items-center gap-2.5 w-full rounded-xl px-3.5 py-2.5 text-sm font-medium text-left transition-all whitespace-nowrap
                    ${active ? "bg-indigo-50 text-indigo-800 font-semibold" : "text-slate-500 hover:bg-slate-50"}`}
                >
                  {active && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r bg-gradient-to-b from-indigo-700 to-violet-700" />
                  )}
                  <span className={active ? "text-indigo-600" : "text-slate-300"}>{s.icon}</span>
                  {s.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right panel */}
        <div className="flex-1 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
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
          {section === "security" && <SecuritySection />}
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
    </div>
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
  onEdit: () => void; onSave: () => void; onCancel: () => void;
  extraData: ProfileData;
  loadingExtra: boolean;
  onExtraUpdate: (data: ProfileData) => void;
}) {
  const [editPhone, setEditPhone] = useState(extraData.phone ?? "");
  const [editDept, setEditDept] = useState(extraData.department ?? "");
  const [editJob, setEditJob] = useState(extraData.jobTitle ?? "");
  const [editHire, setEditHire] = useState(extraData.hireDate ?? "");
  const [isEditingExtra, setIsEditingExtra] = useState(false);
  const [savingExtra, setSavingExtra] = useState(false);

  useEffect(() => {
    if (!isEditingExtra) {
      setEditPhone(extraData.phone ?? "");
      setEditDept(extraData.department ?? "");
      setEditJob(extraData.jobTitle ?? "");
      setEditHire(extraData.hireDate ?? "");
    }
  }, [extraData, isEditingExtra]);

  const handleSaveExtra = async () => {
    setSavingExtra(true);
    try {
      const res = await http.put<ProfileData>("/api/employee/me/extra", {
        phone: editPhone.trim() || null,
        department: editDept.trim() || null,
        jobTitle: editJob.trim() || null,
        hireDate: editHire || null,
      });
      onExtraUpdate(res.data);
      setIsEditingExtra(false);
      toast.success("Informations mises à jour.");
    } catch {
      toast.error("Erreur lors de la mise à jour.");
    } finally {
      setSavingExtra(false);
    }
  };

  return (
    <div className="p-4 md:p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-indigo-950">Informations personnelles</h2>
          <p className="text-xs text-slate-400 mt-1">
            {isEditing ? "Modifiez vos informations puis enregistrez." : "Cliquez sur Modifier pour changer votre nom."}
          </p>
        </div>
        {!isEditing ? (
          <button type="button" onClick={onEdit}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 transition shrink-0">
            <PencilSquareIcon className="w-3.5 h-3.5" /> Modifier
          </button>
        ) : (
          <div className="flex gap-2 shrink-0">
            <button type="button" onClick={onCancel} disabled={saving}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-100 transition">
              <XMarkIcon className="w-3.5 h-3.5" /> Annuler
            </button>
            <button type="button" onClick={onSave} disabled={saving}
              className="flex items-center gap-1.5 rounded-xl border-none bg-gradient-to-r from-indigo-700 to-violet-700 px-3.5 py-1.5 text-xs font-bold text-white shadow-md disabled:opacity-70 disabled:cursor-not-allowed transition">
              {saving ? <ArrowPathIcon className="w-3.5 h-3.5 animate-spin" /> : <ArrowDownTrayIcon className="w-3.5 h-3.5" />}
              {saving ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>
        )}
      </div>

      {/* Nom / Prénom */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {isEditing ? (
          <>
            <EditableField label="Prénom" icon={<UserIcon className="w-4 h-4 text-indigo-600" />}
              value={firstName} onChange={onEditedFirstNameChange} placeholder="Prénom" autoFocus />
            <EditableField label="Nom" icon={<UserIcon className="w-4 h-4 text-indigo-600" />}
              value={lastName} onChange={onEditedLastNameChange} placeholder="Nom" />
          </>
        ) : (
          <>
            <ReadonlyField icon={<UserIcon className="w-4 h-4 text-indigo-600" />} label="Prénom" value={firstName || "—"} />
            <ReadonlyField icon={<UserIcon className="w-4 h-4 text-indigo-600" />} label="Nom" value={lastName || "—"} />
          </>
        )}
      </div>

      {/* Email */}
      <ReadonlyField
        icon={<EnvelopeIcon className="w-4 h-4 text-indigo-600" />}
        label="Adresse e-mail"
        value={email || "—"}
        badge={
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-600 bg-green-50 border border-green-200 rounded-full px-2.5 py-0.5">
            <CheckCircleIcon className="w-3 h-3" /> Vérifié
          </span>
        }
      />

      {/* Informations professionnelles */}
      <div className="border-t border-slate-100 pt-4">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Informations professionnelles</p>
          {!loadingExtra && !isEditingExtra ? (
            <button type="button" onClick={() => setIsEditingExtra(true)}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 transition">
              <PencilSquareIcon className="w-3 h-3" /> Modifier
            </button>
          ) : isEditingExtra ? (
            <div className="flex gap-2">
              <button type="button" onClick={() => setIsEditingExtra(false)} disabled={savingExtra}
                className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-100 transition">
                <XMarkIcon className="w-3 h-3" /> Annuler
              </button>
              <button type="button" onClick={handleSaveExtra} disabled={savingExtra}
                className="flex items-center gap-1 rounded-xl border-none bg-gradient-to-r from-indigo-700 to-violet-700 px-3 py-1 text-xs font-bold text-white shadow disabled:opacity-70 disabled:cursor-not-allowed transition">
                {savingExtra ? <ArrowPathIcon className="w-3 h-3 animate-spin" /> : <ArrowDownTrayIcon className="w-3 h-3" />}
                {savingExtra ? "..." : "Enregistrer"}
              </button>
            </div>
          ) : null}
        </div>

        {loadingExtra ? (
          <div className="flex justify-center py-5">
            <ArrowPathIcon className="w-5 h-5 animate-spin text-violet-700" />
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {isEditingExtra ? (
                <ExtraField icon={<PhoneIcon className="w-4 h-4 text-indigo-600" />} label="Téléphone" value={editPhone} onChange={setEditPhone} placeholder="+216 20 123 456" type="tel" />
              ) : (
                <ReadonlyField icon={<PhoneIcon className="w-4 h-4 text-indigo-600" />} label="Téléphone" value={extraData.phone || "—"} />
              )}
              {isEditingExtra ? (
                <ExtraField icon={<CalendarDaysIcon className="w-4 h-4 text-indigo-600" />} label="Date d'embauche" value={editHire} onChange={setEditHire} type="date" />
              ) : (
                <ReadonlyField icon={<CalendarDaysIcon className="w-4 h-4 text-indigo-600" />} label="Date d'embauche" value={extraData.hireDate || "—"} />
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {isEditingExtra ? (
                <ExtraField icon={<BuildingOffice2Icon className="w-4 h-4 text-indigo-600" />} label="Département" value={editDept} onChange={setEditDept} placeholder="ex: Ingénierie" />
              ) : (
                <ReadonlyField icon={<BuildingOffice2Icon className="w-4 h-4 text-indigo-600" />} label="Département" value={extraData.department || "—"} />
              )}
              {isEditingExtra ? (
                <ExtraField icon={<BriefcaseIcon className="w-4 h-4 text-indigo-600" />} label="Poste" value={editJob} onChange={setEditJob} placeholder="ex: Développeur" />
              ) : (
                <ReadonlyField icon={<BriefcaseIcon className="w-4 h-4 text-indigo-600" />} label="Poste" value={extraData.jobTitle || "—"} />
              )}
            </div>
          </div>
        )}
      </div>
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
      <label htmlFor={id} className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-slate-400">
        <LockClosedIcon className="w-3 h-3 text-indigo-600" /> {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className={`w-full rounded-xl border px-3.5 py-2.5 pr-10 text-sm text-slate-800 outline-none transition
            focus:border-violet-600 focus:ring-2 focus:ring-violet-100 focus:bg-white
            ${error ? "border-red-300 bg-red-50" : "border-slate-200 bg-slate-50"}`}
        />
        <button type="button" onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
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

function SecuritySection() {
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
      await http.post("/api/employee/me/change-password", { currentPassword, newPassword, confirmPassword });
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
    <div className="p-4 md:p-5 flex flex-col gap-4">
      <div>
        <h2 className="text-base font-bold text-indigo-950">Sécurité & Mot de passe</h2>
        <p className="text-xs text-slate-400 mt-1">Modifiez votre mot de passe de connexion.</p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <PasswordField
          id="sec-current" label="Mot de passe actuel"
          value={currentPassword} show={showCurrent}
          onToggle={() => setShowCurrent((v) => !v)}
          onChange={setCurrentPassword}
          error={fieldErrors.current}
          placeholder="Votre mot de passe actuel"
          autoComplete="current-password"
        />

        <div className="border-t border-slate-100 pt-4 flex flex-col gap-4">
          <PasswordField
            id="sec-new" label="Nouveau mot de passe"
            value={newPassword} show={showNew}
            onToggle={() => setShowNew((v) => !v)}
            onChange={setNewPassword}
            error={fieldErrors.newPwd}
            placeholder="Minimum 8 caractères"
            autoComplete="new-password"
          />

          {newPassword && (
            <div className="flex flex-col gap-1.5">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className={`flex-1 h-1 rounded-full transition-all ${i <= strength.score ? strength.tw : "bg-slate-200"}`} />
                ))}
              </div>
              {strength.label && <span className={`text-xs font-semibold ${strength.color}`}>{strength.label}</span>}
            </div>
          )}

          <PasswordField
            id="sec-confirm" label="Confirmer le nouveau mot de passe"
            value={confirmPassword} show={showConfirm}
            onToggle={() => setShowConfirm((v) => !v)}
            onChange={setConfirmPassword}
            error={fieldErrors.confirm}
            placeholder="Répétez le nouveau mot de passe"
            autoComplete="new-password"
          />
        </div>

        <div className="flex justify-end pt-1">
          <button type="submit" disabled={saving}
            className="flex items-center gap-2 rounded-xl border-none bg-gradient-to-r from-indigo-700 to-violet-700 px-5 py-2.5 text-sm font-bold text-white shadow-md disabled:opacity-70 disabled:cursor-not-allowed transition">
            {saving ? <ArrowPathIcon className="w-4 h-4 animate-spin" /> : <LockClosedIcon className="w-4 h-4" />}
            {saving ? "Modification..." : "Modifier le mot de passe"}
          </button>
        </div>
      </form>

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
  const isFirstCvFlow = !cvFileName && !extractionResult;
  const compact = !isFirstCvFlow;

  return (
    <div className="p-2.5 md:p-3 flex flex-col gap-2">
      <div
        className={`rounded-2xl border border-violet-100 bg-white shadow-sm flex flex-col ${
          compact ? "p-3 min-h-[260px]" : "p-5 min-h-[420px]"
        }`}
      >
        <p className={`${compact ? "mb-2 text-[10px]" : "mb-3 text-xs"} font-bold uppercase tracking-widest text-violet-400`}>
          Extraction des compétences
        </p>

        <div
          className={`flex flex-col items-center rounded-xl border-2 border-dashed p-3 transition-all ${
            dragOver
              ? "scale-[1.01] border-violet-500 bg-violet-50"
              : "border-violet-200 bg-slate-50/50"
          } ${compact ? "min-h-[180px] justify-start" : "min-h-[280px] flex-1 justify-center"}`}
          onDragOver={(e) => { e.preventDefault(); onDragOver(true); }}
          onDragLeave={() => onDragOver(false)}
          onDrop={onCvDrop}
        >
          <div className={`flex items-center justify-center border border-violet-200 bg-gradient-to-br from-violet-100 to-indigo-100 ${compact ? "h-11 w-11 rounded-xl" : "h-14 w-14 rounded-2xl"}`}>
            <SparklesIcon className={`${compact ? "h-5 w-5" : "h-7 w-7"} text-violet-600`} />
          </div>

          <h3 className={`${compact ? "mt-2 text-sm" : "mt-3 text-base"} font-bold tracking-tight text-slate-900`}>
            Importez votre CV
          </h3>
          <p className={`${compact ? "mt-1 text-xs" : "mt-1.5 text-sm"} text-center leading-relaxed text-slate-500`}>
            Glissez-déposez votre CV (PDF ou DOCX) pour analyser vos compétences
          </p>

          {(cvFile || cvFileName) && (
            <div className={`${compact ? "mt-2 gap-1.5 rounded-lg px-2.5 py-1 text-xs" : "mt-3 gap-2 rounded-xl px-3 py-1.5 text-sm"} flex items-center border border-violet-200 bg-violet-50 font-semibold text-violet-700`}>
              <DocumentTextIcon className={`${compact ? "h-3.5 w-3.5" : "h-4 w-4"}`} />
              {cvFile?.name ?? cvFileName}
            </div>
          )}

          <div className={`${compact ? "mt-2.5 gap-2" : "mt-4 gap-2.5"} flex flex-wrap justify-center`}>
            <button
              type="button"
              onClick={() => cvInputRef.current?.click()}
              className={`${compact ? "rounded-lg px-3 py-1.5 text-xs" : "rounded-xl px-4 py-2 text-sm"} border border-violet-200 bg-white font-semibold text-violet-700 transition hover:border-violet-300 hover:bg-violet-50`}
            >
              Choisir un fichier
            </button>
            <button
              type="button"
              onClick={onExtract}
              disabled={!cvFile || extracting}
              className={`${compact ? "gap-1.5 rounded-lg px-4 py-1.5 text-xs" : "gap-2 rounded-xl px-5 py-2 text-sm"} flex items-center bg-gradient-to-r from-violet-600 to-indigo-600 font-semibold text-white shadow-md shadow-violet-200 transition hover:-translate-y-px hover:from-violet-700 hover:to-indigo-700 hover:shadow-violet-300 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50`}
            >
              {extracting ? (
                <>
                  <ArrowPathIcon className={`${compact ? "h-4 w-4" : "h-5 w-5"} animate-spin`} />
                  Extraction en cours…
                </>
              ) : (
                <>
                  <CloudArrowUpIcon className={`${compact ? "h-4 w-4" : "h-5 w-5"}`} />
                  Extraire
                </>
              )}
            </button>
          </div>
          <input ref={cvInputRef} type="file" accept=".pdf,.docx" className="hidden" onChange={onCvSelect} />
        </div>
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
  const SKILLS_PER_PAGE = 4;

  useEffect(() => {
    const maxPage = Math.max(0, Math.ceil(employeeSkills.length / SKILLS_PER_PAGE) - 1);
    if (skillsPage > maxPage) setSkillsPage(maxPage);
  }, [employeeSkills.length, skillsPage]);

  const validatedCount = employeeSkills.filter((s) => s.status === "VALIDATED").length;
  const pendingQuizCount = employeeSkills.filter((s) => s.status === "QUIZ_PENDING" || s.status === "EXTRACTED").length;
  const failedCount = employeeSkills.filter((s) => s.status === "FAILED").length;
  const totalSkillPages = Math.max(1, Math.ceil(employeeSkills.length / SKILLS_PER_PAGE));
  const pagedSkills = employeeSkills.slice(
    skillsPage * SKILLS_PER_PAGE,
    (skillsPage + 1) * SKILLS_PER_PAGE
  );

  return (
    <div className="flex flex-col gap-2">
      {(extractionResult || employeeSkills.length > 0 || pendingUnrecognizedSkills.length > 0) ? (
        <div className="rounded-2xl border border-slate-100 bg-white p-3 shadow-sm">
          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-violet-400">
            Résultat de l'extraction
          </p>

          {employeeSkills.length > 0 && (
            <div className="mb-4 rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50/60 to-white p-3.5">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2.5">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-violet-200 bg-violet-100/70">
                    <BeakerIcon className="h-4 w-4 text-violet-600" />
                  </div>
                  <span className="text-sm font-bold text-violet-900">
                    Compétences extraites ({employeeSkills.length})
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                    Validées: {validatedCount}
                  </span>
                  <span className="inline-flex items-center rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-[11px] font-semibold text-violet-700">
                    Quiz en attente: {pendingQuizCount}
                  </span>
                  <span className="inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-semibold text-rose-700">
                    À repasser: {failedCount}
                  </span>
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                {pagedSkills.map((skill) => {
                  const isValidated = skill.status === "VALIDATED";
                  const statusClass = skill.status === "VALIDATED"
                    ? "border-green-200 bg-green-50 text-green-700"
                    : skill.status === "FAILED"
                      ? "border-rose-200 bg-rose-50 text-rose-700"
                      : "border-violet-200 bg-violet-50 text-violet-700";
                  const statusLabel = skill.status === "VALIDATED"
                    ? "Validée"
                    : skill.status === "FAILED"
                      ? "À repasser"
                      : "Quiz en attente";
                  return (
                    <div
                      key={skill.id}
                      className="group flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm transition-all duration-200 hover:-translate-y-px hover:border-violet-200 hover:shadow-md"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">{skill.skillName}</p>
                        <p className="text-xs text-slate-500">{skill.categoryName} · Niveau {skill.level}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold ${statusClass}`}>
                          {statusLabel}
                        </span>
                        {!isValidated && (
                          <button
                            type="button"
                            onClick={() => toast.info("Quiz bientôt disponible")}
                            className="rounded-xl border border-violet-200 bg-white px-3 py-1.5 text-[10px] font-semibold text-violet-700 shadow-sm transition hover:border-violet-300 hover:bg-violet-50"
                          >
                            Passer quiz
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {totalSkillPages > 1 && (
                <div className="mt-2.5 flex items-center justify-center gap-2">
                  {Array.from({ length: totalSkillPages }).map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSkillsPage(idx)}
                      aria-label={`Aller à la page ${idx + 1}`}
                      className={`h-2.5 w-2.5 rounded-full transition-all ${
                        skillsPage === idx
                          ? "scale-110 bg-violet-600"
                          : "bg-violet-200 hover:bg-violet-300"
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {(pendingUnrecognizedSkills.length > 0 || (extractionResult?.unmatchedSkills.length ?? 0) > 0) && (
            <div className="rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50/60 to-white p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2.5">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-amber-200 bg-amber-100/70">
                    <ArrowPathIcon className="h-4 w-4 text-amber-600" />
                  </div>
                  <span className="text-sm font-bold text-amber-800">
                    En attente de validation
                  </span>
                </div>
                <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
                  {pendingUnrecognizedSkills.length > 0 ? pendingUnrecognizedSkills.length : (extractionResult?.unmatchedSkills.length ?? 0)} compétence(s)
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {(pendingUnrecognizedSkills.length > 0 ? pendingUnrecognizedSkills : (extractionResult?.unmatchedSkills ?? [])).map((skill, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center rounded-full border border-amber-200 bg-white px-3 py-1 text-xs font-medium text-amber-700 shadow-sm"
                  >
                    {skill}
                  </span>
                ))}
              </div>

              <p className="mt-2 text-xs text-slate-500">
                Ces compétences seront examinées par un administrateur et ajoutées au référentiel si validées.
              </p>
            </div>
          )}

          {extractionResult && extractionResult.matchedSkills.length === 0 && extractionResult.unmatchedSkills.length === 0 && employeeSkills.length === 0 && pendingUnrecognizedSkills.length === 0 && (
            <p className="text-sm text-slate-500">Aucune compétence détectée dans le CV.</p>
          )}
        </div>
      ) : null}
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
      <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-slate-400">
        {icon} {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="w-full rounded-xl border border-violet-500 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none ring-2 ring-violet-100 transition focus:border-indigo-600 focus:ring-indigo-100"
      />
    </div>
  );
}

function ExtraField({ icon, label, value, onChange, placeholder, type = "text" }: {
  icon: React.ReactNode; label: string; value: string;
  onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-slate-400">
        {icon} {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-violet-500 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none ring-2 ring-violet-100 transition focus:border-indigo-600 focus:ring-indigo-100"
      />
    </div>
  );
}

function ReadonlyField({ icon, label, value, badge }: {
  icon: React.ReactNode; label: string; value: string; badge?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-slate-400">
        {icon} {label}
      </label>
      <div className={`flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm ${value === "—" ? "text-slate-300" : "text-slate-800 font-medium"}`}>
        <span>{value}</span>
        {badge}
      </div>
    </div>
  );
}
