export function ForumLoadingState({ label = "Chargement…" }: { label?: string }) {
  return (
    <div className="flex flex-col gap-3">
      {/* Skeleton cards */}
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex w-14 shrink-0 flex-col items-center gap-2 border-r border-slate-100 bg-slate-50 py-6 px-2">
            <div className="h-6 w-6 animate-pulse rounded bg-slate-200" />
            <div className="h-4 w-4 animate-pulse rounded bg-slate-200" />
            <div className="h-6 w-6 animate-pulse rounded bg-slate-200" />
          </div>
          <div className="flex-1 space-y-3 p-4">
            <div className="flex gap-2">
              <div className="h-4 w-16 animate-pulse rounded-full bg-slate-200" />
              <div className="h-4 w-24 animate-pulse rounded-full bg-slate-200" />
            </div>
            <div className="h-5 w-3/4 animate-pulse rounded bg-slate-200" />
            <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-slate-100" />
            <div className="flex gap-3 pt-1">
              <div className="h-3 w-16 animate-pulse rounded bg-slate-100" />
              <div className="h-3 w-12 animate-pulse rounded bg-slate-100" />
            </div>
          </div>
        </div>
      ))}
      <p className="text-center text-xs text-slate-400">{label}</p>
    </div>
  );
}
