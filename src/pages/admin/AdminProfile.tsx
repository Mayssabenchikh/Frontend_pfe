import { useState, useRef, useCallback } from "react";
import { Camera, Loader2, User, Mail, Phone, Building2, Briefcase, CalendarDays, Shield, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { http } from "../../api/http";
import type { TokenParsed } from "./types";
import { getAvatarColor } from "./utils";

type Props = {
  token: TokenParsed | undefined;
  adminKeycloakId: string | undefined;
  initialAvatarUrl?: string | null;
  onAvatarUpdate?: (url: string) => void;
};

type Section = "personal" | "security";

export function AdminProfile({ token, adminKeycloakId, initialAvatarUrl, onAvatarUpdate }: Props) {
  const firstName = token?.given_name ?? "";
  const lastName = token?.family_name ?? "";
  const email = token?.email ?? "";
  const fullName = [firstName, lastName].filter(Boolean).join(" ") || "Administrateur";
  const initials = `${firstName[0] ?? ""}${lastName[0] ?? ""}`.trim().toUpperCase() || "AD";
  const gradient = getAvatarColor(email);

  const [section, setSection] = useState<Section>("personal");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatarUrl ?? token?.picture ?? null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    { id: "personal", label: "Informations personnelles", icon: <User size={15} strokeWidth={2} /> },
    { id: "security", label: "Sécurité & Mot de passe",   icon: <Shield size={15} strokeWidth={2} /> },
  ];

  return (
    <div style={{ padding: "clamp(16px, 4vw, 32px)", overflowY: "auto", flex: 1 }}>
      <div className="profile-layout">

        {/* Left panel */}
        <div className="profile-left" style={{
          background: "#fff", borderRadius: 20,
          border: "1px solid #e8edf5",
          boxShadow: "0 4px 24px rgba(67,56,202,0.06)",
          display: "flex", flexDirection: "column",
          overflow: "hidden",
        }}>
          {/* Avatar section */}
          <div style={{
            padding: "32px 24px 24px",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
            background: "linear-gradient(160deg,#f5f3ff 0%,#fff 60%)",
            borderBottom: "1px solid #f1f5f9",
          }}>
            <div style={{ position: "relative" }}>
              {avatarUrl ? (
                <img src={avatarUrl} alt={fullName} style={{ width: 88, height: 88, borderRadius: "50%", objectFit: "cover", border: "4px solid #ede9fe", boxShadow: "0 8px 24px rgba(67,56,202,0.2)" }} />
              ) : (
                <div style={{ width: 88, height: 88, borderRadius: "50%", background: `linear-gradient(135deg,${gradient[0]},${gradient[1]})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 700, color: "#fff", border: "4px solid #ede9fe", boxShadow: "0 8px 24px rgba(67,56,202,0.2)" }}>
                  {initials}
                </div>
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                title="Changer la photo"
                style={{
                  position: "absolute", bottom: 2, right: 2,
                  width: 28, height: 28, borderRadius: "50%",
                  background: "linear-gradient(135deg,#4338ca,#6d28d9)",
                  border: "2.5px solid #fff",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: uploadingAvatar ? "not-allowed" : "pointer", color: "#fff",
                  boxShadow: "0 2px 8px rgba(67,56,202,0.4)",
                }}
              >
                {uploadingAvatar
                  ? <Loader2 size={13} style={{ animation: "spin 0.7s linear infinite" }} />
                  : <Camera size={13} strokeWidth={2.5} />
                }
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleAvatarChange} />
            </div>
            <div style={{ textAlign: "center" }}>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#1e1b4b" }}>{fullName}</p>
              <p style={{ margin: "3px 0 0", fontSize: 12, color: "#94a3b8" }}>Administrateur</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 20, padding: "4px 12px" }}>
              <CheckCircle2 size={12} color="#16a34a" strokeWidth={2.5} />
              <span style={{ fontSize: 11, fontWeight: 600, color: "#16a34a" }}>Compte actif</span>
            </div>
          </div>

          {/* Nav */}
          <nav style={{ padding: "12px 10px", display: "flex", flexDirection: "column", gap: 2 }}>
            {SECTIONS.map((s) => {
              const active = section === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSection(s.id)}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    width: "100%", borderRadius: 10, padding: "10px 14px",
                    border: "none", cursor: "pointer", fontSize: 13,
                    fontWeight: active ? 600 : 500,
                    background: active ? "rgba(67,56,202,0.10)" : "transparent",
                    color: active ? "#3730a3" : "#64748b",
                    textAlign: "left", transition: "all 0.15s",
                    position: "relative",
                  }}
                  onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "#f0f0ff"; }}
                  onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
                >
                  {active && (
                    <span style={{ position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)", width: 3, height: 18, borderRadius: "0 4px 4px 0", background: "linear-gradient(180deg,#4338ca,#6d28d9)" }} />
                  )}
                  <span style={{ color: active ? "#4338ca" : "#b0b8cc" }}>{s.icon}</span>
                  {s.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right panel */}
        <div className="profile-right" style={{
          background: "#fff", borderRadius: 20,
          border: "1px solid #e8edf5",
          boxShadow: "0 4px 24px rgba(67,56,202,0.06)",
          overflow: "hidden",
        }}>
          {section === "personal" && <PersonalSection firstName={firstName} lastName={lastName} email={email} />}
          {section === "security" && <SecuritySection />}
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function PersonalSection({ firstName, lastName, email }: { firstName: string; lastName: string; email: string }) {
  return (
    <div className="profile-section-content" style={{ padding: "28px 32px", display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#1e1b4b" }}>Informations personnelles</h2>
        <p style={{ margin: "4px 0 0", fontSize: 12, color: "#94a3b8" }}>Ces informations proviennent de votre compte Keycloak.</p>
      </div>

      <div className="modal-grid-2" style={{ gap: 18 }}>
        <ReadonlyField icon={<User size={14} color="#4338ca" />} label="Prénom" value={firstName || "—"} />
        <ReadonlyField icon={<User size={14} color="#4338ca" />} label="Nom" value={lastName || "—"} />
      </div>

      <ReadonlyField
        icon={<Mail size={14} color="#4338ca" />}
        label="Adresse e-mail"
        value={email || "—"}
        badge={<span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, color: "#16a34a", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 20, padding: "2px 10px" }}><CheckCircle2 size={11} strokeWidth={2.5} />Vérifié</span>}
      />

      <div className="modal-grid-2" style={{ gap: 18 }}>
        <ReadonlyField icon={<Phone size={14} color="#4338ca" />} label="Téléphone" value="—" />
        <ReadonlyField icon={<CalendarDays size={14} color="#4338ca" />} label="Date d'embauche" value="—" />
      </div>

      <div className="modal-grid-2" style={{ gap: 18 }}>
        <ReadonlyField icon={<Building2 size={14} color="#4338ca" />} label="Département" value="—" />
        <ReadonlyField icon={<Briefcase size={14} color="#4338ca" />} label="Poste" value="—" />
      </div>

      <div style={{ background: "#f8faff", border: "1px solid #e8edf5", borderRadius: 12, padding: "14px 18px", display: "flex", alignItems: "flex-start", gap: 12 }}>
        <Shield size={16} color="#4338ca" style={{ flexShrink: 0, marginTop: 1 }} />
        <div>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "#3730a3" }}>Informations gérées par Keycloak</p>
          <p style={{ margin: "3px 0 0", fontSize: 11, color: "#94a3b8" }}>Pour modifier votre nom ou email, rendez-vous dans la console Keycloak ou contactez votre administrateur système.</p>
        </div>
      </div>
    </div>
  );
}

function SecuritySection() {
  return (
    <div className="profile-section-content" style={{ padding: "28px 32px", display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#1e1b4b" }}>Sécurité & Mot de passe</h2>
        <p style={{ margin: "4px 0 0", fontSize: 12, color: "#94a3b8" }}>Gérez la sécurité de votre compte.</p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <SecurityItem
          title="Mot de passe"
          description="Votre mot de passe est géré par Keycloak. Cliquez pour le modifier via la console de compte."
          actionLabel="Modifier le mot de passe"
          actionColor="#4338ca"
          onAction={() => window.open("http://localhost:8081/realms/skillify/account/#/security/signingin", "_blank")}
        />
        <SecurityItem
          title="Sessions actives"
          description="Gérez vos sessions actives et déconnectez les appareils non reconnus."
          actionLabel="Voir les sessions"
          actionColor="#4338ca"
          onAction={() => window.open("http://localhost:8081/realms/skillify/account/#/security/device-activity", "_blank")}
        />
      </div>

      <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 12, padding: "14px 18px", display: "flex", alignItems: "flex-start", gap: 12 }}>
        <Shield size={16} color="#b45309" style={{ flexShrink: 0, marginTop: 1 }} />
        <div>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "#92400e" }}>Authentification gérée par Keycloak</p>
          <p style={{ margin: "3px 0 0", fontSize: 11, color: "#b45309" }}>La gestion des mots de passe et des sessions est déléguée à Keycloak pour une sécurité maximale.</p>
        </div>
      </div>
    </div>
  );
}

function ReadonlyField({ icon, label, value, badge }: { icon: React.ReactNode; label: string; value: string; badge?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#94a3b8", display: "flex", alignItems: "center", gap: 5 }}>
        {icon} {label}
      </label>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        borderRadius: 10, border: "1.5px solid #e2e8f0",
        background: "#f8faff", padding: "10px 14px",
        fontSize: 13, color: value === "—" ? "#cbd5e1" : "#1e293b", fontWeight: value === "—" ? 400 : 500,
      }}>
        <span>{value}</span>
        {badge}
      </div>
    </div>
  );
}

function SecurityItem({ title, description, actionLabel, actionColor, onAction }: {
  title: string; description: string; actionLabel: string; actionColor: string; onAction: () => void;
}) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "16px 20px", borderRadius: 14,
      border: "1.5px solid #e8edf5", background: "#fafbff",
      gap: 16,
    }}>
      <div style={{ flex: 1 }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{title}</p>
        <p style={{ margin: "3px 0 0", fontSize: 11, color: "#94a3b8" }}>{description}</p>
      </div>
      <button
        type="button"
        onClick={onAction}
        style={{
          flexShrink: 0, borderRadius: 10, border: `1.5px solid ${actionColor}`,
          background: "transparent", padding: "7px 16px",
          fontSize: 12, fontWeight: 600, color: actionColor,
          cursor: "pointer", transition: "all 0.15s", whiteSpace: "nowrap",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(67,56,202,0.08)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
      >
        {actionLabel}
      </button>
    </div>
  );
}
