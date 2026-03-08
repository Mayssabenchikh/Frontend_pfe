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

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Mes compétences</h2>
      {loading && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#64748b" }}>
          <ArrowPathIcon className="w-5 h-5 animate-spin" />
          Chargement...
        </div>
      )}
      {error && <p style={{ color: "#ef4444", fontSize: 14 }}>{error}</p>}
      {!loading && !error && skills.length === 0 && (
        <p style={{ color: "#94a3b8", fontSize: 14 }}>
          Aucune compétence pour le moment. Les compétences seront extraites de votre CV (fonctionnalité à venir).
        </p>
      )}
      {!loading && !error && skills.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {skills.map((s) => (
            <div
              key={s.id}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "12px 16px", borderRadius: 10, background: "#f8fafc", border: "1px solid #e2e8f0",
              }}
            >
              <div>
                <span style={{ fontSize: 14, fontWeight: 600, color: "#1e293b" }}>{s.skillName}</span>
                <span style={{ fontSize: 12, color: "#64748b", marginLeft: 8 }}>{s.categoryName}</span>
                <span style={{ fontSize: 12, color: "#94a3b8", marginLeft: 8 }}>Niveau {s.level}</span>
              </div>
              <span
                style={{
                  fontSize: 11,
                  padding: "4px 8px",
                  borderRadius: 6,
                  background: s.status === "VALIDATED" ? "#dcfce7" : s.status === "FAILED" ? "#fee2e2" : "#fef3c7",
                  color: s.status === "VALIDATED" ? "#166534" : s.status === "FAILED" ? "#991b1b" : "#92400e",
                }}
              >
                {STATUS_LABELS[s.status] ?? s.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
