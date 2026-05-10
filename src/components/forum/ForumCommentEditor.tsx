import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaperPlane } from "@fortawesome/free-solid-svg-icons";

type Props = {
  placeholder?: string;
  submitLabel?: string;
  disabled?: boolean;
  initialValue?: string;
  onSubmit: (content: string) => Promise<void> | void;
  onCancel?: () => void;
};

export function ForumCommentEditor({
  placeholder = "Votre message…",
  submitLabel = "Publier",
  disabled,
  initialValue = "",
  onSubmit,
  onCancel,
}: Props) {
  const [content, setContent] = useState(initialValue);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!content.trim() || saving) return;
    setSaving(true);
    try {
      await onSubmit(content.trim());
      setContent("");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <textarea
        value={content}
        disabled={disabled || saving}
        onChange={(e) => setContent(e.target.value)}
        rows={4}
        placeholder={placeholder}
        className="w-full resize-y bg-white px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-inset focus:ring-violet-300 disabled:opacity-60"
      />
      <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/60 px-4 py-2.5">
        <p className="text-xs text-slate-400">{content.length} / 5000</p>
        <div className="flex gap-2">
          {onCancel ? (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-xl px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-200 transition-colors"
            >
              Annuler
            </button>
          ) : null}
          <button
            type="button"
            disabled={disabled || saving || !content.trim()}
            onClick={submit}
            className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-1.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-violet-700 disabled:opacity-50"
          >
            <FontAwesomeIcon icon={faPaperPlane} className="h-3.5 w-3.5" />
            {saving ? "Envoi…" : submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
