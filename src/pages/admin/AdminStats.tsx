import { Users, TrendingUp, UserX } from "lucide-react";

type CardProps = {
  label: string; value: number; icon: React.ReactNode;
  iconColor: string; iconBg: string; accentColor: string; note?: string;
};

function Card({ label, value, icon, iconColor, iconBg, accentColor, note }: CardProps) {
  return (
    <div
      style={{
        background: "#fff", borderRadius: 16,
        border: `1.5px solid ${accentColor}18`,
        padding: "24px", boxShadow: "0 2px 16px rgba(99,102,241,0.06)",
        position: "relative", overflow: "hidden",
        transition: "transform 0.2s, box-shadow 0.2s", cursor: "default",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
        (e.currentTarget as HTMLDivElement).style.boxShadow = `0 8px 28px ${accentColor}18`;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "0 2px 16px rgba(99,102,241,0.06)";
      }}
    >
      <div style={{ position: "absolute", right: -24, top: -24, width: 100, height: 100, borderRadius: "50%", background: `${accentColor}06`, pointerEvents: "none" }} />
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.13em", color: "#94a3b8", margin: "0 0 8px" }}>{label}</p>
          <p style={{ fontSize: 40, fontWeight: 800, color: "#0f172a", margin: 0, lineHeight: 1, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.03em" }}>{value}</p>
          {note && <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 8 }}>{note}</p>}
        </div>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: `0 4px 12px ${accentColor}25` }}>
          <span style={{ color: iconColor }}>{icon}</span>
        </div>
      </div>
    </div>
  );
}

export function AdminStats({ total, actifs, inactifs }: { total: number; actifs: number; inactifs: number }) {
  return (
    <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
      <Card label="Total utilisateurs" value={total}   icon={<Users size={20} strokeWidth={1.75} />}      iconColor="#4338ca" iconBg="#ede9fe" accentColor="#4338ca" />
      <Card label="Comptes actifs"     value={actifs}  icon={<TrendingUp size={20} strokeWidth={1.75} />} iconColor="#10b981" iconBg="#ecfdf5" accentColor="#10b981" note="Comptes opérationnels" />
      <Card label="Comptes inactifs"   value={inactifs} icon={<UserX size={20} strokeWidth={1.75} />}    iconColor="#94a3b8" iconBg="#f1f5f9" accentColor="#94a3b8" />
    </div>
  );
}
