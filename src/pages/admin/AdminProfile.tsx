import { useState, useRef, useCallback, useEffect } from "react";
import { CameraIcon, ArrowPathIcon, UserIcon, EnvelopeIcon, PhoneIcon, BuildingOffice2Icon, BriefcaseIcon, CalendarDaysIcon, ShieldCheckIcon, CheckCircleIcon, PencilSquareIcon, ArrowDownTrayIcon, XMarkIcon, EyeIcon, EyeSlashIcon, LockClosedIcon } from "@heroicons/react/24/outline";
import { toast } from "sonner";
import { http } from "../../api/http";
import type { TokenParsed } from "./types";
import { getAvatarColor } from "./utils";

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

type Section = "personal" | "security";

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
    http.get<AdminProfileData>("/api/admin/me")
      .then((res) => setExtraData(res.data))
      .catch(() => {})
      .finally(() => setLoadingExtra(false));
  }, []);

  const displayFirst = isEditing ? editedFirstName : (editedFirstName || firstName);
  const displayLast = isEditing ? editedLastName : (editedLastName || lastName);
  const fullName = [displayFirst, displayLast].filter(Boolean).join(" ") || "Administrateur";
  const initials = `${displayFirst[0] ?? ""}${displayLast[0] ?? ""}`.trim().toUpperCase() || "AD";
  const gradient = getAvatarColor(email);

  const [section, setSection] = useState<Section>("personal");
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
      await http.put("/api/admin/me/profile", { firstName: fn, lastName: ln });
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
      const res = await http.post<{ avatarUrl: string }>(`/api/admin/users/${adminKeycloakId}/avatar`, formData, {
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

  const SECTIONS: { id: Section; label: string; icon: React.ReactNode }[] = [
{ id: "personal", label: "Informations personnelles", icon: <UserIcon className="w-4 h-4" /> },
  { id: "security", label: "Sécurité & Mot de passe", icon: <ShieldCheckIcon className="w-4 h-4" /> },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8">
      <div className="flex flex-col lg:flex-row gap-6 max-w-5xl mx-auto">

        {/* Left panel */}
        <div className="lg:w-64 shrink-0 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-3 px-6 pt-8 pb-6 bg-gradient-to-b from-violet-50 to-white border-b border-slate-100">
            <div className="relative">
              {avatarUrl ? (
                <img src={avatarUrl} alt={fullName} className="w-22 h-22 rounded-full object-cover border-4 border-violet-100 shadow-lg" style={{ width: 88, height: 88 }} />
              ) : (
                <div
                  className="w-22 h-22 rounded-full flex items-center justify-center text-3xl font-bold text-white border-4 border-violet-100 shadow-lg"
                  style={{ width: 88, height: 88, background: `linear-gradient(135deg,${gradient[0]},${gradient[1]})` }}
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
              <p className="text-xs text-slate-400 mt-0.5">Administrateur</p>
            </div>
            <div className="flex items-center gap-1.5 bg-green-50 border border-green-200 rounded-full px-3 py-1">
              <CheckCircleIcon className="w-3 h-3 text-green-600" />
              <span className="text-xs font-semibold text-green-600">Compte actif</span>
            </div>
          </div>

          {/* Nav */}
          <nav className="p-3 flex flex-col gap-1">
            {SECTIONS.map((s) => {
              const active = section === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSection(s.id)}
                  className={`relative flex items-center gap-2.5 w-full rounded-xl px-3.5 py-2.5 text-sm font-medium text-left transition-all
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
  extraData: AdminProfileData;
  loadingExtra: boolean;
  onExtraUpdate: (data: AdminProfileData) => void;
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
      const res = await http.put<AdminProfileData>("/api/admin/me/extra", {
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
    <div className="p-6 md:p-8 flex flex-col gap-6">
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
      <div className="border-t border-slate-100 pt-5">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {isEditingExtra ? (
                <ExtraField icon={<BuildingOffice2Icon className="w-4 h-4 text-indigo-600" />} label="Département" value={editDept} onChange={setEditDept} placeholder="ex: Ingénierie" />
              ) : (
                <ReadonlyField icon={<BuildingOffice2Icon className="w-4 h-4 text-indigo-600" />} label="Département" value={extraData.department || "—"} />
              )}
              {isEditingExtra ? (
                <ExtraField icon={<BriefcaseIcon className="w-4 h-4 text-indigo-600" />} label="Poste" value={editJob} onChange={setEditJob} placeholder="ex: Administrateur Système" />
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
      await http.post("/api/admin/me/change-password", { currentPassword, newPassword, confirmPassword });
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
    <div className="p-6 md:p-8 flex flex-col gap-6">
      <div>
        <h2 className="text-base font-bold text-indigo-950">Sécurité & Mot de passe</h2>
        <p className="text-xs text-slate-400 mt-1">Modifiez votre mot de passe de connexion.</p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        <PasswordField
          id="sec-current" label="Mot de passe actuel"
          value={currentPassword} show={showCurrent}
          onToggle={() => setShowCurrent((v) => !v)}
          onChange={setCurrentPassword}
          error={fieldErrors.current}
          placeholder="Votre mot de passe actuel"
          autoComplete="current-password"
        />

        <div className="border-t border-slate-100 pt-5 flex flex-col gap-5">
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

      <div className="flex items-start gap-3 rounded-xl bg-green-50 border border-green-200 p-4">
        <ShieldCheckIcon className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-semibold text-green-700">Conseils de sécurité</p>
          <p className="text-xs text-green-600 mt-0.5">Utilisez au moins 8 caractères avec des majuscules, chiffres et symboles. Ne réutilisez pas d'anciens mots de passe.</p>
        </div>
      </div>
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
