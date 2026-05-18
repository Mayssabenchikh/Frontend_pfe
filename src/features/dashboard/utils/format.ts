export function formatNumber(value: number, unit?: string | null) {
  const formatted = new Intl.NumberFormat("fr-FR").format(Number.isFinite(value) ? value : 0);
  return unit ? `${formatted}${unit}` : formatted;
}

export function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

function normalizeTechnicalValue(value?: string | null) {
  return (value ?? "").trim().toUpperCase().replace(/[\s-]+/g, "_");
}

export function formatStatusLabel(status?: string | null) {
  if (!status) return "Non défini";
  const normalized = normalizeTechnicalValue(status);
  const labels: Record<string, string> = {
    ACTIVE: "Actif",
    DISABLED: "Désactivé",
    ARCHIVED: "Archivé",
    PENDING: "En attente",
    ACCEPTED: "Affecté",
    APPROVED: "Approuvée",
    REJECTED: "Refusé",
    REFUSED: "Refusé",
    MERGED: "Fusionnée",
    COMPLETED: "Terminé",
    CLOSED: "Terminé",
    IN_PROGRESS: "En cours",
    DRAFT: "Brouillon",
    PUBLISHED: "Publié",
    VALIDATED: "Validé",
    QUIZ_PENDING: "Quiz en attente",
    TO_IMPROVE: "À renforcer",
    ASSIGNED: "Affecté",
    AFFECTE: "Affecté",
    CRITICAL: "Critique",
    HIGH: "Élevée",
    MEDIUM: "Moyenne",
    LOW: "Faible",
    FAILED: "Échoué",
    FAIL: "Échoué",
    PASSED: "Réussi",
    SUCCESS: "Réussi",
    READY: "Prêt",
    GENERATING: "En génération",
    SUBMITTED: "Soumis",
    REVIEWED: "Corrigé",
    ACTIVITY_REVIEWED: "Activité corrigée",
    CHAT_MESSAGE: "Message de chat",
    FORUM_COMMENT: "Commentaire forum",
    FORUM_REPLY: "Réponse forum",
    FORUM_MENTION: "Mention forum",
    ADMIN_PROJECT_ASSIGNED: "Affectation (admin)",
    ADMIN_PROJECT_CREATED: "Nouveau projet (admin)",
    ADMIN_SKILL_REQUEST_CREATED: "Demande de compétence (admin)",
    ADMIN_FORUM_POST_CREATED: "Publication forum (admin)",
    ADMIN_FORUM_COMMENT_ADDED: "Commentaire forum (admin)",
    FORUM_ACCEPTED_ANSWER: "Réponse acceptée",
    PROJECT_ASSIGNMENT: "Affectation projet",
    PROJECT_ASSIGNMENT_REMOVED: "Affectation retirée",
    ACTIVITY_SUBMITTED: "Activité soumise",
    SYSTEM_ANNOUNCEMENT: "Annonce système",
    IA_DISPONIBLE: "À revoir",
    AI_AVAILABLE: "À revoir",
    A_REVOIR: "À revoir",
    CORRIGE: "Corrigé",
    CORRIGÉ: "Corrigé",
    TRAINING_RECOMMENDED: "Formation recommandée",
    TRAINING_ENROLLED: "Inscription formation",
    TRAINING_COMPLETED: "Formation terminée",
    QUIZ_AVAILABLE: "Quiz disponible",
    QUIZ_PASSED: "Quiz réussi",
    QUIZ_FAILED: "Quiz échoué",
    REMOVED: "Retiré",
    EXTRACTED: "Extrait",
  };
  return labels[normalized] ?? status;
}

export function formatPriorityLabel(priority?: string | null) {
  if (!priority) return "Non définie";
  const normalized = normalizeTechnicalValue(priority);
  const labels: Record<string, string> = {
    CRITICAL: "Critique",
    HIGH: "Élevée",
    MEDIUM: "Moyenne",
    LOW: "Faible",
    TO_IMPROVE: "À renforcer",
  };
  return labels[normalized] ?? formatStatusLabel(priority);
}

export function formatRoleLabel(role?: string | null) {
  if (!role) return "Rôle non défini";
  const normalized = normalizeTechnicalValue(role);
  const labels: Record<string, string> = {
    ADMIN: "Administrateur",
    MANAGER: "Manager",
    EMPLOYEE: "Employé",
    TRAINING_MANAGER: "Responsable formation",
  };
  return labels[normalized] ?? role;
}

export function normalizeStatus(status?: string | null) {
  return formatStatusLabel(status);
}
