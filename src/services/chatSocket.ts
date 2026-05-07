import { Client, type IFrame, type IMessage, type StompSubscription } from "@stomp/stompjs";
import type { ChatError, ChatMessage, PresenceEvent, ReadReceipt, TypingEvent } from "../types/chat";

type ProjectHandlers = {
  onMessage?: (message: ChatMessage) => void;
  onTyping?: (event: TypingEvent) => void;
  onPresence?: (event: PresenceEvent) => void;
  onRead?: (event: ReadReceipt) => void;
  onError?: (error: ChatError) => void;
};

function parseBody<T>(frame: IMessage): T {
  return JSON.parse(frame.body) as T;
}

function resolveWsUrl(): string {
  const env = import.meta.env.VITE_WS_CHAT_URL as string | undefined;
  if (env && env.trim()) return env.trim();

  const apiUrl = (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:8080";
  const base = apiUrl.replace(/\/$/, "").replace(/^http:/, "ws:").replace(/^https:/, "wss:");
  return `${base}/ws-chat`;
}

class ChatSocket {
  private client: Client | null = null;

  async connect(token: string): Promise<void> {
    if (this.client?.active) return;

    this.client = new Client({
      brokerURL: resolveWsUrl(),
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      reconnectDelay: 2000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
    });

    await new Promise<void>((resolve, reject) => {
      if (!this.client) return reject(new Error("Client WebSocket indisponible"));

      this.client.onConnect = () => resolve();
      this.client.onStompError = (frame: IFrame) => reject(new Error(frame.headers.message || "Erreur STOMP"));
      this.client.onWebSocketError = () => reject(new Error("Connexion WebSocket échouée"));
      this.client.activate();
    });
  }

  disconnect() {
    this.client?.deactivate();
    this.client = null;
  }

  subscribeToProject(projectUuid: string, handlers: ProjectHandlers): () => void {
    if (!this.client || !this.client.connected) {
      throw new Error("WebSocket non connecté");
    }

    const subscriptions: StompSubscription[] = [];

    subscriptions.push(this.client.subscribe(`/topic/projects/${projectUuid}/messages`, (msg: IMessage) => handlers.onMessage?.(parseBody(msg))));
    subscriptions.push(this.client.subscribe(`/topic/projects/${projectUuid}/typing`, (msg: IMessage) => handlers.onTyping?.(parseBody(msg))));
    subscriptions.push(this.client.subscribe(`/topic/projects/${projectUuid}/presence`, (msg: IMessage) => handlers.onPresence?.(parseBody(msg))));
    subscriptions.push(this.client.subscribe(`/topic/projects/${projectUuid}/read`, (msg: IMessage) => handlers.onRead?.(parseBody(msg))));
    subscriptions.push(this.client.subscribe(`/user/queue/chat/errors`, (msg: IMessage) => handlers.onError?.(parseBody(msg))));

    return () => subscriptions.forEach((s) => s.unsubscribe());
  }

  sendMessage(projectUuid: string, content: string, attachmentUuid?: string) {
    this.client?.publish({
      destination: "/app/chat.project.send",
      body: JSON.stringify({ projectUuid, content, attachmentUuid: attachmentUuid ?? null }),
    });
  }

  sendTyping(projectUuid: string, typing: boolean) {
    this.client?.publish({
      destination: "/app/chat.project.typing",
      body: JSON.stringify({ projectUuid, typing }),
    });
  }

  markRead(projectUuid: string, messageUuid: string) {
    this.client?.publish({
      destination: "/app/chat.project.read",
      body: JSON.stringify({ projectUuid, messageUuid }),
    });
  }

  joinProject(projectUuid: string) {
    this.client?.publish({
      destination: "/app/chat.project.join",
      body: JSON.stringify({ projectUuid }),
    });
  }

  leaveProject(projectUuid: string) {
    this.client?.publish({
      destination: "/app/chat.project.leave",
      body: JSON.stringify({ projectUuid }),
    });
  }
}

export const chatSocket = new ChatSocket();
