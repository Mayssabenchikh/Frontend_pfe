import { useState, useRef, useCallback, useEffect } from "react";
import { CameraIcon, ArrowPathIcon, UserIcon, EnvelopeIcon, PhoneIcon, BuildingOffice2Icon, BriefcaseIcon, CalendarDaysIcon, CheckCircleIcon, PencilSquareIcon, ArrowDownTrayIcon, XMarkIcon, EyeIcon, EyeSlashIcon, LockClosedIcon } from "@heroicons/react/24/outline";
import { toast } from "sonner";
import { http } from "../../api/http";
import { ADMIN_API_PATHS } from "./adminApiPaths";
import type { TokenParsed } from "./types";
import { getAvatarColor } from "./utils";

const styles = `
  :root {
    --luxury-primary: #7C3AED;
    --luxury-light-bg: #f8f7ff;
    --luxury-card: #FFFFFF;
    --luxury-input: #FFFFFF;
    --luxury-text: #1E293B;
    --luxury-text-muted: #64748B;
    --luxury-success: #10B981;
    --luxury-error: #EF4444;
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
`;

if (typeof document !== "undefined" && !document.getElementById("admin-profile-styles")) {
  const styleSheet = document.createElement("style");
  styleSheet.id = "admin-profile-styles";
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}

type AdminProfileData = {
  phone: string | null;
  department: string | null;
  jobTitle: string | null;
  hireDate: string | null;
};

type Props = {
  token: TokenParsed | undefined;
  adminKeycloakId: string | undefined;
  initialAvatarUrl?: string | null;
  onAvatarUpdate?: (url: string) => void;
  onProfileUpdate?: (firstName: string, lastName: string) => void;
};

// Note: Admin ne dispose que d'une vue "Informations personnelles"

export function AdminProfile({ token, adminKeycloakId, initialAvatarUrl, onAvatarUpdate, onProfileUpdate }: Props) {
  const firstName = token?.given_name ?? "";
  const lastName = token?.family_name ?? "";
  const email = token?.email ?? "";

  const [editedFirstName, setEditedFirstName] = useState(firstName);
  const [editedLastName, setEditedLastName] = useState(lastName);
  const [isEditing, setIsEditing] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  const [extraData, setExtraData] = useState<AdminProfileData>({ phone: null, department: null, jobTitle: null, hireDate: null });
  const [loadingExtra, setLoadingExtra] = useState(true);

  useEffect(() => {
    setLoadingExtra(true);
    http.get<AdminProfileData>(ADMIN_API_PATHS.ME)
      .then((res) => setExtraData(res.data))
      .catch(() => {})
      .finally(() => setLoadingExtra(false));
  }, []);

  const displayFirst = isEditing ? editedFirstName : (editedFirstName || firstName);
  const displayLast = isEditing ? editedLastName : (editedLastName || lastName);
  const fullName = [displayFirst, displayLast].filter(Boolean).join(" ") || "Administrateur";
  const initials = `${displayFirst[0] ?? ""}${displayLast[0] ?? ""}`.trim().toUpperCase() || "AD";
  const gradient = getAvatarColor(email);

  // Pas de menu (comme employé) côté Admin
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatarUrl ?? token?.picture ?? null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveProfile = useCallback(async () => {
    const fn = editedFirstName.trim();
    const ln = editedLastName.trim();
    if (!fn || fn.length < 2) { toast.error("Le prénom doit contenir au moins 2 caractères."); return; }
    if (!ln || ln.length < 2) { toast.error("Le nom doit contenir au moins 2 caractères."); return; }
    setSavingProfile(true);
    try {
      await http.put(ADMIN_API_PATHS.ME_PROFILE, { firstName: fn, lastName: ln });
      setIsEditing(false);
      onProfileUpdate?.(fn, ln);
      toast.success("Profil mis à jour.");
    } catch {
      toast.error("Erreur lors de la mise à jour du profil.");
    } finally {
      setSavingProfile(false);
    }
  }, [editedFirstName, editedLastName, onProfileUpdate]);

  const handleCancelEdit = useCallback(() => {
    setEditedFirstName(firstName);
    setEditedLastName(lastName);
    setIsEditing(false);
  }, [firstName, lastName]);

  const handleExtraUpdate = useCallback((updated: AdminProfileData) => {
    setExtraData(updated);
  }, []);

  const handleAvatarChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !adminKeycloakId) return;
    if (!file.type.startsWith("image/")) { toast.error("Veuillez sélectionner une image."); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("L'image ne doit pas dépasser 5 Mo."); return; }

    const reader = new FileReader();
    reader.onload = (ev) => setAvatarUrl(ev.target?.result as string);
    reader.readAsDataURL(file);

    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await http.post<{ avatarUrl: string }>(ADMIN_API_PATHS.userAvatar(adminKeycloakId), formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setAvatarUrl(res.data.avatarUrl);
      onAvatarUpdate?.(res.data.avatarUrl);
      toast.success("Photo de profil mise à jour.", { description: "Votre photo sera conservée après rechargement." });
    } catch {
      toast.error("Erreur lors de l'upload de la photo.");
      setAvatarUrl(initialAvatarUrl ?? token?.picture ?? null);
    } finally {
      setUploadingAvatar(false);
    }
  }, [adminKeycloakId, initialAvatarUrl, token?.picture, onAvatarUpdate]);

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
                    Profil Administrateur
                  </p>
                </div>
              </div>
            </div>
            <div className="flex w-fit shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-xs shadow-sm transition-transform duration-200 hover:scale-[1.02]" style={{ background: "rgba(16, 185, 129, 0.08)", borderColor: "var(--luxury-success)" }}>
              <CheckCircleIcon className="h-3 w-3 shrink-0" style={{ color: "var(--luxury-success)" }} />
              Compte actif
            </div>
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-hidden luxury-animate-in" style={{ animationDelay: "0.1s" }}>
          <div className="profile-saas-card flex h-full min-h-0 flex-col overflow-hidden rounded-2xl">
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pt-3 px-3 pb-2 md:pt-4 md:px-4 md:pb-3">
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
          </div>
          </div>
        </main>
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
  extraData: AdminProfileData;
  loadingExtra: boolean;
  onExtraUpdate: (data: AdminProfileData) => void;
}) {
  const [editPhone, setEditPhone] = useState(extraData.phone ?? "");
  const [editDept, setEditDept] = useState(extraData.department ?? "");
  const [editJob, setEditJob] = useState(extraData.jobTitle ?? "");
  const [editHire, setEditHire] = useState(extraData.hireDate ?? "");
  const [isEditingExtra, setIsEditingExtra] = useState(false);

  useEffect(() => {
    if (!isEditingExtra) {
      setEditPhone(extraData.phone ?? "");
      setEditDept(extraData.department ?? "");
      setEditJob(extraData.jobTitle ?? "");
      setEditHire(extraData.hireDate ?? "");
    }
  }, [extraData, isEditingExtra]);

  const handleSaveExtra = useCallback(async () => {
    try {
      const res = await http.put<AdminProfileData>(ADMIN_API_PATHS.ME_EXTRA, {
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
    }
  }, [editPhone, editDept, editJob, editHire, onExtraUpdate]);

  const handleSaveAll = async () => {
    await onSave();
    if (loadingExtra) return;
    const next: AdminProfileData = {
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
    if (!unchanged) await handleSaveExtra();
  };

  return (
    <div className="flex flex-col gap-4 lg:gap-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="mb-0.5 text-lg font-bold" style={{ color: "#1e293b" }}>Informations personnelles</h2>
          <p className="text-sm" style={{ color: "var(--luxury-text-muted)" }}>
            {isEditing ? "Modifiez votre profil et enregistrez les modifications." : "Gérez vos informations de base."}
          </p>
        </div>
        {!isEditing ? (
          <button type="button" onClick={onEdit}
            style={{ background: "rgba(124, 58, 237, 0.08)", border: "1.5px solid var(--luxury-primary)" }}
            className="flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-200 hover:shadow-md active:scale-[0.98]">
            <PencilSquareIcon className="h-4 w-4" /> Modifier
          </button>
        ) : (
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={onCancel} disabled={saving}
              style={{ border: "1.5px solid rgba(148, 163, 184, 0.25)" }}
              className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-200 hover:bg-slate-50 active:scale-[0.98] disabled:opacity-50">
              <XMarkIcon className="h-4 w-4" /> Annuler
            </button>
            <button type="button" onClick={() => { void handleSaveAll(); }} disabled={saving}
              style={{ background: "var(--luxury-primary)" }}
              className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold text-white transition-all duration-200 hover:shadow-lg active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50">
              {saving ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : <ArrowDownTrayIcon className="h-4 w-4" />}
              {saving ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>
        )}
      </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-5 lg:items-start">
        <div className="profile-saas-card rounded-2xl p-4 md:p-5">
          <div className="mb-3 border-b border-slate-200/80 pb-3">
            <h3 className="text-lg font-bold" style={{ color: "#1e293b" }}>Identité & contact</h3>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
              badge={<span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold shadow-sm" style={{ background: "rgba(16, 185, 129, 0.08)", color: "var(--luxury-success)", border: "1px solid rgba(16, 185, 129, 0.3)" }}><CheckCircleIcon className="h-3 w-3" /> Vérifié</span>}
            />
          </div>
        </div>

        <div className="profile-saas-card rounded-2xl p-4 md:p-5">
          <div className="mb-3 border-b border-slate-200/80 pb-3">
            <h3 className="text-lg font-bold" style={{ color: "#1e293b" }}>Informations professionnelles</h3>
          </div>
          {loadingExtra ? (
            <div className="flex justify-center py-10">
              <ArrowPathIcon className="h-5 w-5 animate-spin" style={{ color: "var(--luxury-primary)" }} />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {isEditingExtra ? <ExtraField icon={<PhoneIcon className="h-4 w-4" />} label="Téléphone" value={editPhone} onChange={setEditPhone} placeholder="+216 20 123 456" type="tel" /> : <ReadonlyField icon={<PhoneIcon className="h-4 w-4" />} label="Téléphone" value={extraData.phone || "—"} />}
                {isEditingExtra ? <ExtraField icon={<CalendarDaysIcon className="h-4 w-4" />} label="Date d'embauche" value={editHire} onChange={setEditHire} type="date" /> : <ReadonlyField icon={<CalendarDaysIcon className="h-4 w-4" />} label="Date d'embauche" value={extraData.hireDate || "—"} />}
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {isEditingExtra ? <ExtraField icon={<BuildingOffice2Icon className="h-4 w-4" />} label="Département" value={editDept} onChange={setEditDept} placeholder="ex: Ingénierie" /> : <ReadonlyField icon={<BuildingOffice2Icon className="h-4 w-4" />} label="Département" value={extraData.department || "—"} />}
                {isEditingExtra ? <ExtraField icon={<BriefcaseIcon className="h-4 w-4" />} label="Poste" value={editJob} onChange={setEditJob} placeholder="ex: Administrateur Système" /> : <ReadonlyField icon={<BriefcaseIcon className="h-4 w-4" />} label="Poste" value={extraData.jobTitle || "—"} />}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="profile-saas-card rounded-2xl p-4 md:p-5">
        <div className="mb-3 border-b border-slate-200/80 pb-3">
          <h3 className="text-lg font-bold" style={{ color: "#1e293b" }}>Sécurité & Mot de passe</h3>
          <p className="mt-1 text-sm" style={{ color: "var(--luxury-text-muted)" }}>Modifiez votre mot de passe de connexion.</p>
        </div>
        <SecuritySection embedded />
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
      await http.post(ADMIN_API_PATHS.ME_CHANGE_PASSWORD, { currentPassword, newPassword, confirmPassword });
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
        className="w-full rounded-xl px-3 py-2.5 text-xs transition-all duration-300"
        style={{
          background: "var(--luxury-input)",
          border: "1px solid rgba(148, 163, 184, 0.2)",
          color: "var(--luxury-text)",
          outline: "none",
        }}
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
      <label className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-widest" style={{ color: "var(--luxury-text-muted)" }}>
        <span style={{ color: "var(--luxury-primary)" }}>{icon}</span> {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl px-3 py-2.5 text-xs transition-all duration-300"
        style={{
          background: "var(--luxury-input)",
          border: "1px solid rgba(148, 163, 184, 0.2)",
          color: "var(--luxury-text)",
          outline: "none",
        }}
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
        className="flex items-center justify-between rounded-xl px-3 py-2.5 text-xs transition-all duration-200 hover:border-violet-200/70 hover:shadow-sm"
        style={{
          background: "var(--luxury-input)",
          border: "1px solid rgba(148, 163, 184, 0.2)",
          color: value === "—" ? "var(--luxury-text-muted)" : "var(--luxury-text)",
        }}
      >
        <span>{value}</span>
        {badge}
      </div>
    </div>
  );
}
