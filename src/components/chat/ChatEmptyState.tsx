export function ChatEmptyState({ message }: { message: string }) {
  return (
    <div className="flex h-full items-center justify-center rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm">
      {message}
    </div>
  );
}
