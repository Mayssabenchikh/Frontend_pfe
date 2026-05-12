export function LoadingState() {
  return (
    <section className="w-full space-y-5 px-4 py-4 sm:px-6 lg:px-8">
      <div className="h-24 animate-pulse rounded-3xl bg-slate-100" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="h-32 animate-pulse rounded-2xl bg-slate-100" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-80 animate-pulse rounded-2xl bg-slate-100" />
        ))}
      </div>
    </section>
  );
}
