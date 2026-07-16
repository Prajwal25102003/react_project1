import { STATUS_TONE, getStatusClass } from "./statusStylesModel.js";

export const ATTENDANCE_STATUSES = ["Present", "Absent", "Late", "Half Day"];

export const EMPTY_ATTENDANCE_FORM = {
  employeeId: "",
  date: "",
  checkIn: "09:00 AM",
  checkOut: "06:00 PM",
  workingHours: "",
  status: "Present",
};

const ATTENDANCE_STATUS = {
  Present: STATUS_TONE.success,
  Absent: STATUS_TONE.error,
  Late: STATUS_TONE.warning,
  "Half Day": STATUS_TONE.info,
};

const CLOCK_PATTERN = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i;

export function mapAttendanceRecord(record) {
  return {
    ...record,
    statusClass: getStatusClass(ATTENDANCE_STATUS, record.status, "Absent"),
  };
}

export function toAttendanceFormValues(record) {
  if (!record) return { ...EMPTY_ATTENDANCE_FORM };
  return {
    employeeId: record.employeeId || "",
    date: record.date || "",
    checkIn: record.checkIn || "—",
    checkOut: record.checkOut || "—",
    workingHours: record.workingHours || "",
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
