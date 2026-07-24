import {
  buildMonthCells,
  HOLIDAY_TYPE_DOT,
  HOLIDAY_TYPES,
  holidaysByDate,
} from "../../models/holidaysModel.js";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function HolidayMonthCalendar({
  year,
  monthIndex,
  monthLabel,
  holidays,
  selectedDate = null,
  onSelectDate,
  onPrev,
  onNext,
}) {
  const cells = buildMonthCells(year, monthIndex);
  const byDate = holidaysByDate(holidays);
  const weekCount = Math.max(1, Math.ceil(cells.length / 7));
  const today = new Date();
  const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  function handleDayClick(iso) {
    if (!iso || !onSelectDate) return;
    onSelectDate(selectedDate === iso ? null : iso);
  }

  return (
    <div
      id="holiday-month-calendar"
      className="relative flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white p-2.5 shadow-theme-xs sm:p-3"
    >
      <div className="mb-2 flex shrink-0 items-center justify-between gap-1">
        <button
          type="button"
          onClick={() => {
            onSelectDate?.(null);
            onPrev?.();
          }}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-base text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800"
          aria-label="Previous month"
        >
          ‹
        </button>
        <h3 className="min-w-0 truncate text-center text-sm font-semibold text-gray-800">
          {monthLabel}
        </h3>
        <button
          type="button"
          onClick={() => {
            onSelectDate?.(null);
            onNext?.();
          }}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-base text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800"
          aria-label="Next month"
        >
          ›
        </button>
      </div>

      <div
        className="grid min-h-0 w-full min-w-0 flex-1 grid-cols-7 text-center"
        style={{
          gridTemplateRows: `auto repeat(${weekCount}, minmax(0, 1fr))`,
        }}
      >
        {WEEKDAY_LABELS.map((label) => (
          <div
            key={label}
            className="min-w-0 pb-1 text-[10px] font-medium text-gray-400 sm:text-[11px]"
          >
            {label}
          </div>
        ))}

        {cells.map((cell) => {
          const dayHolidays = cell.iso ? byDate.get(cell.iso) || [] : [];
          const primary = !cell.outside ? dayHolidays[0] : null;
          const isToday = cell.iso === todayIso && !cell.outside;
          const isSelected = !cell.outside && selectedDate === cell.iso;
          const hasHoliday = !cell.outside && dayHolidays.length > 0;

          let dayClass = "text-gray-700";
          if (cell.outside) {
            dayClass = "text-gray-300";
          } else if (primary) {
            dayClass = `${primary.typeDayClass}${isSelected ? " ring-2 ring-offset-1 ring-brand-500/35" : ""}`;
          } else if (isSelected) {
            dayClass =
              "bg-brand-50 font-semibold text-brand-600 ring-2 ring-offset-1 ring-brand-500/35";
          } else if (isToday) {
            dayClass = "bg-brand-50 font-semibold text-brand-600";
          } else {
            dayClass = "text-gray-700 hover:bg-gray-50";
          }

          const dayNumberClass = `mx-auto flex aspect-square w-[min(2rem,100%)] max-w-8 items-center justify-center rounded-full text-[11px] font-medium transition-colors sm:text-xs ${dayClass}`;

          if (cell.outside) {
            return (
              <div
                key={cell.key}
                className="flex min-h-0 min-w-0 flex-col items-center justify-center px-0.5"
              >
                <div className={dayNumberClass}>{cell.day}</div>
                <div className="mt-0.5 h-2.5" aria-hidden="true" />
              </div>
            );
          }

          const holidayNames = dayHolidays.map((item) => item.name).join(", ");
          const ariaLabel = hasHoliday
            ? `${holidayNames}. Show in holiday list`
            : `${cell.day}. No holidays on this date`;

          return (
            <div
              key={cell.key}
              className="flex min-h-0 min-w-0 flex-col items-center justify-center px-0.5"
            >
              <button
                type="button"
                onClick={() => handleDayClick(cell.iso)}
                className="flex w-full min-w-0 flex-col items-center rounded-lg focus:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-500/40"
                aria-pressed={isSelected}
                aria-label={ariaLabel}
              >
                <span className={dayNumberClass}>{cell.day}</span>
                <span className="mt-0.5 flex h-2.5 items-center justify-center gap-0.5">
                  {hasHoliday
                    ? dayHolidays.slice(0, 3).map((item) => (
                        <span
                          key={item.id}
                          className={`h-1.5 w-1.5 rounded-full ${item.typeDotClass || "bg-gray-400"}`}
                        />
                      ))
                    : null}
                </span>
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-2 flex shrink-0 flex-wrap gap-x-3 gap-y-1.5 border-t border-gray-100 pt-2.5">
        {HOLIDAY_TYPES.map((type) => (
          <div key={type} className="flex min-w-0 items-center gap-1.5">
            <span
              className={`h-2 w-2 shrink-0 rounded-[2px] ${HOLIDAY_TYPE_DOT[type]}`}
            />
            <span className="text-[10px] text-gray-600 sm:text-[11px]">
              {type}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default HolidayMonthCalendar;
