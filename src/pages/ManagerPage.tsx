import { useKeycloak } from "@react-keycloak/web";

export default function ManagerPage() {
  const { keycloak } = useKeycloak();

  return (
    <div style={{ fontFamily: "system-ui", padding: 24, maxWidth: 800, margin: "0 auto" }}>
      <h1>Espace manager</h1>
      <p>Bienvenue, vous êtes connecté en tant que <strong>manager</strong>.</p>
      <button
        onClick={() => keycloak.logout({ redirectUri: `${window.location.origin}/` })}
        style={{ padding: "10px 20px", fontSize: "16px", marginTop: 16 }}
      >
        Déconnexion
      </button>
    </div>
  );
}
