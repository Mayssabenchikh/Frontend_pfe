import type { TokenParsed } from "./types";

export function getDisplayName(token: TokenParsed | undefined): string {
  if (!token) return "Utilisateur";
  if (token.name) return token.name;
  const parts = [token.given_name, token.family_name].filter(Boolean);
  if (parts.length) return parts.join(" ");
  return token.preferred_username ?? "Utilisateur";
}

export function getInitials(token: TokenParsed | undefined): string {
  if (!token) return "?";
  const given = token.given_name ?? "";
  const family = token.family_name ?? "";
  if (given && family) return `${given[0]}${family[0]}`.toUpperCase();
  const name = token.name ?? token.preferred_username ?? "";
  if (name) return name.slice(0, 2).toUpperCase();
  return "?";
}

export function getApiError(err: unknown, fallback: string): string {
  if (err && typeof err === "object" && "response" in err) {
    const res = (err as { response?: { data?: { error?: string } } }).response;
    if (res?.data?.error) return res.data.error;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}

export function ensureArray<T>(value: T | T[] | null | undefined): T[] {
  return Array.isArray(value) ? value : [];
}

export function getAvatarColor(str: string): [string, string] {
  const palettes: [string, string][] = [
    ["#8b5cf6", "#6366f1"],
    ["#06b6d4", "#0ea5e9"],
    ["#10b981", "#14b8a6"],
    ["#f59e0b", "#f97316"],
    ["#ec4899", "#f43f5e"],
    ["#6366f1", "#8b5cf6"],
    ["#84cc16", "#22c55e"],
    ["#a855f7", "#ec4899"],
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return palettes[Math.abs(hash) % palettes.length];
}