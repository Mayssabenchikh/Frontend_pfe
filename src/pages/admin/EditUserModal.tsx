import { useState, useCallback, useRef } from "react";
import type { AdminRole, UserListDto } from "./types";
import { ROLE_OPTIONS, MESSAGES } from "./constants";
import { X, AlertCircle, Camera, Loader2 } from "lucide-react";
import { getAvatarColor } from "./utils";
import { http } from "../../api/http";
import { toast } from "sonner";

type Props = {
  open?: boolean; onClose: () => void;
  user?: UserListDto;
  email?: string; firstName: string; lastName: string; role: AdminRole;
  department: string; jobTitle: string; phone: string; hireDate: string;
  onEmailChange?: (v: string) => void; onFirstNameChange: (v: string) => void;
  onLastNameChange: (v: string) => void; onRoleChange: (v: AdminRole) => void;
  onDepartmentChange: (v: string) => void; onJobTitleChange: (v: string) => void;
  onPhoneChange: (v: string) => void; onHireDateChange: (v: string) => void;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
};

type FieldErrors = Partial<Record<"email" | "firstName" | "lastName" | "phone" | "hireDate" | "department" | "jobTitle", string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[+\d][\d\s\-().]{6,19}$/;
const NAME_RE = /^[\p{L}\s'\-]{2,60}$/u;

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

const baseInput: React.CSSProperties = {
  width: "100%", borderRadius: 10, border: "1.5px solid #e2e8f0",
  background: "#f8faff", padding: "10px 14px", fontSize: 13,
  color: "#1e293b", outline: "none", boxSizing: "border-box", transition: "all 0.15s",
};
const errorInput: React.CSSProperties = { ...baseInput, borderColor: "#fca5a5", background: "#fff5f5" };
const labelStyle: React.CSSProperties = {
  display: "block", fontSize: 10, fontWeight: 700,
  textTransform: "uppercase", letterSpacing: "0.12em", color: "#94a3b8", marginBottom: 6,
};

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
      <AlertCircle size={11} color="#ef4444" />
      <span style={{ fontSize: 11, color: "#ef4444" }}>{msg}</span>
    </div>
  );
}

function applyFocus(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>, hasError: boolean) {
  e.target.style.border = `1.5px solid ${hasError ? "#f87171" : "#6d28d9"}`;
  e.target.style.background = "#fff";
  e.target.style.boxShadow = hasError ? "0 0 0 3px rgba(239,68,68,0.1)" : "0 0 0 3px rgba(67,56,202,0.12)";
}
function applyBlur(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>, hasError: boolean) {
  e.target.style.border = `1.5px solid ${hasError ? "#fca5a5" : "#e2e8f0"}`;
  e.target.style.background = hasError ? "#fff5f5" : "#f8faff";
  e.target.style.boxShadow = "none";
}

export function EditUserModal({
  open, onClose, user: _user, email, firstName, lastName, role,
  department, jobTitle, phone, hireDate,
  onEmailChange, onFirstNameChange, onLastNameChange, onRoleChange,
  onDepartmentChange, onJobTitleChange, onPhoneChange, onHireDateChange,
  loading, onSubmit,
}: Props) {
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Set<string>>(new Set());
  const [avatarPreview, setAvatarPreview] = useState<string | null>(_user?.avatarUrl ?? null);
  // Sync avatar preview when editing a different user
  const prevUserId = useRef<string | undefined>(_user?.id);
  if (_user?.id !== prevUserId.current) {
    prevUserId.current = _user?.id;
    setAvatarPreview(_user?.avatarUrl ?? null);
  }
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !_user?.id) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Veuillez sélectionner une image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("L'image ne doit pas dépasser 5 Mo.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await http.post<{ avatarUrl: string }>(`/api/admin/users/${_user.id}/avatar`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setAvatarPreview(res.data.avatarUrl);
      toast.success("Photo de profil mise à jour.");
    } catch {
      toast.error("Erreur lors de l'upload de la photo.");
      setAvatarPreview(_user?.avatarUrl ?? null);
    } finally {
      setUploadingAvatar(false);
    }
  }, [_user]);

  const touch = useCallback((field: string) => setTouched((p) => new Set(p).add(field)), []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate({ email: email ?? "", firstName, lastName, phone, hireDate, department, jobTitle });
    setErrors(errs);
    setTouched(new Set(["email", "firstName", "lastName", "phone", "hireDate", "department", "jobTitle"]));
    if (Object.keys(errs).length > 0) return;
    onSubmit(e);
  };

  const revalidate = useCallback((field: keyof FieldErrors, value: string) => {
    if (!touched.has(field)) return;
    const errs = validate({
      email: field === "email" ? value : (email ?? ""),
      firstName: field === "firstName" ? value : firstName,
      lastName: field === "lastName" ? value : lastName,
      phone: field === "phone" ? value : phone,
      hireDate: field === "hireDate" ? value : hireDate,
      department: field === "department" ? value : department,
      jobTitle: field === "jobTitle" ? value : jobTitle,
    });
    setErrors((prev) => ({ ...prev, [field]: errs[field] }));
  }, [touched, email, firstName, lastName, phone, hireDate, department, jobTitle]);

  if (open === false) return null;

  const inp = (field: keyof FieldErrors) => errors[field] ? errorInput : baseInput;
  const err = (field: keyof FieldErrors) => errors[field];

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, background: "rgba(30,27,75,0.35)", backdropFilter: "blur(4px)" }}
      role="dialog" aria-modal="true"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 520, borderRadius: 20,
          border: "1px solid #e8edf5", background: "#fff",
          boxShadow: "0 24px 64px rgba(67,56,202,0.18)",
          animation: "modalIn 0.2s cubic-bezier(0.16,1,0.3,1) both",
          maxHeight: "90vh", overflowY: "auto",
        }}
      >
        <style>{`@keyframes modalIn{from{opacity:0;transform:scale(0.96) translateY(8px)}to{opacity:1;transform:scale(1) translateY(0)}} @keyframes spin{to{transform:rotate(360deg)}}`}</style>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", borderBottom: "1px solid #f1f5f9" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#1e1b4b" }}>Modifier l'utilisateur</h2>
            <p style={{ margin: 0, fontSize: 12, color: "#94a3b8" }}>Mettez à jour les informations</p>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: "50%", border: "1.5px solid #e2e8f0", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#94a3b8" }}>
            <X size={14} />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate style={{ padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Avatar upload */}
          <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "12px 0", borderBottom: "1px solid #f1f5f9" }}>
            <div style={{ position: "relative", flexShrink: 0 }}>
              {(() => {
                const fullName = `${firstName ?? ""} ${lastName ?? ""}`.trim() || (email ?? "");
                const initials = `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.trim().toUpperCase() || (email?.[0] ?? "U").toUpperCase();
                const gradient = getAvatarColor(email ?? "");
                return avatarPreview ? (
                  <img src={avatarPreview} alt={fullName} style={{ width: 64, height: 64, borderRadius: "50%", objectFit: "cover", border: "3px solid #ede9fe", boxShadow: "0 4px 16px rgba(67,56,202,0.2)" }} />
                ) : (
                  <div style={{ width: 64, height: 64, borderRadius: "50%", background: `linear-gradient(135deg,${gradient[0]},${gradient[1]})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 700, color: "#fff", border: "3px solid #ede9fe", boxShadow: "0 4px 16px rgba(67,56,202,0.2)" }}>
                    {initials}
                  </div>
                );
              })()}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                style={{ position: "absolute", bottom: 0, right: 0, width: 22, height: 22, borderRadius: "50%", background: "linear-gradient(135deg,#4338ca,#6d28d9)", border: "2px solid #fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: uploadingAvatar ? "not-allowed" : "pointer", color: "#fff" }}
              >
                {uploadingAvatar ? <Loader2 size={11} style={{ animation: "spin 0.7s linear infinite" }} /> : <Camera size={11} strokeWidth={2.5} />}
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleAvatarChange} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#1e293b" }}>Photo de profil</p>
              <p style={{ margin: "2px 0 0", fontSize: 11, color: "#94a3b8" }}>JPG, PNG ou WebP · max 5 Mo</p>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <label style={labelStyle} htmlFor="e-email">Email <span style={{ color: "#ef4444" }}>*</span></label>
            <input id="e-email" type="email" style={inp("email")} value={email}
              onChange={(e) => { onEmailChange?.(e.target.value); revalidate("email", e.target.value); }}
              onBlur={(e) => { touch("email"); revalidate("email", e.target.value); applyBlur(e, !!err("email")); }}
              onFocus={(e) => applyFocus(e, !!err("email"))}
              placeholder="ex: ahmed.ben.ali@whitecapetech.com"
            />
            <FieldError msg={err("email")} />
          </div>

          <div className="modal-grid-2">
            <div style={{ display: "flex", flexDirection: "column" }}>
              <label style={labelStyle} htmlFor="e-fn">Prénom <span style={{ color: "#ef4444" }}>*</span></label>
              <input id="e-fn" type="text" style={inp("firstName")} value={firstName}
                onChange={(e) => { onFirstNameChange(e.target.value); revalidate("firstName", e.target.value); }}
                onBlur={(e) => { touch("firstName"); revalidate("firstName", e.target.value); applyBlur(e, !!err("firstName")); }}
                onFocus={(e) => applyFocus(e, !!err("firstName"))}
                placeholder="ex: Ahmed"
              />
              <FieldError msg={err("firstName")} />
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <label style={labelStyle} htmlFor="e-ln">Nom <span style={{ color: "#ef4444" }}>*</span></label>
              <input id="e-ln" type="text" style={inp("lastName")} value={lastName}
                onChange={(e) => { onLastNameChange(e.target.value); revalidate("lastName", e.target.value); }}
                onBlur={(e) => { touch("lastName"); revalidate("lastName", e.target.value); applyBlur(e, !!err("lastName")); }}
                onFocus={(e) => applyFocus(e, !!err("lastName"))}
                placeholder="ex: Ben Ali"
              />
              <FieldError msg={err("lastName")} />
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <label style={labelStyle} htmlFor="e-role">Rôle <span style={{ color: "#ef4444" }}>*</span></label>
            <select id="e-role" style={{ ...baseInput, cursor: "pointer" }} value={role}
              onChange={(e) => onRoleChange(e.target.value as AdminRole)}
              onFocus={(e) => applyFocus(e, false)} onBlur={(e) => applyBlur(e, false)}
            >
              {ROLE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 14 }}>
            <p style={{ margin: "0 0 12px", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#94a3b8" }}>Informations professionnelles</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div className="modal-grid-2">
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <label style={labelStyle} htmlFor="e-dept">Département</label>
                  <input id="e-dept" type="text" style={inp("department")} value={department}
                    onChange={(e) => { onDepartmentChange(e.target.value); revalidate("department", e.target.value); }}
                    onBlur={(e) => { touch("department"); revalidate("department", e.target.value); applyBlur(e, !!err("department")); }}
                    onFocus={(e) => applyFocus(e, !!err("department"))}
                    placeholder="ex: Ingénierie Logicielle"
                  />
                  <FieldError msg={err("department")} />
                </div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <label style={labelStyle} htmlFor="e-job">Poste</label>
                  <input id="e-job" type="text" style={inp("jobTitle")} value={jobTitle}
                    onChange={(e) => { onJobTitleChange(e.target.value); revalidate("jobTitle", e.target.value); }}
                    onBlur={(e) => { touch("jobTitle"); revalidate("jobTitle", e.target.value); applyBlur(e, !!err("jobTitle")); }}
                    onFocus={(e) => applyFocus(e, !!err("jobTitle"))}
                    placeholder="ex: Ingénieur Java"
                  />
                  <FieldError msg={err("jobTitle")} />
                </div>
              </div>
              <div className="modal-grid-2">
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <label style={labelStyle} htmlFor="e-phone">Téléphone</label>
                  <input id="e-phone" type="tel" style={inp("phone")} value={phone}
                    onChange={(e) => { onPhoneChange(e.target.value); revalidate("phone", e.target.value); }}
                    onBlur={(e) => { touch("phone"); revalidate("phone", e.target.value); applyBlur(e, !!err("phone")); }}
                    onFocus={(e) => applyFocus(e, !!err("phone"))}
                    placeholder="+216 20 123 456"
                  />
                  <FieldError msg={err("phone")} />
                </div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <label style={labelStyle} htmlFor="e-hire">Date d'embauche</label>
                  <input id="e-hire" type="date" style={inp("hireDate")} value={hireDate}
                    onChange={(e) => { onHireDateChange(e.target.value); revalidate("hireDate", e.target.value); }}
                    onBlur={(e) => { touch("hireDate"); revalidate("hireDate", e.target.value); applyBlur(e, !!err("hireDate")); }}
                    onFocus={(e) => applyFocus(e, !!err("hireDate"))}
                  />
                  <FieldError msg={err("hireDate")} />
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, borderTop: "1px solid #f1f5f9", paddingTop: 16 }}>
            <button type="button" onClick={onClose} style={{ borderRadius: 10, border: "1.5px solid #e2e8f0", padding: "8px 18px", fontSize: 13, fontWeight: 500, color: "#475569", background: "#fff", cursor: "pointer" }}>
              {MESSAGES.cancel}
            </button>
            <button type="submit" disabled={loading} style={{ borderRadius: 10, border: "none", padding: "8px 20px", fontSize: 13, fontWeight: 700, color: "#fff", background: "linear-gradient(135deg,#4338ca,#6d28d9)", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, display: "flex", alignItems: "center", gap: 8, boxShadow: "0 4px 16px rgba(67,56,202,0.4)" }}>
              {loading && <span style={{ width: 13, height: 13, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", display: "inline-block", animation: "spin 0.7s linear infinite" }} />}
              {loading ? MESSAGES.submit : MESSAGES.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
