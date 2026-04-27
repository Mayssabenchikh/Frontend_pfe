import type { AxiosResponse } from "axios";
import { http } from "./http";

type MeResponse = { avatarUrl: string | null };

type MeRequestState = {
  inFlight: Promise<AxiosResponse<unknown>> | null;
  cacheAt: number;
  cachedValue: AxiosResponse<unknown> | null;
};

const ME_DEDUPE_TTL_MS = 3000;
const meRequestState = new Map<string, MeRequestState>();

function dedupedMeGet<T>(endpoint: string): Promise<AxiosResponse<T>> {
  const now = Date.now();
  const state = meRequestState.get(endpoint);

  if (state?.cachedValue && now - state.cacheAt < ME_DEDUPE_TTL_MS) {
    return Promise.resolve(state.cachedValue as AxiosResponse<T>);
  }

  if (state?.inFlight) {
    return state.inFlight as Promise<AxiosResponse<T>>;
  }

  const request = http.get<T>(endpoint).finally(() => {
    const current = meRequestState.get(endpoint);
    if (!current) return;
    current.inFlight = null;
  });

  meRequestState.set(endpoint, {
    inFlight: request,
    cacheAt: state?.cacheAt ?? 0,
    cachedValue: state?.cachedValue ?? null,
  });

  return request.then((res) => {
    meRequestState.set(endpoint, {
      inFlight: null,
      cacheAt: Date.now(),
      cachedValue: res,
    });
    return res;
  });
}

export const meApi = {
  manager: () => dedupedMeGet<MeResponse>("/api/manager/me"),
  employee: () => dedupedMeGet<MeResponse>("/api/employee/me"),
  byEndpoint: <T>(endpoint: string) => dedupedMeGet<T>(endpoint),
};
