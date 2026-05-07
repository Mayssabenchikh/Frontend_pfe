import { useEffect, useRef, useState } from "react";
import EmojiPicker, { type EmojiClickData } from "emoji-picker-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFaceSmile, faPaperclip, faPaperPlane, faXmark } from "@fortawesome/free-solid-svg-icons";
import type { ChatMessage } from "../../types/chat";

function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "Taille inconnue";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  const value = bytes / 1024 ** index;
  return `${value >= 10 || index === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[index]}`;
}

export function ChatInput({
  value,
  onChange,
  onSend,
  selectedReplyMessage,
  onCancelReply,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  onSend: (file?: File | null) => Promise<void> | void;
  selectedReplyMessage?: ChatMessage | null;
  onCancelReply?: () => void;
  disabled?: boolean;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const pickerRef = useRef<HTMLDivElement | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!pickerOpen) return;
      const target = event.target as Node | null;
      if (target && pickerRef.current?.contains(target)) return;
      setPickerOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setPickerOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [pickerOpen]);

  const focusTextarea = () => {
    textareaRef.current?.focus();
  };

  const insertEmoji = (emoji: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      onChange(`${value}${emoji}`);
      return;
    }

    const start = textarea.selectionStart ?? value.length;
    const end = textarea.selectionEnd ?? value.length;
    const nextValue = `${value.slice(0, start)}${emoji}${value.slice(end)}`;
    onChange(nextValue);

    window.requestAnimationFrame(() => {
      textarea.focus();
      const nextCursor = start + emoji.length;
      textarea.setSelectionRange(nextCursor, nextCursor);
    });
  };

  const handleEmojiClick = (emoji: EmojiClickData) => {
    insertEmoji(emoji.emoji);
    setPickerOpen(false);
    focusTextarea();
  };

  const handleSend = async () => {
    if (disabled || uploading || (!value.trim() && !pendingFile)) return;

    setUploading(true);
    try {
      await onSend(pendingFile);
      setPendingFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } finally {
      setUploading(false);
      focusTextarea();
    }
  };

  const clearPendingFile = () => {
    if (uploading) return;
    setPendingFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    focusTextarea();
  };

  return (
    <div className="relative border-t border-slate-200 bg-white p-3">
      <div ref={pickerRef} className={`absolute bottom-full left-3 right-3 z-30 mb-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl transition ${pickerOpen ? "block" : "hidden"}`}>
        <EmojiPicker onEmojiClick={handleEmojiClick} width="100%" height={360} />
      </div>

      {selectedReplyMessage ? (
        <div className="mb-2 flex items-start justify-between gap-3 rounded-xl border border-violet-200 bg-violet-50 px-3 py-2">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-violet-700">Réponse à {selectedReplyMessage.senderName || "Utilisateur"}</p>
            <p className="truncate text-sm text-slate-700">
              {selectedReplyMessage.deleted
                ? "Message original indisponible"
                : selectedReplyMessage.content || (selectedReplyMessage.attachments?.length ? "Pièce jointe" : "Message original indisponible")}
            </p>
          </div>
          <button
            type="button"
            onClick={onCancelReply}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-white hover:text-slate-700"
            aria-label="Annuler la réponse"
            title="Annuler la réponse"
          >
            <FontAwesomeIcon icon={faXmark} className="h-4 w-4" />
          </button>
        </div>
      ) : null}

      {pendingFile ? (
        <div className="mb-2 flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
          <div className="min-w-0">
            <p className="truncate text-base font-medium text-slate-800">{pendingFile.name}</p>
            <p className="text-sm text-slate-500">{formatBytes(pendingFile.size)}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={clearPendingFile}
              disabled={uploading}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
              title="Retirer le fichier"
            >
              <FontAwesomeIcon icon={faXmark} className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ) : null}

      <div className="flex items-end gap-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || uploading}
          className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
          title="Joindre un fichier"
        >
          <FontAwesomeIcon icon={faPaperclip} className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => setPickerOpen((open) => !open)}
          disabled={disabled || uploading}
          className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
          title="Ajouter un emoji"
        >
          <FontAwesomeIcon icon={faFaceSmile} className="h-4 w-4" />
        </button>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Écrivez votre message..."
          rows={1}
          className="min-h-[44px] flex-1 resize-none rounded-xl border border-slate-300 px-3 py-2 text-base text-slate-900 placeholder:text-slate-400 focus:border-violet-400 focus:outline-none disabled:bg-slate-50"
          disabled={disabled || uploading}
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={disabled || uploading || (!value.trim() && !pendingFile)}
          className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-violet-600 text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
          title="Envoyer"
        >
          {uploading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <FontAwesomeIcon icon={faPaperPlane} className="h-4 w-4" />}
        </button>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={(event) => {
          const file = event.currentTarget.files?.[0] ?? null;
          if (file) {
            setPendingFile(file);
            setPickerOpen(false);
          }
          event.currentTarget.value = "";
        }}
      />
    </div>
  );
}
