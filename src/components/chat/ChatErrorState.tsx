export function ChatErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex h-full min-h-0 w-full flex-col items-center justify-center gap-3 rounded-2xl border border-rose-200 bg-rose-50/70 p-5 text-center shadow-sm sm:p-8">
      <p className="break-words text-sm text-rose-700">{message}</p>
      {onRetry ? (
        <button onClick={onRetry} className="rounded-lg bg-rose-600 px-3 py-2 text-sm font-semibold text-white hover:bg-rose-700">
          Réessayer
        </button>
      ) : null}
    </div>
  );
}
