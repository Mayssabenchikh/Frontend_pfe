/**
 * Mapping automatique des compétences et catégories vers Simple Icons
 * cdn.simpleicons.org = icônes colorées (couleurs officielles des marques)
 */

const ICON_BASE = "https://cdn.simpleicons.org/";
const ICON_FALLBACK = "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/";
/** Slugs qui renvoient 404 sur simpleicons.org → fallback jsDelivr */
const FALLBACK_SLUGS = new Set(["amazonaws", "csharp", "microsoftazure"]);

const SKILL_ICON_MAP: Record<string, string> = {
  java: "openjdk",
  "c#": "csharp",
  csharp: "csharp",
  python: "python",
  javascript: "javascript",
  typescript: "typescript",
  kotlin: "kotlin",
  swift: "swift",
  sql: "postgresql",
  php: "php",
  go: "go",
  "spring boot": "springboot",
  spring: "springboot",
  ".net": "dotnet",
  dotnet: "dotnet",
  angular: "angular",
  react: "react",
  "vue.js": "vuedotjs",
  vue: "vuedotjs",
  "node.js": "nodedotjs",
  nodejs: "nodedotjs",
  django: "django",
  laravel: "laravel",
  docker: "docker",
  kubernetes: "kubernetes",
  jenkins: "jenkins",
  "gitlab ci": "gitlab",
  gitlab: "gitlab",
  aws: "amazonaws",
  azure: "microsoftazure",
  selenium: "selenium",
  jest: "jest",
  junit: "junit5",
  cypress: "cypress",
  jira: "jirasoftware",
  confluence: "confluence",
  graphql: "graphql",
  redis: "redis",
  mongodb: "mongodb",
  mysql: "mysql",
  postgresql: "postgresql",
  git: "git",
  github: "github",
  html: "html5",
  css: "css3",
  sass: "sass",
  tailwind: "tailwindcss",
  bootstrap: "bootstrap",
  nextjs: "nextdotjs",
  expressjs: "express",
  prisma: "prisma",
  figma: "figma",
  agile: "jira",
  scrum: "jira",
  kanban: "jira",
  devops: "docker",
  nearshore: "docker",
  "gestion de projet": "jira",
  planification: "jira",
  "suivi budgétaire": "jira",
  "tests unitaires": "jest",
  "tests d'intégration": "selenium",
  "tests e2e": "cypress",
  "développement web": "html5",
  "développement mobile": "androidstudio",
  "apis rest": "express",
  odoo: "odoo",
  sap: "sap",
  "intégration erp": "sap",
  "gestion rh": "jira",
  "gestion production": "sap",
  "gestion vente": "odoo",
  "ci/cd": "jenkins",
};

const CATEGORY_ICON_MAP: Record<string, string> = {
  "langages de programmation": "javascript",
  "frameworks & technologies": "react",
  méthodologies: "jira",
  "gestion de projet": "jira",
  "qualité & tests": "jest",
  "devops & infrastructure": "docker",
  "intégration & erp": "sap",
  "web & mobile": "html5",
};

const CATEGORY_DESCRIPTION_MAP: Record<string, string> = {
  "langages de programmation": "JavaScript, Python, Java...",
  "frameworks & technologies": "React, Angular, Spring...",
  méthodologies: "Kanban, Lean, DevSecOps...",
  "gestion de projet": "Agile, Scrum, PMBOK...",
  "qualité & tests": "JUnit, Selenium, TDD...",
  "devops & infrastructure": "Gestion CI/CD, Cloud, Docker, Kubernetes..",
  "intégration & erp": "SAP, Oracle, Microsoft Dynamics...",
  "web & mobile": "React, Flutter, iOS...",
};

function findSlug(key: string, map: Record<string, string>): string | null {
  const k = key.trim().toLowerCase();
  const slug = map[k];
  if (slug) return slug;
  for (const [mapKey, s] of Object.entries(map)) {
    if (k.includes(mapKey) || mapKey.includes(k)) return s;
  }
  return null;
}

function getIconUrl(slug: string): string {
  const base = FALLBACK_SLUGS.has(slug) ? ICON_FALLBACK : ICON_BASE;
  return base === ICON_FALLBACK ? `${base}${slug}.svg` : `${base}${slug}`;
}

export function getSkillIconUrl(skillName: string): string | null {
  const slug = findSlug(skillName, SKILL_ICON_MAP);
  return slug ? getIconUrl(slug) : null;
}

export function getCategoryIconUrl(categoryName: string): string | null {
  const slug = findSlug(categoryName, CATEGORY_ICON_MAP);
  return slug ? getIconUrl(slug) : null;
}

export function getCategoryDescription(categoryName: string): string {
  const k = categoryName.trim().toLowerCase();
  const desc = CATEGORY_DESCRIPTION_MAP[k];
  if (desc) return desc;
  for (const [mapKey, d] of Object.entries(CATEGORY_DESCRIPTION_MAP)) {
    if (k.includes(mapKey) || mapKey.includes(k)) return d;
  }
  return "";
}
