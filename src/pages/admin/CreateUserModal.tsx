import { useState, useCallback, useRef } from "react";
import type { AdminRole } from "./types";
import { ROLE_OPTIONS, MESSAGES } from "./constants";
import { XMarkIcon, ExclamationCircleIcon, CameraIcon, UserCircleIcon, ArrowPathIcon } from "../../icons/heroicons/outline";
import { getAvatarColor } from "./utils";
import { toast } from "sonner";

type Props = {
  open: boolean; onClose: () => void;
  email: string; firstName: string; lastName: string; role: AdminRole;
  department: string; jobTitle: string; phone: string; hireDate: string;
  onEmailChange: (v: string) => void; onFirstNameChange: (v: string) => void;
  onLastNameChange: (v: string) => void; onRoleChange: (v: AdminRole) => void;
  onDepartmentChange: (v: string) => void; onJobTitleChange: (v: string) => void;
  onPhoneChange: (v: string) => void; onHireDateChange: (v: string) => void;
  loading: boolean;
  onSubmit: (e: React.FormEvent, avatarFile: File | null) => void;
  onResetAvatar?: () => void;
};

type FieldErrors = Partial<Record<"email" | "firstName" | "lastName" | "phone" | "hireDate" | "department" | "jobTitle", string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[+\d][\d\s\-().]{6,19}$/;
const NAME_RE = /^[\p{L}\s'-]{2,60}$/u;

function validate(fields: {
  email: string; firstName: string; lastName: string;
  phone: string; hireDate: string; department: string; jobTitle: string;
}): FieldErrors {
  const errors: FieldErrors = {};
  if (!fields.email.trim()) errors.email = "L'email est requis.";
  else if (!EMAIL_RE.test(fields.email.trim())) errors.email = "Format d'email invalide.";
  if (!fields.firstName.trim()) errors.firstName = "Le prénom est requis.";
  else if (!NAME_RE.test(fields.firstName.trim())) errors.firstName = "Prénom invalide (min 2 lettres).";
  if (!fields.lastName.trim()) errors.lastName = "Le nom est requis.";
  else if (!NAME_RE.test(fields.lastName.trim())) errors.lastName = "Nom invalide (min 2 lettres).";
  if (fields.phone.trim() && !PHONE_RE.test(fields.phone.trim()))
    errors.phone = "Format invalide (ex: +216 20 123 456).";
  if (fields.hireDate) {
    const d = new Date(fields.hireDate);
    if (isNaN(d.getTime())) errors.hireDate = "Date invalide.";
    else if (d > new Date()) errors.hireDate = "La date ne peut pas être dans le futur.";
  }
  if (fields.department.trim().length > 100) errors.department = "Max 100 caractères.";
  if (fields.jobTitle.trim().length > 100) errors.jobTitle = "Max 100 caractères.";
  return errors;
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <div className="flex items-center gap-1 mt-1">
      <ExclamationCircleIcon className="w-3 h-3 text-red-500 shrink-0" />
      <span className="text-xs text-red-500">{msg}</span>
    </div>
  );
}

function FormInput({ id, type = "text", value, onChange, onBlur, onFocus, placeholder, hasError }: {
  id: string; type?: string; value: string;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
  onBlur: React.FocusEventHandler<HTMLInputElement>;
  onFocus: React.FocusEventHandler<HTMLInputElement>;
  placeholder?: string; hasError: boolean;
}) {
  return (
    <input
      id={id} type={type} value={value}
      onChange={onChange} onBlur={onBlur} onFocus={onFocus}
      placeholder={placeholder}
      className={`w-full rounded-xl border px-3.5 py-2.5 text-sm text-slate-800 outline-none transition
        focus:border-violet-600 focus:ring-2 focus:ring-violet-100 focus:bg-white
        ${hasError ? "border-red-300 bg-red-50" : "border-slate-200 bg-slate-50"}`}
    />
  );
}

function FormLabel({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-1.5">
      {children}
    </label>
  );
}

export function CreateUserModal({
  open, onClose, email, firstName, lastName, role,
  department, jobTitle, phone, hireDate,
  onEmailChange, onFirstNameChange, onLastNameChange, onRoleChange,
  onDepartmentChange, onJobTitleChange, onPhoneChange, onHireDateChange,
  loading, onSubmit,
}: Props) {
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Set<string>>(new Set());
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Veuillez sélectionner une image."); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("L'image ne doit pas dépasser 5 Mo."); return; }
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  const removeAvatar = useCallback(() => {
    setAvatarFile(null);
    setAvatarPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const touch = useCallback((field: string) => setTouched((p) => new Set(p).add(field)), []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate({ email, firstName, lastName, phone, hireDate, department, jobTitle });
    setErrors(errs);
    setTouched(new Set(["email", "firstName", "lastName", "phone", "hireDate", "department", "jobTitle"]));
    if (Object.keys(errs).length > 0) return;
    onSubmit(e, avatarFile);
  };

  const handleClose = () => { removeAvatar(); onClose(); };

  const revalidate = useCallback((field: keyof FieldErrors, value: string) => {
    if (!touched.has(field)) return;
    const errs = validate({
      email: field === "email" ? value : email,
      firstName: field === "firstName" ? value : firstName,
      lastName: field === "lastName" ? value : lastName,
      phone: field === "phone" ? value : phone,
      hireDate: field === "hireDate" ? value : hireDate,
      department: field === "department" ? value : department,
      jobTitle: field === "jobTitle" ? value : jobTitle,
    });
    setErrors((prev) => ({ ...prev, [field]: errs[field] }));
  }, [touched, email, firstName, lastName, phone, hireDate, department, jobTitle]);

  if (!open) return null;

  const hasErr = (f: keyof FieldErrors) => !!errors[f];
  const errMsg = (f: keyof FieldErrors) => errors[f];
  const initials = `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.trim().toUpperCase() || "?";
  const gradient = getAvatarColor(email || "new");

  return (
    <div
      onClick={handleClose}
      className="app-modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4"
      role="dialog" aria-modal="true"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg max-h-[min(92dvh,900px)] overflow-y-auto rounded-2xl border border-slate-100 bg-white shadow-2xl animate-[modalIn_0.2s_cubic-bezier(0.16,1,0.3,1)_both]"
      >
        <style>{`@keyframes modalIn{from{opacity:0;transform:scale(0.96) translateY(8px)}to{opacity:1;transform:scale(1) translateY(0)}}`}</style>

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4 sm:px-6 sm:py-5">
          <div>
            <h2 className="text-base font-bold text-indigo-950">Nouvel utilisateur</h2>
            <p className="text-xs text-slate-400 mt-0.5">Remplissez les informations ci-dessous</p>
          </div>
          <button onClick={handleClose} className="w-8 h-8 rounded-full border border-slate-200 bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-400 transition">
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4 p-4 sm:p-6">

          {/* Avatar picker */}
          <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
            <div className="relative shrink-0">
              {avatarPreview ? (
                <img src={avatarPreview} alt="avatar" className="h-16 w-16 rounded-full object-cover border-[3px] border-violet-100 shadow-md" />
              ) : (firstName || lastName) ? (
                <div className="flex h-16 w-16 items-center justify-center rounded-full border-[3px] border-violet-100 text-2xl font-bold text-white shadow-md"
                  style={{ background: `linear-gradient(135deg,${gradient[0]},${gradient[1]})` }}>
                  {initials}
                </div>
              ) : (
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center border-2 border-slate-200">
                  <UserCircleIcon className="w-8 h-8 text-slate-300" />
                </div>
              )}
              <button type="button" onClick={() => fileInputRef.current?.click()} title="Choisir une photo"
                className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-gradient-to-br from-indigo-700 to-violet-700 border-2 border-white flex items-center justify-center text-white cursor-pointer">
                <CameraIcon className="w-3 h-3" />
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-800">Photo de profil</p>
              <p className="text-xs text-slate-400 mt-0.5 mb-2">JPG, PNG ou WebP · max 5 Mo · optionnel</p>
              <div className="flex gap-2">
                <button type="button" onClick={() => fileInputRef.current?.click()}
                  className="text-xs font-semibold text-indigo-600 bg-violet-100 hover:bg-violet-200 rounded-lg px-2.5 py-1 transition">
                  {avatarPreview ? "Changer" : "Choisir"}
                </button>
                {avatarPreview && (
                  <button type="button" onClick={removeAvatar}
                    className="text-xs font-medium text-slate-400 bg-slate-100 hover:bg-slate-200 rounded-lg px-2.5 py-1 transition">
                    Supprimer
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Email */}
          <div>
            <FormLabel htmlFor="c-email">Email <span className="text-red-500">*</span></FormLabel>
            <FormInput id="c-email" type="email" value={email} hasError={hasErr("email")}
              onChange={(e) => { onEmailChange(e.target.value); revalidate("email", e.target.value); }}
              onBlur={(e) => { touch("email"); revalidate("email", e.target.value); }}
              onFocus={() => {}}
              placeholder="ex: ahmed.ben.ali@whitecapetech.com"
            />
            <FieldError msg={errMsg("email")} />
          </div>

          {/* Prénom / Nom */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <FormLabel htmlFor="c-fn">Prénom <span className="text-red-500">*</span></FormLabel>
              <FormInput id="c-fn" value={firstName} hasError={hasErr("firstName")}
                onChange={(e) => { onFirstNameChange(e.target.value); revalidate("firstName", e.target.value); }}
                onBlur={(e) => { touch("firstName"); revalidate("firstName", e.target.value); }}
                onFocus={() => {}} placeholder="ex: Ahmed"
              />
              <FieldError msg={errMsg("firstName")} />
            </div>
            <div>
              <FormLabel htmlFor="c-ln">Nom <span className="text-red-500">*</span></FormLabel>
              <FormInput id="c-ln" value={lastName} hasError={hasErr("lastName")}
                onChange={(e) => { onLastNameChange(e.target.value); revalidate("lastName", e.target.value); }}
                onBlur={(e) => { touch("lastName"); revalidate("lastName", e.target.value); }}
                onFocus={() => {}} placeholder="ex: Ben Ali"
              />
              <FieldError msg={errMsg("lastName")} />
            </div>
          </div>

          {/* Rôle */}
          <div>
            <FormLabel htmlFor="c-role">Rôle <span className="text-red-500">*</span></FormLabel>
            <select id="c-role" value={role} onChange={(e) => onRoleChange(e.target.value as AdminRole)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none cursor-pointer transition focus:border-violet-600 focus:ring-2 focus:ring-violet-100 focus:bg-white">
              {ROLE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          {/* Informations professionnelles */}
          <div className="border-t border-slate-100 pt-4">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Informations professionnelles</p>
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <FormLabel htmlFor="c-dept">Département</FormLabel>
                  <FormInput id="c-dept" value={department} hasError={hasErr("department")}
                    onChange={(e) => { onDepartmentChange(e.target.value); revalidate("department", e.target.value); }}
                    onBlur={(e) => { touch("department"); revalidate("department", e.target.value); }}
                    onFocus={() => {}} placeholder="ex: Ingénierie Logicielle"
                  />
                  <FieldError msg={errMsg("department")} />
                </div>
                <div>
                  <FormLabel htmlFor="c-job">Poste</FormLabel>
                  <FormInput id="c-job" value={jobTitle} hasError={hasErr("jobTitle")}
                    onChange={(e) => { onJobTitleChange(e.target.value); revalidate("jobTitle", e.target.value); }}
                    onBlur={(e) => { touch("jobTitle"); revalidate("jobTitle", e.target.value); }}
                    onFocus={() => {}} placeholder="ex: Ingénieur Java"
                  />
                  <FieldError msg={errMsg("jobTitle")} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <FormLabel htmlFor="c-phone">Téléphone</FormLabel>
                  <FormInput id="c-phone" type="tel" value={phone} hasError={hasErr("phone")}
                    onChange={(e) => { onPhoneChange(e.target.value); revalidate("phone", e.target.value); }}
                    onBlur={(e) => { touch("phone"); revalidate("phone", e.target.value); }}
                    onFocus={() => {}} placeholder="+216 20 123 456"
                  />
                  <FieldError msg={errMsg("phone")} />
                </div>
                <div>
                  <FormLabel htmlFor="c-hire">Date d'embauche</FormLabel>
                  <FormInput id="c-hire" type="date" value={hireDate} hasError={hasErr("hireDate")}
                    onChange={(e) => { onHireDateChange(e.target.value); revalidate("hireDate", e.target.value); }}
                    onBlur={(e) => { touch("hireDate"); revalidate("hireDate", e.target.value); }}
                    onFocus={() => {}}
                  />
                  <FieldError msg={errMsg("hireDate")} />
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-end sm:gap-2.5">
            <button type="button" onClick={handleClose}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-500 transition hover:bg-slate-50 sm:w-auto">
              {MESSAGES.cancel}
            </button>
            <button type="submit" disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl border-none bg-gradient-to-r from-indigo-700 to-violet-700 px-5 py-2 text-sm font-bold text-white shadow-md transition disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto">
              {loading && <ArrowPathIcon className="w-3.5 h-3.5 animate-spin" />}
              {loading ? MESSAGES.submit : MESSAGES.create}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
