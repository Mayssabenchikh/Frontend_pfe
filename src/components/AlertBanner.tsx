import type { ReactNode } from "react";
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
} from "../icons/heroicons/outline";

type AlertVariant = "error" | "warning" | "success" | "info";

interface AlertBannerProps {
  message: ReactNode;
  title?: ReactNode;
  variant?: AlertVariant;
  className?: string;
  role?: "alert" | "status";
}

const variantStyle: Record<AlertVariant, { box: string; icon: string; iconBox: string }> = {
  error: {
    box: "border-rose-200 bg-rose-50 text-rose-800 ring-rose-200/60",
    icon: "text-rose-600",
    iconBox: "bg-rose-100",
  },
  warning: {
    box: "border-amber-200 bg-amber-50 text-amber-800 ring-amber-200/60",
    icon: "text-amber-600",
    iconBox: "bg-amber-100",
  },
  success: {
    box: "border-emerald-200 bg-emerald-50 text-emerald-800 ring-emerald-200/60",
    icon: "text-emerald-600",
    iconBox: "bg-emerald-100",
  },
  info: {
    box: "border-violet-200 bg-violet-50 text-violet-800 ring-violet-200/60",
    icon: "text-violet-600",
    iconBox: "bg-violet-100",
  },
};

const variantIcon: Record<AlertVariant, typeof InformationCircleIcon> = {
  error: ExclamationCircleIcon,
  warning: ExclamationTriangleIcon,
  success: CheckCircleIcon,
  info: InformationCircleIcon,
};

export function AlertBanner({
  message,
  title,
  variant = "error",
  className,
  role = "alert",
}: AlertBannerProps) {
  const style = variantStyle[variant];
  const Icon = variantIcon[variant];

  return (
    <div
      role={role}
      className={[
        "flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm shadow-sm ring-1",
        style.box,
        className ?? "",
      ].join(" ")}
    >
      <span className={["mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full", style.iconBox].join(" ")}>
        <Icon className={["h-4 w-4", style.icon].join(" ")} />
      </span>
      <span className="min-w-0">
        {title ? <span className="mb-0.5 block font-semibold">{title}</span> : null}
        <span className="block">{message}</span>
      </span>
    </div>
  );
}
