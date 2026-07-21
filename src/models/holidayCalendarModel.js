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

/**
 * Unread Holidays notifications → chips shown beside the Released badge.
 */
export function mapHolidayChangeNotifications(notifications = []) {
  return (notifications || [])
    .filter(
      (item) =>
        item?.isNew &&
        String(item.category || "") === "Holidays" &&
        item.id,
    )
    .map((item) => {
      const status = String(item.status || "Updated");
      return {
        id: String(item.id),
        status,
        title: String(item.title || "Holiday change"),
        description: String(item.description || "").trim(),
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
