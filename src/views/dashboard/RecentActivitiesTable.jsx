import StatusPill from "../components/StatusPill.jsx";

function ActivityCard({ activity }) {
  return (
    <article
      className={
        activity.isNew
          ? "rounded-xl border border-brand-100 bg-brand-50/70 p-3"
          : "rounded-xl border border-gray-100 bg-white p-3"
      }
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-theme-sm font-medium text-gray-800">
              {activity.title}
            </p>
            {activity.isNew ? (
              <span className="shrink-0 rounded-full bg-brand-500 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white">
                New
              </span>
            ) : null}
          </div>
          <p className="mt-0.5 break-words text-theme-xs text-gray-500">
            {activity.description}
          </p>
        </div>
        <StatusPill label={activity.status} statusClass={activity.statusClass} />
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-theme-xs text-gray-500">
        <span>{activity.category}</span>
        <span className="text-gray-300" aria-hidden="true">
          ·
        </span>
        <span>{activity.time}</span>
      </div>
    </article>
  );
}

function RecentActivitiesTable({
  activities,
  title = "Recent Activities",
  compact = false,
}) {
  return (
    <div
      className={
        compact
          ? "flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-2 pt-3 sm:px-5"
          : "min-w-0 overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 sm:px-6"
      }
    >
      <h3
        className={
          compact
            ? "mb-2 shrink-0 text-base font-semibold text-gray-800"
            : "mb-4 text-lg font-semibold text-gray-800"
        }
      >
        {title}
      </h3>

      {activities.length === 0 ? (
        <p className="py-6 text-theme-sm text-gray-500">No recent activity.</p>
      ) : (
        <>
          {/* Mobile: stacked cards — 4-col table overlaps at phone widths */}
          <div
            className={
              compact
                ? "min-h-0 flex-1 space-y-2 overflow-y-auto md:hidden"
                : "space-y-2 md:hidden"
            }
          >
            {activities.map((activity) => (
              <ActivityCard key={activity.id} activity={activity} />
            ))}
          </div>

          {/* Desktop / tablet: table */}
          <div
            className={
              compact
                ? "hidden min-h-0 flex-1 overflow-y-auto md:block"
                : "hidden w-full overflow-x-auto md:block"
            }
          >
            <table className="min-w-full table-fixed">
              <thead>
                <tr className="border-y border-gray-100">
                  <th
                    className={`${compact ? "py-2" : "py-3"} w-[42%] text-left`}
                  >
                    <p className="text-theme-xs font-medium text-gray-500">
                      Activity
                    </p>
                  </th>
                  <th
                    className={`${compact ? "py-2" : "py-3"} w-[18%] text-left`}
                  >
                    <p className="text-theme-xs font-medium text-gray-500">
                      Category
                    </p>
                  </th>
                  <th
                    className={`${compact ? "py-2" : "py-3"} w-[20%] text-left`}
                  >
                    <p className="text-theme-xs font-medium text-gray-500">
                      Time
                    </p>
                  </th>
                  <th
                    className={`${compact ? "py-2" : "py-3"} w-[20%] text-left`}
                  >
                    <p className="text-theme-xs font-medium text-gray-500">
                      Status
                    </p>
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {activities.map((activity) => (
                  <tr
                    key={activity.id}
                    className={activity.isNew ? "bg-brand-50/70" : undefined}
                  >
                    <td className={compact ? "py-2 pr-3" : "py-3 pr-4"}>
                      <div className="flex items-start gap-2">
                        <div className="min-w-0">
                          <p className="text-theme-sm font-medium text-gray-800">
                            {activity.title}
                          </p>
                          <span className="break-words text-theme-xs text-gray-500">
                            {activity.description}
                          </span>
                        </div>
                        {activity.isNew ? (
                          <span className="shrink-0 rounded-full bg-brand-500 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white">
                            New
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className={compact ? "py-2 pr-2" : "py-3 pr-2"}>
                      <p className="truncate text-theme-sm text-gray-500">
                        {activity.category}
                      </p>
                    </td>
                    <td className={compact ? "py-2 pr-2" : "py-3 pr-2"}>
                      <p className="whitespace-nowrap text-theme-sm text-gray-500">
                        {activity.time}
                      </p>
                    </td>
                    <td className={compact ? "py-2" : "py-3"}>
                      <StatusPill
                        label={activity.status}
                        statusClass={activity.statusClass}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

export default RecentActivitiesTable;
