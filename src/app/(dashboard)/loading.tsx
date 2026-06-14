// Shared Suspense fallback for every page in the (dashboard) group.
// Because dashboard pages are server components that query a remote database,
// navigation would otherwise show a blank/frozen screen until all queries
// resolve. This skeleton renders instantly on every click so the app feels
// responsive while the real content streams in.
export default function DashboardLoading() {
  return (
    <div className="p-6 md:p-8" aria-busy="true" aria-label="Loading">
      {/* Page header */}
      <div className="mb-8 space-y-3">
        <div className="shimmer h-7 w-64 rounded-lg" />
        <div className="shimmer h-4 w-96 max-w-full rounded-md" />
      </div>

      {/* Stat cards row */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="surface-panel p-5">
            <div className="shimmer mb-3 h-4 w-24 rounded-md" />
            <div className="shimmer h-8 w-16 rounded-md" />
          </div>
        ))}
      </div>

      {/* Content blocks */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="surface-panel p-6 lg:col-span-2">
          <div className="shimmer mb-5 h-5 w-40 rounded-md" />
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="shimmer h-12 w-full rounded-lg" />
            ))}
          </div>
        </div>
        <div className="surface-panel p-6">
          <div className="shimmer mb-5 h-5 w-32 rounded-md" />
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="shimmer h-16 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
