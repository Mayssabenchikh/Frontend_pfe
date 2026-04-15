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
    <div className="app-modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-md rounded-3xl overflow-hidden border border-violet-500/16 bg-white/[0.9] px-7 py-6 shadow-[0_18px_48px_rgba(109,40,217,0.14)]">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl border border-amber-400/30 bg-amber-400/15">
            <ExclamationTriangleIcon className="h-6 w-6 text-amber-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-violet-950">{title}</h3>
            <div className="mt-1.5 text-sm text-slate-600">{message}</div>
            <button
              type="button"
              onClick={onClose}
              className="mt-4 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 px-4 py-2.5 text-xs font-semibold text-white"
            >
              {buttonLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
