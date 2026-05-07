export function ChatPresenceBar({ onlineCount }: { onlineCount: number }) {
  return <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">{onlineCount} en ligne</span>;
}
