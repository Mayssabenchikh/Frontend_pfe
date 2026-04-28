/**
 * Extraction et libellés d'erreur API en français pour toutes les interfaces.
 */

const EXACT: Record<string, string> = {
  Forbidden: "Accès refusé.",
  "Access Denied": "Accès refusé.",
  Unauthorized: "Non autorisé. Veuillez vous reconnecter.",
  "Bad Request": "Requête invalide.",
  "Not Found": "Ressource introuvable.",
  "Internal Server Error": "Erreur interne du serveur. Réessayez plus tard.",
  "Service Unavailable": "Service temporairement indisponible. Réessayez plus tard.",
  "Current password is incorrect": "Mot de passe actuel incorrect.",
  "Invalid credentials": "Identifiants invalides.",
  "Network Error": "Erreur réseau. Vérifiez votre connexion.",
  "Request failed with status code 403": "Accès refusé.",
  "Request failed with status code 401": "Non autorisé. Veuillez vous reconnecter.",
  Error: "Une erreur est survenue.",
  "Empty response from AI quiz service": "Réponse vide du service de quiz IA.",
  "AI quiz generation failed": "Échec de la génération du quiz IA.",
  "Skill status update failed": "Échec de la mise à jour du statut de la compétence après le quiz.",
  "Invalid quiz payload from AI service": "Données de quiz invalides renvoyées par le service IA.",
};

/** Correspondances par préfixe / motif (messages variables côté serveur). */
const PREFIX_RULES: { test: (s: string) => boolean; fr: string | ((s: string) => string) }[] = [
  {
    test: (s) => /^User already exists with email:\s*/i.test(s),
    fr: (s) => `Un utilisateur existe déjà avec l'adresse e-mail : ${s.replace(/^User already exists with email:\s*/i, "").trim()}`,
  },
  {
    test: (s) => /^Keycloak returned\s+\d+:/i.test(s),
    fr: () => "Erreur du service d'authentification. Réessayez ou contactez l'administrateur.",
  },
  {
    test: (s) => s.startsWith("AI quiz service error:"),
    fr: () => "Erreur du service de quiz IA. Réessayez dans quelques instants.",
  },
  {
    test: (s) => s.startsWith("AI quiz generation failed:"),
    fr: () => "Échec de la génération du quiz IA. Réessayez dans quelques instants.",
  },
  {
    test: (s) => /Cloudinary upload failed/i.test(s),
    fr: () => "Échec de l'envoi du fichier vers le stockage. Réessayez.",
  },
];

export function translateApiMessageToFrench(text: string): string {
  const t = text.trim();
  if (!t) return t;
  if (EXACT[t]) return EXACT[t];
  const lower = t.toLowerCase();
  if (EXACT[t] === undefined) {
    for (const [en, fr] of Object.entries(EXACT)) {
      if (lower === en.toLowerCase()) return fr;
    }
  }
  for (const rule of PREFIX_RULES) {
    if (rule.test(t)) {
      return typeof rule.fr === "function" ? rule.fr(t) : rule.fr;
    }
  }
  return t;
}

function extractFromResponseData(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const d = data as Record<string, unknown>;

  if (typeof d.error === "string" && d.error.trim()) return d.error.trim();

  if (typeof d.message === "string" && d.message.trim()) return d.message.trim();

  const detail = d.detail;
  if (typeof detail === "string" && detail.trim()) return detail.trim();

  if (Array.isArray(detail)) {
    const parts = detail
      .map((item) => {
        if (!item || typeof item !== "object") return null;
        const o = item as Record<string, unknown>;
        if (typeof o.msg === "string") return o.msg;
        if (typeof o.message === "string") return o.message;
        return null;
      })
      .filter(Boolean) as string[];
    if (parts.length) return parts.join(" · ");
  }

  if (detail && typeof detail === "object") {
    const o = detail as Record<string, unknown>;
    if (typeof o.message === "string" && o.message.trim()) return String(o.message).trim();
  }

  if (Array.isArray(d.errors)) {
    const parts = d.errors
      .map((item) => {
        if (!item || typeof item !== "object") return null;
        const o = item as Record<string, unknown>;
        if (typeof o.defaultMessage === "string" && o.defaultMessage.trim()) return o.defaultMessage.trim();
        if (typeof o.message === "string" && o.message.trim()) return o.message.trim();
        return null;
      })
      .filter(Boolean) as string[];
    if (parts.length) return parts.join(" · ");
  }

  return null;
}

/** Extrait le premier message texte exploitable d'une erreur Axios / réseau. */
export function extractApiErrorText(err: unknown): string | null {
  if (!err || typeof err !== "object") return null;

  if ("response" in err) {
    const res = (err as { response?: { data?: unknown } }).response;
    const fromData = extractFromResponseData(res?.data);
    if (fromData) return fromData;
  }

  if (err instanceof Error && err.message.trim()) return err.message.trim();

  return null;
}

/**
 * Message utilisateur en français : extraction API + traduction des libellés connus en anglais.
 */
export function getUserFacingApiMessage(err: unknown, fallbackFr: string): string {
  const raw = extractApiErrorText(err);
  if (!raw) return fallbackFr;
  const fr = translateApiMessageToFrench(raw);
  return fr || fallbackFr;
}
