import { useEffect, useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import { useKeycloak } from "@react-keycloak/web";
import { getPrimaryRole, getRedirectPathForRole } from "../auth/roles";

const POST_LOGIN_REDIRECT_KEY = "skillify_post_login_redirect";

export default function RoleRedirect() {
  const { keycloak } = useKeycloak();
  const [redirectPath, setRedirectPath] = useState<string | null>(null);
  const resolvedOnceRef = useRef(false);

  useEffect(() => {
    if (!keycloak.authenticated || !keycloak.tokenParsed) {
      return;
    }

    if (resolvedOnceRef.current) {
      return;
    }

    let rememberedPath: string | null = null;
    try {
      rememberedPath = sessionStorage.getItem(POST_LOGIN_REDIRECT_KEY);
    } catch {
      // ignore
    }

    const role = getPrimaryRole(keycloak.tokenParsed);
    const defaultPath = role ? getRedirectPathForRole(role) : `${window.location.pathname}${window.location.search}${window.location.hash}` || "/";
    const normalizedRememberedPath =
      rememberedPath && rememberedPath.startsWith("/") && rememberedPath !== "/" ? rememberedPath : null;
    const path = normalizedRememberedPath ?? defaultPath;

    // Set the path once per auth session
    resolvedOnceRef.current = true;
    setRedirectPath(path);
  }, [keycloak.authenticated, keycloak.tokenParsed]);

  if (!keycloak.authenticated || !keycloak.tokenParsed) {
    return null;
  }

  if (!redirectPath) {
    return null;
  }

  return <Navigate to={redirectPath} replace />;
}
