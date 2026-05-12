import { InboxStackIcon } from "../../../icons/heroicons/outline";

type EmptyStateProps = {
  title?: string;
  description?: string;
};

export function EmptyState({
  title = "Aucune donnée disponible pour le moment.",
  description = "Les indicateurs apparaîtront dès que des données réelles seront disponibles.",
}: EmptyStateProps) {
  return (
    <div className="flex min-h-36 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-6 text-center">
      <InboxStackIcon className="h-8 w-8 text-slate-300" />
      <p className="mt-3 text-sm font-semibold text-slate-700">{title}</p>
      <p className="mt-1 max-w-sm text-xs leading-relaxed text-slate-500">{description}</p>
    </div>
  );
}
