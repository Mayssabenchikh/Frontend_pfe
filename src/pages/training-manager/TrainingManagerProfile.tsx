import { RoleProfilePage, type RoleProfileConfig } from "../profile/RoleProfilePage";

/** Même expérience que le profil employé (luxury UI, édition, avatar, mot de passe) — sans CV ni extraction. */
const TRAINING_MANAGER_PROFILE_CONFIG: RoleProfileConfig = {
  roleDisplayLabel: "Responsable formation",
  fallbackName: "Responsable formation",
  fallbackInitials: "RF",
  profileEndpoint: "/api/training-manager/me",
  profileUpdateEndpoint: "/api/training-manager/me/profile",
  extraUpdateEndpoint: "/api/training-manager/me/extra",
  avatarEndpoint: "/api/training-manager/me/avatar",
  changePasswordEndpoint: "/api/training-manager/me/change-password",
  showCvSection: false,
};

export function TrainingManagerProfile() {
  return <RoleProfilePage config={TRAINING_MANAGER_PROFILE_CONFIG} />;
}
