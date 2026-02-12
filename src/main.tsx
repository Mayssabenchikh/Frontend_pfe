import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import keycloak from "./auth/keycloak";
import { ReactKeycloakProvider } from "@react-keycloak/web";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ReactKeycloakProvider
      authClient={keycloak}
      initOptions={{
        onLoad: "login-required",
        
        checkLoginIframe: false,

        silentCheckSsoFallback: false,
      }}
    >
      <App />
    </ReactKeycloakProvider>
  </React.StrictMode>
);
