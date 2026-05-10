import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faWandMagicSparkles, faXmark, faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";
import { learningProgramApi } from "../../api/learningProgramApi";
import type { LearningProgramSummary } from "../../api/learningProgramApi";
import { skillsApi } from "../../api/skillsApi";
import type { SkillDto } from "../../pages/admin/types";
import { getRealmRoles } from "../../auth/roles";
import type { ForumOfficialResourceSourceType } from "../../types/forum";

type Props = {
  open: boolean;
  onClose: () => void;
  sourceType: ForumOfficialResourceSourceType;
  sourceUuid: string;
  defaultTitle: string;
  defaultSummary: string;
  defaultUrl?: string | null;
  tokenParsed: unknown;
  onSubmit: (payload: {
    sourceType: ForumOfficialResourceSourceType;
    sourceUuid: string;
    learningProgramUuid?: string | null;
    skillUuid?: string | null;
    title: string;
    summary?: string | null;
    resourceUrl?: string | null;
  }) => Promise<void>;
};

export function ForumResourcePromoteModal({
  open,
  onClose,
  sourceType,
  sourceUuid,
  defaultTitle,
  defaultSummary,
  defaultUrl,
  tokenParsed,
  onSubmit,
}: Props) {
  const [title, setTitle] = useState(defaultTitle);
  const [summary, setSummary] = useState(defaultSummary);
  const [resourceUrl, setResourceUrl] = useState(defaultUrl ?? "");
  const [learningProgramUuid, setLearningProgramUuid] = useState<string>("");
  const [skillUuid, setSkillUuid] = useState<string>("");
  const [programs, setPrograms] = useState<LearningProgramSummary[]>([]);
  const [skills, setSkills] = useState<SkillDto[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setTitle(defaultTitle);
    setSummary(defaultSummary);
    setResourceUrl(defaultUrl ?? "");
    setLearningProgramUuid("");
    setSkillUuid("");
    setError(null);
  }, [open, defaultTitle, defaultSummary, defaultUrl]);

  useEffect(() => {
    if (!open) return;
    const roles = getRealmRoles(tokenParsed);
    const isTm = roles.some((r) => r === "TRAINING_MANAGER");
    const load = async () => {
      try {
        if (isTm) {
          const res = await learningProgramApi.managerList({ page: 0, size: 200 });
          setPrograms(res.data.items);
        } else {
          const res = await learningProgramApi.listPublished();
          setPrograms(res.data);
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
  }, [open, tokenParsed]);

  if (!open) return null;

  const submit = async () => {
    setError(null);
    if (!title.trim()) {
      setError("Le titre est requis.");
      return;
    }
    setSaving(true);
    try {
      await onSubmit({
        sourceType,
        sourceUuid,
        title: title.trim(),
        summary: summary.trim() || null,
        resourceUrl: resourceUrl.trim() || null,
        learningProgramUuid: learningProgramUuid || null,
        skillUuid: skillUuid || null,
      });
      onClose();
    } catch {
      setError("Promotion impossible.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto overscroll-contain rounded-2xl border border-slate-200 bg-white shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-slate-100 bg-white px-5 py-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50">
            <FontAwesomeIcon icon={faWandMagicSparkles} className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-semibold text-slate-900">Promouvoir en ressource</h2>
            <p className="text-xs text-slate-500">Ce contenu deviendra une ressource officielle.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            aria-label="Fermer"
          >
            <FontAwesomeIcon icon={faXmark} className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          {error ? (
            <div className="flex items-center gap-2 rounded-xl bg-rose-50 px-3 py-2.5 text-sm text-rose-800">
              <FontAwesomeIcon icon={faTriangleExclamation} className="h-4 w-4 shrink-0" />
              {error}
            </div>
          ) : null}

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">
              Titre <span className="text-rose-500">*</span>
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-300/30"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">Résumé</label>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={4}
              className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-300/30"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">
              URL <span className="font-normal text-slate-400">(optionnel)</span>
            </label>
            <input
              value={resourceUrl}
              onChange={(e) => setResourceUrl(e.target.value)}
              placeholder="https://…"
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-300/30"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">
              Formation liée <span className="font-normal text-slate-400">(optionnel)</span>
            </label>
            <select
              value={learningProgramUuid}
              onChange={(e) => setLearningProgramUuid(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-300/30"
            >
              <option value="">— Aucune formation —</option>
              {programs.map((p) => (
                <option key={p.uuid} value={p.uuid}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">
              Compétence <span className="font-normal text-slate-400">(optionnel)</span>
            </label>
            <select
              value={skillUuid}
              onChange={(e) => setSkillUuid(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-300/30"
            >
              <option value="">— Aucune compétence —</option>
              {skills.map((s) => (
                <option key={s.uuid} value={s.uuid}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Annuler
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={submit}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              <FontAwesomeIcon icon={faWandMagicSparkles} className="h-3.5 w-3.5" />
              {saving ? "Promotion…" : "Promouvoir"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
