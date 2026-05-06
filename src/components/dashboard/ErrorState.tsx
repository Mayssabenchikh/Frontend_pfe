import { ExclamationTriangleIcon } from "../../icons/heroicons/outline";

export function ErrorState({ message, onRetry }: { message?: string | null; onRetry?: () => void }) {
  return (
    <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-rose-800">
      <div className="flex items-start gap-3">
        <ExclamationTriangleIcon className="mt-0.5 h-5 w-5 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold">Impossible de charger le dashboard</p>
          <p className="mt-1 text-xs leading-relaxed">{message ?? "Veuillez réessayer dans quelques instants."}</p>
        </div>
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="shrink-0 rounded-xl border border-rose-200 bg-white px-3 py-2 text-xs font-bold text-rose-700 transition hover:bg-rose-100"
          >
            Réessayer
          </button>
        ) : null}
      </div>
    </div>
  );
}
