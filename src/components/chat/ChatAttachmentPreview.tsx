import type { ChatAttachment } from "../../types/chat";
import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowUpRightFromSquare,
  faFile,
  faFileArchive,
  faFileExcel,
  faFileImage,
  faFilePdf,
  faFilePowerpoint,
  faFileWord,
} from "@fortawesome/free-solid-svg-icons";

function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "Taille inconnue";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  const value = bytes / 1024 ** index;
  return `${value >= 10 || index === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[index]}`;
}

function getAttachmentIcon(attachment: ChatAttachment) {
  const contentType = attachment.contentType?.toLowerCase() ?? "";
  const fileName = attachment.fileName.toLowerCase();

  if (contentType.includes("pdf") || fileName.endsWith(".pdf")) return faFilePdf;
  if (contentType.includes("msword") || fileName.endsWith(".doc") || fileName.endsWith(".docx")) return faFileWord;
  if (contentType.includes("spreadsheet") || fileName.endsWith(".xls") || fileName.endsWith(".xlsx")) return faFileExcel;
  if (contentType.includes("presentation") || fileName.endsWith(".ppt") || fileName.endsWith(".pptx")) return faFilePowerpoint;
  if (contentType.includes("zip") || fileName.endsWith(".zip") || fileName.endsWith(".rar") || fileName.endsWith(".7z")) return faFileArchive;
  if (contentType.startsWith("image/")) return faFileImage;
  return faFile;
}

export function ChatAttachmentPreview({ attachment }: { attachment: ChatAttachment }) {
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [attachment.fileUrl]);

  const isImage = attachment.contentType?.toLowerCase().startsWith("image/") && !imageFailed;

  if (isImage) {
    return (
      <a href={attachment.fileUrl} target="_blank" rel="noreferrer" className="block max-w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
        <img
          src={attachment.fileUrl}
          alt={attachment.fileName}
          className="h-auto max-h-48 w-full max-w-full object-cover"
          onError={() => setImageFailed(true)}
        />
        <div className="flex min-w-0 items-center justify-between gap-3 px-3 py-2">
          <div className="min-w-0">
            <p className="truncate text-xs font-medium text-slate-800">{attachment.fileName}</p>
            <p className="text-xs text-slate-500">{formatBytes(attachment.sizeBytes)}</p>
          </div>
          <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="h-3.5 w-3.5 text-slate-400" />
        </div>
      </a>
    );
  }

  return (
    <a href={attachment.fileUrl} target="_blank" rel="noreferrer" className="flex max-w-full min-w-0 items-center justify-between gap-3 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 transition hover:border-violet-200 hover:bg-violet-50">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-violet-700 shadow-sm ring-1 ring-slate-200">
          <FontAwesomeIcon icon={getAttachmentIcon(attachment)} className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-slate-800">{attachment.fileName}</p>
          <p className="text-xs text-slate-500">{formatBytes(attachment.sizeBytes)}</p>
        </div>
      </div>
      <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="h-3.5 w-3.5 shrink-0 text-slate-400" />
    </a>
  );
}
