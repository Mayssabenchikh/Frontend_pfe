import { useEffect, useState } from "react";
import { AcademicCapIcon, CheckCircleIcon, ClockIcon, XCircleIcon } from "../../icons/heroicons/outline";
import { quizApi, type EmployeeSkillDto } from "../../api/quizApi";

export function EmployeeDashboard() {
  const [skills, setSkills] = useState<EmployeeSkillDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    quizApi
      .listEmployeeSkills()
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
    <div className="mx-auto max-w-5xl space-y-4 sm:space-y-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="relative cursor-default overflow-hidden rounded-2xl border border-violet-500/15 bg-white/50 p-4 shadow-md transition-all -translate-y-0.5 sm:p-6"
          >
            <div className="pointer-events-none absolute -right-6 -top-6 z-0 h-24 w-24 rounded-full bg-slate-50" />
            <div className="relative z-10 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-900 sm:mb-2 sm:text-xs">
                  {card.label}
                </p>
                <p className="text-3xl font-extrabold leading-none tracking-tight text-violet-900 tabular-nums sm:text-4xl">
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
