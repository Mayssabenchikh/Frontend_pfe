export type DashboardTone = "violet" | "blue" | "green" | "orange" | "red" | "gray" | "cyan" | "indigo";

export type DashboardChartType = "bar" | "line" | "doughnut" | "horizontalBar";

export type DashboardKpi = {
  key: string;
  label: string;
  value: number;
  unit?: string | null;
  description?: string | null;
  tone?: DashboardTone | string | null;
};

export type DashboardChartDataset = {
  label: string;
  data: number[];
  backgroundColor?: string[] | null;
  borderColor?: string[] | null;
};

export type DashboardChart = {
  key: string;
  title: string;
  description?: string | null;
  type: DashboardChartType;
  xAxisTitle: string;
  yAxisTitle: string;
  labels: string[];
  datasets: DashboardChartDataset[];
};

export type DashboardTableColumn = {
  key: string;
  label: string;
  type: "text" | "status" | "number" | "date" | string;
};

export type DashboardTableRow = {
  id: string;
  title: string;
  subtitle?: string | null;
  status?: string | null;
  primaryValue?: number | null;
  secondaryValue?: number | null;
  date?: string | null;
  link?: string | null;
  cells?: Record<string, string | number | boolean | null | undefined> | null;
};

export type DashboardTable = {
  key: string;
  title: string;
  description?: string | null;
  columns: DashboardTableColumn[];
  rows: DashboardTableRow[];
};

export type DashboardSection = {
  key: string;
  title: string;
  description?: string | null;
  kpis: DashboardKpi[];
  charts: DashboardChart[];
  tables: DashboardTable[];
};

export type DashboardResponse = {
  title: string;
  description: string;
  generatedAt: string;
  sections: DashboardSection[];
};

export type DashboardFilters = {
  period?: "week" | "month" | "quarter" | "year";
  status?: string;
  search?: string;
};

export type DashboardRole = "admin" | "manager" | "employee" | "training-manager";
