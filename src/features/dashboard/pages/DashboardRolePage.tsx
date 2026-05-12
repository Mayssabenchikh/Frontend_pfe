import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "../services/dashboardApi";
import type { DashboardFilters, DashboardRole } from "../types/dashboard";
import { ChartCard } from "../components/ChartCard";
import { DashboardFilters as DashboardFiltersControl } from "../components/DashboardFilters";
import { DashboardGrid } from "../components/DashboardGrid";
import { DashboardHeader } from "../components/DashboardHeader";
import { DashboardPageLayout } from "../components/DashboardPageLayout";
import { DataTableCard } from "../components/DataTableCard";
import { ErrorState } from "../components/ErrorState";
import { KpiCard } from "../components/KpiCard";
import { LoadingState } from "../components/LoadingState";

type DashboardRolePageProps = {
  role: DashboardRole;
};

export function DashboardRolePage({ role }: DashboardRolePageProps) {
  const [filters, setFilters] = useState<DashboardFilters>({ period: "year" });
  const query = useQuery({
    queryKey: ["dashboard", role, filters],
    queryFn: () => dashboardApi.getDashboard(role, filters).then((res) => res.data),
  });

  if (query.isLoading) return <LoadingState />;

  if (query.isError || !query.data) {
    const message = query.error instanceof Error ? query.error.message : "Erreur de chargement";
    return (
      <DashboardPageLayout>
        <ErrorState message={message} onRetry={() => void query.refetch()} />
      </DashboardPageLayout>
    );
  }

  const dashboard = query.data;

  return (
    <DashboardPageLayout>
      <DashboardHeader
        title={dashboard.title}
        description={dashboard.description}
        generatedAt={dashboard.generatedAt}
        actions={<DashboardFiltersControl value={filters} onChange={setFilters} />}
      />

      {dashboard.sections.map((section) => (
        <section key={section.key} className="space-y-4">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-slate-950">{section.title}</h2>
            {section.description ? <p className="mt-1 text-sm leading-6 text-slate-600">{section.description}</p> : null}
          </div>

          {section.kpis.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {section.kpis.map((kpi) => (
                <KpiCard key={kpi.key} kpi={kpi} />
              ))}
            </div>
          ) : null}

          {section.charts.length > 0 ? (
            <DashboardGrid columns={section.charts.length % 3 === 0 ? "three" : "two"}>
              {section.charts.map((chart) => (
                <ChartCard key={chart.key} chart={chart} />
              ))}
            </DashboardGrid>
          ) : null}

          {section.tables.length > 0 ? (
            <DashboardGrid>
              {section.tables.map((table) => (
                <DataTableCard key={table.key} table={table} />
              ))}
            </DashboardGrid>
          ) : null}
        </section>
      ))}
    </DashboardPageLayout>
  );
}
