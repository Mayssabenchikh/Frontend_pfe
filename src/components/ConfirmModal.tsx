/**
 * Modal de confirmation unifié — design violet cohérent dans tout le projet
 */
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
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(109,40,217,0.12)", backdropFilter: "blur(10px)" }}
    >
      <div className="absolute inset-0" onClick={onCancel} aria-hidden="true" />
      <div
        className="relative w-full max-w-md rounded-3xl overflow-hidden px-7 py-6"
        style={{
          background: "rgba(255,255,255,0.97)",
          border: "1px solid rgba(139,92,246,0.2)",
          boxShadow: "0 32px 80px rgba(109,40,217,0.2)",
        }}
      >
        <h3 className="text-sm font-bold text-violet-950">{title}</h3>
        <p className="text-sm text-slate-600 mt-1.5">{message}</p>
        <div className="flex items-center justify-end gap-3 mt-5">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-500 bg-slate-50 border border-slate-200 hover:bg-slate-100"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed ${isDanger ? "hover:bg-red-600" : ""}`}
            style={
              isDanger
                ? { background: "#ef4444" }
                : { background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)" }
            }
          >
            {loading ? "…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
