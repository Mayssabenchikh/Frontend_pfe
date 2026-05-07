import { PaperAirplaneIcon } from "../../icons/heroicons/outline";

export function ChatInput({
  value,
  onChange,
  onSend,
  onUpload,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  onUpload: (file: File) => void;
  disabled?: boolean;
}) {
  return (
    <div className="border-t border-slate-200 bg-white p-3">
      <div className="flex items-center gap-2">
        <label className="cursor-pointer rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50">
          Pièce jointe
          <input
            type="file"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onUpload(file);
              e.currentTarget.value = "";
            }}
          />
        </label>
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSend();
            }
          }}
          placeholder="Écrivez votre message..."
          className="h-10 flex-1 rounded-xl border border-slate-300 px-3 text-sm focus:border-violet-400 focus:outline-none"
          disabled={disabled}
        />
        <button onClick={onSend} disabled={disabled} className="rounded-xl bg-violet-600 p-2.5 text-white hover:bg-violet-700 disabled:opacity-50">
          <PaperAirplaneIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
