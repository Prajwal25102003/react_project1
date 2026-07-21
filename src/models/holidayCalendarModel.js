import { validateHolidayForm } from "./holidaysModel.js";

export const CALENDAR_STATUS = {
  DRAFT: "draft",
  RELEASED: "released",
};

/** Last year available to release / fetch from the India holiday calendar. */
export const HOLIDAY_RELEASE_MAX_YEAR = 2030;

export const EMPTY_RELEASE_ROW = {
  name: "",
  date: "",
  type: "National Holiday",
  description: "",
};

function yearsThroughMax(currentYear, maxYear = HOLIDAY_RELEASE_MAX_YEAR) {
  const years = [];
  const end = Math.max(currentYear, maxYear);
  for (let year = currentYear; year <= end; year += 1) {
    years.push(year);
  }
  return years;
}

/** Years shown on the page: current year through 2030 (never previous years). */
export function buildYearOptions(currentYear, calendars = [], { canManage = false } = {}) {
  if (canManage) {
    const years = new Set(yearsThroughMax(currentYear));
    for (const calendar of calendars) {
      const y = Number(calendar?.year);
      if (
        Number.isFinite(y) &&
        y >= currentYear &&
        y <= HOLIDAY_RELEASE_MAX_YEAR
      ) {
        years.add(y);
      }
    }
    return [...years]
      .filter((year) => year >= currentYear && year <= HOLIDAY_RELEASE_MAX_YEAR)
      .sort((a, b) => a - b)
      .map((year) => ({ value: String(year), label: String(year) }));
  }

  // Employees / HR: only released years from the current year onward.
  const years = new Set();
  for (const calendar of calendars) {
    const y = Number(calendar?.year);
    if (
      Number.isFinite(y) &&
      y >= currentYear &&
      y <= HOLIDAY_RELEASE_MAX_YEAR &&
      calendar.status === CALENDAR_STATUS.RELEASED
    ) {
      years.add(y);
    }
  }
  if (years.size === 0) years.add(currentYear);

  return [...years]
    .sort((a, b) => a - b)
    .map((year) => ({ value: String(year), label: String(year) }));
}

/** Years available to release: current year through 2030, not already released. */
export function buildReleaseYearOptions(currentYear, calendars = []) {
  const released = new Set(
    (calendars || [])
      .filter((calendar) => calendar?.status === CALENDAR_STATUS.RELEASED)
      .map((calendar) => Number(calendar.year)),
  );

  return yearsThroughMax(currentYear)
    .filter((year) => !released.has(year))
    .map((year) => ({ value: String(year), label: String(year) }));
}

export function mapCalendar(calendar) {
  if (!calendar) return null;
  return {
    year: calendar.year,
    status: calendar.status || CALENDAR_STATUS.DRAFT,
    releasedAt: calendar.releasedAt || null,
    releasedBy: calendar.releasedBy || null,
    holidayCount: calendar.holidayCount ?? null,
  };
}

export function calendarStatusLabel(status) {
  if (status === CALENDAR_STATUS.RELEASED) return "Released";
  return "Not yet released";
}

export function calendarStatusClass(status) {
  if (status === CALENDAR_STATUS.RELEASED) {
    return "bg-success-50 text-success-700";
  }
  return "bg-warning-50 text-warning-700";
}

const HOLIDAY_CHANGE_TONE = {
  Added: "bg-success-50 text-success-700",
  Updated: "bg-blue-light-50 text-blue-light-700",
  Removed: "bg-error-50 text-error-700",
  Completed: "bg-brand-50 text-brand-500",
};

export const HOLIDAY_ACTION_FLASH_MS = 3000;
const HOLIDAY_CHANGE_CHIP_LIMIT = 3;

const SHORT_MONTHS = [
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

function formatHolidayChipDate(isoDate) {
  const match = String(isoDate || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return "";
  const month = SHORT_MONTHS[Number(match[2]) - 1];
  if (!month) return match[0];
  return `${month} ${Number(match[3])}`;
}

function extractQuotedName(text) {
  const match = String(text || "").match(/"([^"]+)"/);
  return match?.[1]?.trim() || "";
}

/** Build a short chip label: Added · Name · Jul 25 */
export function formatHolidayChangeChip(notification) {
  const status = String(notification?.status || "Updated");
  const description = String(notification?.description || "").trim();
  const title = String(notification?.title || "").trim();
  const actionLabel = status === "Removed" ? "Deleted" : status;

  if (status === "Completed") {
    const yearMatch = `${description} ${title}`.match(/\b(20\d{2})\b/);
    return yearMatch ? `Released · ${yearMatch[1]}` : "Calendar released";
  }

  // Prefer "Name · YYYY-MM-DD" descriptions; fall back to quoted legacy text.
  let name = "";
  let date = "";
  const simpleParts = description.split("·").map((part) => part.trim());
  if (simpleParts.length >= 2 && /^\d{4}-\d{2}-\d{2}$/.test(simpleParts[1])) {
    name = simpleParts[0];
    date = simpleParts[1];
  } else {
    name = extractQuotedName(description) || extractQuotedName(title);
    date = (description.match(/\d{4}-\d{2}-\d{2}/) || [])[0] || "";
  }

  const parts = [actionLabel];
  if (name) parts.push(name);
  const shortDate = formatHolidayChipDate(date);
  if (shortDate) parts.push(shortDate);
  return parts.join(" · ");
}

/** Short admin confirmation shown beside the Released badge. */
export function buildHolidayActionFlash(action, holidayName = "") {
  const name = String(holidayName || "").trim();

  switch (action) {
    case "Added":
      return {
        status: "Added",
        message: name ? `Added · ${name}` : "Holiday added",
        toneClass: HOLIDAY_CHANGE_TONE.Added,
      };
    case "Updated":
      return {
        status: "Updated",
        message: name ? `Updated · ${name}` : "Holiday updated",
        toneClass: HOLIDAY_CHANGE_TONE.Updated,
      };
    case "Removed":
      return {
        status: "Removed",
        message: name ? `Deleted · ${name}` : "Holiday deleted",
        toneClass: HOLIDAY_CHANGE_TONE.Removed,
      };
    case "Completed":
      return {
        status: "Completed",
        message: "Calendar released",
        toneClass: HOLIDAY_CHANGE_TONE.Completed,
      };
    default:
      return {
        status: "Updated",
        message: "Calendar updated",
        toneClass: HOLIDAY_CHANGE_TONE.Updated,
      };
  }
}

/**
 * Unread Holidays notifications → short chips beside the Released badge.
 */
export function mapHolidayChangeNotifications(notifications = []) {
  return (notifications || [])
    .filter(
      (item) =>
        item?.isNew &&
        String(item.category || "") === "Holidays" &&
        item.id,
    )
    .slice(0, HOLIDAY_CHANGE_CHIP_LIMIT)
    .map((item) => {
      const status = String(item.status || "Updated");
      return {
        id: String(item.id),
        status,
        message: formatHolidayChangeChip(item),
        toneClass: HOLIDAY_CHANGE_TONE[status] || HOLIDAY_CHANGE_TONE.Updated,
      };
    });
}

/** Map a holiday onto the selected calendar year (never keep another year's date). */
export function toReleaseRow(holiday, year) {
  const targetYear = Number(year);
  let date = String(holiday?.date || "").trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    date = `${targetYear}${date.slice(4)}`;
  } else {
    date = `${targetYear}-01-01`;
  }

  return {
    name: holiday?.name || "",
    date,
    type: holiday?.type || "National Holiday",
    description: holiday?.description || "",
  };
}

export function validateReleaseRows(rows, year) {
  const fieldErrors = {};
  const messages = [];

  if (!Array.isArray(rows) || rows.length === 0) {
    return {
      ok: false,
      fieldErrors,
      message: "Add at least one holiday to release the calendar.",
    };
  }

  rows.forEach((row, index) => {
    const result = validateHolidayForm(row);
    if (!result.ok) {
      fieldErrors[index] = result.fieldErrors;
      messages.push(`Row ${index + 1} has invalid fields`);
    } else if (Number(row.date.slice(0, 4)) !== Number(year)) {
      fieldErrors[index] = {
        ...(fieldErrors[index] || {}),
        date: `Date must be in ${year}`,
      };
      messages.push(`Row ${index + 1}: date must be in ${year}`);
    }
  });

  if (messages.length > 0) {
    return {
      ok: false,
      fieldErrors,
      message: messages[0],
    };
  }

  return { ok: true, fieldErrors: {}, message: "" };
}

export function releaseRowsToPayload(rows) {
  return rows.map((row) => ({
    name: String(row.name ?? "").trim(),
    date: String(row.date ?? "").trim(),
    type: String(row.type ?? "").trim(),
    description: String(row.description ?? "").trim(),
  }));
}
