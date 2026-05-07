import { useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser } from "@fortawesome/free-solid-svg-icons";

function getInitials(name: string) {
  const trimmed = name.trim();
  if (!trimmed) return "";

  return trimmed
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function ChatAvatar({
  name,
  avatarUrl,
  size = 40,
}: {
  name?: string | null;
  avatarUrl?: string | null;
  size?: number;
}) {
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [avatarUrl]);

  const initials = useMemo(() => (name ? getInitials(name) : ""), [name]);
  const diameter = `${size}px`;

  if (avatarUrl && !imageFailed) {
    return (
      <img
        src={avatarUrl}
        alt={name || "Utilisateur"}
        onError={() => setImageFailed(true)}
        className="shrink-0 rounded-full border border-slate-200 object-cover"
        style={{ width: diameter, height: diameter }}
      />
    );
  }

  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full border border-slate-200 bg-violet-100 text-[11px] font-semibold text-violet-700"
      style={{ width: diameter, height: diameter }}
      aria-label={name || "Utilisateur"}
      title={name || "Utilisateur"}
    >
      {initials ? <span>{initials}</span> : <FontAwesomeIcon icon={faUser} className="h-4 w-4 text-violet-700" />}
    </div>
  );
}