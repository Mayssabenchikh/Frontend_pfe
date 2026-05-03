import { RoleCvExtractionPage, RoleProfilePage, type RoleProfileConfig } from "../profile/RoleProfilePage";

const EMPLOYEE_PROFILE_CONFIG: RoleProfileConfig = {
  roleDisplayLabel: "Profil Employé",
  fallbackName: "Employé",
  fallbackInitials: "EM",
  profileEndpoint: "/api/employee/me",
  profileUpdateEndpoint: "/api/employee/me/profile",
  extraUpdateEndpoint: "/api/employee/me/extra",
  avatarEndpoint: "/api/employee/me/avatar",
  changePasswordEndpoint: "/api/employee/me/change-password",
  showCvSection: false,
  cvEndpoint: "/api/employee/me/cv",
  cvExtractEndpoint: "/api/employee/me/cv/extract",
  cvDownloadEndpoint: "/api/employee/me/cv/download",
  skillsEndpoint: "/api/employee/me/skills",
  pendingSkillsEndpoint: "/api/employee/me/pending-skills",
};

export function EmployeeMyProfile() {
  return <RoleProfilePage config={EMPLOYEE_PROFILE_CONFIG} />;
}

const EMPLOYEE_CV_EXTRACTION_CONFIG: RoleProfileConfig = {
  ...EMPLOYEE_PROFILE_CONFIG,
  showCvSection: true,
};

export function EmployeeCvExtraction() {
  return <RoleCvExtractionPage config={EMPLOYEE_CV_EXTRACTION_CONFIG} />;
}
