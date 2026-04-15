import { RoleProfilePage, type RoleProfileConfig } from "../profile/RoleProfilePage";

const MANAGER_PROFILE_CONFIG: RoleProfileConfig = {
  roleDisplayLabel: "Profil Manager",
  fallbackName: "Manager",
  fallbackInitials: "MG",
  profileEndpoint: "/api/manager/me",
  profileUpdateEndpoint: "/api/manager/me/profile",
  extraUpdateEndpoint: "/api/manager/me/extra",
  avatarEndpoint: "/api/manager/me/avatar",
  changePasswordEndpoint: "/api/manager/me/change-password",
  cvEndpoint: "/api/manager/me/cv",
  cvExtractEndpoint: "/api/manager/me/cv/extract",
  cvDownloadEndpoint: "/api/manager/me/cv/download",
  // Manager lit ses skills via ces endpoints partagés (autorisés côté backend).
  skillsEndpoint: "/api/employee/me/skills",
  pendingSkillsEndpoint: "/api/employee/me/pending-skills",
};

export function ManagerProfile() {
  return <RoleProfilePage config={MANAGER_PROFILE_CONFIG} />;
}
