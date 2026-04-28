const YT_ID = /^[a-zA-Z0-9_-]{11}$/;

/** 1×1 transparent GIF — évite des requêtes 404 si l’ID n’est pas un ID YouTube valide. */
export const PLACEHOLDER_THUMB =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

/**
 * Miniature « medium » (hqdefault) via i.ytimg.com — en général plus fiable que mqdefault.jpg pour les cartes.
 */
export function youtubeThumbUrl(videoId: string): string {
  const id = videoId.trim();
  if (!YT_ID.test(id)) return PLACEHOLDER_THUMB;
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}
