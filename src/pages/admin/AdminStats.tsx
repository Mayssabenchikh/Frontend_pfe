import { UserGroupIcon, ArrowTrendingUpIcon, UserMinusIcon } from "../../icons/heroicons/outline";

type CardProps = {
  label: string;
  value: number;
  icon: React.ReactNode;
  iconClass: string;
  iconBgClass: string;
  note?: string;
};

function Card({ label, value, icon, iconClass, iconBgClass, note }: CardProps) {
  return (
    <div className="relative cursor-default overflow-hidden rounded-2xl border border-violet-500/15 bg-white/50 p-4 shadow-md transition-all -translate-y-0.5 sm:p-6">
      <div className="pointer-events-none absolute -right-6 -top-6 z-0 h-24 w-24 rounded-full bg-slate-50" />
      <div className="relative z-10 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-900 sm:mb-2 sm:text-xs">{label}</p>
          <p className="text-3xl font-extrabold leading-none tracking-tight text-violet-900 tabular-nums sm:text-4xl">{value}</p>
          {note && <p className="text-xs text-slate-900 mt-2">{note}</p>}
        </div>
        <div className={`min-h-[44px] min-w-[44px] w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${iconBgClass} ${iconClass}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

export function AdminStats({ total, actifs, inactifs }: { total: number; actifs: number; inactifs: number }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
      <Card
        label="Total utilisateurs"
        value={total}
        icon={<UserGroupIcon className="w-5 h-5 text-indigo-600" />}
        iconClass="text-indigo-600"
        iconBgClass="bg-violet-100"
      />
      <Card
        label="Comptes actifs"
        value={actifs}
        icon={<ArrowTrendingUpIcon className="w-5 h-5 text-emerald-600" />}
        iconClass="text-emerald-600"
        iconBgClass="bg-emerald-100"
        note="Comptes opérationnels"
      />
      <Card
        label="Comptes inactifs"
        value={inactifs}
        icon={<UserMinusIcon className="w-5 h-5 text-slate-500" />}
        iconClass="text-slate-400"
        iconBgClass="bg-slate-100"
      />
    </div>
  );
}
