import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { projectsApi, type ProjectDto } from "../../api/projectsApi";

export function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<ProjectDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const numId = id ? parseInt(id, 10) : NaN;
    if (isNaN(numId)) {
      setError("ID invalide");
      setLoading(false);
      return;
    }
    projectsApi.get(numId)
      .then((res) => { setProject(res.data ?? null); setError(null); })
      .catch(() => { setError("Projet non trouvé"); setProject(null); })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div style={{ padding: 24 }}>Chargement...</div>;
  if (error || !project) return <div style={{ padding: 24, color: "#ef4444" }}>{error ?? "Projet non trouvé"}</div>;

  return (
    <div style={{ padding: 24, maxWidth: 800, margin: "0 auto" }}>
      <button
        type="button"
        onClick={() => navigate("/manager/projects")}
        style={{
          display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 20,
          padding: "8px 12px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff",
          cursor: "pointer", fontSize: 14, color: "#64748b",
        }}
      >
        <ArrowLeftIcon className="w-4 h-4" />
        Retour aux projets
      </button>

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#1e293b", marginBottom: 8 }}>{project.name}</h1>
        <span style={{ fontSize: 12, color: "#94a3b8" }}>Statut: {project.status}</span>
        {project.description && (
          <p style={{ fontSize: 14, color: "#64748b", marginTop: 12 }}>{project.description}</p>
        )}
      </div>

      <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Compétences requises</h2>
      {!project.requirements || project.requirements.length === 0 ? (
        <p style={{ color: "#94a3b8", fontSize: 14 }}>Aucune compétence requise définie.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {project.requirements.map((r) => (
            <div
              key={r.id}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "12px 16px", borderRadius: 10, background: "#f8fafc", border: "1px solid #e2e8f0",
              }}
            >
              <span style={{ fontSize: 14, fontWeight: 600 }}>{r.skillName}</span>
              <span style={{ fontSize: 12, color: "#64748b" }}>{r.categoryName}</span>
              <span style={{ fontSize: 12, color: "#94a3b8" }}>Niveau min: {r.levelMin}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
