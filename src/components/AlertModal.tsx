/**
 * Modal d'alerte unifié (avertissement, info) — design violet cohérent
 */
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";

interface Props {
  open: boolean;
  title: string;
  message: React.ReactNode;
  buttonLabel?: string;
  onClose: () => void;
}

export function AlertModal({
  open,
  title,
  message,
  buttonLabel = "Compris",
  onClose,
}: Props) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(109,40,217,0.12)", backdropFilter: "blur(10px)" }}
    >
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />
      <div
        className="relative w-full max-w-md rounded-3xl overflow-hidden px-7 py-6"
        style={{
          background: "rgba(255,255,255,0.97)",
          border: "1px solid rgba(139,92,246,0.2)",
          boxShadow: "0 32px 80px rgba(109,40,217,0.2)",
        }}
      >
        <div className="flex items-start gap-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: "rgba(245,158,11,0.15)",
              border: "1px solid rgba(245,158,11,0.3)",
            }}
          >
            <ExclamationTriangleIcon className="w-6 h-6 text-amber-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-violet-950">{title}</h3>
            <div className="text-sm text-slate-600 mt-1.5">{message}</div>
            <button
              type="button"
              onClick={onClose}
              className="mt-4 px-4 py-2.5 rounded-xl text-xs font-semibold text-white"
              style={{ background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)" }}
            >
              {buttonLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
