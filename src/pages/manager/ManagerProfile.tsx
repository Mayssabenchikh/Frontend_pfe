import { useEffect, useState, useCallback } from "react";
import { useKeycloak } from "@react-keycloak/web";
import { toast } from "sonner";
import { http } from "../../api/http";
import {
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  BuildingOffice2Icon,
  BriefcaseIcon,
  CalendarDaysIcon,
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
  ArrowPathIcon,
  ArrowDownTrayIcon,
  XMarkIcon,
  PencilSquareIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";

type ManagerProfileDto = {
  keycloakId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  department: string | null;
  jobTitle: string | null;
  hireDate: string | null;
  avatarUrl: string | null;
};

/** Reusable labelled field row */
function FieldRow({
  icon,
  label,
  value,
  editing,
  editNode,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  editing: boolean;
  editNode?: React.ReactNode;
}) {
  return (
    <div className="group flex items-start gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-slate-50/80">
      <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-500">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="mb-0.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
        {editing && editNode ? (
          editNode
        ) : (
          <p className="text-sm font-medium text-slate-800">{value || <span className="text-slate-300">—</span>}</p>
        )}
      </div>
    </div>
  );
}

/** Password input with toggle */
function PwdInput({
  label,
  value,
  onChange,
  show,
  onToggle,
  error,
  placeholder,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggle: () => void;
  error?: string;
  placeholder?: string;
  autoComplete?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className={[
            "w-full rounded-xl border px-3.5 py-2.5 pr-10 text-sm text-slate-800 outline-none transition",
            "focus:border-violet-500 focus:bg-white focus:ring-2 focus:ring-violet-100",
            error ? "border-red-300 bg-red-50/60" : "border-slate-200 bg-slate-50",
          ].join(" ")}
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
        >
          {show ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
        </button>
      </div>
      {error && (
        <p className="flex items-center gap-1 text-xs text-red-500">
          <XMarkIcon className="h-3 w-3" />
          {error}
        </p>
      )}
    </div>
  );
}

/** Inline edit input */
function EditInput({
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-900 shadow-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-100"
    />
  );
}

export function ManagerProfile() {
  const { keycloak } = useKeycloak();
  const token = keycloak.tokenParsed as
    | { given_name?: string; family_name?: string; email?: string; picture?: string }
    | undefined;

  const [profile, setProfile] = useState<ManagerProfileDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingInfo, setSavingInfo] = useState(false);
  const [editingInfo, setEditingInfo] = useState(false);

  const [editedFirstName, setEditedFirstName] = useState("");
  const [editedLastName, setEditedLastName] = useState("");
  const [editedPhone, setEditedPhone] = useState("");
  const [editedDepartment, setEditedDepartment] = useState("");
  const [editedJobTitle, setEditedJobTitle] = useState("");
  const [editedHireDate, setEditedHireDate] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [pwdErrors, setPwdErrors] = useState<{ current?: string; newPwd?: string; confirm?: string }>({});

  useEffect(() => {
    setLoading(true);
    http
      .get<ManagerProfileDto>("/api/manager/me")
      .then((res) => setProfile(res.data ?? null))
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, []);

  const firstName = profile?.firstName || token?.given_name || "";
  const lastName = profile?.lastName || token?.family_name || "";
  const email = profile?.email || token?.email || "";
  const fullName = [firstName, lastName].filter(Boolean).join(" ") || "Manager";
  const avatarUrl = profile?.avatarUrl || token?.picture || null;
  const initials =
    firstName && lastName
      ? `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase()
      : (email[0] ?? "M").toUpperCase();

  useEffect(() => {
    if (!editingInfo && profile) {
      setEditedFirstName(profile.firstName || token?.given_name || "");
      setEditedLastName(profile.lastName || token?.family_name || "");
      setEditedPhone(profile.phone ?? "");
      setEditedDepartment(profile.department ?? "");
      setEditedJobTitle(profile.jobTitle ?? "");
      setEditedHireDate(profile.hireDate ?? "");
    }
  }, [profile, token?.family_name, token?.given_name, editingInfo]);

  const handleSaveInfo = useCallback(async () => {
    const fn = editedFirstName.trim();
    const ln = editedLastName.trim();
    if (!fn || fn.length < 2) { toast.error("Le prénom doit contenir au moins 2 caractères."); return; }
    if (!ln || ln.length < 2) { toast.error("Le nom doit contenir au moins 2 caractères."); return; }
    setSavingInfo(true);
    try {
      const extraRes = await http.put<ManagerProfileDto>("/api/manager/me/extra", {
        phone: editedPhone.trim() || null,
        department: editedDepartment.trim() || null,
        jobTitle: editedJobTitle.trim() || null,
        hireDate: editedHireDate || null,
      });
      await http.put("/api/manager/me/profile", { firstName: fn, lastName: ln });
      setProfile(extraRes.data);
      toast.success("Profil mis à jour.");
      setEditingInfo(false);
    } catch {
      toast.error("Erreur lors de la mise à jour du profil.");
    } finally {
      setSavingInfo(false);
    }
  }, [editedFirstName, editedLastName, editedPhone, editedDepartment, editedJobTitle, editedHireDate]);

  const handleCancelInfo = () => {
    setEditingInfo(false);
    if (profile) {
      setEditedFirstName(profile.firstName || "");
      setEditedLastName(profile.lastName || "");
      setEditedPhone(profile.phone ?? "");
      setEditedDepartment(profile.department ?? "");
      setEditedJobTitle(profile.jobTitle ?? "");
      setEditedHireDate(profile.hireDate ?? "");
    }
  };

  const handlePasswordSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const errs: typeof pwdErrors = {};
      if (!currentPassword) errs.current = "Requis.";
      if (!newPassword || newPassword.length < 8) errs.newPwd = "Minimum 8 caractères.";
      if (newPassword === currentPassword) errs.newPwd = "Le nouveau mot de passe doit être différent de l'ancien.";
      if (!confirmPassword) errs.confirm = "Requis.";
      else if (newPassword !== confirmPassword) errs.confirm = "Les mots de passe ne correspondent pas.";
      setPwdErrors(errs);
      if (Object.keys(errs).length > 0) return;
      setSavingPassword(true);
      try {
        await http.post("/api/manager/me/change-password", { currentPassword, newPassword, confirmPassword });
        setCurrentPassword(""); setNewPassword(""); setConfirmPassword(""); setPwdErrors({});
        toast.success("Mot de passe modifié avec succès.");
      } catch (err: unknown) {
        const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? "Erreur lors du changement de mot de passe.";
        if (msg.toLowerCase().includes("incorrect")) setPwdErrors({ current: "Mot de passe actuel incorrect." });
        else toast.error(msg);
      } finally {
        setSavingPassword(false);
      }
    },
    [currentPassword, newPassword, confirmPassword, pwdErrors]
  );

  return (
    <div className="min-h-full w-full bg-slate-50/50 px-4 pb-12 pt-6 md:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-5">

        {/* ── HERO HEADER ── */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700 shadow-xl shadow-indigo-200/60">
          {/* Decorative circles */}
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/5" />
          <div className="pointer-events-none absolute -bottom-8 right-24 h-36 w-36 rounded-full bg-violet-500/20" />
          <div className="pointer-events-none absolute left-1/2 top-0 h-px w-3/4 -translate-x-1/2 bg-gradient-to-r from-transparent via-white/20 to-transparent" />

          <div className="relative flex flex-col gap-4 px-6 py-6 md:flex-row md:items-center md:justify-between">
            {/* Avatar + name */}
            <div className="flex items-center gap-4">
              <div className="relative flex-shrink-0">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={fullName}
                    className="h-16 w-16 rounded-2xl border-2 border-white/30 object-cover shadow-lg"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 text-xl font-bold text-white shadow-lg backdrop-blur-sm">
                    {initials}
                  </div>
                )}
                {/* Online dot */}
                <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-indigo-700 bg-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-white" />
                </span>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-indigo-200/70">
                  Espace Manager
                </p>
                <h1 className="text-xl font-bold leading-tight text-white">{fullName}</h1>
                <div className="mt-1 flex items-center gap-1.5">
                  <EnvelopeIcon className="h-3 w-3 text-indigo-300" />
                  <span className="text-xs text-indigo-200/80">{email}</span>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2">
              {!editingInfo ? (
                <button
                  type="button"
                  onClick={() => setEditingInfo(true)}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-4 py-2 text-xs font-semibold text-white backdrop-blur-sm transition hover:bg-white/20 active:scale-95"
                >
                  <PencilSquareIcon className="h-3.5 w-3.5" />
                  Modifier le profil
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleCancelInfo}
                    disabled={savingInfo}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-xs font-semibold text-white/80 transition hover:bg-white/10"
                  >
                    <XMarkIcon className="h-3.5 w-3.5" />
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveInfo}
                    disabled={savingInfo}
                    className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-xs font-bold text-indigo-700 shadow-md transition hover:bg-indigo-50 disabled:opacity-70 active:scale-95"
                  >
                    {savingInfo ? (
                      <ArrowPathIcon className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <CheckIcon className="h-3.5 w-3.5" />
                    )}
                    {savingInfo ? "Enregistrement…" : "Enregistrer"}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Edit mode banner */}
          {editingInfo && (
            <div className="border-t border-white/10 bg-white/5 px-6 py-2">
              <p className="text-[11px] text-indigo-200">
                <span className="font-semibold text-white">Mode édition actif —</span>{" "}
                modifiez vos informations ci-dessous puis cliquez sur Enregistrer.
              </p>
            </div>
          )}
        </div>

        {/* ── TWO COLUMN CARDS ── */}
        <div className="grid gap-4 md:grid-cols-2">

          {/* Identité */}
          <div className={[
            "rounded-2xl border bg-white shadow-sm transition-all",
            editingInfo ? "border-violet-200 shadow-violet-100/60" : "border-slate-100",
          ].join(" ")}>
            <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-100">
                <UserIcon className="h-3.5 w-3.5 text-indigo-600" />
              </div>
              <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Informations générales
              </h2>
            </div>

            <div className="px-2 py-2">
              <div className="grid grid-cols-2 gap-x-2">
                {/* Prénom */}
                <FieldRow
                  icon={<UserIcon className="h-3.5 w-3.5" />}
                  label="Prénom"
                  value={firstName}
                  editing={editingInfo}
                  editNode={
                    <EditInput
                      value={editedFirstName}
                      onChange={setEditedFirstName}
                      placeholder="Prénom"
                    />
                  }
                />
                {/* Nom */}
                <FieldRow
                  icon={<UserIcon className="h-3.5 w-3.5" />}
                  label="Nom"
                  value={lastName}
                  editing={editingInfo}
                  editNode={
                    <EditInput
                      value={editedLastName}
                      onChange={setEditedLastName}
                      placeholder="Nom de famille"
                    />
                  }
                />
              </div>

              {/* Divider */}
              <div className="mx-3 my-1 border-t border-dashed border-slate-100" />

              <FieldRow
                icon={<EnvelopeIcon className="h-3.5 w-3.5" />}
                label="Adresse email"
                value={email}
                editing={false}
              />

              <FieldRow
                icon={<PhoneIcon className="h-3.5 w-3.5" />}
                label="Téléphone"
                value={profile?.phone}
                editing={editingInfo}
                editNode={
                  <EditInput
                    value={editedPhone}
                    onChange={setEditedPhone}
                    placeholder="+216 20 123 456"
                    type="tel"
                  />
                }
              />
            </div>
          </div>

          {/* Infos professionnelles */}
          <div className={[
            "rounded-2xl border bg-white shadow-sm transition-all",
            editingInfo ? "border-violet-200 shadow-violet-100/60" : "border-slate-100",
          ].join(" ")}>
            <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-100">
                <BriefcaseIcon className="h-3.5 w-3.5 text-indigo-600" />
              </div>
              <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Informations professionnelles
              </h2>
            </div>

            <div className="px-2 py-2">
              {loading ? (
                <div className="flex flex-col gap-3 p-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-8 animate-pulse rounded-xl bg-slate-100" />
                  ))}
                </div>
              ) : (
                <>
                  <FieldRow
                    icon={<BuildingOffice2Icon className="h-3.5 w-3.5" />}
                    label="Département"
                    value={profile?.department}
                    editing={editingInfo}
                    editNode={
                      <EditInput
                        value={editedDepartment}
                        onChange={setEditedDepartment}
                        placeholder="ex: Ingénierie"
                      />
                    }
                  />
                  <FieldRow
                    icon={<BriefcaseIcon className="h-3.5 w-3.5" />}
                    label="Poste"
                    value={profile?.jobTitle}
                    editing={editingInfo}
                    editNode={
                      <EditInput
                        value={editedJobTitle}
                        onChange={setEditedJobTitle}
                        placeholder="ex: Manager de projet"
                      />
                    }
                  />
                  <div className="mx-3 my-1 border-t border-dashed border-slate-100" />
                  <FieldRow
                    icon={<CalendarDaysIcon className="h-3.5 w-3.5" />}
                    label="Date d'embauche"
                    value={
                      profile?.hireDate
                        ? new Date(profile.hireDate).toLocaleDateString("fr-FR", {
                            year: "numeric",
                            month: "long",
                            day: "2-digit",
                          })
                        : null
                    }
                    editing={editingInfo}
                    editNode={
                      <EditInput
                        value={editedHireDate || ""}
                        onChange={setEditedHireDate}
                        type="date"
                      />
                    }
                  />
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── SECURITY CARD ── */}
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
          {/* Section header */}
          <div className="flex items-center gap-3 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-5 py-3.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-gradient-to-br from-amber-100 to-orange-100">
              <LockClosedIcon className="h-4 w-4 text-amber-600" />
            </div>
            <div>
              <h2 className="text-xs font-bold uppercase tracking-widest text-slate-600">
                Sécurité & Mot de passe
              </h2>
              <p className="text-[11px] text-slate-400">Modifiez votre mot de passe de connexion.</p>
            </div>
            {/* Shield badge */}
            <div className="ml-auto hidden sm:flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span className="text-[10px] font-semibold text-emerald-600">Compte sécurisé</span>
            </div>
          </div>

          <form onSubmit={handlePasswordSubmit} noValidate className="p-5">
            <div className="grid gap-5 md:grid-cols-[1fr,2fr]">
              {/* Left: current password */}
              <div className="space-y-1">
                <p className="mb-3 text-[11px] text-slate-400 leading-relaxed">
                  Pour modifier votre mot de passe, saisissez d'abord votre mot de passe actuel pour confirmer votre identité.
                </p>
                <PwdInput
                  label="Mot de passe actuel"
                  value={currentPassword}
                  onChange={setCurrentPassword}
                  show={showCurrent}
                  onToggle={() => setShowCurrent((v) => !v)}
                  error={pwdErrors.current}
                  placeholder="Votre mot de passe actuel"
                  autoComplete="current-password"
                />
              </div>

              {/* Right: new + confirm */}
              <div className="space-y-3">
                <PwdInput
                  label="Nouveau mot de passe"
                  value={newPassword}
                  onChange={setNewPassword}
                  show={showNew}
                  onToggle={() => setShowNew((v) => !v)}
                  error={pwdErrors.newPwd}
                  placeholder="Minimum 8 caractères"
                  autoComplete="new-password"
                />
                <PwdInput
                  label="Confirmer le nouveau mot de passe"
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  show={showConfirm}
                  onToggle={() => setShowConfirm((v) => !v)}
                  error={pwdErrors.confirm}
                  placeholder="Répétez le nouveau mot de passe"
                  autoComplete="new-password"
                />

                {/* Strength hint dots */}
                {newPassword.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-slate-400">Force :</span>
                    {[...Array(4)].map((_, i) => {
                      const strength =
                        newPassword.length >= 12
                          ? 4
                          : newPassword.length >= 10
                          ? 3
                          : newPassword.length >= 8
                          ? 2
                          : 1;
                      const colors = ["bg-red-400", "bg-orange-400", "bg-yellow-400", "bg-emerald-400"];
                      return (
                        <span
                          key={i}
                          className={[
                            "h-1.5 w-8 rounded-full transition-all duration-300",
                            i < strength ? colors[strength - 1] : "bg-slate-200",
                          ].join(" ")}
                        />
                      );
                    })}
                  </div>
                )}

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={savingPassword}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-700 to-violet-700 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-200/50 transition hover:shadow-lg hover:shadow-indigo-200/70 disabled:cursor-not-allowed disabled:opacity-70 active:scale-95"
                  >
                    {savingPassword ? (
                      <ArrowPathIcon className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <ArrowDownTrayIcon className="h-3.5 w-3.5" />
                    )}
                    {savingPassword ? "Enregistrement…" : "Enregistrer le mot de passe"}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}