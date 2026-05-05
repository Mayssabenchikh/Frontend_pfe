import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import keycloak from "./auth/keycloak";
import { ReactKeycloakProvider } from "@react-keycloak/web";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import "./index.css";

const POST_LOGIN_REDIRECT_KEY = "skillify_post_login_redirect";

function rememberCurrentLocationForPostLoginRedirect() {
  try {
    const path = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    
    // Never remember the Keycloak auth callback URL as a target.
    // Keycloak redirects with code and state in either query string or hash
    const hasKeycloakCallback = (path.includes("code=") && path.includes("state=")) || 
                                 (path.includes("session_state=") && path.includes("iss="));
    if (hasKeycloakCallback) {
      return;
    }
    
    // Always update deep-links, unless we're at root
    if (path !== "/") {
      sessionStorage.setItem(POST_LOGIN_REDIRECT_KEY, path);
    } else {
      sessionStorage.removeItem(POST_LOGIN_REDIRECT_KEY);
    }
  } catch {
    // ignore storage errors
  }
}

rememberCurrentLocationForPostLoginRedirect();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      retry: 1,
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ReactKeycloakProvider
      authClient={keycloak}
      initOptions={{
        onLoad: "login-required",
        checkLoginIframe: false,
        silentCheckSsoFallback: false,
        // Must match Keycloak "Valid Redirect URIs".
        redirectUri: `${window.location.origin}/`,
      }}
    >
      <QueryClientProvider client={queryClient}>
        <App />
        <Toaster
          position="top-right"
          richColors
          closeButton
          toastOptions={{ duration: 4000 }}
        />
      </QueryClientProvider>
    </ReactKeycloakProvider>
  </React.StrictMode>
);
