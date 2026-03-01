import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import keycloak from "./auth/keycloak";
import { ReactKeycloakProvider } from "@react-keycloak/web";
import { Toaster } from "sonner";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ReactKeycloakProvider
      authClient={keycloak}
      initOptions={{
        onLoad: "login-required",
        checkLoginIframe: false,
        silentCheckSsoFallback: false,
        redirectUri: `${window.location.origin}/`,
      }}
    >
      <App />
      <Toaster
        position="top-right"
        richColors
        closeButton
        toastOptions={{ duration: 4000 }}
      />
    </ReactKeycloakProvider>
  </React.StrictMode>
);
