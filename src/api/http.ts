import axios, { type InternalAxiosRequestConfig } from "axios";
import keycloak from "../auth/keycloak";

const ROOT_REDIRECT_URI = `${window.location.origin}/`;

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

function attachAuthorizationHeader(config: InternalAxiosRequestConfig, token: string) {
  config.headers = config.headers ?? {};
  config.headers.Authorization = `Bearer ${token}`;
}

http.interceptors.request.use(async (config) => {
  if (keycloak.authenticated) {
    try {
      await keycloak.updateToken(30);
    } catch {
      // Save current location before redirecting to Keycloak login
      try {
        const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
        sessionStorage.setItem("skillify_post_login_redirect", currentUrl);
      } catch {
        // ignore storage errors
      }
      keycloak.login({ redirectUri: ROOT_REDIRECT_URI });
    }

    const token = keycloak.token;
    if (token) {
      attachAuthorizationHeader(config, token);
    }
  }
  return config;
});
