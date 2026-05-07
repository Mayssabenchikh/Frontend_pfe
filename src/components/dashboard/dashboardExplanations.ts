/**
 * Dashboard Explanations - Comprehensive guides for all KPIs, charts and sections
 * Each explanation includes: Purpose, Measurement, Interpretation, Importance, and Actions
 */

export interface ExplanationContent {
  title: string;
  purpose: string;
  measures: string;
  interpretation: string;
  importance: string;
  actions: string;
}

// ============================================================================
// ADMIN DASHBOARD EXPLANATIONS
// ============================================================================

export const adminDashboardExplanations: Record<string, ExplanationContent> = {
  // Section: Pilotage global
  section_admin_governance: {
    title: "Pilotage global",
    purpose: "Vue d'ensemble complète de la santé globale de la plateforme",
    measures: "Métriques clés de croissance et d'engagement",
    interpretation: "Permet d'identifier rapidement les tendances positives ou préoccupantes",
    importance: "Essentiel pour la prise de décision stratégique et l'allocation des ressources",
    actions: "Explorez les sections détaillées pour approfondir les anomalies détectées",
  },

  // KPIs - Pilotage global
  admin_total_employees: {
    title: "Nombre total d'employés",
    purpose: "Suivi de la taille globale de la base utilisateurs",
    measures: "Nombre d'employés actifs et inactifs dans la plateforme",
    interpretation: "Un nombre stable indique une bonne rétention ; une baisse peut signaler un problème",
    importance: "Indicateur clé de la croissance et de la santé organisationnelle",
    actions: "Comparez avec la période précédente pour identifier les tendances de rotation",
  },

  admin_active_employees: {
    title: "Employés actifs ce mois",
    purpose: "Mesurer l'engagement actuel des utilisateurs",
    measures: "Nombre d'employés ayant au moins une interaction dans le mois",
    interpretation: "Plus le ratio est élevé, meilleur est l'engagement; un ratio faible indique un problème",
    importance: "Révèle l'engagement réel versus la base nominale",
    actions: "Identifiez les employés inactifs pour relancer leur engagement",
  },

  admin_total_skills: {
    title: "Compétences existantes",
    purpose: "Tracer l'étendue du catalogue de compétences disponibles",
    measures: "Nombre de compétences uniques cataloguées dans le système",
    interpretation: "Un nombre croissant indique une couverture d'expertise; une stagnation peut signaler une mise à jour insuffisante",
    importance: "Reflète la richesse du référentiel de compétences et l'alignement avec les besoins métier",
    actions: "Examinez le catalogue annuellement pour ajouter les compétences émergentes",
  },

  admin_active_trainings: {
    title: "Formations actives",
    purpose: "Évaluer l'offre de formation disponible",
    measures: "Nombre de formations actuellement publiées ou en cours",
    interpretation: "Un nombre équilibré assure une couverture; un nombre très élevé peut diluer la qualité",
    importance: "Indique la diversité des chemins d'apprentissage offerts",
    actions: "Archivez les formations obsolètes et encouragez la création de nouvelles formations pertinentes",
  },

  admin_quiz_completion_rate: {
    title: "Taux de complétion des quiz",
    purpose: "Mesurer l'engagement avec les évaluations",
    measures: "Pourcentage de quiz commencés qui sont finalisés",
    interpretation: "Un taux élevé (>80%) indique une bonne engagement; <50% signale une friction",
    importance: "Révèle l'efficacité des apprentissages et la motivation à évaluer",
    actions: "Simplifiez les quiz complexes ou offrez un accompagnement supplémentaire",
  },

  admin_average_quiz_score: {
    title: "Score moyen quiz",
    purpose: "Évaluer la maîtrise globale des compétences",
    measures: "Score moyen de tous les quiz passés ce mois",
    interpretation: "Un score élevé (>70%) indique une maîtrise; <50% signale des écarts critiques",
    importance: "Indicateur de la préparation de la force de travail",
    actions: "Investissez dans les formations pour les domaines à faibles scores",
  },

  // KPIs - Matching
  admin_matching_projects: {
    title: "Projets avec matching",
    purpose: "Compter les projets bénéficiant de recommandations de profils",
    measures: "Nombre de projets avec au moins une recommandation active",
    interpretation: "100% idéal; <50% indique une couverture insuffisante",
    importance: "Assure que les projets critiques reçoivent des talents adaptés",
    actions: "Examinez les projets non couverts et ajoutez les recommandations manquantes",
  },

  admin_matching_avg: {
    title: "Score moyen matching",
    purpose: "Évaluer la qualité globale des recommandations",
    measures: "Score d'adéquation moyen (0-100%) entre profil et projet",
    interpretation: "≥70% excellent; 50-69% acceptable; <50% risqué",
    importance: "Détermine la réussite potentielle de l'assignation",
    actions: "Renforcez les règles de matching pour les scores < 60%",
  },

  admin_matching_reco: {
    title: "Recommandations actives",
    purpose: "Tracker le volume des suggestions de matching",
    measures: "Nombre total de recommandations profil-projet en cours",
    interpretation: "Un nombre élevé indique une activité de matching soutenue",
    importance: "Reflète la dynamique et la flexibilité d'allocation des ressources",
    actions: "Convertissez les recommandations validées en assignations réelles",
  },

  admin_matching_risk: {
    title: "Projets à risque de staffing",
    purpose: "Identifier les projets avec des gaps critiques en talents",
    measures: "Nombre de projets avec des écarts de compétences non comblés",
    interpretation: "0 idéal; >3 signale une crise de staffing potentielle",
    importance: "Permet une intervention précoce pour éviter les retards de projets",
    actions: "Élaborez des plans de reclassement ou de formation d'urgence",
  },

  // Charts
  chart_employees_evolution: {
    title: "Évolution des employés",
    purpose: "Visualiser la tendance de croissance de l'effectif",
    measures: "Nombre d'employés ajoutés chaque mois",
    interpretation: "Courbe croissante: bonne croissance; courbe décroissante: possible attrition",
    importance: "Aide à anticiper les besoins en formation et l'adaptation des capacités",
    actions: "Planifiez les programmes d'intégration et de formation selon les pics de croissance",
  },

  chart_users_by_role: {
    title: "Répartition utilisateurs par rôle",
    purpose: "Comprendre la composition de l'équipe par responsabilité",
    measures: "Proportion d'employés, managers, responsables formation et administrateurs",
    interpretation: "Un ratio 10:1 (employés:managers) est optimal",
    importance: "Assure un équilibre sain des structures de leadership",
    actions: "Rééquilibrez si un rôle est surreprésenté ou sous-représenté",
  },

  chart_top_skills: {
    title: "Compétences les plus demandées",
    purpose: "Identifier les compétences critiques pour l'organisation",
    measures: "Nombre de projets demandant chaque compétence",
    interpretation: "Les compétences en haut de la liste sont stratégiques",
    importance: "Oriente les investissements de formation et les priorités d'acquisition",
    actions: "Priorisez les formations et évaluations pour les top 5 compétences",
  },

  chart_top_trainings: {
    title: "Formations les plus suivies",
    purpose: "Évaluer la demande réelle de formation",
    measures: "Nombre d'inscriptions par formation",
    interpretation: "High demand indique la pertinence; low demand peut indiquer une obscurité",
    importance: "Confirme la pertinence du contenu et l'engagement des apprenants",
    actions: "Promouvoir davantage les formations peu suivies ou réexaminer leur pertinence",
  },

  chart_quiz_success_rate: {
    title: "Taux de réussite quiz par mois",
    purpose: "Suivre les performances d'apprentissage dans le temps",
    measures: "Pourcentage de quiz réussis (≥70%) par mois",
    interpretation: "Tendance à la hausse: amélioration pédagogique; baisse: possible problème",
    importance: "Indique l'efficacité des stratégies d'apprentissage",
    actions: "Identifiez les mois faibles et analysez les changements apportés",
  },

  chart_matching_by_project: {
    title: "Score de matching par projet",
    purpose: "Identifier les projets les mieux staffés versus ceux à risque",
    measures: "Score d'adéquation moyen par projet",
    interpretation: "Projets en haut: excellente couverture talent; bas: efforts prioritaires",
    importance: "Révèle les disparités d'allocation de ressources",
    actions: "Réaffectez les talents ou ajoutez les formations pour améliorer les bas scores",
  },

  // Tables
  table_latest_employees: {
    title: "Derniers employés ajoutés",
    purpose: "Suivre les nouvelles recrues intégrées",
    measures: "Nom, département, niveau de compétence des 10 derniers employés",
    interpretation: "Vérifiez que les niveaux correspondent au profil attendu",
    importance: "Assure que l'intégration de nouvelles recrues est traçable",
    actions: "Planifiez des formations d'intégration pour les nouveaux entrants",
  },

  table_latest_trainings: {
    title: "Dernières formations créées",
    purpose: "Suivre les nouveaux contenus de formation",
    measures: "Titre, date de création, nombre de modules des 10 dernières formations",
    interpretation: "Vérifiez que le nombre de modules est adapté",
    importance: "Assure une couverture à jour des sujets de formation",
    actions: "Rejetez rapidement les formations obsolètes; encouragez la création continue",
  },

  table_matching_recommendations: {
    title: "Recommandations de matching",
    purpose: "Examiner les assignments proposées et valider la qualité",
    measures: "Profil recommandé, projet, score de matching, statut",
    interpretation: "Scores >70%: approvez rapidement; <50%: questionnez ou rejetez",
    importance: "Contrôle de qualité des décisions d'allocation de talents",
    actions: "Rejetez les mauvais matchs et itérez les règles de recommandation",
  },
};

// ============================================================================
// MANAGER DASHBOARD EXPLANATIONS
// ============================================================================

export const managerDashboardExplanations: Record<string, ExplanationContent> = {
  // Section: Vue équipe
  section_manager_team_view: {
    title: "Vue équipe",
    purpose: "Avoir une vue complète de la performance et l'engagement de votre équipe",
    measures: "Métriques clés de votre équipe directe",
    interpretation: "Permet d'identifier rapidement qui progresse et qui a besoin de soutien",
    importance: "Essentiel pour gérer efficacement et motiver votre équipe",
    actions: "Utilisez ces données pour identifier les besoins de coaching et de formation",
  },

  // KPIs - Team
  manager_team_size: {
    title: "Taille de l'équipe",
    purpose: "Tracer le nombre d'employés dont vous êtes responsable",
    measures: "Nombre total d'employés directs",
    interpretation: "Baseline pour tous les autres calculs d'équipe",
    importance: "Aide à contextualiser les autres métriques",
    actions: "Planifiez l'allocation de temps en fonction de la charge",
  },

  manager_team_active: {
    title: "Équipe active ce mois",
    purpose: "Mesurer l'engagement de votre équipe",
    measures: "Nombre d'employés ayant au moins une action ce mois",
    interpretation: "100% idéal; <80% peut indiquer un engagement faible ou des congés",
    importance: "Indicateur de l'engagement opérationnel",
    actions: "Relancez les employés inactifs avec des assignments ou formations",
  },

  manager_avg_skill_level: {
    title: "Niveau moyen des compétences",
    purpose: "Évaluer le niveau global d'expertise de l'équipe",
    measures: "Moyenne des niveaux (1-5) de toutes les compétences",
    interpretation: "Niveau 3+ indique une équipe capable; <2.5 indique des besoins en formation",
    importance: "Reflète la capacité à livrer la qualité",
    actions: "Identifiez les domaines de compétences faibles et réappliquez du training",
  },

  manager_quiz_completion_rate: {
    title: "Taux de complétion quiz équipe",
    purpose: "Suivre la participation aux évaluations",
    measures: "Pourcentage de quiz commencés et finalisés par votre équipe",
    interpretation: ">80% bon engagement; <50% nécessite un renforcement",
    importance: "Révèle le discipline d'auto-évaluation",
    actions: "Encouragez les quiz non complétés via un suivi direct",
  },

  manager_avg_quiz_score: {
    title: "Score moyen quiz équipe",
    purpose: "Évaluer la maîtrise globale des compétences",
    measures: "Score moyen de tous les quiz de votre équipe",
    interpretation: ">70% bon; 50-69% acceptable; <50% défaillant",
    importance: "Indicateur clé de la préparation à exécuter",
    actions: "Mettez en place du soutien supplémentaire pour les domaines faibles",
  },

  // KPIs - Matching
  manager_matching_projects: {
    title: "Projets avec matching",
    purpose: "Nombre de projets avec recommandations de talent de votre équipe",
    measures: "Nombre de projets où au moins un membre de votre équipe est recommandé",
    interpretation: "Plus le nombre est élevé, plus votre équipe est sollicitée",
    importance: "Montre la demande et la pertinence de votre équipe",
    actions: "Vérifiez que votre équipe n'est pas surchargée",
  },

  manager_matching_avg_score: {
    title: "Score moyen matching",
    purpose: "Évaluer la qualité des recommendations de votre équipe",
    measures: "Score d'adéquation moyen pour votre équipe",
    interpretation: "≥70% excellent; <50% indique un décalage compétences-besoins",
    importance: "Révèle l'adéquation talent-projet",
    actions: "Planifiez du skilling pour améliorer les scores faibles",
  },

  manager_matching_high_score: {
    title: "Matchs >= 70%",
    purpose: "Compter les recommendations de haute qualité",
    measures: "Nombre de recommendations avec score ≥ 70%",
    interpretation: "Indicateur des excellents matchs prêts à accepter",
    importance: "Facilite la prise de décision rapide",
    actions: "Acceptez rapidement les recommendations ≥70%",
  },

  manager_matching_risk: {
    title: "Projets sans match suffisant",
    purpose: "Identifier les projets nécessitant du reskilling",
    measures: "Nombre de projets où aucun match n'atteint 70%",
    interpretation: "0 idéal; >1 signale un gap de compétences",
    importance: "Permet une intervention précoce",
    actions: "Planifiez des formations d'urgence ou des recrutements",
  },

  // Section: Compétences, quiz et progression
  section_manager_skills_quiz: {
    title: "Compétences, quiz et progression",
    purpose: "Analyser la profondeur des compétences et l'engagement d'apprentissage",
    measures: "4 perspectives différentes sur les compétences et l'évaluation",
    interpretation: "Ensemble holistique pour évaluer la maturité de l'équipe",
    importance: "Permet une gestion intelligente du développement d'équipe",
    actions: "Utilisez chaque graphique pour affiner votre stratégie de skilling",
  },

  chart_skill_levels_by_employee: {
    title: "Niveaux des employés par compétence",
    purpose: "Voir les compétences de chaque employé côte à côte",
    measures: "Matrice: employé vs compétence, colorée par niveau",
    interpretation: "Zones rouges/orange: gaps prioritaires; zones vertes: forces",
    importance: "Permet d'identifier les chevaux de bataille et les besoins de reskilling",
    actions: "Assignez les employés aux projets selon leurs forces",
  },

  chart_employee_progress: {
    title: "Progression des employés",
    purpose: "Tracker la courbe d'apprentissage dans le temps",
    measures: "Score de progression cumulative par employé",
    interpretation: "Courbes croissantes: bonne tendance; plates: stagnation possible",
    importance: "Révèle qui progresse et qui a besoin de soutien",
    actions: "Célébrez les progrès; intervenez pour les stagnations",
  },

  chart_quiz_results_by_employee: {
    title: "Résultats quiz par employé",
    purpose: "Comparer les performances en évaluation",
    measures: "Score moyen de chaque employé",
    interpretation: "Disparités: certains progressent, d'autres stagnent",
    importance: "Identifie les top performers et les bottlenecks",
    actions: "Jumelez les top performers avec les autres pour du mentoring",
  },

  chart_skill_gaps_by_skill: {
    title: "Écarts de compétences par compétence",
    purpose: "Voir les lacunes de compétences par domaine",
    measures: "Écart moyen (cible - réel) pour chaque compétence",
    interpretation: "Barres longues: gaps critiques; courtes: maîtrise atteinte",
    importance: "Oriente les priorités de formation",
    actions: "Investissez dans les formations pour les top 3 gaps",
  },

  // Section: Matching et projets
  section_manager_matching_projects: {
    title: "Matching et projets",
    purpose: "Optimiser l'assignation des talents aux projets",
    measures: "Recommendations et performance de projets",
    interpretation: "Données d'optimisation pour placement stratégique",
    importance: "Maximise l'utilisation des talents et les succès de projets",
    actions: "Acceptez les recommendations et planifiez le développement correspondant",
  },
};

// ============================================================================
// EMPLOYEE DASHBOARD EXPLANATIONS
// ============================================================================

export const employeeDashboardExplanations: Record<string, ExplanationContent> = {
  // Section: Vue personnelle
  section_employee_personal_view: {
    title: "Vue personnelle",
    purpose: "Avoir une vue claire de votre progression personnelle et de vos responsabilités",
    measures: "Votre progression, vos actions et les formations recommandées",
    interpretation: "Tableau de bord de votre développement professionnel",
    importance: "Vous aide à suivre votre parcours et à rester motivé",
    actions: "Priorisez vos actions pour développer vos compétences",
  },

  // KPIs
  employee_skill_gaps: {
    title: "Vos écarts de compétences",
    purpose: "Identifier les domaines où vous avez besoin de vous développer",
    measures: "Nombre de compétences où vous êtes en dessous du niveau cible",
    interpretation: "Plus le nombre est élevé, plus il y a de domaines à couvrir",
    importance: "Guide votre stratégie d'apprentissage personnel",
    actions: "Suivez les formations recommandées pour combler ces écarts",
  },

  employee_training_progress: {
    title: "Progression de formation",
    purpose: "Suivre vos progrès dans les formations en cours",
    measures: "Pourcentage d'achèvement des formations commencées",
    interpretation: "100% achevé: bravo! 0%: commencez ou complétez",
    importance: "Vous motivera à terminer ce que vous avez commencé",
    actions: "Terminez les formations partiellement complétées ce mois",
  },

  employee_quiz_average_score: {
    title: "Votre score moyen quiz",
    purpose: "Évaluer votre maîtrise globale",
    measures: "Score moyen de tous vos quiz",
    interpretation: ">70% excellent; 50-69% acceptable; <50% besoin de renforcement",
    importance: "Démontre votre préparation aux responsabilités",
    actions: "Refaites les quiz échoués et révisez les domaines faibles",
  },

  employee_active_projects: {
    title: "Projets actifs",
    purpose: "Tracer le nombre de projets auxquels vous participez",
    measures: "Nombre de projets en cours",
    interpretation: "1-2 optimal; >3 peut être surchargé",
    importance: "Aide à équilibrer votre charge de travail",
    actions: "Communiquez si vous êtes surchargé ou sous-utilisé",
  },

  // Section: Compétences, quiz et formation
  section_employee_skills_training: {
    title: "Compétences, quiz et formation",
    purpose: "Visualiser votre développement de compétences de multiple angles",
    measures: "4 perspectives: compétences cibles, scores, progression, distribution",
    interpretation: "Vue holistique de votre profil de compétences",
    importance: "Vous aide à identifier vos forces et faiblesses",
    actions: "Concentrez-vous sur l'équilibre de vos compétences",
  },

  chart_current_vs_target: {
    title: "Compétences actuelles vs cibles",
    purpose: "Comparer votre niveau réel à vos objectifs de carrière",
    measures: "Diagramme radar: niveau actuel vs niveau cible par compétence",
    interpretation: "Zones à l'intérieur: en retard; zones à l'extérieur: avancé",
    importance: "Vous montre exactement sur quoi vous concentrer",
    actions: "Priorisez les gaps majeurs (écarts > 2 niveaux)",
  },

  chart_quiz_score_evolution: {
    title: "Évolution des scores quiz",
    purpose: "Tracker votre amélioration dans le temps",
    measures: "Votre score à chaque quiz au fil du temps",
    interpretation: "Courbe croissante: apprentissage en cours; plate: stagnation",
    importance: "Vous montre si vos efforts d'apprentissage portent leurs fruits",
    actions: "Célébrez les tendances à la hausse; ajustez la stratégie si stagnation",
  },

  chart_training_progress: {
    title: "Progression par formation",
    purpose: "Voir votre avancement dans chaque formation",
    measures: "% d'achèvement par programme de formation",
    interpretation: "100%: achevé; 50-99%: en cours; <50%: à reprendre",
    importance: "Vous motive à terminer les formations commencées",
    actions: "Terminez les formations en cours avant de commencer de nouvelles",
  },

  chart_skills_by_level: {
    title: "Compétences par niveau",
    purpose: "Voir la distribution de vos compétences par niveau",
    measures: "Donut chart: nombre de compétences à chaque niveau",
    interpretation: "Idéalement centré sur les niveaux 3-4 pour votre rôle",
    importance: "Aide à évaluer votre profil global",
    actions: "Planifiez monter tous les niveaux 1-2 à 3+",
  },

  // Global progression bar
  global_progress: {
    title: "Progression globale",
    purpose: "Votre score de progression générale dans le système",
    measures: "Agrégation de tous vos compétences, quiz, formations",
    interpretation: "% de complétion vers votre profil professionnel cible",
    importance: "Vue unique de votre progression générale",
    actions: "Élevez ce % en complétant les formations et quiz recommandés",
  },

  // Section: Mes projets
  section_employee_my_projects: {
    title: "Mes projets",
    purpose: "Voir les projets auxquels vous êtes assigné",
    measures: "Projectes avec vos assignations et responsabilités",
    interpretation: "Clarté sur vos responsabilités de projet",
    importance: "Vous montre où sont vos responsabilités",
    actions: "Engagez-vous activement et communiquez les blocages",
  },
};

// ============================================================================
// TRAINING MANAGER DASHBOARD EXPLANATIONS
// ============================================================================

export const trainingManagerDashboardExplanations: Record<string, ExplanationContent> = {
  // Section: Vue formation
  section_training_view: {
    title: "Vue formation",
    purpose: "Vue d'ensemble de la performance et de l'impact de vos formations",
    measures: "Métriques clés d'efficacité et d'engagement",
    interpretation: "Permet d'identifier les formations performantes vs celles à améliorer",
    importance: "Essentiel pour optimiser votre stratégie de formation",
    actions: "Utilisez ces données pour affiner ou archiver les formations",
  },

  // KPIs
  training_total_programs: {
    title: "Nombre de programmes",
    purpose: "Tracer votre catalogue de formations",
    measures: "Nombre total de programmes de formation actifs",
    interpretation: "Indicateur de la couverture de sujets",
    importance: "Montre l'ampleur de votre offre",
    actions: "Archivez les programmes obsolètes; créez les nouveau nécessaires",
  },

  training_total_content: {
    title: "Contenus créés",
    purpose: "Tracer votre création de contenu pédagogique",
    measures: "Nombre total de modules, activités, quiz créés",
    interpretation: "Plus élevé: riche portefeuille; plus bas: besoin d'enrichissement",
    importance: "Reflète l'investissement en création pédagogique",
    actions: "Enrichissez les programmes avec plus de contenus",
  },

  training_avg_completion: {
    title: "Taux moyen de complétion",
    purpose: "Mesurer la capacité de vos formations à retenir les apprenants",
    measures: "% moyen de complétion de tous les programmes",
    interpretation: ">80% excellent; 50-79% acceptable; <50% alerte",
    importance: "Indicateur clé de l'engagement et la pertinence",
    actions: "Améliorez les programmes à faible complétion",
  },

  training_avg_score: {
    title: "Score moyen de performance",
    purpose: "Évaluer l'efficacité pédagogique",
    measures: "Score moyen de tous les quiz de vos formations",
    interpretation: ">70% efficace; 50-69% acceptable; <50% besoin de révision",
    importance: "Montre si vos formations atteignent leurs objectifs",
    actions: "Révisez le contenu des formations avec scores faibles",
  },

  training_pending_corrections: {
    title: "Activités en attente de correction",
    purpose: "Tracer les activités pratiques soumises en attente de feedback",
    measures: "Nombre de soumissions non corrigées",
    interpretation: "Plus le nombre est élevé, plus il y a de travail d'évaluation",
    importance: "Importance pour maintenir la timidité du feedback",
    actions: "Priorisez les corrections pour fournir du feedback rapidement",
  },

  // Section: Contenus, complétion et recommandations
  section_training_content_completion: {
    title: "Contenus, complétion et recommandations",
    purpose: "Analyser la composition du contenu, l'engagement et les performances",
    measures: "4 perspectives différentes sur les programmes",
    interpretation: "Données pour optimiser l'offre et l'impact pédagogique",
    importance: "Permet une gestion intelligente du portefeuille",
    actions: "Utilisez pour affiner la stratégie de formation",
  },

  chart_content_by_type: {
    title: "Répartition des contenus par type",
    purpose: "Voir la composition de votre portefeuille",
    measures: "% de contenus: videos, documents, quizzes, activités, etc.",
    interpretation: "Distribution équilibrée recommandée",
    importance: "Assure une variété pédagogique",
    actions: "Rééquilibrez si un type de contenu est surreprésenté",
  },

  chart_completion_by_training: {
    title: "Complétion par formation",
    purpose: "Identifier les formations engageantes vs celles à répudier",
    measures: "Taux de complétion pour chaque programme",
    interpretation: "Taux élevé: engageant/pertinent; bas: besoin de revision",
    importance: "Révèle la pertinence perçue de chaque programme",
    actions: "Améliorez ou archivez les programmes à faible complétion",
  },

  chart_recommendations_by_training: {
    title: "Recommandations par formation",
    purpose: "Voir quels programmes sont les plus prescrits",
    measures: "Nombre de fois que chaque formation est recommandée",
    interpretation: "Élevé: demande élevée; bas: peut être peu pertinent",
    importance: "Montre la demande du marché pour vos formations",
    actions: "Augmentez la création pour les formations à fort potentiel",
  },

  chart_creations_evolution: {
    title: "Évolution des créations",
    purpose: "Tracker votre productivité de création de contenu",
    measures: "Nombre de contenus créés par mois",
    interpretation: "Courbe croissante: productivité; plateaux: possibilité de ralentissement",
    importance: "Assure que votre catalogue reste à jour",
    actions: "Maintenez une cadence régulière de création",
  },

  // Tables and lists
  table_trainings: {
    title: "Formations",
    purpose: "Vue détaillée de chaque programme et sa progression",
    measures: "Titre, nombre de modules, taux de complétion",
    interpretation: "Trier par complétion pour identifier les problèmes",
    importance: "Vue complète du portefeuille",
    actions: "Cliquez pour éditer ou archiver les programmes",
  },

  list_pending_corrections: {
    title: "Activités / exercices à valider",
    purpose: "Lister les soumissions d'apprenants en attente de feedback",
    measures: "Nom de l'apprenant, activité, date de soumission",
    interpretation: "Priorisez par ancienneté pour éviter les délais",
    importance: "Critique pour maintenir l'engagement des apprenants",
    actions: "Corrigez et fournissez un feedback constructif rapidement",
  },

  list_recent_trainings: {
    title: "Formations récemment créées",
    purpose: "Tracker le lancement de vos nouveaux programmes",
    measures: "Titre, date de création, nombre de modules",
    interpretation: "Vérifiez que les contenus sont actualisés et pertinents",
    importance: "Assure que vous lancez les formations au bon moment",
    actions: "Promouvoir les nouvelles formations auprès des gestionnaires",
  },
};

/**
 * Helper to get explanation by key and dashboard type
 */
export function getExplanation(
  dashboard: "admin" | "manager" | "employee" | "training",
  key: string
): ExplanationContent | null {
  const mapping = {
    admin: adminDashboardExplanations,
    manager: managerDashboardExplanations,
    employee: employeeDashboardExplanations,
    training: trainingManagerDashboardExplanations,
  };

  return mapping[dashboard][key] || null;
}
