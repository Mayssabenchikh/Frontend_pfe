export function TypingIndicator({ users }: { users: string[] }) {
  if (!users.length) return null;
  return <p className="shrink-0 truncate px-3 py-2 text-xs text-violet-600 sm:px-4">{users.join(", ")} en train d'écrire...</p>;
}
