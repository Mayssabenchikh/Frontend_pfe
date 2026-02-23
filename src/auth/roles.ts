export type AppRole = "ADMIN" | "MANAGER" | "EMPLOYEE";

export function getRealmRoles(tokenParsed: unknown): string[] {
  if (!tokenParsed || typeof tokenParsed !== "object") return [];
  const realmAccess = (tokenParsed as Record<string, unknown>).realm_access;
  if (!realmAccess || typeof realmAccess !== "object") return [];
  const roles = (realmAccess as Record<string, unknown>).roles;
  if (!Array.isArray(roles)) return [];
  return roles.filter((r): r is string => typeof r === "string");
}

export function getPrimaryRole(tokenParsed: unknown): AppRole | null {
  const roles = getRealmRoles(tokenParsed);
  if (roles.includes("ADMIN")) return "ADMIN";
  if (roles.includes("MANAGER")) return "MANAGER";
  if (roles.includes("EMPLOYEE")) return "EMPLOYEE";
  return null;
}

export function getRedirectPathForRole(role: AppRole): string {
  switch (role) {
    case "ADMIN":
      return "/admin";
    case "MANAGER":
      return "/manager";
    case "EMPLOYEE":
      return "/employee";
    default:
      return "/";
  }
}
