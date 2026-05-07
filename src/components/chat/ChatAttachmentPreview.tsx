import type { ChatAttachment } from "../../types/chat";

export function ChatAttachmentPreview({ attachment }: { attachment: ChatAttachment }) {
  return (
    <a href={attachment.fileUrl} target="_blank" rel="noreferrer" className="mt-2 block rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 hover:bg-slate-100">
      {attachment.fileName}
    </a>
  );
}
