export function LoadingState() {
  return (
    <div className="dashboard-shell">
      <div className="dashboard-skeleton h-24 rounded-2xl" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="dashboard-skeleton h-32 rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="dashboard-skeleton h-80 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
