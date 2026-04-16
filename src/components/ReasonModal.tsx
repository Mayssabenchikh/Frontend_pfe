import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { XMarkIcon } from "../icons/heroicons/outline";

type Variant = "danger" | "primary";

type Props = {
  open: boolean;
  title: string;
  description?: string;
  placeholder?: string;
  confirmLabel: string;
  cancelLabel?: string;
  variant?: Variant;
  loading?: boolean;
  initialValue?: string;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
};

export function ReasonModal({
  open,
  title,
  description,
  placeholder = "Saisir le motif…",
  confirmLabel,
  cancelLabel = "Annuler",
  variant = "primary",
  loading = false,
  initialValue = "",
  onConfirm,
  onCancel,
}: Props) {
  const isDanger = variant === "danger";
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    if (!open) return;
    setValue(initialValue);
  }, [open, initialValue]);

  if (!open) return null;

  const trimmed = value.trim();
  const disabled = loading || trimmed.length === 0;

  const content = (
    <div className="app-modal-backdrop fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/25" onClick={onCancel} aria-hidden="true" />

      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-violet-500/16 bg-white shadow-[0_18px_48px_rgba(109,40,217,0.14)]">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-7 py-5">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-bold text-violet-950">{title}</h3>
            {description ? <p className="mt-1 text-sm text-slate-600">{description}</p> : null}
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
            aria-label="Fermer"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="px-7 py-5">
          <label className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">
            Motif (obligatoire)
            <textarea
              value={value}
              onChange={(e) => setValue(e.target.value)}
              rows={4}
              placeholder={placeholder}
              className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-800 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/15"
            />
          </label>
          <div className="mt-5 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={() => onConfirm(trimmed)}
              disabled={disabled}
              className={`rounded-xl px-4 py-2.5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 ${
                isDanger ? "bg-red-500 hover:bg-red-600" : "bg-gradient-to-br from-violet-600 to-indigo-600"
              }`}
            >
              {loading ? "…" : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (typeof document === "undefined") return content;
  return createPortal(content, document.body);
}

