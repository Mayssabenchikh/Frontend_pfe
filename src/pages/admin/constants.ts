export const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrateur",
  MANAGER: "Manager",
  EMPLOYEE: "Employé",
};

export const ROLE_OPTIONS = [
  { value: "EMPLOYEE" as const, label: "Employé" },
  { value: "MANAGER" as const, label: "Manager" },
] as const;

export const MESSAGES = {
  userCreated: "Utilisateur créé.",
  userUpdated: "Utilisateur mis à jour.",
  errorGeneric: "Erreur",
  errorLoad: "Erreur chargement",
  loading: "Chargement...",
  noUsers: "Aucun utilisateur.",
  submit: "Envoi...",
  create: "Créer",
  save: "Enregistrer",
  cancel: "Annuler",
  close: "Fermer",
} as const;
