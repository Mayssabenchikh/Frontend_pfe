export function ChatEmptyState({ message }: { message: string }) {
  return (
    <div className="flex h-full min-h-0 w-full items-center justify-center rounded-2xl border border-slate-200 bg-white p-5 text-center text-sm text-slate-500 shadow-sm sm:p-8">
      {message}
    </div>
  );
}
