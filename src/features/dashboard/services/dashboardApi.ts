import { http } from "../../../api/http";
import type { DashboardFilters, DashboardResponse, DashboardRole } from "../types/dashboard";

const endpoints: Record<DashboardRole, string> = {
  admin: "/api/dashboard/admin",
  manager: "/api/dashboard/manager",
  employee: "/api/dashboard/employee",
  "training-manager": "/api/dashboard/training-manager",
};

function cleanParams(filters: DashboardFilters) {
  return Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value !== undefined && value !== "" && value !== "all"),
  );
}

export const dashboardApi = {
  getDashboard(role: DashboardRole, filters: DashboardFilters) {
    return http.get<DashboardResponse>(endpoints[role], { params: cleanParams(filters) });
  },
};
