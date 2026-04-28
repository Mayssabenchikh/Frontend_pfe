import { useLocation } from "react-router-dom";

/** Base path for learning program UI when mounted under /employee or /manager. */
export function useLearningProgramBasePath(): string {
  const { pathname } = useLocation();
  if (pathname.startsWith("/training-manager")) return "/training-manager";
  if (pathname.startsWith("/manager")) return "/manager";
  return "/employee";
}
