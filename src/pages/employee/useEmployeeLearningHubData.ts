import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { trainingApi, type EmployeeTrainingProgress, type SkillRecommendationGroup } from "../../api/trainingApi";

const HUB_CACHE_KEY = "employee-learning-hub-cache-v2";
const HUB_QUERY_KEY = "employee-learning-hub";
const HUB_STALE_TIME_MS = 5 * 60 * 1000;
const HUB_CACHE_TIME_MS = 30 * 60 * 1000;

type HubFilters = {
  q: string;
  level: string;
  track: string;
  durationBand: "" | "0-1" | "1-3" | "3+";
  filtersOpen: boolean;
};

type HubData = {
  groups: SkillRecommendationGroup[];
  recentTrainings: EmployeeTrainingProgress[];
};

type HubSessionPayload = {
  ts: number;
  data: HubData;
  filters: HubFilters;
};

function readHubSessionCache(): HubSessionPayload | null {
  try {
    const raw = window.sessionStorage.getItem(HUB_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as HubSessionPayload;
    if (typeof parsed.ts !== "number" || !parsed.data || !parsed.filters) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeHubSessionCache(data: HubData, filters: HubFilters) {
  try {
    const payload: HubSessionPayload = {
      ts: Date.now(),
      data,
      filters,
    };
    window.sessionStorage.setItem(HUB_CACHE_KEY, JSON.stringify(payload));
  } catch {
    // ignore storage failures
  }
}

async function fetchHubData(args: { q?: string; level?: string; track?: string; minHours?: number; maxHours?: number }): Promise<HubData> {
  const [recoRes, recentRes] = await Promise.all([
    trainingApi.recommendFromSkills({
      maxPerSkill: 3,
      q: args.q,
      level: args.level,
      track: args.track,
      minHours: args.minHours,
      maxHours: args.maxHours,
    }),
    trainingApi.myLearning(),
  ]);
  const groups = Array.isArray(recoRes.data) ? recoRes.data : [];
  const recents = Array.isArray(recentRes.data) ? recentRes.data : [];
  const validRecents = recents.filter((item) => {
    const name = (item.courseName ?? "").trim();
    return name.length >= 3 && !/^\d+$/.test(name);
  });
  return {
    groups,
    recentTrainings: validRecents.slice(0, 6),
  };
}

export function useEmployeeLearningHubData() {
  const queryClient = useQueryClient();
  const [thumbnailByPlaylist, setThumbnailByPlaylist] = useState<Record<string, string>>({});
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [q, setQ] = useState("");
  const [level, setLevel] = useState("");
  const [track, setTrack] = useState("");
  const [durationBand, setDurationBand] = useState<"" | "0-1" | "1-3" | "3+">("");
  const [debouncedQ, setDebouncedQ] = useState("");

  useEffect(() => {
    const cached = readHubSessionCache();
    if (!cached) return;
    if (Date.now() - cached.ts > HUB_STALE_TIME_MS) return;
    setQ(cached.filters.q ?? "");
    setLevel(cached.filters.level ?? "");
    setTrack(cached.filters.track ?? "");
    setDurationBand(cached.filters.durationBand ?? "");
    setFiltersOpen(Boolean(cached.filters.filtersOpen));
    setDebouncedQ(cached.filters.q ?? "");
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQ(q), 250);
    return () => window.clearTimeout(t);
  }, [q]);

  const { minHours, maxHours } = useMemo(() => {
    if (durationBand === "0-1") return { minHours: 0, maxHours: 1 };
    if (durationBand === "1-3") return { minHours: 1, maxHours: 3 };
    if (durationBand === "3+") return { minHours: 3, maxHours: undefined };
    return { minHours: undefined, maxHours: undefined };
  }, [durationBand]);

  const queryKey = useMemo(
    () => [HUB_QUERY_KEY, { q: debouncedQ || "", level: level || "", track: track || "", minHours, maxHours }] as const,
    [debouncedQ, level, track, minHours, maxHours],
  );

  const query = useQuery({
    queryKey,
    queryFn: () =>
      fetchHubData({
        q: debouncedQ || undefined,
        level: level || undefined,
        track: track || undefined,
        minHours,
        maxHours,
      }),
    staleTime: HUB_STALE_TIME_MS,
    gcTime: HUB_CACHE_TIME_MS,
    refetchOnWindowFocus: true,
    placeholderData: (previous) => previous,
    initialData: () => {
      const cached = readHubSessionCache();
      if (!cached) return undefined;
      if (Date.now() - cached.ts > HUB_STALE_TIME_MS) return undefined;
      return cached.data;
    },
  });

  const groups = query.data?.groups ?? [];
  const recentTrainings = query.data?.recentTrainings ?? [];

  useEffect(() => {
    if (!query.data) return;
    writeHubSessionCache(query.data, { q, level, track, durationBand, filtersOpen });
  }, [query.data, q, level, track, durationBand, filtersOpen]);

  useEffect(() => {
    const currentData = queryClient.getQueryData<HubData>(queryKey);
    if (!currentData) return;
    writeHubSessionCache(currentData, { q, level, track, durationBand, filtersOpen });
  }, [q, level, track, durationBand, filtersOpen, queryClient, queryKey]);

  useEffect(() => {
    const playlistUrls = [
      ...groups.flatMap((g) => g.recommendations.map((r) => r.playlistUrl)),
      ...recentTrainings.map((r) => r.playlistUrl),
    ];
    const unique = Array.from(new Set(playlistUrls.filter(Boolean))).filter((url) => !thumbnailByPlaylist[url]);
    if (unique.length === 0) return;
    let active = true;
    void Promise.all(
      unique.map(async (url) => {
        try {
          const { data } = await trainingApi.playlistVideos(url);
          const first = Array.isArray(data) ? data[0] : null;
          return first?.thumbnailUrl ? [url, first.thumbnailUrl] as const : null;
        } catch {
          return null;
        }
      }),
    ).then((results) => {
      if (!active) return;
      const updates = Object.fromEntries(results.filter((v): v is readonly [string, string] => Boolean(v)));
      if (Object.keys(updates).length > 0) {
        setThumbnailByPlaylist((prev) => ({ ...prev, ...updates }));
      }
    });
    return () => {
      active = false;
    };
  }, [groups, recentTrainings, thumbnailByPlaylist]);

  return {
    groups,
    recentTrainings,
    thumbnailByPlaylist,
    isFetching: query.isFetching,
    isError: query.isError,
    filters: { q, level, track, durationBand, filtersOpen },
    setQ,
    setLevel,
    setTrack,
    setDurationBand,
    setFiltersOpen,
  };
}
