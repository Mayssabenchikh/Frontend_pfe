/** Centralized admin REST paths (no behavior change vs inline strings). */
export const ADMIN_API_PATHS = {
  ME: "/api/admin/me",
  ME_PROFILE: "/api/admin/me/profile",
  ME_EXTRA: "/api/admin/me/extra",
  ME_CHANGE_PASSWORD: "/api/admin/me/change-password",
  userAvatar: (userId: string) => `/api/admin/users/${userId}/avatar`,
} as const;
