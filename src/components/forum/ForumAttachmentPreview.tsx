import { ArrowTopRightOnSquareIcon } from "../../icons/heroicons/outline";
import type { ForumAttachmentDto } from "../../types/forum";

export function ForumAttachmentPreview({ attachments }: { attachments: ForumAttachmentDto[] }) {
  if (!attachments.length) return null;
  return (
    <ul className="mt-3 flex flex-col gap-2">
      {attachments.map((a) => (
        <li key={a.uuid}>
          <a
            href={a.fileUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-violet-700 hover:bg-violet-50"
          >
            <ArrowTopRightOnSquareIcon className="h-4 w-4 shrink-0" />
            <span className="min-w-0 truncate">{a.fileName}</span>
            {a.sizeBytes != null ? (
              <span className="shrink-0 text-xs text-slate-500">{(a.sizeBytes / 1024).toFixed(0)} Ko</span>
            ) : null}
          </a>
        </li>
      ))}
    </ul>
  );
}
