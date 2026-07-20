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
  onPrev,
  onNext,
}) {
  const cells = buildMonthCells(year, monthIndex);
  const byDate = holidaysByDate(holidays);
  const today = new Date();
  const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  return (
    <div
      id="holiday-month-calendar"
      className="flex h-full min-h-0 flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-xs"
    >
      <div className="mb-2 flex shrink-0 items-center justify-between gap-2">
        <button
          type="button"
          onClick={onPrev}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-base text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800"
          aria-label="Previous month"
        >
          ‹
        </button>
        <h3 className="text-sm font-semibold text-gray-800">{monthLabel}</h3>
        <button
          type="button"
          onClick={onNext}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-base text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800"
          aria-label="Next month"
        >
          ›
        </button>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-7 content-start text-center">
        {WEEKDAY_LABELS.map((label) => (
          <div
            key={label}
            className="pb-1 text-[11px] font-medium text-gray-400"
          >
            {label}
          </div>
        ))}

        {cells.map((cell) => {
          const dayHolidays = cell.iso ? byDate.get(cell.iso) || [] : [];
          const primary = !cell.outside ? dayHolidays[0] : null;
          const isToday = cell.iso === todayIso && !cell.outside;

          let dayClass = "text-gray-700";
          if (cell.outside) {
            dayClass = "text-gray-300";
          } else if (primary) {
            dayClass = primary.typeDayClass;
          } else if (isToday) {
            dayClass = "bg-brand-50 font-semibold text-brand-600";
          } else {
            dayClass = "text-gray-700 hover:bg-gray-50";
          }

          return (
            <div
              key={cell.key}
              className="flex flex-col items-center justify-start py-0.5"
              title={
                !cell.outside && dayHolidays.length
                  ? dayHolidays.map((item) => item.name).join(", ")
                  : undefined
              }
            >
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium transition-colors ${dayClass}`}
              >
                {cell.day}
              </div>
              {!cell.outside && dayHolidays.length > 0 ? (
                <div className="mt-0.5 flex h-1.5 items-center justify-center gap-0.5">
                  {dayHolidays.slice(0, 3).map((item) => (
                    <span
                      key={item.id}
                      className={`h-1.5 w-1.5 rounded-full ${item.typeDotClass || "bg-gray-400"}`}
                    />
                  ))}
                </div>
              ) : (
                <div className="h-1.5" />
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-2 grid shrink-0 grid-cols-2 gap-x-3 gap-y-1.5 border-t border-gray-100 pt-2.5">
        {HOLIDAY_TYPES.map((type) => (
          <div key={type} className="flex min-w-0 items-center gap-1.5">
            <span
              className={`h-2 w-2 shrink-0 rounded-[2px] ${HOLIDAY_TYPE_DOT[type]}`}
            />
            <span className="truncate text-[11px] text-gray-600">{type}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default HolidayMonthCalendar;
