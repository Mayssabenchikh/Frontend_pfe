import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faBookOpen,
  faBriefcase,
  faChartSimple,
  faCircleCheck,
  faClipboardCheck,
  faClipboardList,
  faGraduationCap,
  faLayerGroup,
  faListCheck,
  faUser,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { DashboardKpi } from "../types/dashboard";
import { formatNumber } from "../utils/format";

const toneClasses: Record<
  string,
  { accent: string; iconBg: string; iconRing: string; iconText: string }
> = {
  violet: {
    accent: "bg-fuchsia-500",
    iconBg: "bg-fuchsia-50",
    iconRing: "ring-fuchsia-100",
    iconText: "text-fuchsia-600",
  },
  blue: {
    accent: "bg-indigo-500",
    iconBg: "bg-blue-50",
    iconRing: "ring-blue-100",
    iconText: "text-indigo-600",
  },
  green: {
    accent: "bg-emerald-500",
    iconBg: "bg-emerald-50",
    iconRing: "ring-emerald-100",
    iconText: "text-emerald-500",
  },
  orange: {
    accent: "bg-amber-400",
    iconBg: "bg-amber-50",
    iconRing: "ring-amber-100",
    iconText: "text-orange-500",
  },
  red: {
    accent: "bg-orange-600",
    iconBg: "bg-orange-50",
    iconRing: "ring-orange-100",
    iconText: "text-orange-600",
  },
  cyan: {
    accent: "bg-teal-400",
    iconBg: "bg-cyan-50",
    iconRing: "ring-cyan-100",
    iconText: "text-teal-500",
  },
  indigo: {
    accent: "bg-violet-500",
    iconBg: "bg-violet-50",
    iconRing: "ring-violet-100",
    iconText: "text-violet-600",
  },
  gray: {
    accent: "bg-slate-400",
    iconBg: "bg-slate-50",
    iconRing: "ring-slate-100",
    iconText: "text-slate-500",
  },
};

const kpiVisuals: Record<string, { icon: IconDefinition; tone: keyof typeof toneClasses }> = {
  declaredSkills: { icon: faBookOpen, tone: "violet" },
  validatedSkills: { icon: faCircleCheck, tone: "green" },
  averageLevel: { icon: faChartSimple, tone: "blue" },
  quizPassed: { icon: faClipboardCheck, tone: "orange" },
  recommendations: { icon: faGraduationCap, tone: "violet" },
  inProgressTrainings: { icon: faBookOpen, tone: "red" },
  pendingActivities: { icon: faUser, tone: "cyan" },
  assignedProjects: { icon: faBriefcase, tone: "blue" },
};

const toneIcons: Record<string, IconDefinition> = {
  violet: faLayerGroup,
  blue: faChartSimple,
  green: faCircleCheck,
  orange: faClipboardCheck,
  red: faClipboardList,
  cyan: faListCheck,
  indigo: faGraduationCap,
  gray: faLayerGroup,
};

export function KpiCard({ kpi }: { kpi: DashboardKpi }) {
  const visual = kpiVisuals[kpi.key];
  const toneKey = visual?.tone ?? kpi.tone ?? "violet";
  const tone = toneClasses[toneKey] ?? toneClasses.violet;
  const icon = visual?.icon ?? toneIcons[toneKey] ?? faLayerGroup;

  return (
    <article className="relative min-h-[112px] overflow-hidden rounded-xl border border-slate-200/80 bg-white px-4 pb-4 pt-5 shadow-[0_8px_22px_-14px_rgba(15,23,42,0.45)]">
      <div className="flex items-start gap-4">
        <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${tone.iconBg} ${tone.iconText} ring-1 ${tone.iconRing}`}>
          <FontAwesomeIcon icon={icon} className="h-6 w-6" />
        </span>

        <div className="min-w-0 pt-0.5">
          <p className="truncate text-[10px] font-extrabold uppercase leading-4 tracking-wide text-slate-500">{kpi.label}</p>
          <p className="mt-0.5 text-[28px] font-black leading-none tracking-normal text-slate-950">{formatNumber(kpi.value, kpi.unit)}</p>
          {kpi.description ? <p className="mt-2 line-clamp-2 text-[11px] font-medium leading-4 text-slate-500">{kpi.description}</p> : null}
        </div>
      </div>
      <span className={`absolute inset-x-3 bottom-0 h-0.5 rounded-full ${tone.accent}`} />
    </article>
  );
}
