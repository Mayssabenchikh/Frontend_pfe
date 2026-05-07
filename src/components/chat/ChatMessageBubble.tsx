import type { ChatMessage } from "../../types/chat";
import { faCheck, faCheckDouble } from "@fortawesome/free-solid-svg-icons";
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

export function ChatMessageBubble({ message, currentUserId }: { message: ChatMessage; currentUserId: string }) {
  const mine = message.senderKeycloakId === currentUserId;
  const readStatus = getReadStatus(message, currentUserId);

  return (
    <div className={`flex items-end gap-3 ${mine ? "justify-end" : "justify-start"}`}>
      {!mine ? <ChatAvatar name={message.senderName} avatarUrl={message.senderAvatarUrl} size={36} /> : null}
      <div className={`max-w-[78%] rounded-2xl px-4 py-2 shadow-sm ${mine ? "bg-violet-600 text-white" : "border border-slate-200 bg-white text-slate-800"}`}>
        <div className="mb-1 text-[11px] font-semibold opacity-80">{message.senderName || "Utilisateur"}</div>
        {message.content ? <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p> : null}
        {message.attachments?.length ? (
          <div className="mt-2 space-y-2">
            {message.attachments.map((attachment) => (
              <ChatAttachmentPreview key={attachment.uuid} attachment={attachment} />
            ))}
          </div>
        ) : null}
        <div className="mt-2 flex items-center justify-between gap-3 text-[10px] opacity-70">
          <span>{new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
          {readStatus ? (
            <span title={readStatus.title} className="inline-flex items-center gap-1 font-semibold">
              <FontAwesomeIcon icon={readStatus.icon} className="h-3 w-3" />
              {readStatus.label}
            </span>
          ) : null}
        </div>
      </div>
      {mine ? <ChatAvatar name={message.senderName} avatarUrl={message.senderAvatarUrl} size={36} /> : null}
    </div>
  );
}
