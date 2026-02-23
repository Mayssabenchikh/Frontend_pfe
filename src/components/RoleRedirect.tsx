import { Navigate } from "react-router-dom";
import { useKeycloak } from "@react-keycloak/web";
import { getPrimaryRole, getRedirectPathForRole } from "../auth/roles";

export default function RoleRedirect() {
  const { keycloak } = useKeycloak();

  if (!keycloak.authenticated || !keycloak.tokenParsed) {
    return null;
  }

  const role = getPrimaryRole(keycloak.tokenParsed);
  const path = role ? getRedirectPathForRole(role) : "/";

  return <Navigate to={path} replace />;
}
