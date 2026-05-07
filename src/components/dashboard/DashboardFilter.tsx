import { useEffect, useState } from "react";
import type { DashboardFilterOptionsDto, DashboardFilters } from "../../api/dashboardService";

export function DashboardFilter({
  filters,
  options,
  onChange,
}: {
  filters: DashboardFilters;
  options?: DashboardFilterOptionsDto;
  onChange: (filters: DashboardFilters) => void;
}) {
  const [searchInput, setSearchInput] = useState(filters.search ?? "");

  useEffect(() => {
    setSearchInput(filters.search ?? "");
  }, [filters.search]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if ((filters.search ?? "") !== searchInput) {
        onChange({ ...filters, search: searchInput });
      }
    }, 280);
    return () => window.clearTimeout(timer);
  }, [filters, onChange, searchInput]);

  const periodOptions = options?.periods?.length ? options.periods : [
    { value: "week", label: "Semaine" },
    { value: "month", label: "Mois" },
    { value: "quarter", label: "Trimestre" },
    { value: "year", label: "Année" },
  ];
  const statusOptions = options?.statuses ?? [];

  return (
    <div className="dashboard-filter">
      <input
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
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
      {statusOptions.length ? (
        <select value={filters.status ?? "all"} onChange={(e) => onChange({ ...filters, status: e.target.value })} className="dashboard-select">
          <option value="all">Tous statuts</option>
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : null}
    </div>
  );
}
