function OverviewPanel({
  title,
  description,
  items,
  emptyMessage,
  compact = false,
}) {
  return (
    <div
      className={
        compact
          ? "flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-2 pt-3 sm:px-5"
          : "rounded-2xl border border-gray-200 bg-white p-5 sm:p-6"
      }
    >
      <div className={compact ? "mb-2 shrink-0" : undefined}>
        <h3
          className={
            compact
              ? "text-base font-semibold text-gray-800"
              : "text-lg font-semibold text-gray-800"
          }
        >
          {title}
        </h3>
        <p className="mt-1 text-theme-sm text-gray-500">{description}</p>
      </div>

      {items.length === 0 ? (
        <p className="text-theme-sm text-gray-500">{emptyMessage}</p>
      ) : (
        <div
          className={
            compact
              ? "min-h-0 flex-1 space-y-3 overflow-y-auto"
              : "space-y-5"
          }
        >
          {items.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-theme-xs font-semibold text-brand-500">
                  {item.name.slice(0, 1)}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-theme-sm font-semibold text-gray-800">
                    {item.name}
                  </p>
                  <span className="block text-theme-xs text-gray-500">
                    {item.employees}
                  </span>
                </div>
              </div>

              <div className="flex w-full max-w-[120px] shrink-0 items-center gap-2">
                <div className="relative block h-2 w-full max-w-[80px] rounded-sm bg-gray-200">
                  <div
                    className="absolute left-0 top-0 h-full rounded-sm bg-brand-500"
                    style={{ width: `${item.percent}%` }}
                  />
                </div>
                <p className="text-theme-xs font-medium text-gray-800">
                  {item.percent}%
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DepartmentOverview({ departments, compact = false }) {
  return (
    <OverviewPanel
      title="Departments"
      description="Headcount by department"
      items={departments}
      emptyMessage="No departments to show."
      compact={compact}
    />
  );
}

export default DepartmentOverview;
