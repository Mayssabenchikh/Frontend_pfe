import { http } from "../api/http";
import type {
  CreateSystemNotificationData,
  NotificationCountDto,
  NotificationDto,
  NotificationPageDto,
  NotificationType,
} from "../types/notification";

const API = "/api/notifications";

type GetNotificationsParams = {
  page?: number;
  size?: number;
  read?: boolean;
  type?: NotificationType;
};

export const notificationService = {
  async getNotifications(params: GetNotificationsParams = {}) {
    const res = await http.get<NotificationPageDto>(API, { params });
    return res.data;
  },

  async getUnreadCount() {
    const res = await http.get<NotificationCountDto>(`${API}/unread-count`);
    return res.data;
  },

  async markAsRead(uuid: string) {
    const res = await http.patch<NotificationDto>(`${API}/${uuid}/read`);
    return res.data;
  },

  async markAllAsRead() {
    const res = await http.patch<NotificationCountDto>(`${API}/read-all`);
    return res.data;
  },

  async createSystemNotification(data: CreateSystemNotificationData) {
    const res = await http.post<{ status: string }>(`${API}/admin/system`, data);
    return res.data;
  },
};
