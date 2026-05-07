import { useMemo } from "react";
import type { ChatMessage, PresenceEvent, ProjectConversation } from "../../types/chat";
import { ChatHeader } from "./ChatHeader";
import { ChatInput } from "./ChatInput";
import { ChatMessageBubble } from "./ChatMessageBubble";
import { TypingIndicator } from "./TypingIndicator";

export function ProjectChat({
  project,
  messages,
  currentUserId,
  typingUsers,
  presence,
  input,
  onInput,
  onSend,
  onUpload,
}: {
  project: ProjectConversation;
  messages: ChatMessage[];
  currentUserId: string;
  typingUsers: string[];
  presence: Record<string, PresenceEvent>;
  input: string;
  onInput: (value: string) => void;
  onSend: () => void;
  onUpload: (file: File) => void;
}) {
  const onlineCount = useMemo(() => Object.values(presence).filter((p) => p.online).length, [presence]);

  return (
    <section className="flex min-w-0 flex-1 flex-col bg-slate-50/40">
      <ChatHeader project={project} onlineCount={onlineCount} />
      <div className="flex-1 space-y-3 overflow-auto px-4 py-4">
        {messages.map((message) => (
          <ChatMessageBubble key={message.messageUuid} message={message} mine={message.senderKeycloakId === currentUserId} />
        ))}
      </div>
      <TypingIndicator users={typingUsers} />
      <ChatInput value={input} onChange={onInput} onSend={onSend} onUpload={onUpload} />
    </section>
  );
}
