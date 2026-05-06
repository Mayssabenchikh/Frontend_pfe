const exactTranslations: Record<string, string> = {
  "dashboard admin": "Tableau de bord admin",
  "dashboard manager": "Tableau de bord responsable d'équipe",
  "dashboard responsable formation": "Tableau de bord responsable formation",
  "mon dashboard": "Mon tableau de bord",
  "skillify analytics": "Analyse Skillify",
  managers: "Responsables d'équipe",
  manager: "Responsable",
  employee: "Employé",
  employees: "Employés",
  training: "Formation",
  trainings: "Formations",
  skills: "Compétences",
  skill: "Compétence",
  feedback: "Retour",
  "recent feedback": "Retours récents",
  "skill gaps par competence": "Écarts de compétences par compétence",
  "gaps critiques": "Écarts critiques",
  completed: "Terminé",
  in_progress: "En cours",
  published: "Publié",
  draft: "Brouillon",
  risk: "Risque",
  validated: "Validé",
};

const phraseTranslations: Array<[RegExp, string]> = [
  [/\bDashboard\b/g, "Tableau de bord"],
  [/\bSkill gaps\b/gi, "Écarts de compétences"],
  [/\bGaps\b/g, "Écarts"],
  [/\bgaps\b/g, "écarts"],
  [/\bFeedback\b/g, "Retours"],
  [/\bfeedback\b/g, "retours"],
  [/\bManager\b/g, "Responsable"],
  [/\bmanager\b/g, "responsable"],
  [/\bEmployees\b/g, "Employés"],
  [/\bemployees\b/g, "employés"],
  [/\bEmployee\b/g, "Employé"],
  [/\bemployee\b/g, "employé"],
  [/\bSkills\b/g, "Compétences"],
  [/\bskills\b/g, "compétences"],
  [/\bSkill\b/g, "Compétence"],
  [/\bskill\b/g, "compétence"],
  [/\bTrainings\b/g, "Formations"],
  [/\btrainings\b/g, "formations"],
  [/\bTraining\b/g, "Formation"],
  [/\btraining\b/g, "formation"],
];

export function translateDashboardText(value?: string | null) {
  if (!value) return value;
  const normalized = value.trim().toLowerCase();
  const exact = exactTranslations[normalized];
  if (exact) return exact;
  return phraseTranslations.reduce((text, [pattern, replacement]) => text.replace(pattern, replacement), value);
}
