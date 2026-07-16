import { STATUS_TONE, getStatusClass } from "./statusStylesModel.js";

export const LEAVE_TYPES = ["Sick Leave", "Casual Leave", "Maternity Leave"];

export const EMPTY_LEAVE_FORM = {
  employeeId: "",
  leaveType: "Casual Leave",
  startDate: "",
  endDate: "",
  leaveDays: "",
  reason: "",
};

const LEAVE_STATUS = {
  Pending: STATUS_TONE.warning,
  Approved: STATUS_TONE.success,
  Rejected: STATUS_TONE.error,
  Cancelled: STATUS_TONE.info,
};

export function mapLeaveRequest(request) {
  return {
    ...request,
    statusClass: getStatusClass(LEAVE_STATUS, request.status, "Pending"),
  };
}

export function calculateLeaveDays(startDate, endDate) {
  if (!startDate || !endDate) return "";
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return "";
  const diff = Math.floor((end - start) / 86400000) + 1;
  return diff >= 1 ? String(diff) : "";
}

export function toLeavePayload(form) {
  return {
    employeeId: form.employeeId,
    leaveType: form.leaveType,
    startDate: form.startDate,
    endDate: form.endDate,
    leaveDays: Number(form.leaveDays),
    reason: form.reason.trim(),
  };
}

export function validateLeaveForm(form) {
  const fieldErrors = {};
  const employeeId = String(form?.employeeId ?? "").trim();
  const leaveType = String(form?.leaveType ?? "").trim();
  const startDate = String(form?.startDate ?? "").trim();
  const endDate = String(form?.endDate ?? "").trim();
  const reason = String(form?.reason ?? "").trim();
  const leaveDaysRaw = String(form?.leaveDays ?? "").trim();

  if (!employeeId) fieldErrors.employeeId = "Employee is required";
  if (!leaveType) fieldErrors.leaveType = "Leave type is required";
  else if (!LEAVE_TYPES.includes(leaveType)) {
    fieldErrors.leaveType = "Select a valid leave type";
  }
  if (!startDate) fieldErrors.startDate = "Start date is required";
  if (!endDate) fieldErrors.endDate = "End date is required";
  if (startDate && endDate && endDate < startDate) {
    fieldErrors.endDate = "End date cannot be before start date";
  }
  if (!leaveDaysRaw) fieldErrors.leaveDays = "Leave days are required";
  else {
    const days = Number(leaveDaysRaw);
    if (Number.isNaN(days) || days < 1) {
      fieldErrors.leaveDays = "Leave days must be at least 1";
    }
  }
  if (!reason) fieldErrors.reason = "Leave reason is required";

  const keys = Object.keys(fieldErrors);
  if (keys.length === 0) return { ok: true, fieldErrors: {} };

  return {
    ok: false,
    fieldErrors,
    message: "Please fix the highlighted fields and try again.",
  };
}
