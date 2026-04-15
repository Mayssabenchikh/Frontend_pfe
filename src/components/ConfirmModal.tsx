/**
 * Modal de confirmation unifié — design violet cohérent dans tout le projet
 */
import { createPortal } from "react-dom";

type Variant = "danger" | "primary";

interface Props {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  variant?: Variant;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel = "Annuler",
  variant = "primary",
  loading = false,
  onConfirm,
  onCancel,
}: Props) {
  if (!open) return null;
  const isDanger = variant === "danger";
  const content = (
    <div className="app-modal-backdrop fixed inset-0 z-[80] flex items-center justify-center px-4">
      <div className="absolute inset-0" onClick={onCancel} aria-hidden="true" />
      <div className="relative w-full max-w-md rounded-3xl overflow-hidden border border-violet-500/16 bg-white/[0.9] px-7 py-6 shadow-[0_18px_48px_rgba(109,40,217,0.14)]">
        <h3 className="text-sm font-bold text-violet-950">{title}</h3>
        <p className="mt-1.5 text-sm text-slate-600">{message}</p>
        <div className="mt-5 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-semibold text-slate-500 hover:bg-slate-100"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`rounded-xl px-4 py-2.5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 ${isDanger ? "bg-red-500 hover:bg-red-600" : "bg-gradient-to-br from-violet-600 to-indigo-600"}`}
          >
            {loading ? "…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );

  if (typeof document === "undefined") {
    return content;
  }

  return createPortal(content, document.body);
}
