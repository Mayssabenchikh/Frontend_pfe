import { useEffect, useState } from "react";
import { ClipboardDocumentListIcon, PlayCircleIcon, CheckCircleIcon, PencilSquareIcon } from "@heroicons/react/24/outline";
import { projectsApi, type ProjectDto, type ProjectPage } from "../../api/projectsApi";

export function ManagerDashboard() {
  const [projects, setProjects] = useState<ProjectDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    projectsApi
      .list({ page: 0, size: 100 })
      .then((res) => {
        const data = res.data as ProjectPage;
        setProjects(data.content ?? []);
      })
      .catch(() => setProjects([]))
      .finally(() => setLoading(false));
  }, []);

  const total = projects.length;
  const drafts = projects.filter((p) => p.status === "DRAFT").length;
  const actives = projects.filter((p) => p.status === "ACTIVE").length;
  const closed = projects.filter((p) => p.status === "CLOSED").length;

  const cards = [
    {
      label: "Total projets",
      value: loading ? "…" : total,
      icon: <ClipboardDocumentListIcon className="w-5 h-5 text-indigo-600" />,
      iconClass: "text-indigo-600",
      iconBgClass: "bg-violet-100",
      note: undefined as string | undefined,
    },
    {
      label: "Projets actifs",
      value: loading ? "…" : actives,
      icon: <PlayCircleIcon className="w-5 h-5 text-emerald-600" />,
      iconClass: "text-emerald-600",
      iconBgClass: "bg-emerald-100",
      note: "En cours d'exécution",
    },
    {
      label: "Projets clôturés",
      value: loading ? "…" : closed,
      icon: <CheckCircleIcon className="w-5 h-5 text-slate-500" />,
      iconClass: "text-slate-500",
      iconBgClass: "bg-slate-100",
      note: "Terminés avec succès",
    },
    {
      label: "Brouillons",
      value: loading ? "…" : drafts,
      icon: <PencilSquareIcon className="w-5 h-5 text-violet-700" />,
      iconClass: "text-violet-700",
      iconBgClass: "bg-violet-50",
      note: "En préparation",
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

