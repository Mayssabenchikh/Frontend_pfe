import { useEffect, useState } from "react";
import { AcademicCapIcon, CheckCircleIcon, ClockIcon, XCircleIcon } from "@heroicons/react/24/outline";
import { http } from "../../api/http";

type EmployeeSkillDto = {
  id: number;
  skillId: number;
  skillName: string;
  categoryName: string;
  level: number;
  status: string;
  source: string;
};

export function EmployeeDashboard() {
  const [skills, setSkills] = useState<EmployeeSkillDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    http
      .get<EmployeeSkillDto[]>("/api/employee/me/skills")
      .then((res) => setSkills(Array.isArray(res.data) ? res.data : []))
      .catch(() => setSkills([]))
      .finally(() => setLoading(false));
  }, []);

  const total = skills.length;
  const validated = skills.filter((s) => s.status === "VALIDATED").length;
  const pending = skills.filter((s) => s.status === "EXTRACTED" || s.status === "QUIZ_PENDING").length;
  const failed = skills.filter((s) => s.status === "FAILED").length;

  const cards = [
    {
      label: "Total compétences",
      value: loading ? "…" : total,
      icon: <AcademicCapIcon className="w-5 h-5 text-indigo-600" />,
      iconClass: "text-indigo-600",
      iconBgClass: "bg-violet-100",
      note: undefined as string | undefined,
    },
    {
      label: "Validées",
      value: loading ? "…" : validated,
      icon: <CheckCircleIcon className="w-5 h-5 text-emerald-600" />,
      iconClass: "text-emerald-600",
      iconBgClass: "bg-emerald-100",
      note: "Compétences confirmées",
    },
    {
      label: "En attente",
      value: loading ? "…" : pending,
      icon: <ClockIcon className="w-5 h-5 text-amber-600" />,
      iconClass: "text-amber-600",
      iconBgClass: "bg-amber-100",
      note: "Quiz en cours ou à faire",
    },
    {
      label: "Échouées",
      value: loading ? "…" : failed,
      icon: <XCircleIcon className="w-5 h-5 text-red-500" />,
      iconClass: "text-red-500",
      iconBgClass: "bg-red-50",
      note: "Quiz non réussi",
    },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="relative rounded-2xl border border-violet-500/15 bg-white/50 p-6 overflow-hidden shadow-md cursor-default transition-all -translate-y-0.5"
          >
            <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-slate-50 pointer-events-none z-0" />
            <div className="flex items-start justify-between relative z-10">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-900 mb-2">
                  {card.label}
                </p>
                <p className="text-4xl font-extrabold text-violet-900 leading-none tabular-nums tracking-tight">
                  {card.value}
                </p>
                {card.note && <p className="text-xs text-slate-900 mt-2">{card.note}</p>}
              </div>
              <div className={`min-h-[44px] min-w-[44px] w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${card.iconBgClass} ${card.iconClass}`}>
                {card.icon}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
