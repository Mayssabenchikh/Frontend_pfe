import type { ChatMessage } from "../../types/chat";
import { faReply, faCheck, faCheckDouble } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ChatAvatar } from "./ChatAvatar";
import { ChatAttachmentPreview } from "./ChatAttachmentPreview";

function getReadStatus(message: ChatMessage, currentUserId: string) {
  if (message.senderKeycloakId !== currentUserId) return null;

  const viewers = message.readBy.filter((receipt) => receipt.readerKeycloakId !== currentUserId);
  if (viewers.length === 0) {
    return { label: "Envoyé", title: "Message envoyé", icon: faCheck };
  }

  if (viewers.length === 1) {
    return { label: "Vu", title: `Vu par ${viewers[0].readerName || "un membre"}`, icon: faCheckDouble };
  }

  const names = viewers.map((receipt) => receipt.readerName).filter(Boolean).join(", ");
  return { label: `Vu par ${viewers.length}`, title: names ? `Vu par ${names}` : `Vu par ${viewers.length} membres`, icon: faCheckDouble };
}

function getReplyText(message: ChatMessage) {
  if (!message.replyTo) {
    return null;
  }

  if (message.replyTo.deleted) {
    return {
      title: `Réponse à ${message.replyTo.senderName || "Utilisateur"}`,
      content: "Message original indisponible",
      hasAttachment: false,
    };
  }

  return {
    title: `Réponse à ${message.replyTo.senderName || "Utilisateur"}`,
    content: message.replyTo.contentPreview || (message.replyTo.hasAttachment ? "Pièce jointe" : "Message original indisponible"),
    hasAttachment: message.replyTo.hasAttachment,
  };
}

export function ChatMessageBubble({
  message,
  currentUserId,
  isOnline = false,
  onReply,
}: {
  message: ChatMessage;
  currentUserId: string;
  isOnline?: boolean;
  onReply?: (message: ChatMessage) => void;
}) {
  const mine = message.senderKeycloakId === currentUserId;
  const readStatus = getReadStatus(message, currentUserId);
  const replyText = getReplyText(message);

  return (
    <div className={`group flex items-end gap-3 ${mine ? "justify-end" : "justify-start"}`}>
      {!mine ? <ChatAvatar name={message.senderName} avatarUrl={message.senderAvatarUrl} size={36} isOnline={isOnline} /> : null}
      <div className={`relative max-w-[78%] rounded-2xl px-4 py-2 shadow-sm ${mine ? "bg-violet-600 text-white" : "border border-slate-200 bg-white text-slate-800"}`}>
        {onReply ? (
          <button
            type="button"
            onClick={() => onReply(message)}
            className={`absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-full border transition ${mine ? "border-white/20 bg-white/10 text-white opacity-0 hover:bg-white/20 group-hover:opacity-100" : "border-slate-200 bg-white text-slate-500 opacity-0 hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 group-hover:opacity-100"}`}
            title="Répondre"
            aria-label="Répondre"
          >
            <FontAwesomeIcon icon={faReply} className="h-3.5 w-3.5" />
          </button>
        ) : null}

        <div className="mb-1 text-xs font-semibold opacity-80">{message.senderName || "Utilisateur"}</div>
        {replyText ? (
          <div className={`mb-2 rounded-xl border-l-4 px-3 py-2 text-xs leading-relaxed ${mine ? "border-violet-200 bg-white/10 text-white/90" : "border-violet-300 bg-violet-50 text-slate-700"}`}>
            <p className={`font-semibold ${mine ? "text-white" : "text-violet-700"}`}>{replyText.title}</p>
            <p className={`max-h-10 overflow-hidden whitespace-pre-wrap ${mine ? "text-white/90" : ""}`}>{replyText.content}</p>
            {replyText.hasAttachment ? <p className={`mt-0.5 font-medium ${mine ? "text-white/90" : "text-violet-700"}`}>Pièce jointe</p> : null}
          </div>
        ) : null}
        {message.content ? <p className="whitespace-pre-wrap text-base leading-relaxed">{message.content}</p> : null}
        {message.attachments?.length ? (
          <div className="mt-2 space-y-2">
            {message.attachments.map((attachment) => (
              <ChatAttachmentPreview key={attachment.uuid} attachment={attachment} />
            ))}
          </div>
        ) : null}
        <div className="mt-2 flex items-center justify-between gap-3 text-xs opacity-70">
          <span>{new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
          {readStatus ? (
            <span title={readStatus.title} className="inline-flex items-center gap-1 font-semibold">
              <FontAwesomeIcon icon={readStatus.icon} className="h-3 w-3" />
              {readStatus.label}
            </span>
          ) : null}
        </div>
      </div>
      {mine ? <ChatAvatar name={message.senderName} avatarUrl={message.senderAvatarUrl} size={36} isOnline={isOnline} /> : null}
    </div>
  );
}
