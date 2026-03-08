import { useKeycloak } from "@react-keycloak/web";
import { EmployeeProfile } from "./employee/EmployeeProfile";

export default function EmployeePage() {
  const { keycloak } = useKeycloak();
  const token = keycloak.tokenParsed as { given_name?: string; family_name?: string; email?: string } | undefined;
  const displayName = [token?.given_name, token?.family_name].filter(Boolean).join(" ") || token?.email || "Employé";

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
        <h1 style={{ fontSize: 18, fontWeight: 700, color: "#1e293b" }}>Espace employé</h1>
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
      <main style={{ flex: 1, padding: 0 }}>
        <EmployeeProfile />
      </main>
    </div>
  );
}
