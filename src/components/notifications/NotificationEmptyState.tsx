import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBell } from "@fortawesome/free-solid-svg-icons";

type Props = {
  compact?: boolean;
};

export function NotificationEmptyState({ compact = false }: Props) {
  return (
    <div className={`flex flex-col items-center justify-center text-center ${compact ? "px-4 py-8" : "px-6 py-16"}`}>
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-violet-500">
        <FontAwesomeIcon icon={faBell} className="h-5 w-5" />
      </div>
      <p className="text-sm font-semibold text-slate-800">Aucune notification</p>
      <p className="mt-1 max-w-xs text-xs leading-5 text-slate-500">
        Les nouvelles alertes liées à vos projets, formations, activités et discussions apparaîtront ici.
      </p>
    </div>
  );
}
