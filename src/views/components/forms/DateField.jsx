import { useEffect, useId, useRef, useState } from "react";
import {
  DATE_PICKER_MONTHS_SHORT,
  DATE_PICKER_WEEKDAYS,
  formatDateDisplay,
  getDatePickerCells,
  getTodayIso,
  getViewMonthFromValue,
  getYearGrid,
  monthLabel,
  parseIsoDate,
  shiftMonth,
  shiftYear,
  toIsoDate,
  toIsoMonth,
  yearGridLabel,
} from "../../../models/datePickerModel.js";
import { SELECT_TRIGGER_CLASS, SELECT_TRIGGER_ERROR_CLASS } from "../../../models/formLayoutModel.js";

function CalendarIcon() {
  return (
    <svg
      className="fill-gray-500"
      width="18"
      height="18"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M6.66683 1.54199C7.08104 1.54199 7.41683 1.87778 7.41683 2.29199V3.00033H12.5835V2.29199C12.5835 1.87778 12.9193 1.54199 13.3335 1.54199C13.7477 1.54199 14.0835 1.87778 14.0835 2.29199V3.00033L15.4168 3.00033C16.5214 3.00033 17.4168 3.89576 17.4168 5.00033V7.50033V15.8337C17.4168 16.9382 16.5214 17.8337 15.4168 17.8337H4.5835C3.47893 17.8337 2.5835 16.9382 2.5835 15.8337V7.50033V5.00033C2.5835 3.89576 3.47893 3.00033 4.5835 3.00033L5.91683 3.00033V2.29199C5.91683 1.87778 6.25262 1.54199 6.66683 1.54199ZM6.66683 4.50033H4.5835C4.30735 4.50033 4.0835 4.72418 4.0835 5.00033V6.75033H15.9168V5.00033C15.9168 4.72418 15.693 4.50033 15.4168 4.50033H13.3335H6.66683ZM15.9168 8.25033H4.0835V15.8337C4.0835 16.1098 4.30735 16.3337 4.5835 16.3337H15.4168C15.693 16.3337 15.9168 16.1098 15.9168 15.8337V8.25033Z"
      />
    </svg>
  );
}

function NavChevron({ direction, double = false }) {
  return (
    <svg
      className="stroke-current"
      width={double ? 18 : 20}
      height={double ? 18 : 20}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {direction === "prev" ? (
        double ? (
          <path
            d="M11 6L5 12.25L11 18.5M18.5 6L12.5 12.25L18.5 18.5"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : (
          <path
            d="M15.25 6L9 12.25L15.25 18.5"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )
      ) : double ? (
        <path
          d="M13 19L19 12.75L13 6.5M5.5 19L11.5 12.75L5.5 6.5"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : (
        <path
          d="M8.75 19L15 12.75L8.75 6.5"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}

const NAV_BTN =
  "inline-flex h-7 w-7 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-gray-50 hover:text-brand-500";

function DateField({
  type = "date",
  value = "",
  onChange,
  className = "",
  ariaLabel,
  title,
  disabled = false,
  hasError = false,
  placeholder,
  showClear = true,
}) {
  const isMonth = type === "month";
  const [open, setOpen] = useState(false);
  const [panel, setPanel] = useState("day");
  const [view, setView] = useState(() => getViewMonthFromValue(value));
  const rootRef = useRef(null);
  const panelId = useId();
  const todayIso = getTodayIso();
  const todayYear = new Date().getFullYear();
  const display = formatDateDisplay(value);
  const emptyLabel =
    placeholder || (isMonth ? "Select month" : "Select date");
  const yearOptions = getYearGrid(view.year);

  useEffect(() => {
    if (!open) return undefined;
    setView(getViewMonthFromValue(value));
    setPanel(isMonth ? "month" : "day");
  }, [open, value, isMonth]);

  useEffect(() => {
    if (!open) return undefined;

    function handlePointerDown(event) {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key !== "Escape") return;
      setPanel((current) => {
        if (current === "year" && !isMonth) return "day";
        if (current === "year" && isMonth) return "month";
        setOpen(false);
        return current;
      });
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, isMonth]);

  function selectDate(iso) {
    onChange?.(iso);
    setOpen(false);
  }

  function selectMonth(year, monthIndex) {
    onChange?.(toIsoMonth(year, monthIndex));
    setOpen(false);
  }

  function goToday() {
    if (isMonth) {
      const now = new Date();
      selectMonth(now.getFullYear(), now.getMonth());
      return;
    }
    selectDate(todayIso);
  }

  function pickYear(year) {
    setView((current) => ({ ...current, year }));
    setPanel(isMonth ? "month" : "day");
  }

  const cells = getDatePickerCells(view.year, view.monthIndex);
  const headerTitle =
    panel === "year"
      ? yearGridLabel(yearOptions)
      : isMonth || panel === "month"
        ? String(view.year)
        : monthLabel(view.year, view.monthIndex);

  return (
    <div ref={rootRef} className={`relative min-w-0 w-full ${className}`}>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={ariaLabel}
        title={title}
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        className={hasError ? SELECT_TRIGGER_ERROR_CLASS : SELECT_TRIGGER_CLASS}
      >
        <span className="flex min-w-0 items-center gap-2">
          <CalendarIcon />
          <span
            className={`min-w-0 truncate ${
              display ? "text-gray-800" : "text-gray-400"
            }`}
          >
            {display || emptyLabel}
          </span>
        </span>
      </button>

      {open ? (
        <div
          id={panelId}
          role="dialog"
          aria-label={ariaLabel || "Choose date"}
          className="absolute left-0 z-50 mt-1 w-[min(16rem,calc(100vw-2rem))] rounded-xl border border-gray-200 bg-white p-3 shadow-theme-lg"
        >
          <div className="mb-2.5 flex items-center justify-between gap-1">
            <div className="flex items-center gap-0.5">
              {panel !== "year" && !isMonth ? (
                <button
                  type="button"
                  onClick={() =>
                    setView((current) =>
                      shiftYear(current.year, current.monthIndex, -1),
                    )
                  }
                  className={NAV_BTN}
                  aria-label="Previous year"
                  title="Previous year"
                >
                  <NavChevron direction="prev" double />
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => {
                  if (panel === "year") {
                    setView((current) =>
                      shiftYear(current.year, current.monthIndex, -12),
                    );
                    return;
                  }
                  if (isMonth) {
                    setView((current) =>
                      shiftYear(current.year, current.monthIndex, -1),
                    );
                    return;
                  }
                  setView((current) =>
                    shiftMonth(current.year, current.monthIndex, -1),
                  );
                }}
                className={NAV_BTN}
                aria-label={
                  panel === "year"
                    ? "Previous years"
                    : isMonth
                      ? "Previous year"
                      : "Previous month"
                }
              >
                <NavChevron direction="prev" />
              </button>
            </div>

            <button
              type="button"
              onClick={() =>
                setPanel((current) => (current === "year" ? (isMonth ? "month" : "day") : "year"))
              }
              className="rounded-md px-1.5 py-0.5 text-sm font-medium text-gray-800 transition-colors hover:bg-gray-50 hover:text-brand-500"
              title="Change year"
            >
              {headerTitle}
            </button>

            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => {
                  if (panel === "year") {
                    setView((current) =>
                      shiftYear(current.year, current.monthIndex, 12),
                    );
                    return;
                  }
                  if (isMonth) {
                    setView((current) =>
                      shiftYear(current.year, current.monthIndex, 1),
                    );
                    return;
                  }
                  setView((current) =>
                    shiftMonth(current.year, current.monthIndex, 1),
                  );
                }}
                className={NAV_BTN}
                aria-label={
                  panel === "year"
                    ? "Next years"
                    : isMonth
                      ? "Next year"
                      : "Next month"
                }
              >
                <NavChevron direction="next" />
              </button>
              {panel !== "year" && !isMonth ? (
                <button
                  type="button"
                  onClick={() =>
                    setView((current) =>
                      shiftYear(current.year, current.monthIndex, 1),
                    )
                  }
                  className={NAV_BTN}
                  aria-label="Next year"
                  title="Next year"
                >
                  <NavChevron direction="next" double />
                </button>
              ) : null}
            </div>
          </div>

          {panel === "year" ? (
            <div className="grid grid-cols-3 gap-1.5">
              {yearOptions.map((year) => {
                const selected = parseIsoDate(value)?.year === year;
                const isCurrent = year === todayYear;
                let yearClass = "text-gray-800 hover:bg-gray-50";
                if (isCurrent && !selected) {
                  yearClass =
                    "bg-brand-50 font-semibold text-brand-600 hover:bg-brand-50";
                }
                if (selected) {
                  yearClass =
                    "bg-brand-500 font-medium text-white hover:bg-brand-500 hover:text-white";
                }
                return (
                  <button
                    key={year}
                    type="button"
                    onClick={() => pickYear(year)}
                    className={`rounded-md px-1.5 py-2 text-theme-xs font-medium transition-colors ${yearClass}`}
                  >
                    {year}
                  </button>
                );
              })}
            </div>
          ) : isMonth ? (
            <div className="grid grid-cols-3 gap-1.5">
              {DATE_PICKER_MONTHS_SHORT.map((label, monthIndex) => {
                const iso = toIsoMonth(view.year, monthIndex);
                const active = value === iso;
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => selectMonth(view.year, monthIndex)}
                    className={`rounded-md px-1.5 py-2 text-theme-xs font-medium transition-colors ${
                      active
                        ? "bg-brand-500 text-white"
                        : "text-gray-800 hover:bg-gray-50"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          ) : (
            <>
              <div className="mb-1 grid grid-cols-7 text-center">
                {DATE_PICKER_WEEKDAYS.map((label) => (
                  <div
                    key={label}
                    className="py-0.5 text-[11px] font-medium text-gray-500"
                  >
                    {label}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-y-0.5 text-center">
                {cells.map((cell) => {
                  const selected = value === cell.iso;
                  const isToday = cell.iso === todayIso;
                  let dayClass =
                    "text-gray-800 hover:bg-gray-50 hover:text-gray-800";
                  if (cell.outside) {
                    dayClass = "text-gray-400 hover:bg-gray-50";
                  }
                  if (isToday && !selected) {
                    dayClass =
                      "bg-brand-50 font-semibold text-brand-600 hover:bg-brand-50";
                  }
                  if (selected) {
                    dayClass =
                      "bg-brand-500 font-medium text-white hover:bg-brand-500 hover:text-white";
                  }

                  return (
                    <button
                      key={cell.key}
                      type="button"
                      onClick={() => {
                        const parsed = parseIsoDate(cell.iso);
                        if (!parsed) return;
                        if (cell.outside) {
                          setView({
                            year: parsed.year,
                            monthIndex: parsed.monthIndex,
                          });
                        }
                        selectDate(
                          toIsoDate(
                            parsed.year,
                            parsed.monthIndex,
                            parsed.day,
                          ),
                        );
                      }}
                      className={`mx-auto flex h-7 w-7 items-center justify-center rounded-full text-theme-xs font-medium transition-colors ${dayClass}`}
                    >
                      {cell.day}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-gray-100 pt-2.5">
            <button
              type="button"
              onClick={goToday}
              className="rounded-md px-2 py-1 text-theme-xs font-medium text-brand-500 hover:bg-brand-50"
            >
              Today
            </button>
            {showClear && value ? (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onChange?.("");
                  setOpen(false);
                }}
                className="rounded-md px-2 py-1 text-theme-xs font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-700"
              >
                Clear
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default DateField;
