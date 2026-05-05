import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const POST_LOGIN_REDIRECT_KEY = "skillify_post_login_redirect";

// Routes that should NOT be saved as they are just parent containers
const EXCLUDED_PATHS = [
  "/training-manager",
  "/manager",
  "/employee",
  "/admin",
  "/training-manager/programs",
  "/training-manager/submissions",
  "/manager/projects",
  "/employee/projects",
];

/**
 * Tracks location changes and persists valid deep-links to sessionStorage.
 * This ensures that when Keycloak redirects after refresh, we restore the original page.
 * Only saves "leaf" routes with actual content (not just container routes).
 */
export function LocationTracker() {
  const location = useLocation();

  useEffect(() => {
    try {
      const currentPath = `${location.pathname}${location.search}${location.hash}`;
      
      // Don't save root path or paths with Keycloak callback parameters
      const isRootPath = currentPath === "/" || currentPath === "/#";
      const hasKeycloakCallback = (currentPath.includes("code=") && currentPath.includes("state=")) ||
                                   (currentPath.includes("session_state=") && currentPath.includes("iss="));
      
      // Don't save excluded container paths
      const isExcludedPath = EXCLUDED_PATHS.some(excluded => 
        currentPath === excluded || currentPath.startsWith(excluded + "/")
      );
      
      // Only save if it's not root, not a callback, and not an excluded container
      // But DO save if the path has sub-routes (e.g., /training-manager/programs/UUID)
      const hasDeepPath = EXCLUDED_PATHS.some(excluded => 
        currentPath.startsWith(excluded + "/") && 
        currentPath.length > excluded.length + 1
      );
      
      if (!isRootPath && !hasKeycloakCallback && (hasDeepPath || !isExcludedPath)) {
        sessionStorage.setItem(POST_LOGIN_REDIRECT_KEY, currentPath);
      }
    } catch {
      // ignore storage errors
    }
  }, [location]);

  return null;
}
