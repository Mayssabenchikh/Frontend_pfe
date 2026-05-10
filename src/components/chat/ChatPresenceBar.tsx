export function ChatPresenceBar({ onlineCount }: { onlineCount: number }) {
  return <span className="inline-flex whitespace-nowrap rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 sm:px-3 sm:py-1.5">{onlineCount} en ligne</span>;
}
