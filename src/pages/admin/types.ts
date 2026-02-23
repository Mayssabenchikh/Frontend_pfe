export type UserListDto = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  enabled: boolean;
};

export type NavId = "dashboard" | "users";

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
