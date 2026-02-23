import axios from "axios";
import keycloak from "../auth/keycloak";

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

http.interceptors.request.use(async (config) => {
  if (keycloak.authenticated) {
    try {
      await keycloak.updateToken(30); 
    } catch {
      keycloak.login({ redirectUri: `${window.location.origin}/` });
    }

    const token = keycloak.token;
    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});
