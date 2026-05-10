import { RoleProfilePage, type RoleProfileConfig } from "../profile/RoleProfilePage";
import { ADMIN_API_PATHS } from "./adminApiPaths";
import type { TokenParsed } from "./types";

const ADMIN_PROFILE_CONFIG: RoleProfileConfig = {
  roleDisplayLabel: "Profil Administrateur",
  fallbackName: "Administrateur",
  fallbackInitials: "AD",
  profileEndpoint: ADMIN_API_PATHS.ME,
  profileUpdateEndpoint: ADMIN_API_PATHS.ME_PROFILE,
  extraUpdateEndpoint: ADMIN_API_PATHS.ME_EXTRA,
  avatarEndpoint: ADMIN_API_PATHS.userAvatar,
  changePasswordEndpoint: ADMIN_API_PATHS.ME_CHANGE_PASSWORD,
  showCvSection: false,
};

type Props = {
  token: TokenParsed | undefined;
  adminKeycloakId: string | undefined;
  initialAvatarUrl?: string | null;
  onAvatarUpdate?: (url: string) => void;
  onProfileUpdate?: (firstName: string, lastName: string) => void;
};

export function AdminProfile({ initialAvatarUrl, onAvatarUpdate, onProfileUpdate }: Props) {
  return (
    <RoleProfilePage
      config={ADMIN_PROFILE_CONFIG}
      initialAvatarUrl={initialAvatarUrl}
      onAvatarUpdate={onAvatarUpdate}
      onProfileUpdate={onProfileUpdate}
    />
  );
}
