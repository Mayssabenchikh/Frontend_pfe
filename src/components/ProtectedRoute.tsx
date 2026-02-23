import { Navigate, useLocation } from "react-router-dom";
import { useKeycloak } from "@react-keycloak/web";
import { getRealmRoles } from "../auth/roles";
import type { AppRole } from "../auth/roles";

type Props = {
  children: React.ReactNode;
  allowedRoles: AppRole[];
};

export default function ProtectedRoute({ children, allowedRoles }: Props) {
  const { keycloak } = useKeycloak();
  const location = useLocation();

  if (!keycloak.authenticated) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  const roles = getRealmRoles(keycloak.tokenParsed ?? undefined);
  const hasRole = allowedRoles.some((r) => roles.includes(r));

  if (!hasRole) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
