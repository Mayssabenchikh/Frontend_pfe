import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faXmark,
  faPenToSquare,
  faCircleQuestion,
  faBookOpen,
  faComments,
  faGraduationCap,
  faBullhorn,
  faTags,
  faLink,
  faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";
import type { ForumPostType } from "../../types/forum";
import type { ForumCategoryDto } from "../../types/forum";
import { ForumTagInput } from "./ForumTagInput";

type Props = {
  categories: ForumCategoryDto[];
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  createPost: (payload: {
    title: string;
    content: string;
    type: ForumPostType;
    categoryUuid: string;
    learningProgramUuid?: string | null;
    skillUuid?: string | null;
    projectUuid?: string | null;
    externalUrl?: string | null;
    tags: string[];
  }) => Promise<void>;
};

const TYPE_OPTIONS: { value: ForumPostType; label: string; icon: typeof faCircleQuestion; desc: string }[] = [
  { value: "QUESTION", label: "Question", icon: faCircleQuestion, desc: "Posez une question à la communauté" },
  { value: "RESOURCE", label: "Ressource", icon: faBookOpen, desc: "Partagez un lien ou document utile" },
  { value: "DISCUSSION", label: "Discussion", icon: faComments, desc: "Lancez un débat ou une réflexion" },
  { value: "TRAINING_FEEDBACK", label: "Retour formation", icon: faGraduationCap, desc: "Partagez votre avis sur une formation" },
  { value: "ANNOUNCEMENT", label: "Annonce", icon: faBullhorn, desc: "Communiquer une information importante" },
];

export function ForumPostEditor({ categories, open, onClose, onCreated, createPost }: Props) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState<ForumPostType>("DISCUSSION");
  const [categoryUuid, setCategoryUuid] = useState("");
  const [externalUrl, setExternalUrl] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const submit = async () => {
    setError(null);
    if (!title.trim() || !content.trim() || !categoryUuid) {
      setError("Titre, contenu et catégorie sont requis.");
      return;
    }
    setSaving(true);
    try {
      await createPost({
        title: title.trim(),
        content: content.trim(),
        type,
        categoryUuid,
        externalUrl: externalUrl.trim() || null,
        tags,
      });
      setTitle("");
      setContent("");
      setExternalUrl("");
      setTags([]);
      onCreated();
      onClose();
    } catch (e: unknown) {
      const msg =
        e && typeof e === "object" && "response" in e
          ? (e as { response?: { data?: { error?: string } } }).response?.data?.error
          : null;
      setError(msg ?? "Impossible de publier. Veuillez réessayer.");
    } finally {
      setSaving(false);
    }
  };

  const selectedType = TYPE_OPTIONS.find((t) => t.value === type)!;

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center bg-slate-900/50 p-4 backdrop-blur-sm sm:items-center">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto overscroll-contain rounded-2xl border border-slate-200 bg-white shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-slate-100 bg-white px-5 py-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-50">
            <FontAwesomeIcon icon={faPenToSquare} className="h-4 w-4 text-violet-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-semibold text-slate-900">Nouvelle publication</h2>
            <p className="text-xs text-slate-500">Partagez avec la communauté Skillify</p>
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

        <div className="space-y-5 p-5">
          {/* Error */}
          {error ? (
            <div className="flex items-center gap-2 rounded-xl bg-rose-50 px-3 py-2.5 text-sm text-rose-800">
              <FontAwesomeIcon icon={faTriangleExclamation} className="h-4 w-4 shrink-0" />
              {error}
            </div>
          ) : null}

          {/* Type selector */}
          <div>
            <p className="mb-2 text-xs font-semibold text-slate-600">Type de publication</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setType(opt.value)}
                  className={[
                    "flex items-start gap-2.5 rounded-xl border p-3 text-left text-sm transition-colors",
                    type === opt.value
                      ? "border-violet-300 bg-violet-50 ring-1 ring-violet-300"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50",
                  ].join(" ")}
                >
                  <FontAwesomeIcon
                    icon={opt.icon}
                    className={`mt-0.5 h-4 w-4 shrink-0 ${type === opt.value ? "text-violet-600" : "text-slate-400"}`}
                  />
                  <div>
                    <p className={`font-medium leading-tight ${type === opt.value ? "text-violet-900" : "text-slate-700"}`}>
                      {opt.label}
                    </p>
                    <p className="mt-0.5 text-[10px] leading-tight text-slate-400">{opt.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">
              Titre <span className="text-rose-500">*</span>
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={selectedType.value === "QUESTION" ? "Quel est votre problème ?" : "Donnez un titre à votre publication"}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 shadow-sm outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-300/30"
            />
          </div>

          {/* Category */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">
              Catégorie <span className="text-rose-500">*</span>
            </label>
            <select
              value={categoryUuid}
              onChange={(e) => setCategoryUuid(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-300/30"
            >
              <option value="">— Sélectionner une catégorie —</option>
              {categories.map((c) => (
                <option key={c.uuid} value={c.uuid}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Content */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">
              Contenu <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={8}
              placeholder="Décrivez votre question, ressource ou discussion en détail…"
              className="w-full resize-y rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 shadow-sm outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-300/30"
            />
            <p className="mt-1 text-right text-xs text-slate-400">{content.length} caractères</p>
          </div>

          {/* External URL */}
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-600">
              <FontAwesomeIcon icon={faLink} className="h-3 w-3" />
              Lien externe <span className="font-normal text-slate-400">(optionnel)</span>
            </label>
            <input
              value={externalUrl}
              onChange={(e) => setExternalUrl(e.target.value)}
              placeholder="https://…"
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 shadow-sm outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-300/30"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-600">
              <FontAwesomeIcon icon={faTags} className="h-3 w-3" />
              Tags <span className="font-normal text-slate-400">(optionnel)</span>
            </label>
            <ForumTagInput tags={tags} onChange={setTags} />
          </div>

          {/* Actions */}
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
              className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2 text-sm font-medium text-white shadow-sm hover:bg-violet-700 disabled:opacity-50 transition-colors"
            >
              <FontAwesomeIcon icon={faPenToSquare} className="h-3.5 w-3.5" />
              {saving ? "Publication…" : "Publier"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
