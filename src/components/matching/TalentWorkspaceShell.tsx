type Props = {
  children: React.ReactNode;
  title: React.ReactNode;
  kicker?: string;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
};

/** Même fond que le quiz (EmployeeQuiz) : --luxury-light-bg / #f8f7ff */
export function TalentWorkspaceShell({ children, title, kicker, subtitle, actions }: Props) {
  return (
    <div className="min-h-full w-full" style={{ background: "var(--luxury-light-bg, #f8f7ff)" }}>
      <div className="mx-auto w-full max-w-[1680px] px-4 py-2 sm:px-8 sm:py-4 lg:px-12 lg:py-5 xl:px-14">
        <header className="mb-6 lg:mb-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0 flex-1">
            {kicker ? (
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-violet-500">{kicker}</p>
            ) : null}
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">{title}</h1>
            {subtitle ? <div className="mt-1 text-sm text-slate-600">{subtitle}</div> : null}
          </div>
          {actions ? <div className="flex w-full min-w-0 shrink-0 flex-wrap items-center gap-2 sm:w-auto">{actions}</div> : null}
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}
