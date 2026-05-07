export function TypingIndicator({ users }: { users: string[] }) {
  if (!users.length) return null;
  return <p className="px-4 py-2 text-xs text-violet-600">{users.join(", ")} en train d'écrire...</p>;
}
