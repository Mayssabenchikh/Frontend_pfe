import { useState } from "react";
import type { NavId } from "./types";
import { ChevronDown, LogOut, UserCircle, Menu } from "lucide-react";

type Props = {
  currentView: NavId;
  displayName: string | null;
  initials: string | null;
  avatarUrl?: string | null;
  onLogout: () => void;
  onNavigate: (view: NavId) => void;
  onMenuToggle: () => void;
};

const TITLES: Record<NavId, { title: string; subtitle: string }> = {
  dashboard: { title: "Tableau de bord", subtitle: "Vue d'ensemble de votre espace administration" },
  users:     { title: "Gestion des utilisateurs", subtitle: "Gérez les comptes, rôles et accès" },
  archives:  { title: "Archives", subtitle: "Utilisateurs archivés — restaurez ou supprimez définitivement" },
  profile:   { title: "Mon Profil", subtitle: "Gérez vos informations personnelles" },
};

export function AdminHeader({ currentView, displayName, initials, avatarUrl, onLogout, onNavigate, onMenuToggle }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { title, subtitle } = TITLES[currentView];
  const safeName = displayName || "Administrateur";
  const safeInitials = initials?.trim() || safeName.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase() || "AD";

  return (
    <header className="admin-header-fixed">
      <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
        {/* Hamburger — visible only on mobile via CSS */}
        <button
          type="button"
          className="hamburger-btn"
          onClick={onMenuToggle}
          aria-label="Menu"
        >
          <Menu size={18} strokeWidth={2} />
        </button>
        <div style={{ minWidth: 0 }}>
          <h1 style={{ fontSize: 15, fontWeight: 700, color: "#1e1b4b", letterSpacing: "-0.01em", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{title}</h1>
          <p style={{ fontSize: 11, color: "#94a3b8", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{subtitle}</p>
        </div>
      </div>

      {/* User menu */}
      <div style={{ position: "relative" }}>
        <button
          onClick={() => setMenuOpen((o) => !o)}
          style={{
            display: "flex", alignItems: "center", gap: 9,
            borderRadius: 999, border: "1.5px solid #e8edf5",
            background: "#f8faff", padding: "5px 14px 5px 5px", cursor: "pointer",
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "#ede9fe"; e.currentTarget.style.borderColor = "#a5b4fc"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "#f8faff"; e.currentTarget.style.borderColor = "#e8edf5"; }}
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt={safeName} style={{ width: 30, height: 30, borderRadius: "50%", objectFit: "cover", boxShadow: "0 2px 8px rgba(67,56,202,0.3)", flexShrink: 0 }} />
          ) : (
            <div style={{ width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg,#4338ca,#6d28d9)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#fff", boxShadow: "0 2px 8px rgba(67,56,202,0.4)", flexShrink: 0 }}>
              {safeInitials}
            </div>
          )}
          <span className="hidden md:block" style={{ fontSize: 13, fontWeight: 500, color: "#374151", maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {safeName}
          </span>
          <span className="hidden md:block" style={{ color: "#94a3b8" }}>
            <ChevronDown size={14} />
          </span>
        </button>

        {menuOpen && (
          <>
            <div style={{ position: "fixed", inset: 0, zIndex: 40 }} onClick={() => setMenuOpen(false)} />
            <div style={{
              position: "absolute", right: 0, top: 46, zIndex: 50,
              minWidth: 180, borderRadius: 14, border: "1px solid #e8edf5",
              background: "#fff", boxShadow: "0 8px 32px rgba(99,102,241,0.12)", overflow: "hidden",
            }}>
              <div style={{ padding: "12px 16px", borderBottom: "1px solid #f1f5f9" }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#1e293b", margin: 0 }}>{safeName}</p>
                <p style={{ fontSize: 11, color: "#94a3b8", margin: 0 }}>Administrateur</p>
              </div>
              <div style={{ padding: 6 }}>
                <button
                  onClick={() => { setMenuOpen(false); onNavigate("profile"); }}
                  style={{
                    display: "flex", alignItems: "center", gap: 10, width: "100%",
                    padding: "8px 12px", borderRadius: 8, border: "none",
                    background: "transparent", cursor: "pointer", color: "#374151",
                    fontSize: 13, fontWeight: 500,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#f0f0ff")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <UserCircle size={14} color="#4338ca" />
                  <span>Mon profil</span>
                </button>
                <div style={{ height: 1, background: "#f1f5f9", margin: "4px 0" }} />
                <button
                  onClick={() => { setMenuOpen(false); onLogout(); }}
                  style={{
                    display: "flex", alignItems: "center", gap: 10, width: "100%",
                    padding: "8px 12px", borderRadius: 8, border: "none",
                    background: "transparent", cursor: "pointer", color: "#ef4444",
                    fontSize: 13, fontWeight: 500,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#fef2f2")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <LogOut size={14} />
                  <span>Déconnexion</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
