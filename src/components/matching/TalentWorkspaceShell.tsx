type Props = {
  children: React.ReactNode;
  title: React.ReactNode;
  kicker?: string;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  actionsPosition?: "left" | "right";
  headerClassName?: string;
  showAccentUnderline?: boolean;
  disablePageBackground?: boolean;
  fullWidth?: boolean;
  contentClassName?: string;
};

export function TalentWorkspaceShell({
  children,
  title,
  kicker,
  subtitle,
  actions,
  actionsPosition = "right",
  headerClassName,
  showAccentUnderline = true,
  disablePageBackground = false,
  fullWidth = false,
  contentClassName,
}: Props) {
  const containerClassName = fullWidth ? "w-full" : "mx-auto w-full max-w-[1680px]";

  return (
    <div
      className="min-h-full w-full"
      style={disablePageBackground ? undefined : { background: "var(--luxury-light-bg, #f8f7ff)" }}
    >

      {/* ── Sticky header ── */}
      <div
        className={`sticky top-0 z-10 shadow-[0_1px_0_0_#e2e8f0] ${headerClassName ?? "bg-white"}`}
      >

        {/* Left-oriented compact header */}
        {actionsPosition === "left" ? (
          <div className={`${containerClassName} px-3 py-3 sm:px-8 lg:px-12 xl:px-14`}>
            <div className="flex min-w-0 items-start gap-3">
              {actions && <div className="flex shrink-0 items-center gap-2 pt-0.5">{actions}</div>}

              <div className="min-w-0">
                <div className="flex min-w-0 items-baseline gap-3">
                  {kicker && (
                    <span className="shrink-0 rounded-md border border-violet-200 bg-violet-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-violet-600">
                      {kicker}
                    </span>
                  )}
                  <h1 className="truncate text-[18px] font-bold leading-tight tracking-tight text-slate-900">
                    {title}
                  </h1>
                </div>

                {subtitle && (
                  <p className="mt-1.5 text-[12px] font-medium tracking-wide text-slate-500">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Top strip — kicker + title */}
            <div className={`${containerClassName} flex flex-wrap items-center justify-between gap-3 px-3 pt-3 pb-0 sm:gap-4 sm:px-8 sm:pt-4 lg:px-12 xl:px-14`}>

              {/* Identity block */}
              <div className="flex min-w-0 items-baseline gap-3">
                {kicker && (
                  <span className="shrink-0 rounded-md border border-violet-200 bg-violet-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-violet-600">
                    {kicker}
                  </span>
                )}
                <h1 className="truncate text-[17px] font-extrabold leading-none tracking-tight text-slate-900">
                  {title}
                </h1>
              </div>

              {/* Actions */}
              {actions && (
                <div className="flex shrink-0 items-center gap-2">{actions}</div>
              )}
            </div>

            {/* Bottom strip — subtitle / meta */}
            {subtitle && (
              <div className={`${containerClassName} px-3 pb-2.5 pt-1 sm:px-8 lg:px-12 xl:px-14`}>
                <span className="text-[12px] font-medium text-slate-400 tracking-wide">
                  {subtitle}
                </span>
              </div>
            )}
          </>
        )}

        {/* Accent underline */}
        {showAccentUnderline && (
          <div className="h-[3px] bg-gradient-to-r from-violet-500 via-fuchsia-500 to-transparent" />
        )}
      </div>

      {/* ── Page content ── */}
      <div className={`${containerClassName} px-3 py-4 sm:px-8 sm:py-6 lg:px-12 lg:py-7 xl:px-14 ${contentClassName ?? ""}`}>
        {children}
      </div>
    </div>
  );
}