import { Client, type IMessage, type StompSubscription } from "@stomp/stompjs";
import type { NotificationCountDto, NotificationDto } from "../types/notification";

type NotificationSocketHandlers = {
  onNotification?: (notification: NotificationDto) => void;
  onCount?: (count: NotificationCountDto) => void;
};

function parseBody<T>(frame: IMessage): T {
  return JSON.parse(frame.body) as T;
}

function resolveWsUrl(): string {
  const env = import.meta.env.VITE_WS_CHAT_URL as string | undefined;
  if (env && env.trim()) return env.trim();

  const apiRaw = (import.meta.env.VITE_API_URL as string | undefined)?.trim();
  const apiUrl = apiRaw && apiRaw.length > 0 ? apiRaw : "http://localhost:8080";
  const base = apiUrl.replace(/\/$/, "").replace(/^http:/, "ws:").replace(/^https:/, "wss:");
  return `${base}/ws-chat`;
}

class NotificationSocket {
  private client: Client | null = null;
  private listeners = new Set<NotificationSocketHandlers>();
  private subscriptions: StompSubscription[] = [];

  connect(token: string, handlers: NotificationSocketHandlers): () => void {
    this.listeners.add(handlers);

    if (!this.client?.active) {
      this.client = new Client({
        brokerURL: resolveWsUrl(),
        connectHeaders: {
          Authorization: `Bearer ${token}`,
        },
        reconnectDelay: 2000,
        heartbeatIncoming: 10000,
        heartbeatOutgoing: 10000,
      });

      this.client.onConnect = () => {
        this.subscriptions.forEach((subscription) => subscription.unsubscribe());
        this.subscriptions = [
          this.client!.subscribe("/user/queue/notifications", (msg) => {
            const notification = parseBody<NotificationDto>(msg);
            this.listeners.forEach((listener) => listener.onNotification?.(notification));
          }),
          this.client!.subscribe("/user/queue/notification-count", (msg) => {
            const count = parseBody<NotificationCountDto>(msg);
            this.listeners.forEach((listener) => listener.onCount?.(count));
          }),
        ];
      };

      this.client.onStompError = () => undefined;
      this.client.onWebSocketError = () => undefined;
      this.client.activate();
    }

    return () => {
      this.listeners.delete(handlers);
      if (this.listeners.size === 0) {
        this.disconnect();
      }
    };
  }

  private disconnect() {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
    this.subscriptions = [];
    this.client?.deactivate();
    this.client = null;
  }
}

export const notificationSocket = new NotificationSocket();
