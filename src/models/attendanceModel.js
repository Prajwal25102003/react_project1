import { STATUS_TONE, getStatusClass } from "./statusStylesModel.js";

export const ATTENDANCE_STATUSES = ["Present", "Absent", "Half Day"];

export const EMPTY_ATTENDANCE_FORM = {
  employeeId: "",
  date: "",
  checkIn: "09:00 AM",
  checkOut: "06:00 PM",
  workingHours: "9",
  status: "Present",
};

const ATTENDANCE_STATUS = {
  Present: STATUS_TONE.success,
  Absent: STATUS_TONE.error,
  "Half Day": STATUS_TONE.info,
};

const CLOCK_PATTERN = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i;

function parseClockToMinutes(value) {
  if (value === null || value === undefined) return null;

  const text = String(value).trim();
  if (!text || text === "—" || text === "-") return null;

  const match = text.match(CLOCK_PATTERN);
  if (!match) return null;

  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const meridiem = match[3].toUpperCase();

  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  if (hours < 1 || hours > 12 || minutes < 0 || minutes > 59) return null;

  if (meridiem === "AM") {
    if (hours === 12) hours = 0;
  } else if (hours !== 12) {
    hours += 12;
  }

  return hours * 60 + minutes;
}

/** Working hours from check-in / check-out, or "" if not calculable. */
export function calculateWorkingHours(checkIn, checkOut) {
  const start = parseClockToMinutes(checkIn);
  const end = parseClockToMinutes(checkOut);
  if (start === null || end === null) return "";

  let diff = end - start;
  if (diff < 0) diff += 24 * 60;

  return String(Number((diff / 60).toFixed(2)));
}

/**
 * Format decimal hours for display, e.g. 8.5 → "8 hours 30 minutes",
 * 8.83 → "8 hours 50 minutes".
 */
export function formatWorkingHoursLabel(value) {
  if (value === "" || value === null || value === undefined) return "";

  const decimal = Number(value);
  if (Number.isNaN(decimal)) return "";

  const totalMinutes = Math.round(decimal * 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0 && minutes === 0) return "0 hours";

  const parts = [];
  if (hours > 0) {
    parts.push(`${hours} ${hours === 1 ? "hour" : "hours"}`);
  }
  if (minutes > 0) {
    parts.push(`${minutes} ${minutes === 1 ? "minute" : "minutes"}`);
  }
  return parts.join(" ");
}

export function mapAttendanceRecord(record) {
  return {
    ...record,
    workingHoursLabel: formatWorkingHoursLabel(record.workingHours),
    statusClass: getStatusClass(ATTENDANCE_STATUS, record.status, "Absent"),
  };
}

export function toAttendanceFormValues(record) {
  if (!record) return { ...EMPTY_ATTENDANCE_FORM };
  const checkIn = record.checkIn || "—";
  const checkOut = record.checkOut || "—";
  const calculated = calculateWorkingHours(checkIn, checkOut);
  return {
    employeeId: record.employeeId || "",
    date: record.date || "",
    checkIn,
    checkOut,
    workingHours:
      calculated ||
      (record.workingHours !== undefined && record.workingHours !== null
        ? String(record.workingHours)
        : ""),
    status: record.status || "Present",
  };
}

export function toAttendancePayload(form) {
  return {
    employeeId: form.employeeId,
    date: form.date,
    checkIn: form.checkIn.trim(),
    checkOut: form.checkOut.trim(),
    workingHours:
      form.workingHours === "" || form.workingHours === undefined
        ? undefined
        : Number(form.workingHours),
    status: form.status,
  };
}

export function validateAttendanceForm(form) {
  const fieldErrors = {};
  const employeeId = String(form?.employeeId ?? "").trim();
  const date = String(form?.date ?? "").trim();
  const status = String(form?.status ?? "").trim();
  const checkIn = String(form?.checkIn ?? "").trim();
  const checkOut = String(form?.checkOut ?? "").trim();

  if (!employeeId) fieldErrors.employeeId = "Employee is required";
  if (!date) fieldErrors.date = "Date is required";
  if (!status) fieldErrors.status = "Status is required";
  else if (!ATTENDANCE_STATUSES.includes(status)) {
    fieldErrors.status = "Select a valid status";
  }

  if (!checkIn) fieldErrors.checkIn = "Check-in is required";
  else if (checkIn !== "—" && !CLOCK_PATTERN.test(checkIn)) {
    fieldErrors.checkIn = "Use format like 09:00 AM or —";
  }

  if (!checkOut) fieldErrors.checkOut = "Check-out is required";
  else if (checkOut !== "—" && !CLOCK_PATTERN.test(checkOut)) {
    fieldErrors.checkOut = "Use format like 06:00 PM or —";
  }

  const keys = Object.keys(fieldErrors);
  if (keys.length === 0) return { ok: true, fieldErrors: {} };

  return {
    ok: false,
    fieldErrors,
    message: "Please fix the highlighted fields and try again.",
  };
}
