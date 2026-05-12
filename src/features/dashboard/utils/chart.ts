import type { ChartOptions, TooltipItem } from "chart.js";
import type { DashboardChart, DashboardChartDataset } from "../types/dashboard";
import { formatPriorityLabel, formatRoleLabel, formatStatusLabel } from "./format";

const fallbackColors = ["#2563EB", "#10B981", "#F59E0B", "#EF4444", "#06B6D4", "#6366F1", "#64748B", "#8B5CF6"];

function formatChartLabel(label: string, chart: DashboardChart) {
  const axis = `${chart.xAxisTitle} ${chart.yAxisTitle} ${chart.title}`.toLowerCase();
  if (axis.includes("rôle")) return formatRoleLabel(label);
  if (axis.includes("priorité")) return formatPriorityLabel(label);
  if (axis.includes("statut") || axis.includes("état")) return formatStatusLabel(label);
  return label;
}

export function hasChartData(chart: DashboardChart) {
  return Boolean(
    chart.labels.length > 0 &&
      chart.datasets.some((dataset) => dataset.data.some((value) => Number(value) !== 0)),
  );
}

export function chartData(chart: DashboardChart) {
  return {
    labels: chart.labels.map((label) => formatChartLabel(label, chart)),
    datasets: chart.datasets.map((dataset: DashboardChartDataset, index) => ({
      label: dataset.label,
      data: dataset.data,
      backgroundColor: dataset.backgroundColor?.length ? dataset.backgroundColor : fallbackColors,
      borderColor: dataset.borderColor?.length ? dataset.borderColor : fallbackColors,
      borderWidth: 2,
      borderRadius: chart.type === "bar" || chart.type === "horizontalBar" ? 8 : undefined,
      tension: chart.type === "line" ? 0.35 : undefined,
      fill: chart.type === "line",
      pointRadius: chart.type === "line" ? 3 : undefined,
      order: index,
    })),
  };
}

export function chartOptions<TType extends "bar" | "line" | "doughnut">(chart: DashboardChart): ChartOptions<TType> {
  const isCartesian = chart.type === "bar" || chart.type === "line" || chart.type === "horizontalBar";

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: chart.type === "horizontalBar" ? "y" : "x",
    plugins: {
      legend: {
        display: chart.datasets.length > 1 || chart.type === "doughnut",
        position: "bottom",
        labels: {
          boxWidth: 10,
          boxHeight: 10,
          color: "#475569",
          font: { size: 11, weight: 600 },
        },
      },
      title: {
        display: true,
        text: chart.title,
        color: "#0f172a",
        font: { size: 13, weight: 700 },
      },
      tooltip: {
        backgroundColor: "#111827",
        padding: 12,
        cornerRadius: 12,
        titleFont: { size: 12, weight: 700 },
        bodyFont: { size: 12, weight: 500 },
        callbacks: {
          label(context: TooltipItem<TType>) {
            const label = (context.dataset as { label?: string }).label;
            const datasetLabel = label ? `${label} : ` : "";
            const parsed = context.parsed as number | { x?: number; y?: number };
            const value = typeof parsed === "number" ? parsed : parsed.x ?? parsed.y ?? 0;
            const suffix = chart.xAxisTitle.includes("%") || chart.yAxisTitle.includes("%") ? "%" : "";
            return `${datasetLabel}${value}${suffix}`;
          },
        },
      },
    },
    scales: isCartesian
      ? {
          x: {
            grid: { display: false },
            ticks: { color: "#64748b", font: { size: 11, weight: 600 } },
            title: {
              display: true,
              text: chart.xAxisTitle,
              color: "#475569",
              font: { size: 12, weight: 700 },
            },
          },
          y: {
            grid: { color: "rgba(148, 163, 184, .18)" },
            ticks: { color: "#64748b", font: { size: 11, weight: 600 } },
            title: {
              display: true,
              text: chart.yAxisTitle,
              color: "#475569",
              font: { size: 12, weight: 700 },
            },
          },
        }
      : undefined,
  };

  return options as ChartOptions<TType>;
}
