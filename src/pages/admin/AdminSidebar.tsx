import { useState } from "react";
import type { NavId } from "./types";
import { LayoutDashboard, Users, Archive } from "lucide-react";

type NavItem = { id: NavId; label: string; icon: React.ReactNode };
type Props = {
  currentView: NavId;
  onNavChange: (view: NavId) => void;
  displayName: string;
  roleLabel: string;
  avatarUrl: string | null;
  initials: string;
  mobileOpen?: boolean;
};

const NAV: NavItem[] = [
  { id: "dashboard", label: "Tableau de bord", icon: <LayoutDashboard size={18} strokeWidth={1.75} /> },
  { id: "users",     label: "Utilisateurs",    icon: <Users size={18} strokeWidth={1.75} /> },
  { id: "archives",  label: "Archives",         icon: <Archive size={18} strokeWidth={1.75} /> },
];

export function AdminSidebar({ currentView, onNavChange, mobileOpen }: Props) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <aside
      className={`admin-sidebar${mobileOpen ? " open" : ""}`}
      style={{
        background: "#ffffff",
        borderRight: "1px solid #e8edf5",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        boxShadow: "2px 0 16px rgba(67,56,202,0.08)",
      }}
    >
      {/* Logo */}
      <div style={{
        height: 64,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 20px",
        borderBottom: "1px solid #f0f3fa",
        flexShrink: 0,
      }}>
        <img src="/logo.png" alt="Logo" style={{ height: 36, width: "auto", objectFit: "contain" }} />
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: "auto", padding: "20px 10px", display: "flex", flexDirection: "column", gap: 2 }}>
        {NAV.map((item) => {
          const active = currentView === item.id;
          const hov = hoveredId === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavChange(item.id)}
              onMouseEnter={() => setHoveredId(item.id)}
              onMouseLeave={() => setHoveredId(null)}
              style={{
                display: "flex", alignItems: "center", gap: 11,
                width: "100%", borderRadius: 10, padding: "10px 14px",
                border: "none", cursor: "pointer", fontSize: 13,
                fontWeight: active ? 600 : 500,
                transition: "all 0.15s ease",
                background: active ? "rgba(67,56,202,0.10)" : hov ? "#f0f0ff" : "transparent",
                color: active ? "#3730a3" : hov ? "#4338ca" : "#64748b",
                position: "relative", textAlign: "left",
              }}
            >
              {active && (
                <span style={{
                  position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)",
                  width: 3, height: 20, borderRadius: "0 4px 4px 0",
                  background: "linear-gradient(180deg,#4338ca,#6d28d9)",
                }} />
              )}
              <span style={{ color: active ? "#4338ca" : hov ? "#6366f1" : "#b0b8cc", transition: "color 0.15s", flexShrink: 0 }}>
                {item.icon}
              </span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
