import { STATUS_TONE, getStatusClass } from "./statusStylesModel.js";

export const HOLIDAY_TYPES = [
  "National Holiday",
  "Company Holiday",
  "Optional Holiday",
  "Company Event",
  "Festival Holiday",
];

export const HOLIDAY_TYPE_DOT = {
  "National Holiday": "bg-error-500",
  "Company Holiday": "bg-success-500",
  "Optional Holiday": "bg-warning-500",
  "Company Event": "bg-blue-light-500",
  "Festival Holiday": "bg-theme-purple-500",
};

const HOLIDAY_TYPE_STATUS = {
  "National Holiday": STATUS_TONE.error,
  "Company Holiday": STATUS_TONE.success,
  "Optional Holiday": STATUS_TONE.warning,
  "Company Event": STATUS_TONE.info,
  "Festival Holiday": "bg-[#f4f3ff] text-[#6941c6]",
};

/** Soft circle fill for calendar day badges (matches holiday calendar mockup). */
export const HOLIDAY_TYPE_DAY = {
  "National Holiday": "bg-error-100 text-error-700",
  "Company Holiday": "bg-success-100 text-success-700",
  "Optional Holiday": "bg-warning-100 text-warning-700",
  "Company Event": "bg-blue-light-100 text-blue-light-700",
  "Festival Holiday": "bg-[#f4f3ff] text-[#6941c6]",
};

export const EMPTY_HOLIDAY_FORM = {
  name: "",
  date: "",
  type: "National Holiday",
  description: "",
};

const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const MONTH_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export function formatHolidayDate(isoDate) {
  if (!isoDate || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return isoDate || "";
  const [, month, day] = isoDate.split("-");
  return `${day}-${MONTH_SHORT[Number(month) - 1]}-${isoDate.slice(0, 4)}`;
}

export function weekdayName(isoDate) {
  if (!isoDate || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return "";
  const [y, m, d] = isoDate.split("-").map(Number);
  return WEEKDAYS[new Date(y, m - 1, d).getDay()];
}

export function shortHolidayType(type) {
  const value = String(type || "");
  if (value === "Company Event") return "Event";
  return value.replace(/ Holiday$/, "");
}

export function mapHoliday(holiday) {
  const date = holiday.date || "";
  const month = date.length >= 7 ? String(Number(date.slice(5, 7))) : "";
  return {
    ...holiday,
    status: shortHolidayType(holiday.type),
    dateLabel: formatHolidayDate(date),
    day: weekdayName(date),
    month,
    statusClass: getStatusClass(
      HOLIDAY_TYPE_STATUS,
      holiday.type,
      "Company Holiday",
    ),
    typeDotClass: HOLIDAY_TYPE_DOT[holiday.type] || "bg-gray-400",
    typeDayClass:
      HOLIDAY_TYPE_DAY[holiday.type] || "bg-brand-500 text-white",
  };
}

export function toHolidayFormValues(holiday) {
  if (!holiday) return { ...EMPTY_HOLIDAY_FORM };
  return {
    name: holiday.name || "",
    date: holiday.date || "",
    type: holiday.type || "National Holiday",
    description: holiday.description || "",
  };
}

export function toHolidayPayload(form) {
  return {
    name: String(form.name ?? "").trim(),
    date: String(form.date ?? "").trim(),
    type: String(form.type ?? "").trim(),
    description: String(form.description ?? "").trim(),
  };
}

export function validateHolidayForm(form) {
  const fieldErrors = {};
  const name = String(form?.name ?? "").trim();
  const date = String(form?.date ?? "").trim();
  const type = String(form?.type ?? "").trim();

  if (!name) fieldErrors.name = "Holiday name is required";
  else if (name.length < 2)
    fieldErrors.name = "Holiday name must be at least 2 characters";

  if (!date) fieldErrors.date = "Date is required";
  else if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    fieldErrors.date = "Enter a valid date";
  }

  if (!type) fieldErrors.type = "Holiday type is required";
  else if (!HOLIDAY_TYPES.includes(type)) {
    fieldErrors.type = "Select a valid holiday type";
  }

  const keys = Object.keys(fieldErrors);
  if (keys.length === 0) return { ok: true, fieldErrors: {} };

  return {
    ok: false,
    fieldErrors,
    message: "Please fix the highlighted fields and try again.",
  };
}

/** Build month grid cells for a calendar month (Sun–Sat), including adjacent days. */
export function buildMonthCells(year, monthIndex) {
  const first = new Date(year, monthIndex, 1);
  const startPad = first.getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const prevMonthDays = new Date(year, monthIndex, 0).getDate();
  const cells = [];

  for (let i = 0; i < startPad; i += 1) {
    const day = prevMonthDays - startPad + 1 + i;
    const date = new Date(year, monthIndex - 1, day);
    const y = date.getFullYear();
    const m = date.getMonth() + 1;
    const iso = `${y}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    cells.push({ key: `prev-${iso}`, day, iso, outside: true });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const iso = `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    cells.push({ key: iso, day, iso, outside: false });
  }

  const trailing = (7 - (cells.length % 7)) % 7;
  for (let day = 1; day <= trailing; day += 1) {
    const date = new Date(year, monthIndex + 1, day);
    const y = date.getFullYear();
    const m = date.getMonth() + 1;
    const iso = `${y}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    cells.push({ key: `next-${iso}`, day, iso, outside: true });
  }

  return cells;
}

export function holidaysByDate(holidays) {
  const map = new Map();
  for (const holiday of holidays || []) {
    if (!holiday.date) continue;
    const list = map.get(holiday.date) || [];
    list.push(holiday);
    map.set(holiday.date, list);
  }
  return map;
}

export function getUpcomingHolidays(holidays, limit) {
  const today = new Date();
  const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const filtered = (holidays || []).filter(
    (holiday) => holiday.date >= todayIso,
  );

  if (limit == null) return filtered;
  return filtered.slice(0, limit);
}

export const MONTH_FILTER_OPTIONS = MONTH_SHORT.map((label, index) => ({
  value: String(index + 1),
  label,
}));
