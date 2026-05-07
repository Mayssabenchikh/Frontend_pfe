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
  selectedReplyMessage,
  onInput,
  onSend,
  onReply,
  onCancelReply,
}: {
  project: ProjectConversation;
  messages: ChatMessage[];
  currentUserId: string;
  typingUsers: string[];
  presence: Record<string, PresenceEvent>;
  input: string;
  selectedReplyMessage: ChatMessage | null;
  onInput: (value: string) => void;
  onSend: (file?: File | null) => Promise<void> | void;
  onReply: (message: ChatMessage) => void;
  onCancelReply: () => void;
}) {
  const onlineCount = useMemo(() => Object.values(presence).filter((p) => p.online).length, [presence]);

  return (
    <section className="flex min-w-0 flex-1 flex-col bg-slate-50/40">
      <ChatHeader project={project} onlineCount={onlineCount} />
      <div className="flex-1 space-y-3 overflow-auto px-4 py-4">
        {messages.map((message) => (
          <ChatMessageBubble
            key={message.messageUuid}
            message={message}
            currentUserId={currentUserId}
            isOnline={presence[message.senderKeycloakId]?.online ?? false}
            onReply={onReply}
          />
        ))}
      </div>
      <TypingIndicator users={typingUsers} />
      <ChatInput value={input} onChange={onInput} onSend={onSend} selectedReplyMessage={selectedReplyMessage} onCancelReply={onCancelReply} />
    </section>
  );
}
