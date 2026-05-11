import { useCallback, useEffect, useRef, useState } from "react";
import { useKeycloak } from "@react-keycloak/web";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBell } from "@fortawesome/free-solid-svg-icons";
import type { NotificationDto } from "../../types/notification";
import { notificationService } from "../../services/notificationService";
import { notificationSocket } from "../../services/notificationSocket";
import { NotificationDropdown } from "./NotificationDropdown";

const DROPDOWN_PAGE_SIZE = 30;

function dedupePrepend(items: NotificationDto[], incoming: NotificationDto, limit = DROPDOWN_PAGE_SIZE) {
  return [incoming, ...items.filter((item) => item.uuid !== incoming.uuid)].slice(0, limit);
}

export function NotificationBell() {
  const { keycloak } = useKeycloak();
  const navigate = useNavigate();
  const rootRef = useRef<HTMLDivElement | null>(null);

  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  const loadUnreadCount = useCallback(() => {
    notificationService
      .getUnreadCount()
      .then((data) => setUnreadCount(data.unreadCount))
      .catch(() => setUnreadCount(0));
  }, []);

  const loadRecent = useCallback(() => {
    setLoading(true);
    setError(null);
    notificationService
      .getNotifications({ page: 0, size: DROPDOWN_PAGE_SIZE })
      .then((data) => {
        setNotifications(data.content);
        setUnreadCount(data.unreadCount);
      })
      .catch(() => setError("Impossible de charger les notifications."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadUnreadCount();
  }, [loadUnreadCount]);

  useEffect(() => {
    if (!keycloak.token) return undefined;
    return notificationSocket.connect(keycloak.token, {
      onNotification: (notification) => {
        setNotifications((items) => dedupePrepend(items, notification));
        if (!notification.read) {
          setUnreadCount((count) => count + 1);
        }
      },
      onCount: (count) => setUnreadCount(count.unreadCount),
    });
  }, [keycloak.token]);

  useEffect(() => {
    if (!open) return undefined;
    loadRecent();

    const handlePointerDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [loadRecent, open]);

  const handleNotificationClick = async (notification: NotificationDto) => {
    let next = notification;
    if (!notification.read) {
      try {
        next = await notificationService.markAsRead(notification.uuid);
        setNotifications((items) => items.map((item) => (item.uuid === next.uuid ? next : item)));
        setUnreadCount((count) => Math.max(0, count - 1));
      } catch {
        setError("Impossible de marquer la notification comme lue.");
        return;
      }
    }

    setOpen(false);
    if (next.link) {
      navigate(next.link);
    }
  };

  const handleMarkAllAsRead = () => {
    setMarkingAll(true);
    notificationService
      .markAllAsRead()
      .then((data) => {
        setUnreadCount(data.unreadCount);
        setNotifications((items) => items.map((item) => ({ ...item, read: true, readAt: item.readAt ?? new Date().toISOString() })));
      })
      .catch(() => setError("Impossible de marquer toutes les notifications comme lues."))
      .finally(() => setMarkingAll(false));
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-violet-100 bg-white text-slate-600 shadow-sm shadow-violet-100/60 transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/30"
        aria-label="Notifications"
        aria-expanded={open}
      >
        <FontAwesomeIcon icon={faBell} className="h-4 w-4" />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 flex min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white shadow-sm">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <NotificationDropdown
          notifications={notifications}
          loading={loading}
          error={error}
          unreadCount={unreadCount}
          markingAll={markingAll}
          onNotificationClick={handleNotificationClick}
          onMarkAllAsRead={handleMarkAllAsRead}
        />
      ) : null}
    </div>
  );
}
