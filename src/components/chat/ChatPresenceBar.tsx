export function ChatPresenceBar({ onlineCount }: { onlineCount: number }) {
  return <span className="rounded-full bg-emerald-50 px-4 py-1.5 text-sm font-semibold text-emerald-700">{onlineCount} en ligne</span>;
}
