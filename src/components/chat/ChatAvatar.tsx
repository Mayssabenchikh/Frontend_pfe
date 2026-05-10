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
  isOnline = false,
}: {
  name?: string | null;
  avatarUrl?: string | null;
  size?: number;
  isOnline?: boolean;
}) {
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [avatarUrl]);

  const initials = useMemo(() => (name ? getInitials(name) : ""), [name]);
  const diameter = `${size}px`;

  const dotSize = Math.max(10, Math.round(size * 0.28));

  const avatar = avatarUrl && !imageFailed ? (
    <img
      src={avatarUrl}
      alt={name || "Utilisateur"}
      onError={() => setImageFailed(true)}
      className="block shrink-0 rounded-full border border-slate-200 object-cover"
      style={{ width: diameter, height: diameter }}
    />
  ) : (
    <div
      className="flex shrink-0 items-center justify-center rounded-full border border-slate-200 bg-violet-100 text-xs font-semibold text-violet-700"
      style={{ width: diameter, height: diameter }}
      aria-label={name || "Utilisateur"}
      title={name || "Utilisateur"}
    >
      {initials ? <span>{initials}</span> : <FontAwesomeIcon icon={faUser} className="h-4 w-4 text-violet-700" />}
    </div>
  );

  return (
    <span className="relative inline-flex shrink-0" style={{ width: diameter, height: diameter }}>
      {avatar}
      {isOnline ? (
        <span
          aria-hidden="true"
          className="absolute bottom-0 right-0 rounded-full border-2 border-white bg-emerald-500 shadow-sm"
          style={{ width: `${dotSize}px`, height: `${dotSize}px` }}
        />
      ) : null}
    </span>
  );
}