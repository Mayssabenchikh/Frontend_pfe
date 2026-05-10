import { InboxStackIcon } from "../../icons/heroicons/outline";

export function EmptyState({ title = "Aucune donnée", description = "Les données apparaîtront dès qu'elles seront disponibles." }) {
  return (
    <div className="flex min-h-36 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/70 p-6 text-center">
      <InboxStackIcon className="h-8 w-8 text-slate-300" />
      <p className="mt-3 text-sm font-semibold text-slate-700">{title}</p>
      <p className="mt-1 max-w-sm text-xs leading-relaxed text-slate-500">{description}</p>
    </div>
  );
}
