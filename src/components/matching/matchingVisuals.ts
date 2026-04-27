export function toPercent(value: number, digits = 0): string {
  const pct = Math.max(0, Math.min(100, value * 100));
  return `${pct.toFixed(digits)}%`;
}

export function toPercentNumber(value: number): number {
  return Math.max(0, Math.min(100, value * 100));
}

export function avatarInitials(displayName?: string | null, email?: string | null): string {
  const source = (displayName && displayName.trim()) || (email && email.trim()) || "?";
  const parts = source
    .split(/\s+/)
    .map((p) => p.trim())
    .filter(Boolean);

  if (!parts.length) return "?";
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export function avatarGradient(seed: string): [string, string] {
  const palettes: [string, string][] = [
    ["#8b5cf6", "#6d28d9"],
    ["#9333ea", "#7e22ce"],
    ["#2563eb", "#4f46e5"],
    ["#0ea5e9", "#2563eb"],
    ["#f97316", "#ea580c"],
    ["#ec4899", "#be185d"],
    ["#14b8a6", "#0f766e"],
    ["#22c55e", "#15803d"],
  ];

  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  return palettes[Math.abs(hash) % palettes.length];
}

/** Niveau de compétence affiché (N = niveau ; évite la confusion avec la lettre L). */
export function formatSkillLevel(level: number | null | undefined): string {
  if (level === null || level === undefined || Number.isNaN(Number(level))) return "—";
  return `N${Number(level)}`;
}

export function formatFrenchDate(value?: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}
