import { useState, useEffect } from "react";
import { skillsApi } from "../../api/skillsApi";
import type { SkillDto } from "../admin/types";

type Props = {
  onClose: () => void;
  onSubmit: (data: { name: string; description?: string; status?: string; requirements?: { skillId: number; levelMin: number }[] }) => Promise<void>;
};

export function CreateProjectModal({ onClose, onSubmit }: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("DRAFT");
  const [skills, setSkills] = useState<SkillDto[]>([]);
  const [requirements, setRequirements] = useState<{ skillId: number; levelMin: number }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    skillsApi.listSkills().then((r) => setSkills(r.data ?? [])).catch(() => {});
  }, []);

  const addRequirement = () => {
    const used = new Set(requirements.map((r) => r.skillId));
    const skill = skills.find((s) => !used.has(s.id));
    if (!skill) return;
    setRequirements((prev) => [...prev, { skillId: skill.id, levelMin: skill.levelMin }]);
  };

  const removeRequirement = (skillId: number) => {
    setRequirements((prev) => prev.filter((x) => x.skillId !== skillId));
  };

  const setReqLevel = (skillId: number, levelMin: number) => {
    setRequirements((prev) =>
      prev.map((x) => (x.skillId === skillId ? { ...x, levelMin } : x))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    onSubmit({
      name: name.trim(),
      description: description.trim() || undefined,
      status: status || "DRAFT",
      requirements: requirements.length ? requirements : undefined,
    })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.4)" }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: 24, maxWidth: 500, width: "100%", maxHeight: "90vh", overflow: "auto" }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Nouveau projet</h3>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Nom</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nom du projet"
              style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid #e2e8f0" }}
              required
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description..."
              rows={3}
              style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid #e2e8f0" }}
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Statut</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid #e2e8f0" }}
            >
              <option value="DRAFT">Brouillon</option>
              <option value="ACTIVE">Actif</option>
              <option value="CLOSED">Clôturé</option>
            </select>
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <label style={{ fontSize: 12, fontWeight: 600 }}>Compétences requises</label>
              <button
                type="button"
                onClick={addRequirement}
                disabled={skills.length === 0}
                style={{ fontSize: 12, padding: "4px 8px", border: "1px solid #e2e8f0", borderRadius: 6, background: "#fff", cursor: "pointer" }}
              >
                + Ajouter
              </button>
            </div>
            {requirements.map((r) => {
              const skill = skills.find((s) => s.id === r.skillId);
              return (
                <div
                  key={r.skillId}
                  style={{
                    display: "flex", alignItems: "center", gap: 8, marginBottom: 8,
                    padding: "8px 12px", borderRadius: 8, background: "#f8fafc", border: "1px solid #e2e8f0",
                  }}
                >
                  <select
                    value={r.skillId}
                    onChange={(e) => {
                      const sid = Number(e.target.value);
                      setRequirements((prev) => {
                        const rest = prev.filter((x) => x.skillId !== r.skillId);
                        const s = skills.find((x) => x.id === sid);
                        return [...rest, { skillId: sid, levelMin: s ? s.levelMin : 1 }];
                      });
                    }}
                    style={{ flex: 1, padding: "6px 10px", borderRadius: 6, border: "1px solid #e2e8f0" }}
                  >
                    {skills.map((s) => (
                      <option key={s.id} value={s.id}>{s.name} ({s.categoryName})</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min={skill?.levelMin ?? 1}
                    max={skill?.levelMax ?? 5}
                    value={r.levelMin}
                    onChange={(e) => setReqLevel(r.skillId, Math.max(skill?.levelMin ?? 1, Math.min(skill?.levelMax ?? 5, Number(e.target.value) || 1)))}
                    style={{ width: 60, padding: "6px 8px", borderRadius: 6, border: "1px solid #e2e8f0" }}
                  />
                  <button
                    type="button"
                    onClick={() => removeRequirement(r.skillId)}
                    style={{ padding: 4, color: "#ef4444", border: "none", background: "none", cursor: "pointer" }}
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>

          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button type="button" onClick={onClose} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff" }}>
              Annuler
            </button>
            <button type="submit" disabled={loading || !name.trim()} style={{ padding: "8px 16px", borderRadius: 8, background: "#4338ca", color: "#fff", border: "none" }}>
              {loading ? "Création..." : "Créer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
