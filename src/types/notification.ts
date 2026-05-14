export type NotificationType =
  | "PROJECT_ASSIGNMENT"
  | "PROJECT_ASSIGNMENT_REMOVED"
  | "TRAINING_RECOMMENDED"
  | "TRAINING_ENROLLED"
  | "TRAINING_COMPLETED"
  | "ACTIVITY_SUBMITTED"
  | "ACTIVITY_REVIEWED"
  | "QUIZ_AVAILABLE"
  | "QUIZ_PASSED"
  | "QUIZ_FAILED"
  | "FORUM_REPLY"
  | "FORUM_COMMENT"
  | "FORUM_ACCEPTED_ANSWER"
  | "FORUM_MENTION"
  | "CHAT_MESSAGE"
  | "SYSTEM_ANNOUNCEMENT"
  | "ADMIN_PROJECT_ASSIGNED"
  | "ADMIN_PROJECT_CREATED"
  | "ADMIN_SKILL_REQUEST_CREATED"
  | "ADMIN_FORUM_POST_CREATED"
  | "ADMIN_FORUM_COMMENT_ADDED";

export type NotificationPriority = "LOW" | "NORMAL" | "HIGH";

export type NotificationDto = {
  uuid: string;
  type: NotificationType;
  title: string;
  message: string;
  link: string | null;
  priority: NotificationPriority;
  read: boolean;
  createdAt: string;
  readAt: string | null;
  metadataJson: string | null;
};

export type NotificationPageDto = {
  content: NotificationDto[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
  unreadCount: number;
};

export type NotificationCountDto = {
  unreadCount: number;
};

export type CreateSystemNotificationData = {
  recipientKeycloakId?: string | null;
  title: string;
  message: string;
  link?: string | null;
  priority?: NotificationPriority;
  broadcast: boolean;
};
