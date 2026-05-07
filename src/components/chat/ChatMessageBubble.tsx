import type { ChatMessage } from "../../types/chat";
import { ChatAttachmentPreview } from "./ChatAttachmentPreview";

export function ChatMessageBubble({ message, mine }: { message: ChatMessage; mine: boolean }) {
  return (
    <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[78%] rounded-2xl px-4 py-2 shadow-sm ${mine ? "bg-violet-600 text-white" : "bg-white text-slate-800 border border-slate-200"}`}>
        <div className="mb-1 text-[11px] font-semibold opacity-80">{message.senderName || "Utilisateur"}</div>
        {message.content ? <p className="whitespace-pre-wrap text-sm">{message.content}</p> : null}
        {message.attachments?.map((a) => <ChatAttachmentPreview key={a.uuid} attachment={a} />)}
        <div className="mt-1 text-[10px] opacity-70">{new Date(message.createdAt).toLocaleTimeString()}</div>
      </div>
    </div>
  );
}
