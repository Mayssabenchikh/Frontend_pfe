import type { DashboardFilters, FilterOptionDto } from "../../api/dashboardService";

export function DashboardFilter({
  filters,
  options,
  onChange,
  extraStatus = false,
}: {
  filters: DashboardFilters;
  options?: FilterOptionDto[];
  onChange: (filters: DashboardFilters) => void;
  extraStatus?: boolean;
}) {
  const periodOptions = options?.length ? options : [
    { value: "week", label: "Semaine" },
    { value: "month", label: "Mois" },
    { value: "quarter", label: "Trimestre" },
    { value: "year", label: "Année" },
  ];

  return (
    <div className="dashboard-filter">
      <input
        value={filters.search ?? ""}
        onChange={(e) => onChange({ ...filters, search: e.target.value })}
        placeholder="Rechercher..."
        className="dashboard-input min-w-0 flex-1"
      />
      <select value={filters.period ?? "month"} onChange={(e) => onChange({ ...filters, period: e.target.value })} className="dashboard-select">
        {periodOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {extraStatus ? (
        <select value={filters.status ?? "all"} onChange={(e) => onChange({ ...filters, status: e.target.value })} className="dashboard-select">
          <option value="all">Tous statuts</option>
          <option value="published">Publié</option>
          <option value="draft">Brouillon</option>
          <option value="risk">Risque</option>
        </select>
      ) : null}
    </div>
  );
}
