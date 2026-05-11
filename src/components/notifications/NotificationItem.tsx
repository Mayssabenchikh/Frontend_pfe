import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBriefcase,
  faBullhorn,
  faCheck,
  faCircleQuestion,
  faComments,
  faGraduationCap,
  faMessage,
} from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import type { NotificationDto, NotificationType } from "../../types/notification";

type Props = {
  notification: NotificationDto;
  compact?: boolean;
  onClick: (notification: NotificationDto) => void;
};

const typeIcons: Partial<Record<NotificationType, IconDefinition>> = {
  PROJECT_ASSIGNMENT: faBriefcase,
  PROJECT_ASSIGNMENT_REMOVED: faBriefcase,
  TRAINING_RECOMMENDED: faGraduationCap,
  TRAINING_ENROLLED: faGraduationCap,
  TRAINING_COMPLETED: faGraduationCap,
  ACTIVITY_SUBMITTED: faGraduationCap,
  ACTIVITY_REVIEWED: faGraduationCap,
  QUIZ_AVAILABLE: faCircleQuestion,
  QUIZ_PASSED: faCircleQuestion,
  QUIZ_FAILED: faCircleQuestion,
  FORUM_REPLY: faComments,
  FORUM_COMMENT: faComments,
  FORUM_ACCEPTED_ANSWER: faComments,
  FORUM_MENTION: faComments,
  CHAT_MESSAGE: faMessage,
  SYSTEM_ANNOUNCEMENT: faBullhorn,
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function typeLabel(type: NotificationType) {
  if (type.startsWith("PROJECT")) return "Projet";
  if (type.startsWith("TRAINING") || type.startsWith("ACTIVITY")) return "Formation";
  if (type.startsWith("QUIZ")) return "Quiz";
  if (type.startsWith("FORUM")) return "Forum";
  if (type.startsWith("CHAT")) return "Chat";
  return "Système";
}

export function NotificationItem({ notification, compact = false, onClick }: Props) {
  const icon = typeIcons[notification.type] ?? faBullhorn;
  const unread = !notification.read;

  return (
    <button
      type="button"
      onClick={() => onClick(notification)}
      className={[
        "group flex w-full gap-3 rounded-2xl border p-3 text-left transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/30",
        unread ? "border-violet-100 bg-violet-50/70" : "border-slate-100 bg-white",
        compact ? "items-start" : "items-center",
      ].join(" ")}
    >
      <span
        className={[
          "mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
          notification.priority === "HIGH" ? "bg-rose-50 text-rose-500" : "bg-violet-50 text-violet-600",
        ].join(" ")}
      >
        <FontAwesomeIcon icon={icon} className="h-4 w-4" />
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="truncate text-sm font-semibold text-slate-900">{notification.title}</span>
          {unread ? <span className="h-2 w-2 shrink-0 rounded-full bg-violet-600" /> : null}
        </span>
        <span className="mt-1 line-clamp-2 block text-xs leading-5 text-slate-500">{notification.message}</span>
        <span className="mt-2 flex flex-wrap items-center gap-2 text-[11px] font-medium text-slate-400">
          <span>{typeLabel(notification.type)}</span>
          <span aria-hidden="true">-</span>
          <span>{formatDate(notification.createdAt)}</span>
          {notification.priority === "HIGH" ? (
            <>
              <span aria-hidden="true">-</span>
              <span className="text-rose-500">Priorité haute</span>
            </>
          ) : null}
        </span>
      </span>

      {notification.read ? (
        <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-50 text-slate-300">
          <FontAwesomeIcon icon={faCheck} className="h-3 w-3" />
        </span>
      ) : null}
    </button>
  );
}
