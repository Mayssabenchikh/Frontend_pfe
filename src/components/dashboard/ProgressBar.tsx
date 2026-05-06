export function ProgressBar({ value, label }: { value?: number | null; label?: string }) {
  const safeValue = Math.max(0, Math.min(100, Number(value ?? 0)));
  return (
    <div className="min-w-[120px]">
      <div className="mb-1 flex items-center justify-between gap-2 text-[11px] font-bold text-slate-500">
        <span className="truncate">{label ?? "Progression"}</span>
        <span className="tabular-nums text-slate-700">{safeValue}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className="dashboard-progress h-full rounded-full bg-gradient-to-r from-violet-400 via-blue-500 to-emerald-500"
          style={{ width: `${safeValue}%` }}
        />
      </div>
    </div>
  );
}
