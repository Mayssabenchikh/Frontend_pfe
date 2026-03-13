import { UserGroupIcon, ArrowTrendingUpIcon, UserMinusIcon } from "@heroicons/react/24/outline";

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
    <div className="relative rounded-2xl border border-violet-500/15 bg-white/50 p-6 overflow-hidden shadow-md cursor-default transition-all -translate-y-0.5">
      <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-slate-50 pointer-events-none z-0" />
      <div className="flex items-start justify-between relative z-10">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-900 mb-2">{label}</p>
          <p className="text-4xl font-extrabold text-violet-900 leading-none tabular-nums tracking-tight">{value}</p>
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
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
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
