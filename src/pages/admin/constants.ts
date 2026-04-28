export const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrateur",
  MANAGER: "Manager",
  EMPLOYEE: "Employé",
  TRAINING_MANAGER: "Responsable formation",
};

export const ROLE_OPTIONS = [
  { value: "EMPLOYEE" as const, label: "Employé" },
  { value: "MANAGER" as const, label: "Manager" },
  { value: "TRAINING_MANAGER" as const, label: "Responsable formation" },
] as const;

export const MESSAGES = {
  userCreated: "Utilisateur créé avec succès.",
  userUpdated: "Utilisateur mis à jour.",
  errorGeneric: "Une erreur est survenue.",
  errorLoad: "Erreur lors du chargement.",
  loading: "Chargement...",
  noUsers: "Aucun utilisateur trouvé.",
  submit: "Envoi en cours...",
  create: "Créer l'utilisateur",
  save: "Enregistrer",
  cancel: "Annuler",
  close: "Fermer",
} as const;