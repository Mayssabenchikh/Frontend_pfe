import { translateDashboardText } from "./dashboardText";

const statusStyles: Record<string, string> = {
  "terminé": "border-emerald-200 bg-emerald-50 text-emerald-700",
  completed: "border-emerald-200 bg-emerald-50 text-emerald-700",
  "en cours": "border-blue-200 bg-blue-50 text-blue-700",
  in_progress: "border-blue-200 bg-blue-50 text-blue-700",
  recommandé: "border-violet-100 bg-violet-50 text-violet-600",
  "à corriger": "border-orange-200 bg-orange-50 text-orange-700",
  "à faire": "border-orange-200 bg-orange-50 text-orange-700",
  brouillon: "border-slate-200 bg-slate-50 text-slate-600",
  publié: "border-emerald-200 bg-emerald-50 text-emerald-700",
  "faible niveau": "border-rose-200 bg-rose-50 text-rose-700",
  "bon niveau": "border-emerald-200 bg-emerald-50 text-emerald-700",
  risque: "border-rose-200 bg-rose-50 text-rose-700",
  validé: "border-emerald-200 bg-emerald-50 text-emerald-700",
  validated: "border-emerald-200 bg-emerald-50 text-emerald-700",
  "en attente": "border-orange-200 bg-orange-50 text-orange-700",
  "à renforcer": "border-amber-200 bg-amber-50 text-amber-700",
  démarrage: "border-sky-200 bg-sky-50 text-sky-700",
};

export function StatusBadge({ status }: { status?: string | null }) {
  if (!status) return null;
  const normalized = status.toLowerCase();
  const classes = statusStyles[normalized] ?? "border-slate-200 bg-slate-50 text-slate-600";
  return (
    <span className={`inline-flex max-w-full items-center rounded-full border px-2.5 py-1 text-[11px] font-bold capitalize leading-none transition hover:-translate-y-px ${classes}`}>
      {translateDashboardText(status.replaceAll("_", " ").toLowerCase())}
    </span>
  );
}
