export type UserListDto = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  enabled: boolean;
  department?: string | null;
  jobTitle?: string | null;
  phone?: string | null;
  hireDate?: string | null;
  avatarUrl?: string | null;
};

export type ArchivedUserDto = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  department?: string | null;
  jobTitle?: string | null;
  phone?: string | null;
  hireDate?: string | null;
  archivedAt?: string | null;
  avatarUrl?: string | null;
};

export type NavId = "dashboard" | "users" | "archives" | "profile";

export type AdminRole = "MANAGER" | "EMPLOYEE";

export type MessageType = "success" | "error";

export type FlashMessage = { type: MessageType; text: string };

export type TokenParsed = {
  name?: string;
  preferred_username?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  email?: string;
};