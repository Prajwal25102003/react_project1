import { useNavigate } from "react-router-dom";
import StatusPill from "../components/StatusPill.jsx";

/** Visible rows before the rest scroll (invisible scrollbar). */
const VISIBLE_ACTIVITY_ROWS = 5;

function ActivityCard({ activity, onClick }) {
  const isClickable = Boolean(onClick);

  return (
    <article
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onClick={isClickable ? () => onClick?.(activity) : undefined}
      onKeyDown={
        isClickable
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick?.(activity);
              }
            }
          : undefined
      }
      className={`${
        activity.isNew
          ? "rounded-xl border border-brand-100 bg-brand-50/70 px-3.5 py-3"
          : "rounded-xl border border-gray-100 bg-white px-3.5 py-3"
      } ${isClickable ? "cursor-pointer transition hover:border-brand-200 hover:shadow-sm" : ""}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-theme-sm font-medium text-gray-800">
              {activity.title}
            </p>
            {activity.isNew ? (
              <span className="shrink-0 rounded-full bg-brand-500 px-2 py-0.5 text-theme-xs font-medium uppercase tracking-wide text-white">
                New
              </span>
            ) : null}
          </div>
          {activity.description ? (
            <p
              className="mt-1 line-clamp-2 text-theme-xs leading-snug text-gray-500"
              title={activity.description}
            >
              {activity.description}
            </p>
          ) : null}
        </div>
        <StatusPill label={activity.status} statusClass={activity.statusClass} />
      </div>

      <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-theme-xs text-gray-400">
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
  onActivityClick,
  onMarkAllAsRead,
}) {
  const navigate = useNavigate();
  const needsScroll = activities.length > VISIBLE_ACTIVITY_ROWS;
  // Compact rows: title + clamped description
  const scrollMaxClass = compact ? "max-h-[18rem]" : "max-h-[22rem]";
  const cardScrollMaxClass = compact ? "max-h-[22rem]" : "max-h-[26rem]";
  const hasUnread = (activities || []).some((activity) => activity.isNew);
  const showMarkAsRead = Boolean(onMarkAllAsRead) && hasUnread;

  function handleActivityClick(activity) {
    if (onActivityClick) {
      onActivityClick(activity);
      return;
    }
    if (activity.href) {
      navigate(activity.href);
    }
  }

  const isRowInteractive = (activity) =>
    Boolean(onActivityClick) || Boolean(activity.href);

  return (
    <div
      className={
        compact
          ? "flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-2 pt-3 sm:px-5"
          : "flex min-h-0 min-w-0 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 sm:px-6"
      }
    >
      <div
        className={
          compact
            ? "mb-2 flex shrink-0 flex-wrap items-center justify-between gap-2"
            : "mb-4 flex shrink-0 flex-wrap items-center justify-between gap-2"
        }
      >
        <h3
          className={
            compact
              ? "text-base font-semibold text-gray-800"
              : "text-lg font-semibold text-gray-800"
          }
        >
          {title}
        </h3>
        {showMarkAsRead ? (
          <button
            type="button"
            onClick={onMarkAllAsRead}
            className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800"
          >
            Mark as read
          </button>
        ) : null}
      </div>

      {activities.length === 0 ? (
        <p className="py-6 text-theme-sm text-gray-500">No recent activity.</p>
      ) : (
        <>
          <div
            className={`space-y-2 md:hidden ${
              needsScroll
                ? `no-scrollbar overflow-y-auto ${cardScrollMaxClass}`
                : ""
            }`}
          >
            {activities.map((activity) => (
              <ActivityCard
                key={activity.id}
                activity={activity}
                onClick={
                  isRowInteractive(activity) ? handleActivityClick : undefined
                }
              />
            ))}
          </div>

          <div
            className={`hidden md:block ${
              needsScroll
                ? `no-scrollbar overflow-y-auto ${scrollMaxClass}`
                : "w-full overflow-x-auto"
            }`}
          >
            <table className="min-w-full table-fixed">
              <thead className="sticky top-0 z-10 bg-white">
                <tr className="border-y border-gray-100">
                  <th
                    className={`${compact ? "py-2.5" : "py-3.5"} w-[42%] text-left`}
                  >
                    <p className="text-theme-sm font-medium text-gray-500">
                      Activity
                    </p>
                  </th>
                  <th
                    className={`${compact ? "py-2.5" : "py-3.5"} w-[18%] text-left`}
                  >
                    <p className="text-theme-sm font-medium text-gray-500">
                      Category
                    </p>
                  </th>
                  <th
                    className={`${compact ? "py-2.5" : "py-3.5"} w-[20%] text-left`}
                  >
                    <p className="text-theme-sm font-medium text-gray-500">
                      Time
                    </p>
                  </th>
                  <th
                    className={`${compact ? "py-2.5" : "py-3.5"} w-[20%] text-left`}
                  >
                    <p className="text-theme-sm font-medium text-gray-500">
                      Status
                    </p>
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {activities.map((activity) => {
                  const isClickable = isRowInteractive(activity);
                  return (
                    <tr
                      key={activity.id}
                      role={isClickable ? "button" : undefined}
                      tabIndex={isClickable ? 0 : undefined}
                      onClick={
                        isClickable
                          ? () => handleActivityClick(activity)
                          : undefined
                      }
                      onKeyDown={
                        isClickable
                          ? (e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                handleActivityClick(activity);
                              }
                            }
                          : undefined
                      }
                      className={`${activity.isNew ? "bg-brand-50/70" : ""} ${
                        isClickable
                          ? "cursor-pointer transition hover:bg-gray-50"
                          : ""
                      }`}
                    >
                      <td className={compact ? "py-2.5 pr-3" : "py-3.5 pr-4"}>
                        <div className="flex items-start gap-2">
                          <div className="min-w-0">
                            <p
                              className={`truncate text-theme-sm font-medium ${
                                activity.direction === "sent"
                                  ? "text-brand-500"
                                  : activity.direction === "received"
                                    ? "text-gray-800"
                                    : "text-gray-800"
                              }`}
                            >
                              {activity.title}
                            </p>
                            {activity.description ? (
                              <span
                                className="mt-0.5 line-clamp-2 text-theme-xs leading-snug text-gray-500"
                                title={activity.description}
                              >
                                {activity.description}
                              </span>
                            ) : null}
                          </div>
                          {activity.isNew ? (
                            <span className="shrink-0 rounded-full bg-brand-500 px-2 py-0.5 text-theme-xs font-medium uppercase tracking-wide text-white">
                              New
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className={compact ? "py-2.5 pr-2" : "py-3.5 pr-2"}>
                        <p className="truncate text-theme-sm text-gray-500">
                          {activity.category}
                        </p>
                      </td>
                      <td className={compact ? "py-2.5 pr-2" : "py-3.5 pr-2"}>
                        <p className="whitespace-nowrap text-theme-sm text-gray-500">
                          {activity.time}
                        </p>
                      </td>
                      <td className={compact ? "py-2.5" : "py-3.5"}>
                        <StatusPill
                          label={activity.status}
                          statusClass={activity.statusClass}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

export default RecentActivitiesTable;
