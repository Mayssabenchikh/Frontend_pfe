import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  learningProgramApi,
  type ActivitySubmissionMode,
  type AddLearningVideoPayload,
  type CourseActivityKind,
  type CourseStepOrderItem,
  type LearningProgramDetail,
  type LearningVideoDetail,
  type QuizGenerationStatus,
  type VideoSourceType,
} from "../../api/learningProgramApi";
import { skillsApi } from "../../api/skillsApi";
import type { SkillDto } from "../admin/types";
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  SparklesIcon,
} from "../../icons/heroicons/outline";
import { CourseStepsSortable } from "./components/CourseStepsSortable";
import { SortableCoursesList } from "./components/SortableCoursesList";
import { ProgramEditorRecommendations } from "./components/ProgramEditorRecommendations";
import { PLACEHOLDER_THUMB, youtubeThumbUrl } from "./utils/youtube";
import { getUserFacingApiMessage } from "../../utils/apiUserMessage";
import { LearningMarkdownBody } from "../../components/learning/LearningMarkdownBody";

const LAST_EDITED_PROGRAM_KEY = "tm:lastEditedProgramUuid";

function statusLabel(published: boolean): { text: string; tone: string } {
  if (published) return { text: "Publié", tone: "bg-emerald-100 text-emerald-800 ring-emerald-200" };
  return { text: "Brouillon", tone: "bg-amber-100 text-amber-900 ring-amber-200" };
}

function QuizStatusPill({ status }: { status: QuizGenerationStatus }) {
  const map: Record<QuizGenerationStatus, string> = {
    PENDING: "bg-amber-50 text-amber-800 ring-amber-200",
    READY: "bg-emerald-50 text-emerald-800 ring-emerald-200",
    FAILED: "bg-rose-50 text-rose-800 ring-rose-200",
  };
  const labels: Record<QuizGenerationStatus, string> = {
    PENDING: "Quiz en cours",
    READY: "Quiz prêt",
    FAILED: "Échec quiz",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ${map[status]}`}>
      {labels[status]}
    </span>
  );
}

function SourceBadge({ type }: { type: "RECOMMENDATION" | "MANUAL" }) {
  if (type === "RECOMMENDATION") {
    return (
      <span className="rounded bg-violet-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-violet-800">Recommandé</span>
    );
  }
  return <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-bold uppercase text-slate-700">Manuel</span>;
}

export function TrainingManagerProgramEditor() {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const isNew = uuid === "new";

  const [detail, setDetail] = useState<LearningProgramDetail | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [skillUuid, setSkillUuid] = useState("");
  const [targetLevel, setTargetLevel] = useState(3);
  const [published, setPublished] = useState(false);
  const [courseTitle, setCourseTitle] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [selectedCourseUuid, setSelectedCourseUuid] = useState<string | null>(null);
  const [manualCategory, setManualCategory] = useState("developpement");
  const [manualSkillName, setManualSkillName] = useState("java");
  const [skills, setSkills] = useState<SkillDto[]>([]);
  const [skillsError, setSkillsError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savingMeta, setSavingMeta] = useState(false);
  const [generatingQuiz, setGeneratingQuiz] = useState<string | null>(null);
  const [actKind, setActKind] = useState<CourseActivityKind>("EXERCISE");
  const [actSubmissionMode, setActSubmissionMode] = useState<ActivitySubmissionMode>("TEXT");
  const [actTitle, setActTitle] = useState("");
  const [actInstr, setActInstr] = useState("");
  const [actUrl, setActUrl] = useState("");
  const [textArtTitle, setTextArtTitle] = useState("");
  const [textArtBody, setTextArtBody] = useState("");
  const [textArtImageUrl, setTextArtImageUrl] = useState("");
  const [textArtImageAlt, setTextArtImageAlt] = useState("");
  const textArtBodyRef = useRef<HTMLTextAreaElement>(null);
  const textAssetInputRef = useRef<HTMLInputElement>(null);
  const editTextAssetInputRef = useRef<HTMLInputElement>(null);
  const videoAssetInputRef = useRef<HTMLInputElement>(null);
  const activityAssetInputRef = useRef<HTMLInputElement>(null);
  const activityEditAssetInputRef = useRef<HTMLInputElement>(null);
  const editTextBodyRef = useRef<HTMLTextAreaElement>(null);
  const [editTextImgUrl, setEditTextImgUrl] = useState("");
  const [editTextImgAlt, setEditTextImgAlt] = useState("");
  const [savingItemKey, setSavingItemKey] = useState<string | null>(null);
  const [editingText, setEditingText] = useState<{
    courseUuid: string;
    uuid: string;
    title: string;
    body: string;
  } | null>(null);
  const [editingActivity, setEditingActivity] = useState<{
    courseUuid: string;
    uuid: string;
    kind: CourseActivityKind;
    submissionMode: ActivitySubmissionMode;
    title: string;
    instructions: string;
    resourceUrl: string;
  } | null>(null);
  const [editingVideo, setEditingVideo] = useState<{
    courseUuid: string;
    uuid: string;
    youtubeVideoIdOrUrl: string;
    title: string;
    thumbnailUrl: string;
    sourceType: VideoSourceType;
    sourcePlaylistUrl: string;
  } | null>(null);

  type EditorWorkspaceTab = "modules" | "videosQuiz" | "text" | "activities" | "order";
  const [editorWorkspaceTab, setEditorWorkspaceTab] = useState<EditorWorkspaceTab>("modules");

  const isLikelyYoutubeInput = (value: string) => {
    const v = value.trim().toLowerCase();
    return v.includes("youtube.com/") || v.includes("youtu.be/") || /^[a-z0-9_-]{11}$/i.test(v);
  };

  const insertTextArticleImage = () => {
    const url = textArtImageUrl.trim();
    if (!/^https:\/\//i.test(url)) {
      toast.error("L’URL de l’image doit commencer par https://");
      return;
    }
    const alt = (textArtImageAlt.trim() || "Illustration").replace(/\]/g, "");
    const snippet = `\n\n![${alt}](${url})\n`;
    const ta = textArtBodyRef.current;
    if (ta) {
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      setTextArtBody((v) => v.slice(0, start) + snippet + v.slice(end));
      queueMicrotask(() => {
        ta.focus();
        const pos = start + snippet.length;
        ta.setSelectionRange(pos, pos);
      });
    } else {
      setTextArtBody((v) => v + snippet);
    }
    setTextArtImageUrl("");
    setTextArtImageAlt("");
    toast.success("Image insérée dans le corps");
  };

  const insertEditTextArticleImage = () => {
    const url = editTextImgUrl.trim();
    if (!/^https:\/\//i.test(url)) {
      toast.error("L’URL de l’image doit commencer par https://");
      return;
    }
    const alt = (editTextImgAlt.trim() || "Illustration").replace(/\]/g, "");
    const snippet = `\n\n![${alt}](${url})\n`;
    setEditingText((ed) => {
      if (!ed) return null;
      const ta = editTextBodyRef.current;
      if (ta) {
        const start = ta.selectionStart;
        const end = ta.selectionEnd;
        const next = ed.body.slice(0, start) + snippet + ed.body.slice(end);
        queueMicrotask(() => {
          ta.focus();
          const pos = start + snippet.length;
          ta.setSelectionRange(pos, pos);
        });
        return { ...ed, body: next };
      }
      return { ...ed, body: ed.body + snippet };
    });
    setEditTextImgUrl("");
    setEditTextImgAlt("");
    toast.success("Image insérée dans le corps");
  };

  const uploadTextAssetAndInsert = async (file: File, target: "new" | "edit" | "activity" | "activityEdit") => {
    if (!uuid || isNew) {
      toast.error("Enregistrez d’abord le parcours");
      return;
    }
    try {
      const { data } = await learningProgramApi.managerUploadTextAsset(uuid, file);
      const safeName = (file.name || "fichier").replace(/\]/g, "");
      const snippet = file.type.startsWith("image/") ? `\n\n![${safeName}](${data.fileUrl})\n` : `\n\n[${safeName}](${data.fileUrl})\n`;
      if (target === "new") {
        const ta = textArtBodyRef.current;
        if (ta) {
          const start = ta.selectionStart;
          const end = ta.selectionEnd;
          setTextArtBody((v) => v.slice(0, start) + snippet + v.slice(end));
        } else {
          setTextArtBody((v) => v + snippet);
        }
      } else if (target === "edit") {
        setEditingText((ed) => (ed ? { ...ed, body: ed.body + snippet } : null));
      } else if (target === "activity") {
        setActInstr((v) => v + snippet);
      } else {
        setEditingActivity((v) => (v ? { ...v, instructions: (v.instructions ?? "") + snippet } : v));
      }
      toast.success("Fichier uploadé et inséré");
    } catch (e: unknown) {
      const msg = getUserFacingApiMessage(e, "Upload impossible");
      setError(msg);
      toast.error(msg);
    }
  };

  const uploadVideoAssetAndFill = async (file: File) => {
    if (!uuid || isNew) {
      toast.error("Enregistrez d’abord le parcours");
      return;
    }
    try {
      const { data } = await learningProgramApi.managerUploadVideoAsset(uuid, file);
      setVideoUrl(data.fileUrl);
      toast.success("Vidéo uploadée. Cliquez sur « Ajouter au module » pour créer l’étape.");
    } catch (e: unknown) {
      const msg = getUserFacingApiMessage(e, "Upload vidéo impossible");
      setError(msg);
      toast.error(msg);
    }
  };

  const selectedSkill = useMemo(() => skills.find((s) => s.uuid === skillUuid) ?? null, [skills, skillUuid]);

  const selectedCourse = useMemo(() => {
    if (!detail || !selectedCourseUuid) return null;
    return detail.courses.find((c) => c.uuid === selectedCourseUuid) ?? null;
  }, [detail, selectedCourseUuid]);

  useEffect(() => {
    if (!selectedCourse && editorWorkspaceTab !== "modules") {
      setEditorWorkspaceTab("modules");
    }
  }, [selectedCourse, editorWorkspaceTab]);

  const skillGroups = useMemo(() => {
    const m = new Map<string, SkillDto[]>();
    for (const s of skills) {
      const k = s.categoryName || "Autre";
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(s);
    }
    return [...m.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [skills]);

  const load = useCallback((id: string) => {
    learningProgramApi
      .managerGet(id)
      .then((r) => {
        setDetail(r.data);
        setTitle(r.data.title);
        setDescription(r.data.description ?? "");
        setSkillUuid(r.data.skillUuid ?? "");
        setTargetLevel(r.data.targetSkillLevel);
        setPublished(r.data.published);
        const first = r.data.courses[0]?.uuid ?? null;
        setSelectedCourseUuid((prev) => prev ?? first);
      })
      .catch((e) => setError(e?.response?.data?.error ?? "Chargement impossible"));
  }, []);

  useEffect(() => {
    skillsApi
      .listSkills()
      .then((r) => {
        setSkills(r.data);
        setSkillsError(null);
      })
      .catch(() => {
        setSkills([]);
        setSkillsError("Impossible de charger le catalogue compétences (vérifiez vos droits).");
      });
  }, []);

  useEffect(() => {
    if (!isNew && uuid) load(uuid);
  }, [uuid, isNew, load]);

  useEffect(() => {
    if (!isNew && uuid) {
      window.localStorage.setItem(LAST_EDITED_PROGRAM_KEY, uuid);
    }
  }, [isNew, uuid]);

  const hasPendingQuiz = useMemo(() => {
    if (!detail) return false;
    return detail.courses.some((c) => c.videos.some((v) => v.quizStatus === "PENDING"));
  }, [detail]);

  useEffect(() => {
    if (isNew || !uuid || !hasPendingQuiz) return;
    const timer = window.setInterval(() => {
      load(uuid);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [isNew, uuid, hasPendingQuiz, load]);

  const saveNew = async () => {
    setError(null);
    try {
      const { data } = await learningProgramApi.managerCreate({
        title: title.trim() || "Sans titre",
        description: description.trim() || null,
        skillUuid: skillUuid.trim() || null,
        targetSkillLevel: targetLevel,
        published,
      });
      toast.success("Parcours créé");
      navigate(`/training-manager/programs/${data.uuid}`, { replace: true });
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      setError(err?.response?.data?.error ?? "Création impossible");
    }
  };

  const saveMeta = async () => {
    if (!uuid || isNew) return;
    setSavingMeta(true);
    setError(null);
    try {
      const { data } = await learningProgramApi.managerPatch(uuid, {
        title: title.trim(),
        description: description.trim() || null,
        skillUuid: skillUuid.trim() || null,
        targetSkillLevel: targetLevel,
        published,
      });
      setDetail(data);
      toast.success("Enregistré");
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      setError(err?.response?.data?.error ?? "Enregistrement impossible");
    } finally {
      setSavingMeta(false);
    }
  };

  const addCourse = async () => {
    if (!uuid || isNew || !courseTitle.trim()) return;
    setError(null);
    try {
      const { data } = await learningProgramApi.managerAddCourse(uuid, { title: courseTitle.trim() });
      setDetail(data);
      setCourseTitle("");
      if (!selectedCourseUuid && data.courses[0]) setSelectedCourseUuid(data.courses[0].uuid);
      toast.success("Module ajouté");
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      setError(err?.response?.data?.error ?? "Erreur module");
    }
  };

  const addVideo = async (payload: AddLearningVideoPayload) => {
    if (!uuid || isNew || !selectedCourseUuid) return;
    setError(null);
    try {
      const { data } = await learningProgramApi.managerAddVideo(uuid, selectedCourseUuid, payload);
      setDetail(data);
      setVideoUrl("");
      toast.success("Vidéo ajoutée au module");
    } catch (e: unknown) {
      const msg = getUserFacingApiMessage(e, "Erreur vidéo");
      setError(msg);
      toast.error(msg);
    }
  };

  const reorderCourses = async (orderedUuids: string[]) => {
    if (!uuid || isNew) return;
    setError(null);
    try {
      let last: LearningProgramDetail | null = null;
      for (let i = 0; i < orderedUuids.length; i++) {
        const { data } = await learningProgramApi.managerPatchCourse(uuid, orderedUuids[i]!, { sortOrder: i });
        last = data;
      }
      if (last) setDetail(last);
      toast.success("Ordre des modules mis à jour");
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      setError(err?.response?.data?.error ?? "Réordonnancement impossible");
    }
  };

  const reorderCourseStepsInModule = async (steps: CourseStepOrderItem[]) => {
    if (!uuid || isNew || !selectedCourseUuid) return;
    setError(null);
    try {
      const { data } = await learningProgramApi.managerReorderCourseSteps(uuid, selectedCourseUuid, steps);
      setDetail(data);
      toast.success("Ordre des étapes enregistré");
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      setError(err?.response?.data?.error ?? "Impossible de réordonner les étapes");
    }
  };

  const renameCourse = async (courseUuid: string, newTitle: string) => {
    if (!uuid || isNew) return;
    try {
      const { data } = await learningProgramApi.managerPatchCourse(uuid, courseUuid, { title: newTitle });
      setDetail(data);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      setError(err?.response?.data?.error ?? "Renommage impossible");
    }
  };

  const addCourseActivity = async () => {
    if (!uuid || isNew || !selectedCourseUuid || !actTitle.trim()) return;
    setError(null);
    try {
      const { data } = await learningProgramApi.managerAddActivity(uuid, selectedCourseUuid, {
        kind: actKind,
        submissionMode: actSubmissionMode,
        title: actTitle.trim(),
        instructions: actInstr.trim() || null,
        resourceUrl: actUrl.trim() || null,
      });
      setDetail(data);
      setActTitle("");
      setActInstr("");
      setActUrl("");
      toast.success("Activité ajoutée");
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      setError(err?.response?.data?.error ?? "Impossible d’ajouter l’activité");
    }
  };

  const addCourseTextArticle = async () => {
    if (!uuid || isNew || !selectedCourseUuid || !textArtTitle.trim() || !textArtBody.trim()) return;
    setError(null);
    try {
      const { data } = await learningProgramApi.managerAddTextArticle(uuid, selectedCourseUuid, {
        title: textArtTitle.trim(),
        body: textArtBody.trim(),
      });
      setDetail(data);
      setTextArtTitle("");
      setTextArtBody("");
      toast.success("Contenu texte ajouté");
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      setError(err?.response?.data?.error ?? "Impossible d’ajouter le contenu");
    }
  };

  const removeTextArticle = async (courseUuid: string, textArticleUuid: string) => {
    if (!uuid || isNew) return;
    setError(null);
    try {
      const { data } = await learningProgramApi.managerDeleteTextArticle(uuid, courseUuid, textArticleUuid);
      setDetail(data);
      if (editingText?.uuid === textArticleUuid) setEditingText(null);
      toast.success("Contenu texte supprimé");
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      setError(err?.response?.data?.error ?? "Suppression impossible");
    }
  };

  const saveEditingTextArticle = async () => {
    if (!uuid || isNew || !editingText) return;
    if (!editingText.title.trim() || !editingText.body.trim()) {
      toast.error("Titre et corps sont obligatoires");
      return;
    }
    setSavingItemKey(`text:${editingText.uuid}`);
    setError(null);
    try {
      const { data } = await learningProgramApi.managerPatchTextArticle(uuid, editingText.courseUuid, editingText.uuid, {
        title: editingText.title.trim(),
        body: editingText.body.trim(),
      });
      setDetail(data);
      setEditingText(null);
      setEditTextImgUrl("");
      setEditTextImgAlt("");
      toast.success("Contenu texte mis à jour");
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      setError(err?.response?.data?.error ?? "Enregistrement impossible");
    } finally {
      setSavingItemKey(null);
    }
  };

  const saveEditingActivity = async () => {
    if (!uuid || isNew || !editingActivity) return;
    if (!editingActivity.title.trim()) {
      toast.error("Le titre est obligatoire");
      return;
    }
    setSavingItemKey(`act:${editingActivity.uuid}`);
    setError(null);
    try {
      const { data } = await learningProgramApi.managerPatchActivity(uuid, editingActivity.courseUuid, editingActivity.uuid, {
        kind: editingActivity.kind,
        submissionMode: editingActivity.submissionMode,
        title: editingActivity.title.trim(),
        instructions: editingActivity.instructions.trim() || null,
        resourceUrl: editingActivity.resourceUrl.trim() || null,
      });
      setDetail(data);
      setEditingActivity(null);
      toast.success("Activité mise à jour");
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      setError(err?.response?.data?.error ?? "Enregistrement impossible");
    } finally {
      setSavingItemKey(null);
    }
  };

  const saveEditingVideo = async () => {
    if (!uuid || isNew || !editingVideo) return;
    if (!editingVideo.title.trim()) {
      toast.error("Le titre est obligatoire");
      return;
    }
    setSavingItemKey(`vid:${editingVideo.uuid}`);
    setError(null);
    try {
      const { data } = await learningProgramApi.managerPatchVideo(uuid, editingVideo.courseUuid, editingVideo.uuid, {
        youtubeVideoIdOrUrl: editingVideo.youtubeVideoIdOrUrl.trim(),
        title: editingVideo.title.trim(),
        thumbnailUrl: editingVideo.thumbnailUrl.trim(),
        sourceType: editingVideo.sourceType,
        sourcePlaylistUrl: editingVideo.sourcePlaylistUrl.trim(),
      });
      setDetail(data);
      setEditingVideo(null);
      toast.success("Vidéo mise à jour — si l’identifiant YouTube a changé, le quiz est régénéré.");
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      setError(err?.response?.data?.error ?? "Enregistrement impossible");
    } finally {
      setSavingItemKey(null);
    }
  };

  const removeActivity = async (courseUuid: string, activityUuid: string) => {
    if (!uuid || isNew) return;
    setError(null);
    try {
      const { data } = await learningProgramApi.managerDeleteActivity(uuid, courseUuid, activityUuid);
      setDetail(data);
      if (editingActivity?.uuid === activityUuid) setEditingActivity(null);
      toast.success("Activité supprimée");
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      setError(err?.response?.data?.error ?? "Suppression impossible");
    }
  };

  const regenerate = async (videoUuid: string) => {
    if (!uuid || isNew) return;
    setGeneratingQuiz(videoUuid);
    setError(null);
    try {
      const { data } = await learningProgramApi.managerRegenerateQuiz(uuid, videoUuid);
      setDetail(data);
      toast.success("Génération de quiz lancée — cela peut prendre une minute");
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      setError(err?.response?.data?.error ?? "Régénération impossible");
    } finally {
      setGeneratingQuiz(null);
    }
  };

  const removeVideo = async (courseUuid: string, videoUuid: string) => {
    if (!uuid || isNew) return;
    setError(null);
    try {
      const { data } = await learningProgramApi.managerDeleteVideo(uuid, courseUuid, videoUuid);
      setDetail(data);
      if (editingVideo?.uuid === videoUuid) setEditingVideo(null);
      toast.success("Vidéo supprimée du module");
    } catch (e: unknown) {
      const msg = getUserFacingApiMessage(e, "Suppression vidéo impossible");
      setError(msg);
      toast.error(msg);
    }
  };

  if (isNew) {
    const st = statusLabel(published);
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <Link
          to="/training-manager/programs"
          className="inline-flex items-center gap-1.5 rounded-lg px-1 py-0.5 text-sm font-semibold text-violet-800 transition hover:bg-violet-50 hover:text-violet-950"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Mes parcours
        </Link>
        <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200/60 bg-white shadow-[0_24px_60px_-28px_rgba(99,102,241,0.35)] ring-1 ring-slate-900/[0.04]">
          <div className="relative bg-gradient-to-br from-violet-700 via-indigo-800 to-slate-950 px-6 py-9 text-white sm:px-8 sm:py-10">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.12),transparent_55%)]" aria-hidden />
            <p className="relative text-[10px] font-bold uppercase tracking-[0.22em] text-violet-200/95">Nouveau parcours</p>
            <h1 className="relative mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Créer une formation</h1>
            <p className="relative mt-2 max-w-lg text-sm leading-relaxed text-violet-100/92">
              Définissez le titre, la compétence cible et le niveau. Vous pourrez ensuite structurer modules et vidéos
              dans l’éditeur.
            </p>
          </div>
          <div className="space-y-5 bg-slate-50/40 p-6 sm:p-8">
            {error && <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</div>}
            {skillsError && <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">{skillsError}</div>}
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Titre du parcours</span>
              <input
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-slate-900 shadow-inner focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-200"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="ex. Maîtriser Kubernetes pour l’équipe plateforme"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Description</span>
              <textarea
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-200"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Objectifs, public visé, prérequis…"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Compétence associée</span>
              <select
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-200"
                value={skillUuid}
                onChange={(e) => setSkillUuid(e.target.value)}
              >
                <option value="">— Aucune —</option>
                {skillGroups.map(([cat, list]) => (
                  <optgroup key={cat} label={cat}>
                    {list.map((s) => (
                      <option key={s.uuid} value={s.uuid}>
                        {s.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Niveau cible (1–5)</span>
                <select
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                  value={targetLevel}
                  onChange={(e) => setTargetLevel(Number(e.target.value))}
                >
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>
                      Niveau {n}
                    </option>
                  ))}
                </select>
              </label>
              <div className="flex flex-col justify-end gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Statut</span>
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 px-4 py-3">
                  <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} className="h-4 w-4 accent-violet-600" />
                  <div>
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ring-1 ${st.tone}`}>{st.text}</span>
                    <p className="mt-1 text-xs text-slate-500">Les parcours publiés apparaissent au catalogue employés.</p>
                  </div>
                </label>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="button"
                onClick={() => void saveNew()}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-md hover:opacity-95 sm:flex-none"
              >
                <SparklesIcon className="h-4 w-4" />
                Créer le parcours
              </button>
              <Link
                to="/training-manager/programs"
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Annuler
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const st = statusLabel(published);

  return (
    <div className="relative w-full flex-col px-4 py-3 sm:px-5 xl:py-4 [&_.text-xs]:text-sm [&_.text-\[11px\]]:text-sm [&_.text-\[10px\]]:text-xs">
      <div className="mb-4 shrink-0 flex flex-col gap-3 rounded-2xl border border-slate-200/60 bg-white/90 p-4 shadow-[0_2px_12px_rgba(15,23,42,0.04)] ring-1 ring-slate-900/[0.03] backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between sm:p-5 xl:mb-3">
        <div className="min-w-0">
          <Link
            to="/training-manager/programs"
            className="inline-flex items-center gap-1.5 rounded-lg text-sm font-semibold text-violet-800 transition hover:bg-violet-50 hover:text-violet-950"
          >
            <ArrowLeftIcon className="h-4 w-4 shrink-0" />
            Mes parcours
          </Link>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{title || "Parcours"}</h1>
            <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ring-1 ${st.tone}`}>{st.text}</span>
          </div>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
            Modules, ordre des étapes, contenus et quiz — tout est éditable depuis cette page.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void saveMeta()}
          disabled={savingMeta}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-violet-700/20 ring-1 ring-white/10 transition hover:brightness-110 disabled:opacity-50"
        >
          {savingMeta ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : null}
          {savingMeta ? "Enregistrement…" : "Enregistrer"}
        </button>
      </div>

      {error && (
        <div className="mb-3 shrink-0 rounded-2xl border border-rose-200/80 bg-rose-50 px-4 py-3 text-sm text-rose-900 shadow-sm">{error}</div>
      )}

      <div className="grid grid-cols-1 gap-4">
        <div className="flex min-w-0 flex-col">
          <div className="space-y-6 pb-6 pr-1 xl:pb-2">
          <section className="rounded-2xl border border-slate-200/70 bg-white/95 p-2 shadow-sm ring-1 ring-slate-900/[0.02]">
            <div className="mb-3 rounded-xl border border-violet-100 bg-violet-50/70 px-3 py-2 text-xs text-violet-900">
              {selectedCourse ? (
                <span>
                  Module actif : <span className="font-semibold">{selectedCourse.title}</span>
                </span>
              ) : (
                <span>Sélectionnez un module dans l’onglet « Modules » pour éditer ses contenus.</span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setEditorWorkspaceTab("modules")}
                className={`rounded-xl px-3.5 py-2 text-xs font-bold uppercase tracking-wide transition ${
                  editorWorkspaceTab === "modules"
                    ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                Modules
              </button>
              <button
                type="button"
                disabled={!selectedCourse}
                onClick={() => setEditorWorkspaceTab("videosQuiz")}
                className={`rounded-xl px-3.5 py-2 text-xs font-bold uppercase tracking-wide transition disabled:cursor-not-allowed disabled:opacity-50 ${
                  editorWorkspaceTab === "videosQuiz"
                    ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                Vidéos & quiz IA
              </button>
              <button
                type="button"
                disabled={!selectedCourse}
                onClick={() => setEditorWorkspaceTab("text")}
                className={`rounded-xl px-3.5 py-2 text-xs font-bold uppercase tracking-wide transition disabled:cursor-not-allowed disabled:opacity-50 ${
                  editorWorkspaceTab === "text"
                    ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                Contenu texte
              </button>
              <button
                type="button"
                disabled={!selectedCourse}
                onClick={() => setEditorWorkspaceTab("activities")}
                className={`rounded-xl px-3.5 py-2 text-xs font-bold uppercase tracking-wide transition disabled:cursor-not-allowed disabled:opacity-50 ${
                  editorWorkspaceTab === "activities"
                    ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                Exercices & activités
              </button>
              <button
                type="button"
                disabled={!selectedCourse}
                onClick={() => setEditorWorkspaceTab("order")}
                className={`rounded-xl px-3.5 py-2 text-xs font-bold uppercase tracking-wide transition disabled:cursor-not-allowed disabled:opacity-50 ${
                  editorWorkspaceTab === "order"
                    ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                Ordre du parcours
              </button>
            </div>
          </section>
          {editorWorkspaceTab === "modules" && (
            <div className="grid gap-6">
              <section className="tm-section rounded-2xl border border-slate-200/60 bg-white/95 p-5 shadow-[0_2px_12px_rgba(15,23,42,0.04)] ring-1 ring-slate-900/[0.03] backdrop-blur-sm sm:p-6">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <h2 className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">Modules (cours)</h2>
                    <p className="mt-1 text-xs text-slate-500">Glissez l’icône à gauche pour réordonner. Cochez « Module sélectionné » pour le module actif.</p>
                  </div>
                </div>
                <div className="mt-4">
                  {detail && (
                    <SortableCoursesList
                      courses={detail.courses}
                      disabled={!uuid || isNew}
                      selectedCourseUuid={selectedCourseUuid}
                      onSelectCourse={setSelectedCourseUuid}
                      onReorder={reorderCourses}
                      onRenameCourse={renameCourse}
                    />
                  )}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <input
                    className="min-w-[200px] flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    value={courseTitle}
                    onChange={(e) => setCourseTitle(e.target.value)}
                    placeholder="Titre du nouveau module"
                  />
              <button type="button" onClick={() => void addCourse()} className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:brightness-110">
                    Ajouter un module
                  </button>
                </div>
              </section>
            </div>
          )}


          {editorWorkspaceTab === "videosQuiz" && (
          <>
          <div className="space-y-6">
          <ProgramEditorRecommendations
            selectedSkill={selectedSkill}
            manualCategory={manualCategory}
            manualSkillName={manualSkillName}
            onManualCategory={setManualCategory}
            onManualSkillName={setManualSkillName}
            targetLevel={targetLevel}
            selectedCourseUuid={selectedCourseUuid}
            isNew={isNew}
            onAddVideo={addVideo}
          />
          <section className="tm-section rounded-2xl border border-slate-200/60 bg-white/95 p-5 shadow-[0_2px_12px_rgba(15,23,42,0.04)] ring-1 ring-slate-900/[0.03] backdrop-blur-sm sm:p-6">
            <h2 className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">Vidéo manuelle</h2>
            <p className="mt-1 text-xs text-slate-500">Collez une URL ou un ID YouTube. Source affichée comme « Manuel ».</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <input
                className="min-w-[200px] flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=…"
              />
              <input
                ref={videoAssetInputRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void uploadVideoAssetAndFill(f);
                  e.currentTarget.value = "";
                }}
              />
              <button
                type="button"
                disabled={!uuid || isNew}
                onClick={() => videoAssetInputRef.current?.click()}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
              >
                Uploader vidéo
              </button>
              <button
                type="button"
                disabled={!selectedCourseUuid}
                onClick={() =>
                  void addVideo({
                    sourceType: "MANUAL",
                    youtubeVideoIdOrUrl: videoUrl.trim(),
                    title: isLikelyYoutubeInput(videoUrl) ? undefined : `Vidéo uploadée — ${new Date().toLocaleDateString("fr-FR")}`,
                    sourcePlaylistUrl: isLikelyYoutubeInput(videoUrl) ? undefined : videoUrl.trim(),
                  })
                }
                className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:brightness-110 disabled:opacity-40"
              >
                Ajouter au module
              </button>
            </div>
          </section>

          {detail && (
            <div className="min-w-0">
            <section className="tm-section rounded-2xl border border-slate-200/60 bg-white/95 p-5 shadow-[0_2px_12px_rgba(15,23,42,0.04)] ring-1 ring-slate-900/[0.03] backdrop-blur-sm sm:p-6">
              <h2 className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">Quiz IA par vidéo</h2>
              <p className="mt-1 text-xs text-slate-500">
                Déclenche la génération côté serveur (service IA). Vous pouvez corriger le titre, la miniature, l’URL YouTube ou la source : si
                l’identifiant vidéo change, le quiz est relancé automatiquement.
              </p>
              <ul className="mt-4 space-y-3">
                {detail.courses
                  .slice()
                  .sort((a, b) => a.sortOrder - b.sortOrder)
                  .map((c) => (
                    <li key={c.uuid} className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                      <p className="text-xs font-bold uppercase text-slate-500">{c.title}</p>
                      <ul className="mt-2 space-y-2">
                        {c.videos
                          .slice()
                          .sort((a, b) => a.sortOrder - b.sortOrder)
                          .map((v: LearningVideoDetail) => (
                            <li key={v.uuid} className="rounded-lg border border-white bg-white p-3 shadow-sm">
                              <div className="flex flex-wrap items-center gap-3">
                                <img
                                  src={v.thumbnailUrl || youtubeThumbUrl(v.youtubeVideoId)}
                                  alt=""
                                  onError={(e) => {
                                    e.currentTarget.onerror = null;
                                    e.currentTarget.src = PLACEHOLDER_THUMB;
                                  }}
                                  className="h-12 w-20 shrink-0 rounded-lg object-cover"
                                />
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-medium text-slate-900">{v.title}</p>
                                  <div className="mt-1 flex flex-wrap items-center gap-2">
                                    <SourceBadge type={v.sourceType} />
                                    <QuizStatusPill status={v.quizStatus} />
                                    {v.questionCount != null && <span className="text-xs text-slate-500">{v.questionCount} question(s)</span>}
                                  </div>
                                </div>
                                <div className="flex shrink-0 flex-wrap gap-2">
                                  <button
                                    type="button"
                                    disabled={generatingQuiz === v.uuid || v.quizStatus === "PENDING"}
                                    onClick={() => void regenerate(v.uuid)}
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-violet-800 hover:bg-violet-100 disabled:opacity-50"
                                  >
                                    {generatingQuiz === v.uuid || v.quizStatus === "PENDING" ? (
                                      <ArrowPathIcon className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                      <SparklesIcon className="h-3.5 w-3.5" />
                                    )}
                                    {generatingQuiz === v.uuid || v.quizStatus === "PENDING" ? "Génération..." : "Générer quiz"}
                                  </button>
                                  <button
                                    type="button"
                                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-50"
                                    onClick={() => {
                                      setEditingText(null);
                                      setEditingActivity(null);
                                      setEditingVideo({
                                        courseUuid: c.uuid,
                                        uuid: v.uuid,
                                        youtubeVideoIdOrUrl: `https://www.youtube.com/watch?v=${v.youtubeVideoId}`,
                                        title: v.title,
                                        thumbnailUrl: v.thumbnailUrl ?? "",
                                        sourceType: v.sourceType,
                                        sourcePlaylistUrl: v.sourcePlaylistUrl ?? "",
                                      });
                                    }}
                                  >
                                    Modifier
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => void removeVideo(c.uuid, v.uuid)}
                                    className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                                  >
                                    Supprimer
                                  </button>
                                </div>
                              </div>
                              {editingVideo?.uuid === v.uuid && editingVideo.courseUuid === c.uuid && (
                                <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
                                  <label className="block text-xs text-slate-600">
                                    URL ou ID YouTube
                                    <input
                                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                      value={editingVideo.youtubeVideoIdOrUrl}
                                      onChange={(e) =>
                                        setEditingVideo((ed) => (ed ? { ...ed, youtubeVideoIdOrUrl: e.target.value } : null))
                                      }
                                    />
                                  </label>
                                  <label className="block text-xs text-slate-600">
                                    Titre affiché
                                    <input
                                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                      value={editingVideo.title}
                                      onChange={(e) => setEditingVideo((ed) => (ed ? { ...ed, title: e.target.value } : null))}
                                    />
                                  </label>
                                  <label className="block text-xs text-slate-600">
                                    Miniature (URL, optionnel)
                                    <input
                                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                      value={editingVideo.thumbnailUrl}
                                      onChange={(e) =>
                                        setEditingVideo((ed) => (ed ? { ...ed, thumbnailUrl: e.target.value } : null))
                                      }
                                      placeholder="Laisser vide pour la vignette YouTube par défaut"
                                    />
                                  </label>
                                  <label className="block text-xs text-slate-600">
                                    Source
                                    <select
                                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                      value={editingVideo.sourceType}
                                      onChange={(e) =>
                                        setEditingVideo((ed) => (ed ? { ...ed, sourceType: e.target.value as VideoSourceType } : null))
                                      }
                                    >
                                      <option value="MANUAL">Manuel</option>
                                      <option value="RECOMMENDATION">Recommandation</option>
                                    </select>
                                  </label>
                                  <label className="block text-xs text-slate-600">
                                    URL playlist source (optionnel)
                                    <input
                                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                      value={editingVideo.sourcePlaylistUrl}
                                      onChange={(e) =>
                                        setEditingVideo((ed) => (ed ? { ...ed, sourcePlaylistUrl: e.target.value } : null))
                                      }
                                    />
                                  </label>
                                  <p className="text-[11px] text-amber-800">
                                    Changer l’identifiant YouTube relance la génération du quiz (statut « en cours » puis « prêt »).
                                  </p>
                                  <div className="flex flex-wrap gap-2">
                                    <button
                                      type="button"
                                      disabled={savingItemKey === `vid:${v.uuid}`}
                                      onClick={() => void saveEditingVideo()}
                                      className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                                    >
                                      {savingItemKey === `vid:${v.uuid}` ? "Enregistrement…" : "Enregistrer"}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setEditingVideo(null)}
                                      className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                    >
                                      Annuler
                                    </button>
                                  </div>
                                </div>
                              )}
                            </li>
                          ))}
                      </ul>
                    </li>
                  ))}
              </ul>
            </section>
            </div>
          )}
          </div>
          </>
          )}

          {editorWorkspaceTab === "text" && detail && (
            <div className="min-w-0">
            <section className="tm-section rounded-2xl border border-slate-200/60 bg-white/95 p-5 shadow-[0_2px_12px_rgba(15,23,42,0.04)] ring-1 ring-slate-900/[0.03] backdrop-blur-sm sm:p-6">
              <h2 className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">Contenu texte (lecture)</h2>
              <p className="mt-1 text-xs text-slate-500">
                Articles et synthèses en Markdown : titres, listes, liens, code, tableaux (GFM), images. Chaque bloc existant peut être modifié ou
                supprimé depuis la liste. L’ordre dans le parcours se règle dans « Ordre du parcours ».
              </p>
              <div className="mt-4 space-y-4 rounded-2xl border border-indigo-200/70 bg-gradient-to-b from-indigo-50/60 to-white p-4 shadow-sm ring-1 ring-indigo-100/80 sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-100 pb-3">
                  <p className="text-sm font-semibold text-indigo-950">Nouveau bloc pour le module sélectionné</p>
                  <span className="rounded-full bg-indigo-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-indigo-800">Lecture</span>
                </div>
                <label className="block text-xs text-slate-600">
                  Titre
                  <input
                    className="tm-input mt-1"
                    value={textArtTitle}
                    onChange={(e) => setTextArtTitle(e.target.value)}
                    placeholder="ex. Introduction au langage"
                  />
                </label>
                <label className="block text-xs text-slate-600">
                  Corps (Markdown : texte, titres, images…)
                  <textarea
                    ref={textArtBodyRef}
                    className="tm-textarea mt-1 font-mono"
                    rows={8}
                    value={textArtBody}
                    onChange={(e) => setTextArtBody(e.target.value)}
                    placeholder={"# Titre\n\nParagraphe.\n\n![Schéma](https://exemple.com/image.png)"}
                  />
                </label>
                <div className="flex flex-wrap gap-2">
                  <input
                    ref={textAssetInputRef}
                    type="file"
                    accept="image/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) void uploadTextAssetAndInsert(f, "new");
                      e.currentTarget.value = "";
                    }}
                  />
                  <button
                    type="button"
                    disabled={!uuid || isNew}
                    onClick={() => textAssetInputRef.current?.click()}
                    className="tm-btn tm-btn-ghost px-3 py-1.5 text-xs"
                  >
                    Uploader image / document
                  </button>
                </div>
                <div className="rounded-xl border border-slate-200/90 bg-white p-3 shadow-sm ring-1 ring-slate-100">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Image sous le texte</p>
                  <p className="mt-0.5 text-[11px] text-slate-500">URL publique en HTTPS uniquement (CDN, stockage objet, etc.).</p>
                  <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-end">
                    <label className="min-w-0 flex-1 text-[11px] text-slate-600">
                      URL de l’image
                      <input
                        className="tm-input mt-1"
                        value={textArtImageUrl}
                        onChange={(e) => setTextArtImageUrl(e.target.value)}
                        placeholder="https://…"
                        type="url"
                        autoComplete="off"
                      />
                    </label>
                    <label className="min-w-0 flex-1 text-[11px] text-slate-600 sm:max-w-[200px]">
                      Légende (alt)
                      <input
                        className="tm-input mt-1"
                        value={textArtImageAlt}
                        onChange={(e) => setTextArtImageAlt(e.target.value)}
                        placeholder="Optionnel"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => insertTextArticleImage()}
                      className="tm-btn tm-btn-primary shrink-0 px-3 py-2 text-xs"
                    >
                      Insérer au curseur
                    </button>
                  </div>
                </div>
                {textArtBody.trim() !== "" && (
                  <div className="overflow-hidden rounded-xl border border-indigo-100 bg-gradient-to-b from-white to-indigo-50/40 p-4 ring-1 ring-indigo-100/60">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-indigo-900/80">Aperçu employé</p>
                    <div className="mt-3 rounded-lg border border-white/80 bg-white/90 px-3 py-3 shadow-inner">
                      <LearningMarkdownBody markdown={textArtBody} />
                    </div>
                  </div>
                )}
                <div className="flex justify-end">
                  <button
                    type="button"
                    disabled={!selectedCourseUuid || !textArtTitle.trim() || !textArtBody.trim()}
                    onClick={() => void addCourseTextArticle()}
                    className="tm-btn tm-btn-primary"
                  >
                    Ajouter le contenu texte
                  </button>
                </div>
              </div>
              <ul className="mt-4 space-y-3">
                {selectedCourse ? (
                  <li key={selectedCourse.uuid} className="rounded-lg border border-slate-100 bg-slate-50/50 p-3">
                    <p className="text-xs font-bold text-slate-600">{selectedCourse.title}</p>
                    <ul className="mt-2 space-y-1">
                      {(selectedCourse.textArticles ?? []).length === 0 ? (
                        <li className="text-xs text-slate-400">Aucun contenu texte</li>
                      ) : (
                        [...(selectedCourse.textArticles ?? [])]
                          .sort((a, b) => a.sortOrder - b.sortOrder)
                          .map((t) => (
                            <li key={t.uuid} className="rounded-lg border border-slate-100 bg-white p-3 shadow-sm">
                                <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-slate-800">
                                  <span>
                                    Lecture — {t.title}{" "}
                                    <span className="text-[10px] text-slate-400">(ordre {t.sortOrder})</span>
                                  </span>
                                  <div className="flex flex-wrap gap-2">
                                    <button
                                      type="button"
                                      className="text-xs font-semibold text-indigo-700 hover:underline"
                                      onClick={() => {
                                        setEditingActivity(null);
                                        setEditingVideo(null);
                                        setEditingText({ courseUuid: selectedCourse.uuid, uuid: t.uuid, title: t.title, body: t.body });
                                        setEditTextImgUrl("");
                                        setEditTextImgAlt("");
                                      }}
                                    >
                                      Modifier
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => void removeTextArticle(selectedCourse.uuid, t.uuid)}
                                      className="text-xs font-semibold text-rose-600 hover:underline"
                                    >
                                      Supprimer
                                    </button>
                                  </div>
                                </div>
                                {editingText?.uuid === t.uuid && editingText.courseUuid === selectedCourse.uuid && (
                                  <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
                                    <label className="block text-xs text-slate-600">
                                      Titre
                                      <input
                                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                        value={editingText.title}
                                        onChange={(e) => setEditingText((ed) => (ed ? { ...ed, title: e.target.value } : null))}
                                      />
                                    </label>
                                    <label className="block text-xs text-slate-600">
                                      Corps (Markdown)
                                      <textarea
                                        ref={editTextBodyRef}
                                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono"
                                        rows={8}
                                        value={editingText.body}
                                        onChange={(e) => setEditingText((ed) => (ed ? { ...ed, body: e.target.value } : null))}
                                      />
                                    </label>
                                    <button
                                      type="button"
                                      disabled={!uuid || isNew}
                                      onClick={() => editTextAssetInputRef.current?.click()}
                                      className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-800 hover:bg-indigo-100 disabled:opacity-50"
                                    >
                                      Uploader image / document
                                    </button>
                                    <input
                                      ref={editTextAssetInputRef}
                                      type="file"
                                      accept="image/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt"
                                      className="hidden"
                                      onChange={(e) => {
                                        const f = e.target.files?.[0];
                                        if (f) void uploadTextAssetAndInsert(f, "edit");
                                        e.currentTarget.value = "";
                                      }}
                                    />
                                    <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-3">
                                      <p className="text-[11px] font-semibold text-slate-600">Insérer une image (HTTPS)</p>
                                      <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-end">
                                        <input
                                          className="min-w-0 flex-1 rounded border border-slate-200 px-2 py-1.5 text-sm"
                                          value={editTextImgUrl}
                                          onChange={(e) => setEditTextImgUrl(e.target.value)}
                                          placeholder="https://…"
                                          type="url"
                                        />
                                        <input
                                          className="min-w-0 flex-1 rounded border border-slate-200 px-2 py-1.5 text-sm sm:max-w-[180px]"
                                          value={editTextImgAlt}
                                          onChange={(e) => setEditTextImgAlt(e.target.value)}
                                          placeholder="Légende"
                                        />
                                        <button
                                          type="button"
                                          onClick={() => insertEditTextArticleImage()}
                                          className="shrink-0 rounded bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white"
                                        >
                                          Insérer
                                        </button>
                                      </div>
                                    </div>
                                    {editingText.body.trim() !== "" && (
                                      <div className="rounded-lg border border-indigo-100 bg-white px-3 py-2">
                                        <LearningMarkdownBody markdown={editingText.body} />
                                      </div>
                                    )}
                                    <div className="flex flex-wrap gap-2">
                                      <button
                                        type="button"
                                        disabled={savingItemKey === `text:${t.uuid}`}
                                        onClick={() => void saveEditingTextArticle()}
                                        className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                                      >
                                        {savingItemKey === `text:${t.uuid}` ? "Enregistrement…" : "Enregistrer"}
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditingText(null);
                                          setEditTextImgUrl("");
                                          setEditTextImgAlt("");
                                        }}
                                        className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                      >
                                        Annuler
                                      </button>
                                    </div>
                                  </div>
                                )}
                            </li>
                          ))
                      )}
                    </ul>
                  </li>
                ) : (
                  <li className="text-xs text-slate-400">Sélectionnez un module actif.</li>
                )}
              </ul>
            </section>
            </div>
          )}

          {editorWorkspaceTab === "activities" && detail && (
            <div className="min-w-0">
            <section className="tm-section rounded-2xl border border-slate-200/60 bg-white/95 p-5 shadow-[0_2px_12px_rgba(15,23,42,0.04)] ring-1 ring-slate-900/[0.03] backdrop-blur-sm sm:p-6">
              <h2 className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">Exercices &amp; activités pratiques</h2>
              <p className="mt-1 text-xs text-slate-500">
                L’ordre se règle dans « Ordre du parcours ». L’employé soumet une réponse (texte, code ou fichier) pour valider une activité. Vous
                pouvez modifier titre, type, mode de réponse, consignes et lien depuis la liste ci-dessous.
              </p>
              <div className="mt-4 space-y-4 rounded-2xl border border-teal-200/70 bg-gradient-to-b from-teal-50/60 to-white p-4 shadow-sm ring-1 ring-teal-100/80 sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-teal-100 pb-3">
                  <p className="text-sm font-semibold text-teal-900">Nouvelle activité pour le module sélectionné</p>
                  <span className="rounded-full bg-teal-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-teal-800">Pratique</span>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <label className="text-xs text-slate-600 sm:col-span-2">
                    Type
                    <select
                      className="tm-select mt-1"
                      value={actKind}
                      onChange={(e) => setActKind(e.target.value as CourseActivityKind)}
                    >
                      <option value="EXERCISE">Exercice guidé</option>
                      <option value="PRACTICAL">Activité pratique</option>
                    </select>
                  </label>
                  <label className="text-xs text-slate-600 sm:col-span-2">
                    Réponse attendue de l’apprenant
                    <select
                      className="tm-select mt-1"
                      value={actSubmissionMode}
                      onChange={(e) => setActSubmissionMode(e.target.value as ActivitySubmissionMode)}
                    >
                      <option value="TEXT">Texte libre</option>
                      <option value="CODE">Code / extrait technique</option>
                      <option value="FILE">Fichier (téléversement)</option>
                    </select>
                  </label>
                  <label className="text-xs text-slate-600 sm:col-span-2">
                    Titre
                    <input
                      className="tm-input mt-1"
                      value={actTitle}
                      onChange={(e) => setActTitle(e.target.value)}
                      placeholder="ex. Lab : déployer un pod Kubernetes"
                    />
                  </label>
                  <label className="text-xs text-slate-600 sm:col-span-2">
                    Consignes (Markdown simple ou texte)
                    <textarea
                      className="tm-textarea mt-1"
                      rows={3}
                      value={actInstr}
                      onChange={(e) => setActInstr(e.target.value)}
                    />
                  </label>
                  <div className="sm:col-span-2">
                    <input
                      ref={activityAssetInputRef}
                      type="file"
                      accept="image/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.mp4,.mov,.webm"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) void uploadTextAssetAndInsert(f, "activity");
                        e.currentTarget.value = "";
                      }}
                    />
                    <button
                      type="button"
                      disabled={!uuid || isNew}
                      onClick={() => activityAssetInputRef.current?.click()}
                      className="tm-btn tm-btn-ghost px-3 py-1.5 text-xs"
                    >
                      Uploader pièce jointe pour consigne
                    </button>
                  </div>
                  <label className="text-xs text-slate-600 sm:col-span-2">
                    Lien ressource (optionnel)
                    <input
                      className="tm-input mt-1"
                      value={actUrl}
                      onChange={(e) => setActUrl(e.target.value)}
                      placeholder="https://…"
                    />
                  </label>
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    disabled={!selectedCourseUuid || !actTitle.trim()}
                    onClick={() => void addCourseActivity()}
                    className="tm-btn tm-btn-primary"
                  >
                    Ajouter au module sélectionné
                  </button>
                </div>
              </div>
              <ul className="mt-4 space-y-3">
                {selectedCourse ? (
                  <li key={selectedCourse.uuid} className="rounded-lg border border-slate-100 bg-slate-50/50 p-3">
                    <p className="text-xs font-bold text-slate-600">{selectedCourse.title}</p>
                    <ul className="mt-2 space-y-1">
                      {(selectedCourse.activities ?? []).length === 0 ? (
                        <li className="text-xs text-slate-400">Aucune activité</li>
                      ) : (
                        [...(selectedCourse.activities ?? [])]
                          .sort((a, b) => a.sortOrder - b.sortOrder)
                          .map((a) => (
                            <li key={a.uuid} className="rounded-lg border border-slate-100 bg-white p-3 shadow-sm">
                                <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-slate-800">
                                  <span>
                                    {a.kind === "PRACTICAL" ? "Pratique" : "Exercice"} — {a.title}
                                    <span className="ml-1 text-[10px] font-semibold uppercase text-slate-400">
                                      [
                                      {(a.submissionMode ?? "TEXT") === "CODE"
                                        ? "code"
                                        : (a.submissionMode ?? "TEXT") === "FILE"
                                          ? "fichier"
                                          : "texte"}
                                      ]
                                    </span>
                                  </span>
                                  <div className="flex flex-wrap gap-2">
                                    <button
                                      type="button"
                                      className="text-xs font-semibold text-teal-800 hover:underline"
                                      onClick={() => {
                                        setEditingText(null);
                                        setEditingVideo(null);
                                        setEditingActivity({
                                          courseUuid: selectedCourse.uuid,
                                          uuid: a.uuid,
                                          kind: a.kind,
                                          submissionMode: a.submissionMode ?? "TEXT",
                                          title: a.title,
                                          instructions: a.instructions ?? "",
                                          resourceUrl: a.resourceUrl ?? "",
                                        });
                                      }}
                                    >
                                      Modifier
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => void removeActivity(selectedCourse.uuid, a.uuid)}
                                      className="text-xs font-semibold text-rose-600 hover:underline"
                                    >
                                      Supprimer
                                    </button>
                                  </div>
                                </div>
                                {editingActivity?.uuid === a.uuid && editingActivity.courseUuid === selectedCourse.uuid && (
                                  <div className="mt-4 grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2">
                                    <label className="text-xs text-slate-600 sm:col-span-2">
                                      Type
                                      <select
                                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                        value={editingActivity.kind}
                                        onChange={(e) =>
                                          setEditingActivity((ed) =>
                                            ed ? { ...ed, kind: e.target.value as CourseActivityKind } : null,
                                          )
                                        }
                                      >
                                        <option value="EXERCISE">Exercice guidé</option>
                                        <option value="PRACTICAL">Activité pratique</option>
                                      </select>
                                    </label>
                                    <label className="text-xs text-slate-600 sm:col-span-2">
                                      Réponse attendue
                                      <select
                                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                        value={editingActivity.submissionMode}
                                        onChange={(e) =>
                                          setEditingActivity((ed) =>
                                            ed ? { ...ed, submissionMode: e.target.value as ActivitySubmissionMode } : null,
                                          )
                                        }
                                      >
                                        <option value="TEXT">Texte libre</option>
                                        <option value="CODE">Code / extrait technique</option>
                                        <option value="FILE">Fichier (téléversement)</option>
                                      </select>
                                    </label>
                                    <label className="text-xs text-slate-600 sm:col-span-2">
                                      Titre
                                      <input
                                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                        value={editingActivity.title}
                                        onChange={(e) =>
                                          setEditingActivity((ed) => (ed ? { ...ed, title: e.target.value } : null))
                                        }
                                      />
                                    </label>
                                    <label className="text-xs text-slate-600 sm:col-span-2">
                                      Consignes
                                      <textarea
                                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                        rows={4}
                                        value={editingActivity.instructions}
                                        onChange={(e) =>
                                          setEditingActivity((ed) => (ed ? { ...ed, instructions: e.target.value } : null))
                                        }
                                      />
                                    </label>
                                    <div className="sm:col-span-2">
                                      <input
                                        ref={activityEditAssetInputRef}
                                        type="file"
                                        accept="image/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.mp4,.mov,.webm"
                                        className="hidden"
                                        onChange={(e) => {
                                          const f = e.target.files?.[0];
                                          if (f) void uploadTextAssetAndInsert(f, "activityEdit");
                                          e.currentTarget.value = "";
                                        }}
                                      />
                                      <button
                                        type="button"
                                        disabled={!uuid || isNew}
                                        onClick={() => activityEditAssetInputRef.current?.click()}
                                        className="rounded-lg border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-800 hover:bg-teal-100 disabled:opacity-50"
                                      >
                                        Uploader pièce jointe pour consigne
                                      </button>
                                    </div>
                                    <label className="text-xs text-slate-600 sm:col-span-2">
                                      Lien ressource
                                      <input
                                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                        value={editingActivity.resourceUrl}
                                        onChange={(e) =>
                                          setEditingActivity((ed) => (ed ? { ...ed, resourceUrl: e.target.value } : null))
                                        }
                                        placeholder="https://…"
                                      />
                                    </label>
                                    <div className="flex flex-wrap gap-2 sm:col-span-2">
                                      <button
                                        type="button"
                                        disabled={savingItemKey === `act:${a.uuid}`}
                                        onClick={() => void saveEditingActivity()}
                                        className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                                      >
                                        {savingItemKey === `act:${a.uuid}` ? "Enregistrement…" : "Enregistrer"}
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setEditingActivity(null)}
                                        className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                      >
                                        Annuler
                                      </button>
                                    </div>
                                  </div>
                                )}
                            </li>
                          ))
                      )}
                    </ul>
                  </li>
                ) : (
                  <li className="text-xs text-slate-400">Sélectionnez un module actif.</li>
                )}
              </ul>
            </section>
            </div>
          )}

          {editorWorkspaceTab === "order" && detail && selectedCourse && (
            <section className="relative overflow-hidden rounded-2xl border border-slate-200/50 bg-gradient-to-br from-white via-violet-50/30 to-indigo-50/20 shadow-[0_16px_48px_-24px_rgba(99,102,241,0.2)] ring-1 ring-violet-200/30 sm:p-6">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-violet-500 via-indigo-500 to-teal-500" aria-hidden />
              <div className="p-5 sm:p-0 sm:pt-2">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-600">Ordre du parcours</h2>
                    <p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-500">
                      Module <span className="font-semibold text-slate-700">« {selectedCourse.title} »</span> — glissez les cartes pour définir
                      l’ordre exact vu par l’employé (vidéos, lectures, activités mélangées).
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-600 ring-1 ring-slate-200/80">
                    UX édition
                  </span>
                </div>
                <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50/50 p-4 sm:p-5">
                  <CourseStepsSortable
                    course={selectedCourse}
                    disabled={!uuid || isNew}
                    onReorder={reorderCourseStepsInModule}
                  />
                </div>
              </div>
            </section>
          )}


          </div>
        </div>

      </div>
    </div>
  );
}
