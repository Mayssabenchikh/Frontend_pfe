import { useState } from "react";
import { trainingApi, type PlaylistVideo, type RecommendationItem } from "../../../api/trainingApi";
import type { SkillDto } from "../../../pages/admin/types";
import { PLACEHOLDER_THUMB, youtubeThumbUrl } from "../utils/youtube";
import { ArrowPathIcon } from "../../../icons/heroicons/outline";
import type { AddLearningVideoPayload } from "../../../api/learningProgramApi";

type Props = {
  selectedSkill: SkillDto | null;
  /** When no skill row selected, use these for the recommend API */
  manualCategory: string;
  manualSkillName: string;
  onManualCategory: (v: string) => void;
  onManualSkillName: (v: string) => void;
  targetLevel: number;
  selectedCourseUuid: string | null;
  isNew: boolean;
  onAddVideo: (payload: AddLearningVideoPayload) => Promise<void>;
};

export function ProgramEditorRecommendations({
  selectedSkill,
  manualCategory,
  manualSkillName,
  onManualCategory,
  onManualSkillName,
  targetLevel,
  selectedCourseUuid,
  isNew,
  onAddVideo,
}: Props) {
  const [recs, setRecs] = useState<RecommendationItem[]>([]);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [playlistByKey, setPlaylistByKey] = useState<Record<string, PlaylistVideo[]>>({});
  const [loadingPlaylist, setLoadingPlaylist] = useState<string | null>(null);
  const [addingId, setAddingId] = useState<string | null>(null);

  const category = selectedSkill?.categoryName?.trim() || manualCategory.trim();
  const skillName = selectedSkill?.name?.trim() || manualSkillName.trim();

  const loadRecommendations = async () => {
    if (!category || !skillName) return;
    setLoadingRecs(true);
    try {
      const { data } = await trainingApi.trainingManagerRecommendTop3({
        category,
        skillName,
        employeeSkillLevel: Math.max(0, targetLevel - 1),
        targetSkillLevel: targetLevel,
      });
      setRecs(data);
    } finally {
      setLoadingRecs(false);
    }
  };

  const extractYoutubeVideoId = (urlOrId: string): string | null => {
    const value = (urlOrId || "").trim();
    if (!value) return null;
    if (/^[a-zA-Z0-9_-]{11}$/.test(value)) return value;
    try {
      const parsed = new URL(value);
      const host = parsed.hostname.toLowerCase();
      if (host.includes("youtu.be")) {
        const seg = parsed.pathname.split("/").filter(Boolean)[0];
        return seg && /^[a-zA-Z0-9_-]{11}$/.test(seg) ? seg : null;
      }
      if (host.includes("youtube.com")) {
        const v = parsed.searchParams.get("v");
        if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) return v;
        const shorts = parsed.pathname.match(/\/shorts\/([a-zA-Z0-9_-]{11})/);
        if (shorts?.[1]) return shorts[1];
      }
    } catch {
      return null;
    }
    return null;
  };

  const isPlaylistUrl = (url: string): boolean => {
    try {
      const parsed = new URL(url);
      return parsed.searchParams.has("list");
    } catch {
      return false;
    }
  };

  const expandPlaylist = async (rec: RecommendationItem) => {
    const key = rec.trainingUuid;
    if (playlistByKey[key]) return;
    setLoadingPlaylist(key);
    try {
      const { data } = await trainingApi.trainingManagerPlaylistVideos(rec.playlistUrl);
      setPlaylistByKey((m) => ({ ...m, [key]: data }));
    } catch {
      setPlaylistByKey((m) => ({ ...m, [key]: [] }));
    } finally {
      setLoadingPlaylist(null);
    }
  };

  const handleAddRecommended = async (rec: RecommendationItem, video: PlaylistVideo) => {
    const composite = `${rec.trainingUuid}:${video.videoId}`;
    setAddingId(composite);
    try {
      await onAddVideo({
        sourceType: "RECOMMENDATION",
        youtubeVideoIdOrUrl: video.videoId,
        title: video.title,
        thumbnailUrl: video.thumbnailUrl ?? youtubeThumbUrl(video.videoId),
        sourcePlaylistUrl: rec.playlistUrl,
      });
    } finally {
      setAddingId(null);
    }
  };

  const disabledAdd = isNew || !selectedCourseUuid;

  return (
    <div className="tm-section tm-card flex h-full min-h-[420px] flex-col overflow-hidden bg-gradient-to-b from-white via-violet-50/20 to-slate-50/90">
      <div className="border-b border-slate-200/60 bg-white/60 px-4 py-4 backdrop-blur-sm">
        <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-600">Sources recommandées</h3>
        <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
           Pour une vidéo simple, ajoutez directement; pour une playlist, listez puis choisissez une vidéo.
        </p>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        {!selectedSkill && (
          <div className="grid gap-2">
            <label className="text-xs font-medium text-slate-600">
              Catégorie (si pas de compétence sélectionnée)
              <input
                value={manualCategory}
                onChange={(e) => onManualCategory(e.target.value)}
                className="tm-input mt-0.5"
                placeholder="ex. developpement"
              />
            </label>
            <label className="text-xs font-medium text-slate-600">
              Nom de compétence
              <input
                value={manualSkillName}
                onChange={(e) => onManualSkillName(e.target.value)}
                className="tm-input mt-0.5"
                placeholder="ex. java"
              />
            </label>
          </div>
        )}

        <button
          type="button"
          onClick={() => void loadRecommendations()}
          disabled={loadingRecs || !category || !skillName}
          className="tm-btn tm-btn-primary"
        >
          {loadingRecs ? (
            <>
              <ArrowPathIcon className="h-4 w-4 animate-spin" />
              Chargement…
            </>
          ) : (
            <>
              <ArrowPathIcon className="h-4 w-4" />
              Actualiser les recommandations
            </>
          )}
        </button>

        {disabledAdd && (
          <p className="rounded-lg border border-amber-200/70 bg-amber-50 px-3 py-2 text-xs text-amber-900">
            {isNew
              ? "Enregistrez d’abord le parcours pour ajouter des vidéos."
              : "Choisissez le module sélectionné à gauche."}
          </p>
        )}

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
          {recs.map((rec) => {
            const key = rec.trainingUuid;
            const videos = playlistByKey[key];
            const loadingPl = loadingPlaylist === key;
            const playlistMode = isPlaylistUrl(rec.playlistUrl);
            const directVideoId = playlistMode ? null : extractYoutubeVideoId(rec.playlistUrl);
            return (
              <article
                key={key}
                className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm"
              >
                <div className="flex gap-3 p-3">
                  <div
                    className="hidden h-16 w-28 shrink-0 rounded-lg bg-gradient-to-br from-violet-200 via-indigo-100 to-slate-200 sm:block"
                    aria-hidden
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md bg-violet-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-violet-800">
                        Recommandé
                      </span>
                      <span className="text-[10px] text-slate-400">{rec.courseLevel}</span>
                    </div>
                    <h4 className="mt-1 line-clamp-2 text-sm font-semibold text-slate-900">{rec.courseName}</h4>
                    <div className="mt-2 flex flex-col items-start gap-2">
                      <a
                        href={rec.playlistUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-block text-xs text-indigo-600 hover:underline"
                      >
                        {playlistMode ? "Ouvrir la playlist YouTube" : "Ouvrir la vidéo YouTube"}
                      </a>
                      {playlistMode ? (
                        <button
                          type="button"
                          onClick={() => void expandPlaylist(rec)}
                          className="block text-xs font-semibold text-violet-700 hover:underline"
                        >
                          {videos ? "Recharger les vidéos de la playlist" : loadingPl ? "Chargement playlist…" : "Lister les vidéos de la playlist"}
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={disabledAdd || !directVideoId || addingId === `${key}:${directVideoId}`}
                          onClick={() =>
                            directVideoId
                              ? void handleAddRecommended(rec, {
                                  videoId: directVideoId,
                                  title: rec.courseName,
                                  thumbnailUrl: youtubeThumbUrl(directVideoId),
                                })
                              : undefined
                          }
                          className="tm-btn tm-btn-primary px-3 py-1.5 text-[10px] uppercase tracking-wide"
                        >
                          {addingId === `${key}:${directVideoId}` ? "Ajout…" : "Ajouter directement"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                {playlistMode && videos && videos.length > 0 && (
                  <ul className="max-h-56 space-y-1.5 overflow-y-auto border-t border-slate-100 bg-slate-50/50 p-2">
                    {videos.map((v) => (
                      <li
                        key={v.videoId}
                        className="flex items-center gap-2 rounded-lg border border-slate-100 bg-white p-2 text-sm"
                      >
                        <img
                          src={v.thumbnailUrl || youtubeThumbUrl(v.videoId)}
                          alt=""
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = PLACEHOLDER_THUMB;
                          }}
                          className="h-10 w-16 shrink-0 rounded object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-2 text-xs font-medium text-slate-800">{v.title}</p>
                          <p className="text-[10px] text-slate-400">{v.videoId}</p>
                        </div>
                        <button
                          type="button"
                          disabled={disabledAdd || addingId === `${key}:${v.videoId}`}
                          onClick={() => void handleAddRecommended(rec, v)}
                          className="tm-btn tm-btn-primary shrink-0 px-2 py-1 text-[10px] uppercase tracking-wide"
                        >
                          {addingId === `${key}:${v.videoId}` ? "…" : "Ajouter"}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                {playlistMode && videos && videos.length === 0 && !loadingPl && (
                  <p className="border-t border-slate-100 px-3 py-2 text-xs text-slate-500">Aucune vidéo (clé YouTube ou playlist vide).</p>
                )}
              </article>
            );
          })}
          {!loadingRecs && recs.length === 0 && (
            <p className="text-center text-xs text-slate-400">Aucune recommandation chargée.</p>
          )}
        </div>
      </div>
    </div>
  );
}
