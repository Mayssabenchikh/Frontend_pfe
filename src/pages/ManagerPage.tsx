import { useKeycloak } from "@react-keycloak/web";
import { Outlet, NavLink } from "react-router-dom";

export default function ManagerPage() {
  const { keycloak } = useKeycloak();
  const token = keycloak.tokenParsed as { given_name?: string; family_name?: string; email?: string } | undefined;
  const displayName = [token?.given_name, token?.family_name].filter(Boolean).join(" ") || token?.email || "Manager";

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", fontFamily: "system-ui" }}>
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 24px",
          borderBottom: "1px solid #e2e8f0",
          background: "#fff",
        }}
      >
        <nav style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <NavLink
            to="/manager/projects"
            style={({ isActive }) => ({
              fontSize: 14,
              fontWeight: isActive ? 600 : 500,
              color: isActive ? "#4338ca" : "#64748b",
              textDecoration: "none",
            })}
          >
            Projets
          </NavLink>
        </nav>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontSize: 14, color: "#64748b" }}>{displayName}</span>
          <button
            onClick={() => keycloak.logout({ redirectUri: `${window.location.origin}/` })}
            style={{
              padding: "8px 16px",
              fontSize: 14,
              borderRadius: 8,
              border: "1px solid #e2e8f0",
              background: "#fff",
              cursor: "pointer",
            }}
          >
            Déconnexion
          </button>
        </div>
      </header>
      <main style={{ flex: 1, overflow: "auto" }}>
        <Outlet />
      </main>
    </div>
  );
}
