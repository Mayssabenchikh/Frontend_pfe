import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";

type Props = {
  tags: string[];
  onChange: (tags: string[]) => void;
  disabled?: boolean;
};

export function ForumTagInput({ tags, onChange, disabled }: Props) {
  const [draft, setDraft] = useState("");

  const add = () => {
    const t = draft.trim();
    if (!t || tags.includes(t)) return;
    onChange([...tags, t]);
    setDraft("");
  };

  return (
    <div>
      <div className="flex gap-2">
        <input
          value={draft}
          disabled={disabled}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder="Ajouter un tag (Entrée)"
          className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm placeholder:text-slate-400 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-300/30"
        />
        <button
          type="button"
          disabled={disabled}
          onClick={add}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-violet-700 hover:bg-violet-50"
        >
          Ajouter
        </button>
      </div>
      {tags.length > 0 ? (
        <ul className="mt-2 flex flex-wrap gap-2">
          {tags.map((t) => (
            <li
              key={t}
              className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-900"
            >
              {t}
              <button
                type="button"
                disabled={disabled}
                onClick={() => onChange(tags.filter((x) => x !== t))}
                className="rounded-full p-0.5 text-violet-600 hover:bg-violet-100"
                aria-label={`Retirer ${t}`}
              >
                <FontAwesomeIcon icon={faXmark} className="h-3 w-3" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
