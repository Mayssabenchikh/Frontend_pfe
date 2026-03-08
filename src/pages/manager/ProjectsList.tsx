import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { PlusIcon, MagnifyingGlassIcon, EyeIcon, TrashIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import { projectsApi, type ProjectDto } from "../../api/projectsApi";
import { CreateProjectModal } from "./CreateProjectModal";
import { ConfirmModal } from "../../components/ConfirmModal";

export function ProjectsList() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<ProjectDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [createModal, setCreateModal] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<ProjectDto | null>(null);

  const load = () => {
    setLoading(true);
    projectsApi.list(search || undefined)
      .then((res) => setProjects(res.data ?? []))
      .catch(() => setProjects([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [search]);

  const handleCreate = (data: { name: string; description?: string; status?: string; requirements?: { skillId: number; levelMin: number }[] }) => {
    return projectsApi.create(data)
      .then((res) => {
        setCreateModal(false);
        load();
        toast.success("Projet créé");
        if (res.data?.id) navigate(`/manager/projects/${res.data.id}`);
      });
  };

  const handleDeleteClick = (p: ProjectDto) => setDeleteConfirm(p);

  const confirmDelete = () => {
    if (!deleteConfirm) return;
    const p = deleteConfirm;
    setDeleteConfirm(null);
    setDeletingId(p.id);
    projectsApi.delete(p.id)
      .then(() => {
        load();
        toast.success("Projet supprimé");
      })
      .catch((err) => toast.error(err.response?.data?.error ?? "Erreur"))
      .finally(() => setDeletingId(null));
  };

  return (
    <div style={{ padding: 24, maxWidth: 1000, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#1e293b" }}>Projets</h1>
        <button
          type="button"
          onClick={() => setCreateModal(true)}
          style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "10px 18px", borderRadius: 10, border: "none",
            fontSize: 14, fontWeight: 600, color: "#fff",
            background: "linear-gradient(135deg,#4338ca,#6d28d9)",
            cursor: "pointer",
          }}
        >
          <PlusIcon className="w-4 h-4" />
          Nouveau projet
        </button>
      </div>

      <div style={{ marginBottom: 16, display: "flex", gap: 8 }}>
        <div style={{ position: "relative", flex: 1, maxWidth: 320 }}>
          <MagnifyingGlassIcon className="w-4 h-4" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un projet..."
            style={{
              width: "100%", padding: "10px 14px 10px 40px", borderRadius: 10, border: "1px solid #e2e8f0",
            }}
          />
        </div>
      </div>

      {loading && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#64748b" }}>
          <ArrowPathIcon className="w-5 h-5 animate-spin" />
          Chargement...
        </div>
      )}
      {!loading && projects.length === 0 && (
        <p style={{ color: "#94a3b8", fontSize: 14 }}>Aucun projet. Créez-en un pour commencer.</p>
      )}
      {!loading && projects.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {projects.map((p) => (
            <div
              key={p.id}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "14px 18px", borderRadius: 12, background: "#f8fafc", border: "1px solid #e2e8f0",
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: "#1e293b", marginBottom: 4 }}>{p.name}</h3>
                {p.description && (
                  <p style={{ fontSize: 13, color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.description}</p>
                )}
                <span style={{ fontSize: 11, color: "#94a3b8" }}>{p.requirements?.length ?? 0} compétence(s) requise(s)</span>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  onClick={() => navigate(`/manager/projects/${p.id}`)}
                  style={{ padding: 8, borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer", color: "#64748b" }}
                  title="Voir"
                >
                  <EyeIcon className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteClick(p)}
                  disabled={deletingId === p.id}
                  style={{ padding: 8, borderRadius: 8, border: "1px solid #fee2e2", background: "#fff", cursor: "pointer", color: "#ef4444" }}
                  title="Supprimer"
                >
                  {deletingId === p.id ? <ArrowPathIcon className="w-4 h-4 animate-spin" /> : <TrashIcon className="w-4 h-4" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {createModal && (
        <CreateProjectModal
          onClose={() => setCreateModal(false)}
          onSubmit={handleCreate}
        />
      )}

      <ConfirmModal
        open={!!deleteConfirm}
        title="Confirmer la suppression"
        message={deleteConfirm ? `Supprimer le projet « ${deleteConfirm.name} » ?` : ""}
        confirmLabel="Supprimer"
        variant="danger"
        loading={deletingId !== null}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  );
}
