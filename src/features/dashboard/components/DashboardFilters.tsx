import type { DashboardFilters } from "../types/dashboard";

type DashboardFiltersProps = {
  value: DashboardFilters;
  onChange: (next: DashboardFilters) => void;
};

const periods = [
  { value: "week", label: "Semaine" },
  { value: "month", label: "Mois" },
  { value: "quarter", label: "Trimestre" },
  { value: "year", label: "Année" },
] as const;

const statuses = [
  { value: "all", label: "Tous les statuts" },
  { value: "active", label: "Actif" },
  { value: "in-progress", label: "En cours" },
  { value: "pending", label: "En attente" },
  { value: "completed", label: "Terminé" },
  { value: "draft", label: "Brouillon" },
  { value: "published", label: "Publié" },
  { value: "risk", label: "À risque / refusé" },
] as const;

export function DashboardFilters({ value, onChange }: DashboardFiltersProps) {
  return (
    <div className="flex w-full flex-col gap-2 rounded-2xl border border-slate-200 bg-slate-50/80 p-2 sm:w-auto sm:min-w-[360px] sm:flex-row">
      <select
        value={value.period ?? "year"}
        onChange={(event) => onChange({ ...value, period: event.target.value as DashboardFilters["period"] })}
        className="min-h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-violet-300 focus:ring-4 focus:ring-violet-100"
      >
        {periods.map((period) => (
          <option key={period.value} value={period.value}>
            {period.label}
          </option>
        ))}
      </select>
      <select
        value={value.status ?? "all"}
        onChange={(event) => onChange({ ...value, status: event.target.value })}
        className="min-h-10 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-violet-300 focus:ring-4 focus:ring-violet-100"
      >
        {statuses.map((status) => (
          <option key={status.value} value={status.value}>
            {status.label}
          </option>
        ))}
      </select>
    </div>
  );
}
