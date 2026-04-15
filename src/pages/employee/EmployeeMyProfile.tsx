import { RoleProfilePage, type RoleProfileConfig } from "../profile/RoleProfilePage";

const EMPLOYEE_PROFILE_CONFIG: RoleProfileConfig = {
  roleDisplayLabel: "Profil Employé",
  fallbackName: "Employé",
  fallbackInitials: "EM",
  profileEndpoint: "/api/employee/me",
  profileUpdateEndpoint: "/api/employee/me/profile",
  extraUpdateEndpoint: "/api/employee/me/extra",
  avatarEndpoint: "/api/employee/me/avatar",
  changePasswordEndpoint: "/api/employee/me/change-password",
  cvEndpoint: "/api/employee/me/cv",
  cvExtractEndpoint: "/api/employee/me/cv/extract",
  cvDownloadEndpoint: "/api/employee/me/cv/download",
  skillsEndpoint: "/api/employee/me/skills",
  pendingSkillsEndpoint: "/api/employee/me/pending-skills",
};

export function EmployeeMyProfile() {
  return <RoleProfilePage config={EMPLOYEE_PROFILE_CONFIG} />;
}
