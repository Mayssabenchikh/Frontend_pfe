import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  RadialLinearScale,
  Tooltip,
} from "chart.js";
import { Bar, Doughnut, Line, Radar } from "react-chartjs-2";
import type { ChartDataDto } from "../../api/dashboardService";
import { translateDashboardText } from "./dashboardText";
import { EmptyState } from "./EmptyState";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, RadialLinearScale, Tooltip, Legend, Filler);

type ChartKind = "bar" | "line" | "doughnut" | "radar" | "horizontalBar";

const baseOptions = {
  responsive: true,
  maintainAspectRatio: false,
  animation: { duration: 850, easing: "easeOutQuart" },
  plugins: {
    legend: { position: "bottom", labels: { boxWidth: 10, boxHeight: 10, color: "#475569", font: { size: 11, weight: 700 } } },
    tooltip: {
      backgroundColor: "#111827",
      padding: 12,
      titleFont: { size: 12, weight: 700 },
      bodyFont: { size: 12, weight: 500 },
      cornerRadius: 12,
    },
  },
  scales: {
    x: { grid: { display: false }, ticks: { color: "#64748b", font: { size: 11, weight: 600 } } },
    y: { grid: { color: "rgba(148, 163, 184, .18)" }, ticks: { color: "#64748b", font: { size: 11, weight: 600 } } },
  },
};

export function ChartCard({ title, subtitle, data, type = "bar" }: { title: string; subtitle?: string; data?: ChartDataDto; type?: ChartKind }) {
  const hasData = Boolean(data?.labels?.length && data.datasets?.some((dataset) => dataset.data?.some((value) => Number(value) > 0)));
  const normalizedData = {
    labels: data?.labels ?? [],
    datasets: (data?.datasets ?? []).map((dataset) => ({
      ...dataset,
      borderWidth: 2,
      borderRadius: type === "bar" || type === "horizontalBar" ? 8 : undefined,
      tension: type === "line" ? 0.35 : undefined,
      fill: type === "line" ? true : undefined,
    })),
  };
  const options = (type === "horizontalBar" ? { ...baseOptions, indexAxis: "y" as const } : baseOptions) as any;

  return (
    <article className="dashboard-card dashboard-fade-up">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-extrabold text-slate-900">{translateDashboardText(title)}</h2>
          {subtitle ? <p className="mt-1 text-xs text-slate-500">{translateDashboardText(subtitle)}</p> : null}
        </div>
      </div>
      <div className="h-72 min-h-0">
        {hasData ? (
          type === "line" ? <Line data={normalizedData} options={options} /> :
          type === "doughnut" ? <Doughnut data={normalizedData} options={options} /> :
          type === "radar" ? <Radar data={normalizedData} options={options} /> :
          <Bar data={normalizedData} options={options} />
        ) : (
          <EmptyState title="Aucune métrique" description="Les graphiques se rempliront avec l'activité de la plateforme." />
        )}
      </div>
    </article>
  );
}
