import { useEffect, useState } from "react";
import { useParams, useNavigate, useOutletContext } from "react-router-dom";
import { ArrowLeftIcon, PencilSquareIcon } from "@heroicons/react/24/outline";
import { toast } from "sonner";
import { projectsApi, type ProjectDto } from "../../api/projectsApi";
import { CreateProjectModal } from "./CreateProjectModal";

type ManagerOutletContext = {
  managerAvatarUrl: string | null;
  managerName: string;
  managerEmail: string | null;
  currentPath: string;
};

export function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const outletCtx = useOutletContext<ManagerOutletContext | null>();
  const managerAvatarUrl = outletCtx?.managerAvatarUrl ?? null;
  const managerName = outletCtx?.managerName ?? "";
  const managerEmail = outletCtx?.managerEmail ?? null;
  const [project, setProject] = useState<ProjectDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);

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

  if (loading) return <div className="p-6">Chargement...</div>;
  if (error || !project) return <div className="p-6 text-red-500">{error ?? "Projet non trouvé"}</div>;

  const numId = id ? parseInt(id, 10) : NaN;

  return (
    <>
      <div className="mx-auto max-w-3xl p-6">
        <div className="mb-5 flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate("/manager/projects")}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Retour aux projets
          </button>

          <button
            type="button"
            onClick={() => setEditOpen(true)}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border-none bg-gradient-to-br from-indigo-600 to-violet-600 px-3.5 py-2 text-sm font-semibold text-white"
          >
            <PencilSquareIcon className="w-4 h-4" />
            Modifier le projet
          </button>
        </div>

        <div className="mb-6">
          <h1 className="mb-2 text-2xl font-bold text-slate-800">{project.name}</h1>
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
            <span>Statut : {project.status}</span>
            {project.leadName && (
              <span>• Chef de projet : {project.leadName}</span>
            )}
          </div>
          {project.description && (
            <p className="mt-3 text-sm text-slate-500">{project.description}</p>
          )}
        </div>

        <h2 className="mb-3 text-base font-semibold">Compétences requises</h2>
        {!project.requirements || project.requirements.length === 0 ? (
          <p className="text-sm text-slate-400">Aucune compétence requise définie.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {project.requirements.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
              >
                <span className="text-sm font-semibold">{r.skillName}</span>
                <span className="text-xs text-slate-500">{r.categoryName}</span>
                <span className="text-xs text-slate-400">Niveau min: {r.levelMin}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {editOpen && !isNaN(numId) && (
        <CreateProjectModal
          initialProject={project}
          onClose={() => setEditOpen(false)}
          leadAvatarUrl={managerAvatarUrl}
          leadName={managerName}
          leadEmail={managerEmail}
          onSubmit={(data) =>
            projectsApi
              .update(numId, data)
              .then((res) => {
                setProject(res.data ?? project);
                toast.success("Projet mis à jour");
                setEditOpen(false);
              })
          }
        />
      )}
    </>
  );
}
