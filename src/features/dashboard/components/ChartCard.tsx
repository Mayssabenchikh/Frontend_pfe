import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from "chart.js";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import type { DashboardChart } from "../types/dashboard";
import { chartData, chartOptions, hasChartData } from "../utils/chart";
import { ChartExplanation } from "./ChartExplanation";
import { EmptyState } from "./EmptyState";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend, Title);

const emptyMessages: Record<string, { title: string; description: string }> = {
  projectCoverage: {
    title: "Aucune couverture projet à afficher.",
    description: "Les résultats apparaîtront lorsque les projets auront des exigences et des membres affectés.",
  },
  frequentGaps: {
    title: "Aucun écart de compétence détecté.",
    description: "Les compétences manquantes apparaîtront lorsque les exigences projet dépasseront les niveaux disponibles.",
  },
  recommendationsByPriority: {
    title: "Aucune recommandation à afficher.",
    description: "Les recommandations seront calculées après l’analyse des compétences et des projets.",
  },
  completionByProgram: {
    title: "Aucune complétion disponible.",
    description: "Le taux de complétion apparaîtra après les premières progressions apprenants.",
  },
  submissionsByStatus: {
    title: "Aucune soumission à afficher.",
    description: "Les soumissions apparaîtront après les activités rendues par les apprenants.",
  },
};

export function ChartCard({ chart }: { chart: DashboardChart }) {
  const data = chartData(chart);
  const empty = emptyMessages[chart.key];

  return (
    <article className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm shadow-slate-200/60">
      <div className="h-72 min-h-0">
        {hasChartData(chart) ? (
          chart.type === "line" ? (
            <Line data={data} options={chartOptions<"line">(chart)} />
          ) : chart.type === "doughnut" ? (
            <Doughnut data={data} options={chartOptions<"doughnut">(chart)} />
          ) : (
            <Bar data={data} options={chartOptions<"bar">(chart)} />
          )
        ) : (
          <EmptyState title={empty?.title} description={empty?.description} />
        )}
      </div>
      <ChartExplanation text={chart.description} />
    </article>
  );
}
