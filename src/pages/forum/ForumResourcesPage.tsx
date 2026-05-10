import { useEffect, useState } from "react";
import { useKeycloak } from "@react-keycloak/web";
import { getRealmRoles } from "../../auth/roles";
import { learningProgramApi } from "../../api/learningProgramApi";
import type { LearningProgramSummary } from "../../api/learningProgramApi";
import { skillsApi } from "../../api/skillsApi";
import type { SkillDto } from "../../pages/admin/types";
import { forumService } from "../../services/forumService";
import type { ForumOfficialResourceDto } from "../../types/forum";
import { ForumLoadingState } from "../../components/forum/ForumLoadingState";
import { ForumEmptyState } from "../../components/forum/ForumEmptyState";

export function ForumResourcesPage() {
  const { keycloak } = useKeycloak();
  const roles = getRealmRoles(keycloak.tokenParsed ?? undefined);
  const isTm = roles.includes("TRAINING_MANAGER");

  const [programs, setPrograms] = useState<LearningProgramSummary[]>([]);
  const [skills, setSkills] = useState<SkillDto[]>([]);
  const [programId, setProgramId] = useState("");
  const [skillId, setSkillId] = useState("");
  const [items, setItems] = useState<ForumOfficialResourceDto[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        if (isTm) {
          const r = await learningProgramApi.managerList({ page: 0, size: 200 });
          setPrograms(r.data.items);
        } else {
          const r = await learningProgramApi.listPublished();
          setPrograms(r.data);
        }
      } catch {
        setPrograms([]);
      }
      try {
        const sk = await skillsApi.listSkills();
        setSkills(sk.data);
      } catch {
        setSkills([]);
      }
    };
    void load();
  }, [isTm]);

  const loadResources = async () => {
    setLoading(true);
    try {
      if (programId) {
        const r = await forumService.getOfficialByProgram(programId);
        setItems(r.data);
      } else if (skillId) {
        const r = await forumService.getOfficialBySkill(skillId);
        setItems(r.data);
      } else {
        setItems([]);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-slate-900">Ressources issues du forum</h1>
      <p className="text-sm text-slate-600">
        Consultez les contenus promus par les responsables formation et administrateurs, classés par formation ou par compétence.
      </p>
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-end">
        <label className="flex flex-1 flex-col gap-1 text-xs font-medium text-slate-600">
          Formation
          <select value={programId} onChange={(e) => setProgramId(e.target.value)} className="rounded-xl border px-3 py-2 text-sm">
            <option value="">—</option>
            {programs.map((p) => (
              <option key={p.uuid} value={p.uuid}>
                {p.title}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-1 flex-col gap-1 text-xs font-medium text-slate-600">
          Compétence
          <select value={skillId} onChange={(e) => setSkillId(e.target.value)} className="rounded-xl border px-3 py-2 text-sm">
            <option value="">—</option>
            {skills.map((s) => (
              <option key={s.uuid} value={s.uuid}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={loadResources}
          disabled={!programId && !skillId}
          className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-40"
        >
          Afficher
        </button>
      </div>
      {loading ? <ForumLoadingState /> : null}
      {!loading && items.length === 0 && (programId || skillId) ? (
        <ForumEmptyState title="Aucune ressource officielle pour cette sélection." />
      ) : null}
      <ul className="space-y-3">
        {items.map((r) => (
          <li key={r.uuid} className="rounded-2xl border border-violet-100 bg-white p-4 shadow-sm">
            <h2 className="font-semibold text-slate-900">{r.title}</h2>
            {r.summary ? <p className="mt-1 text-sm text-slate-600">{r.summary}</p> : null}
            <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
              {r.learningProgramTitle ? <span>Formation : {r.learningProgramTitle}</span> : null}
              {r.skillName ? <span>Compétence : {r.skillName}</span> : null}
              <span>Source : {r.sourceType}</span>
            </div>
            {r.resourceUrl ? (
              <a href={r.resourceUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm font-medium text-violet-700">
                Ouvrir le lien →
              </a>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
