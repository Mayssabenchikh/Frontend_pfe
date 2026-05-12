import type { ReactNode } from "react";

type Props = {
  left?: ReactNode;
  main: ReactNode;
  right?: ReactNode;
};

export function ForumLayout({ left, main, right }: Props) {
  return (
    <div className={`grid w-full grid-cols-1 gap-6 ${left ? "xl:grid-cols-[280px_minmax(0,1fr)_300px]" : "xl:grid-cols-[minmax(0,1fr)_300px]"}`}>
      {left ? (
        <aside className="min-w-0 xl:block">
          <div className="sticky top-6">{left}</div>
        </aside>
      ) : null}
      <div className="min-w-0">{main}</div>
      {right ? (
        <aside className="hidden min-w-0 xl:block">
          <div className="sticky top-6 space-y-4">{right}</div>
        </aside>
      ) : null}
    </div>
  );
}
