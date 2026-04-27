import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { trainingApi, type EmployeeTrainingProgress, type PlaylistVideo } from "../../api/trainingApi";
import { ArrowLeftIcon } from "../../icons/heroicons/outline";

type EmployeeLearningCourseProps = {
  basePath?: string;
};

function parseYouTubeIds(url: string): { playlistId: string | null; videoId: string | null } {
  try {
    const parsed = new URL(url);
    let playlistId: string | null = null;
    let videoId: string | null = null;
    if (parsed.hostname.includes("youtube.com")) {
      playlistId = parsed.searchParams.get("list");
      videoId = parsed.searchParams.get("v");
    }
    if (parsed.hostname.includes("youtu.be")) {
      const shortVideo = parsed.pathname.replace("/", "");
      if (shortVideo) videoId = shortVideo;
    }
    return { playlistId, videoId };
  } catch {
    return { playlistId: null, videoId: null };
  }
}

function isValidYouTubeVideoId(value: string | null | undefined): value is string {
  if (!value) return false;
  return /^[a-zA-Z0-9_-]{11}$/.test(value);
}

export function EmployeeLearningCourse({ basePath = "/employee/learning" }: EmployeeLearningCourseProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { progressUuid } = useParams<{ progressUuid: string }>();
  const location = useLocation();
  const stateProgress = (location.state as { progress?: EmployeeTrainingProgress } | null)?.progress;

  const [progress, setProgress] = useState<EmployeeTrainingProgress | null>(stateProgress ?? null);
  const [playlistVideos, setPlaylistVideos] = useState<PlaylistVideo[]>([]);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [playlistLoadError, setPlaylistLoadError] = useState<string | null>(null);
  const playerContainerRef = useRef<HTMLDivElement | null>(null);
  const ytPlayerRef = useRef<any>(null);

  useEffect(() => {
    trainingApi
      .myLearning()
      .then(({ data }) => {
        const arr = Array.isArray(data) ? data : [];
        if (!progressUuid) return;
        const found = arr.find((item) => item.progressUuid === progressUuid);
        if (found) setProgress(found);
      })
      .catch(() => {
        toast.error("Impossible de charger les formations récentes.");
      });
  }, [progressUuid]);

  useEffect(() => {
    void queryClient.prefetchQuery({
      queryKey: ["employee-learning-hub", { q: "", level: "", track: "", minHours: undefined, maxHours: undefined }],
      queryFn: async () => {
        const [recoRes, recentRes] = await Promise.all([
          trainingApi.recommendFromSkills({ maxPerSkill: 3 }),
          trainingApi.myLearning(),
        ]);
        const groups = Array.isArray(recoRes.data) ? recoRes.data : [];
        const recents = Array.isArray(recentRes.data) ? recentRes.data : [];
        const validRecents = recents.filter((item) => {
          const name = (item.courseName ?? "").trim();
          return name.length >= 3 && !/^\d+$/.test(name);
        });
        return { groups, recentTrainings: validRecents.slice(0, 6) };
      },
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
    });
  }, [queryClient]);

  const { playlistId, videoId } = useMemo(() => {
    if (!progress) return { playlistId: null, videoId: null };
    return parseYouTubeIds(progress.playlistUrl);
  }, [progress]);

  useEffect(() => {
    if (!progress) return;
    setPlaylistVideos([]);
    setSelectedVideoId(isValidYouTubeVideoId(videoId) ? videoId : null);
    setPlaylistLoadError(null);
    if (!playlistId) return;
    trainingApi
      .playlistVideos(progress.playlistUrl)
      .then(({ data }) => {
        const items = Array.isArray(data) ? data : [];
        setPlaylistVideos(items);
        if (!selectedVideoId && items.length > 0) {
          setSelectedVideoId(items[0].videoId);
        }
      })
      .catch(() => {
        setPlaylistLoadError("Impossible de charger la playlist (clé API/endpoint/playlist).");
      });
  }, [progress?.playlistUrl, playlistId, videoId]);

  const activeVideoId = useMemo(() => {
    if (isValidYouTubeVideoId(selectedVideoId)) return selectedVideoId;
    if (isValidYouTubeVideoId(videoId)) return videoId;
    const fromList = playlistVideos.find((v) => isValidYouTubeVideoId(v.videoId))?.videoId;
    return fromList ?? null;
  }, [selectedVideoId, videoId, playlistVideos]);

  useEffect(() => {
    if (!progress || !playerContainerRef.current) return;

    let cancelled = false;
    const currentVideo = activeVideoId ?? undefined;
    const list = playlistId ?? undefined;
    if (!currentVideo) {
      setPlaylistLoadError((prev) => prev ?? "Aucune vidéo YouTube valide trouvée pour cette playlist.");
      return;
    }

    const buildPlayer = () => {
      const YT = (window as any).YT;
      if (!YT?.Player || !playerContainerRef.current || cancelled) return;
      if (ytPlayerRef.current) {
        try { ytPlayerRef.current.destroy(); } catch {}
      }
      try {
        ytPlayerRef.current = new YT.Player(playerContainerRef.current, {
          width: "100%",
          height: "100%",
          host: "https://www.youtube.com",
          videoId: currentVideo,
          playerVars: {
            listType: list ? "playlist" : undefined,
            list,
            rel: 0,
            modestbranding: 1,
            enablejsapi: 1,
            origin: window.location.origin,
          },
        });
      } catch {
        setPlaylistLoadError("Lecture YouTube impossible (videoId invalide ou embed bloqué).");
      }
    };

    const ensureApi = () => {
      const win = window as any;
      if (win.YT?.Player) {
        buildPlayer();
        return;
      }
      const existing = document.getElementById("youtube-iframe-api");
      if (!existing) {
        const script = document.createElement("script");
        script.id = "youtube-iframe-api";
        script.src = "https://www.youtube.com/iframe_api";
        document.body.appendChild(script);
      }
      const prevReady = win.onYouTubeIframeAPIReady;
      win.onYouTubeIframeAPIReady = () => {
        if (typeof prevReady === "function") prevReady();
        buildPlayer();
      };
    };

    ensureApi();
    return () => {
      cancelled = true;
    };
  }, [progress?.progressUuid, playlistId, activeVideoId]);

  useEffect(() => {
    if (!progress) return;
    const tick = async () => {
      const player = ytPlayerRef.current;
      if (!player || typeof player.getCurrentTime !== "function" || typeof player.getVideoData !== "function") return;
      try {
        const watchedSeconds = Math.floor(Number(player.getCurrentTime?.() ?? 0));
        const currentVideoId = String(player.getVideoData?.()?.video_id ?? "").trim();
        if (!currentVideoId || watchedSeconds < 0) return;
        const { data } = await trainingApi.watchProgress(progress.progressUuid, currentVideoId, watchedSeconds);
        setProgress(data);
      } catch {
        // silence tracking errors to avoid UX noise
      }
    };

    const interval = window.setInterval(tick, 15000);
    return () => window.clearInterval(interval);
  }, [progress?.progressUuid]);

  const watchedMinutes = Math.floor((progress?.watchedSeconds ?? 0) / 60);
  const totalMinutes = Math.floor((progress?.playlistTotalSeconds ?? 0) / 60);

  if (!progress) {
    return <div className="mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">Formation introuvable.</div>;
  }

  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-5 xl:h-[calc(100vh-170px)] xl:flex-row xl:items-stretch xl:overflow-hidden">
      <section className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm xl:h-full xl:overflow-hidden">
        <button
          type="button"
          onClick={() => navigate(basePath)}
          className="mb-3 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white px-4 py-2 text-xs font-semibold text-violet-700 shadow-sm transition hover:-translate-y-0.5 hover:border-violet-300 hover:bg-violet-50 hover:shadow"
        >
          <ArrowLeftIcon className="h-3.5 w-3.5" />
          Retour aux formations
        </button>
        <h2 className="text-lg font-semibold text-slate-900">{progress.courseName}</h2>
        <p className="mt-1 text-sm text-slate-500">{progress.courseLevel}</p>
        <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
          <span>Visionné: {watchedMinutes} min / {totalMinutes > 0 ? `${totalMinutes} min` : "durée inconnue"}</span>
          <span>{progress.progressPercent}%</span>
        </div>
        <div className="mt-2 h-2 rounded-full bg-slate-100">
          <div className="h-2 rounded-full bg-violet-600 transition-all" style={{ width: `${progress.progressPercent}%` }} />
        </div>
        <div className="mt-4 aspect-video overflow-hidden rounded-xl bg-slate-100">
          <div ref={playerContainerRef} className="h-full w-full" />
        </div>
      </section>

      <aside className="w-full rounded-2xl border border-slate-200 bg-white p-4 shadow-sm xl:flex xl:h-full xl:w-[420px] xl:flex-col">
        <h3 className="text-sm font-semibold text-slate-900">Vidéos de la playlist</h3>
        {playlistVideos.length > 0 ? (
          <div className="mt-3 space-y-2 overflow-auto pr-1 xl:flex-1">
            {playlistVideos.map((video, idx) => {
              const active = (selectedVideoId ?? videoId) === video.videoId;
              return (
                <button
                  key={`${video.videoId}-${idx}`}
                  type="button"
                  onClick={() => setSelectedVideoId(video.videoId)}
                  className={`flex w-full gap-2 rounded-lg border p-2 text-left transition ${active ? "border-indigo-300 bg-indigo-50" : "border-slate-200 bg-white hover:bg-slate-50"}`}
                >
                  {video.thumbnailUrl ? (
                    <img src={video.thumbnailUrl} alt={video.title} className="h-14 w-24 rounded object-cover" />
                  ) : (
                    <div className="h-14 w-24 rounded bg-slate-100" />
                  )}
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-800">{video.title}</p>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <p className="mt-2 text-xs text-slate-500">
            {playlistLoadError ?? "Aucune playlist détectée ou aucune vidéo disponible."}
          </p>
        )}
      </aside>
    </div>
  );
}
