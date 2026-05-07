import { useMemo } from "react";
import type { KpiCardDto } from "../../api/dashboardService";
import { KpiCard } from "./KpiCard";
import type { ExplanationContent } from "./dashboardExplanations";

export function DashboardKpiGrid({ items, explanationMap }: { items?: KpiCardDto[]; explanationMap?: Record<string, ExplanationContent> }) {
  const safeItems = useMemo(() => items ?? [], [items]);

  return (
    <div className="dashboard-kpi-grid">
      {safeItems.map((item) => (
        <KpiCard 
          key={item.key} 
          item={item} 
          explanation={explanationMap?.[item.key] ?? null}
        />
      ))}
    </div>
  );
}
