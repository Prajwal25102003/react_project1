import { buildMonthCells } from "./holidaysModel.js";

export const DATE_PICKER_WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export const DATE_PICKER_MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export const DATE_PICKER_MONTHS_SHORT = [
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

/** @returns {{ year: number, monthIndex: number, day: number } | null} */
export function parseIsoDate(value) {
  if (!value || typeof value !== "string") return null;
  const match = /^(\d{4})-(\d{2})(?:-(\d{2}))?$/.exec(value.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  const day = match[3] ? Number(match[3]) : 1;
  if (
    Number.isNaN(year) ||
    monthIndex < 0 ||
    monthIndex > 11 ||
    day < 1 ||
    day > 31
  ) {
    return null;
  }
  return { year, monthIndex, day };
}

export function toIsoDate(year, monthIndex, day) {
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function toIsoMonth(year, monthIndex) {
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
}

export function getTodayIso() {
  const now = new Date();
  return toIsoDate(now.getFullYear(), now.getMonth(), now.getDate());
}

export function formatDateDisplay(value) {
  const parsed = parseIsoDate(value);
  if (!parsed) return "";
  if (/^\d{4}-\d{2}$/.test(String(value).trim())) {
    return `${DATE_PICKER_MONTHS_SHORT[parsed.monthIndex]} ${parsed.year}`;
  }
  return `${parsed.day} ${DATE_PICKER_MONTHS_SHORT[parsed.monthIndex]} ${parsed.year}`;
}

export function getViewMonthFromValue(value) {
  const parsed = parseIsoDate(value);
  if (parsed) {
    return { year: parsed.year, monthIndex: parsed.monthIndex };
  }
  const now = new Date();
  return { year: now.getFullYear(), monthIndex: now.getMonth() };
}

export function shiftMonth(year, monthIndex, delta) {
  const date = new Date(year, monthIndex + delta, 1);
  return { year: date.getFullYear(), monthIndex: date.getMonth() };
}

export function shiftYear(year, monthIndex, delta) {
  return { year: year + delta, monthIndex };
}

/** 12-year window centered on a decade start (e.g. 2020 → 2016–2027). */
export function getYearGrid(anchorYear) {
  const start = Math.floor(anchorYear / 12) * 12;
  return Array.from({ length: 12 }, (_, index) => start + index);
}

export function yearGridLabel(years) {
  if (!years?.length) return "";
  return `${years[0]} – ${years[years.length - 1]}`;
}

export function getDatePickerCells(year, monthIndex) {
  return buildMonthCells(year, monthIndex);
}

export function monthLabel(year, monthIndex) {
  return `${DATE_PICKER_MONTHS[monthIndex]} ${year}`;
}
