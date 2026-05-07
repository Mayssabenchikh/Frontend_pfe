import type { DashboardFilters } from "../../api/dashboardService";

export function DashboardFilter({
  filters,
  onChange,
}: {
  filters: DashboardFilters;
  onChange: (filters: DashboardFilters) => void;
}) {
  const periodOptions = [
    { value: "week", label: "Semaine" },
    { value: "month", label: "Mois" },
    { value: "quarter", label: "Trimestre" },
    { value: "year", label: "Année" },
  ];

  return (
    <div className="dashboard-filter">
      <select value={filters.period ?? "year"} onChange={(e) => onChange({ ...filters, period: e.target.value })} className="dashboard-select">
        {periodOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
