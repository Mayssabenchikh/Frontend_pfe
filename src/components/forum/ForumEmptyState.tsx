import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faComments } from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/free-solid-svg-icons";

type Props = {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: IconDefinition;
};

export function ForumEmptyState({ title, description, action, icon = faComments }: Props) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
        <FontAwesomeIcon icon={icon} className="h-7 w-7 text-slate-400" />
      </div>
      <p className="mt-4 text-base font-semibold text-slate-800">{title}</p>
      {description ? <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-500">{description}</p> : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
