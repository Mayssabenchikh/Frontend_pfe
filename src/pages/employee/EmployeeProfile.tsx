import { useEffect, useState } from "react";
import { http } from "../../api/http";
import { ArrowPathIcon } from "@heroicons/react/24/outline";

export type EmployeeSkillDto = {
  id: number;
  skillId: number;
  skillName: string;
  categoryName: string;
  level: number;
  status: string;
  source: string;
};

const STATUS_LABELS: Record<string, string> = {
  EXTRACTED: "Extrait (en attente de quiz)",
  QUIZ_PENDING: "Quiz en attente",
  VALIDATED: "Validé",
  FAILED: "Échec au quiz",
};

export function EmployeeProfile() {
  const [skills, setSkills] = useState<EmployeeSkillDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    http.get<EmployeeSkillDto[]>("/api/employee/me/skills")
      .then((res) => { setSkills(Array.isArray(res.data) ? res.data : []); setError(null); })
      .catch(() => { setError("Erreur lors du chargement des compétences"); setSkills([]); })
      .finally(() => setLoading(false));
  }, []);

  const statusClass = (status: string) =>
    status === "VALIDATED"
      ? "bg-green-100 text-green-800"
      : status === "FAILED"
        ? "bg-red-100 text-red-900"
        : "bg-amber-100 text-amber-800";

  return (
    <div className="p-6">
      <h2 className="mb-4 text-xl font-bold">Mes compétences</h2>
      {loading && (
        <div className="flex items-center gap-2 text-slate-500">
          <ArrowPathIcon className="h-5 w-5 animate-spin" />
          Chargement...
        </div>
      )}
      {error && <p className="text-sm text-red-500">{error}</p>}
      {!loading && !error && skills.length === 0 && (
        <p className="text-sm text-slate-400">
          Aucune compétence pour le moment. Les compétences seront extraites de votre CV (fonctionnalité à venir).
        </p>
      )}
      {!loading && !error && skills.length > 0 && (
        <div className="flex flex-col gap-2">
          {skills.map((s) => (
            <div
              key={s.id}
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
            >
              <div>
                <span className="text-sm font-semibold text-slate-800">{s.skillName}</span>
                <span className="ml-2 text-xs text-slate-500">{s.categoryName}</span>
                <span className="ml-2 text-xs text-slate-400">Niveau {s.level}</span>
              </div>
              <span className={`rounded-md px-2 py-1 text-[11px] font-medium ${statusClass(s.status)}`}>
                {STATUS_LABELS[s.status] ?? s.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
