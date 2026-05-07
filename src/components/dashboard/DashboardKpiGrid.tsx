import { useMemo } from "react";
import type { KpiCardDto } from "../../api/dashboardService";
import { KpiCard } from "./KpiCard";

export function DashboardKpiGrid({ items }: { items?: KpiCardDto[] }) {
  const safeItems = useMemo(() => items ?? [], [items]);

  return (
    <div className="dashboard-kpi-grid">
      {safeItems.map((item) => <KpiCard key={item.key} item={item} />)}
    </div>
  );
}
