import { useKeycloak } from "@react-keycloak/web";

function App() {
  const { keycloak, initialized } = useKeycloak();

  if (!initialized) {
    return (
      <div style={{ fontFamily: "system-ui", padding: 24 }}>
        Initialisation de l'authentification...
      </div>
    );
  }

  const handleLogin = () =>
    keycloak.login({ redirectUri: window.location.origin });

  const handleLogout = () =>
    keycloak.logout({ redirectUri: window.location.origin });

  return (
    <div style={{ fontFamily: "system-ui", padding: 24 }}>
      {!keycloak.authenticated ? (
        <button
          onClick={handleLogin}
          style={{ padding: "10px 20px", fontSize: "16px" }}
        >
          Login
        </button>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>Vous êtes connecté.</div>
          <button
            onClick={handleLogout}
            style={{ padding: "10px 20px", fontSize: "16px" }}
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
