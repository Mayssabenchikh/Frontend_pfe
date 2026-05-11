import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheckDouble, faSpinner } from "@fortawesome/free-solid-svg-icons";
import type { NotificationDto } from "../../types/notification";
import { NotificationEmptyState } from "./NotificationEmptyState";
import { NotificationItem } from "./NotificationItem";

type Props = {
  notifications: NotificationDto[];
  loading: boolean;
  error: string | null;
  unreadCount: number;
  markingAll: boolean;
  onNotificationClick: (notification: NotificationDto) => void;
  onMarkAllAsRead: () => void;
};

export function NotificationDropdown({
  notifications,
  loading,
  error,
  unreadCount,
  markingAll,
  onNotificationClick,
  onMarkAllAsRead,
}: Props) {
  return (
    <div className="fixed right-4 top-[calc(5rem+env(safe-area-inset-top,0px)+8px)] z-[135] w-[calc(100vw-2rem)] max-w-[420px] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-violet-200/50 sm:absolute sm:right-0 sm:top-14 sm:w-[380px]">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">Notifications</p>
          <p className="text-xs text-slate-500">{unreadCount > 0 ? `${unreadCount} non lue${unreadCount > 1 ? "s" : ""}` : "Tout est à jour"}</p>
        </div>
        <button
          type="button"
          onClick={onMarkAllAsRead}
          disabled={unreadCount === 0 || markingAll}
          className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-violet-700 transition hover:bg-violet-50 disabled:cursor-not-allowed disabled:text-slate-300"
        >
          <FontAwesomeIcon icon={markingAll ? faSpinner : faCheckDouble} className={`h-3.5 w-3.5 ${markingAll ? "animate-spin" : ""}`} />
          Tout lu
        </button>
      </div>

      <div className="max-h-[60vh] overflow-y-auto overscroll-contain p-3">
        {loading ? (
          <div className="flex items-center justify-center gap-2 px-4 py-10 text-sm text-slate-500">
            <FontAwesomeIcon icon={faSpinner} className="h-4 w-4 animate-spin" />
            Chargement...
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
        ) : notifications.length === 0 ? (
          <NotificationEmptyState compact />
        ) : (
          <div className="flex flex-col gap-2">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.uuid}
                notification={notification}
                compact
                onClick={onNotificationClick}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
