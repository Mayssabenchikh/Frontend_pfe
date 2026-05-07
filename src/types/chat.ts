export type ChatAttachment = {
  uuid: string;
  fileName: string;
  fileUrl: string;
  contentType: string;
  sizeBytes: number;
};

export type ReadReceipt = {
  messageUuid: string;
  readerKeycloakId: string;
  readerName: string;
  readAt: string;
};

export type ReplyPreview = {
  messageUuid: string;
  senderKeycloakId: string;
  senderName: string;
  contentPreview: string;
  hasAttachment: boolean;
  deleted: boolean;
};

export type ChatMessage = {
  messageUuid: string;
  projectUuid: string;
  senderKeycloakId: string;
  senderName: string;
  senderAvatarUrl: string | null;
  content: string | null;
  messageType: string;
  deliveryStatus: string;
  mine: boolean;
  edited: boolean;
  deleted: boolean;
  createdAt: string;
  attachments: ChatAttachment[];
  readBy: ReadReceipt[];
  replyTo?: ReplyPreview | null;
};

export type TypingEvent = {
  projectUuid: string;
  userKeycloakId: string;
  userName: string;
  typing: boolean;
};

export type PresenceEvent = {
  projectUuid: string | null;
  userKeycloakId: string;
  userName: string;
  online: boolean;
  lastSeenAt: string;
};

export type UploadAttachmentResponse = {
  attachmentUuid: string;
  fileName: string;
  fileUrl: string;
  contentType: string;
  sizeBytes: number;
};

export type SendMessageRequest = {
  projectUuid: string;
  content: string;
  attachmentUuid?: string | null;
  repliedToMessageUuid?: string | null;
};

export type ProjectConversation = {
  projectUuid: string;
  name: string;
  status: string | null;
  priority: string | null;
};

export type ChatError = {
  error: string;
};
