import type { ReactNode } from "react";

type DashboardHeaderProps = {
  title: string;
  description: string;
  generatedAt?: string;
  actions?: ReactNode;
};

export function DashboardHeader({ title, description, generatedAt, actions }: DashboardHeaderProps) {
  return (
    <header className="rounded-3xl border border-slate-200/80 bg-white/95 p-5 shadow-sm shadow-slate-200/60">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-600">Skillify tableau de bord</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">{title}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{description}</p>
          {generatedAt ? (
            <p className="mt-3 text-xs font-medium text-slate-400">
              Dernière mise à jour : {new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(generatedAt))}
            </p>
          ) : null}
        </div>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>
    </header>
  );
}
