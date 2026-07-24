import { STATUS_TONE, getStatusClass } from "./statusStylesModel.js";
import {
  isFemaleEmployee,
  isMaternityLeave,
  maternityDatesFromDelivery,
  MATERNITY_TOTAL_DAYS,
} from "./maternityLeaveModel.js";

export const LEAVE_TYPES = [
  "Sick Leave",
  "Casual Leave",
  "Maternity Leave",
  "Medical Leave",
  "Work from Home",
  "Loss of Pay",
];

export const MEDICAL_LEAVE_TYPE = "Medical Leave";
export const WORK_FROM_HOME_TYPE = "Work from Home";

export function isMedicalLeave(leaveType) {
  return String(leaveType || "").trim() === MEDICAL_LEAVE_TYPE;
}

export function isWorkFromHome(leaveType) {
  return String(leaveType || "").trim() === WORK_FROM_HOME_TYPE;
}

/** True when approval does not change casual / sick / LOP quotas. */
export function leaveTypeSkipsBalanceDeduction(leaveType) {
  return (
    isWorkFromHome(leaveType) ||
    String(leaveType || "").trim() === "Maternity Leave"
  );
}

export const LEAVE_DURATIONS = [
  { value: "full", label: "Full day" },
  { value: "half", label: "Half day" },
];

export const HALF_DAY_SESSIONS = [
  { value: "first_half", label: "First half (morning)" },
  { value: "second_half", label: "Second half (afternoon)" },
];

export const EMPTY_LEAVE_FORM = {
  employeeId: "",
  leaveType: "Casual Leave",
  duration: "full",
  halfDaySession: "first_half",
  expectedDeliveryDate: "",
  startDate: "",
  endDate: "",
  leaveDays: "",
  reason: "",
  attachmentUrl: "",
  attachmentName: "",
};

export function attachmentFileLabel(url, fallbackName = "") {
  if (fallbackName) return fallbackName;
  const path = String(url || "").trim();
  if (!path) return "";
  const parts = path.split("/");
  return parts[parts.length - 1] || "Attached document";
}

const LEAVE_STATUS = {
  Pending: STATUS_TONE.warning,
  TeamLeadApproved: STATUS_TONE.info,
  Approved: STATUS_TONE.success,
  Rejected: STATUS_TONE.error,
  Cancelled: STATUS_TONE.warning,
};

export const LEAVE_STATUS_LABEL = {
  Pending: "Pending",
  TeamLeadApproved: "Awaiting HR",
  Approved: "Approved",
  Rejected: "Rejected",
  Cancelled: "Cancelled",
};

export function halfDaySessionLabel(session) {
  if (session === "first_half") return "Morning";
  if (session === "second_half") return "Afternoon";
  return "";
}

export function formatLeaveDaysLabel(leaveDays, halfDaySession) {
  const days = Number(leaveDays);
  if (Number.isNaN(days)) return leaveDays ?? "—";
  if (days === 0.5) {
    const session = halfDaySessionLabel(halfDaySession);
    return session ? `0.5 · ${session}` : "0.5";
  }
  return Number.isInteger(days) ? String(days) : String(days);
}

export function isRequesterHr(request) {
  return Boolean(request?.requesterIsHr);
}

export function isRequesterAdmin(request) {
  return Boolean(request?.requesterIsAdmin);
}

/** HR may reject employee leave (not HR/Admin requesters — those go to Admin). */
export function canHrRejectRequest(request) {
  if (!request) return false;
  if (isRequesterHr(request) || isRequesterAdmin(request)) return false;
  if (request.status === "TeamLeadApproved") return true;
  if (
    request.status === "Pending" &&
    request.departmentHeadId &&
    request.departmentHeadId === request.employeeId
  ) {
    return true;
  }
  return false;
}

export function mapApprovalHistoryEntry(entry) {
  const stepLabel =
    {
      Submit: "Requested",
      TeamLead: "Dept Head",
      HR: "HR",
      Admin: "Admin",
      HigherAuthority: "Higher Authority",
      Cancel: "Cancelled",
    }[entry.step] || entry.step;

  return {
    ...entry,
    stepLabel,
  };
}

/**
 * Multilevel approval steps for the leave details stepper.
 * state: completed | current | upcoming | rejected | cancelled
 * Always returns the full path; terminal outcomes mark the fail step.
 */
export function buildLeaveApprovalSteps(request) {
  if (!request) return [];

  const status = request.status || "Pending";
  const isHeadSelf =
    Boolean(request.departmentHeadId) &&
    request.departmentHeadId === request.employeeId;

  let defs;
  if (isRequesterAdmin(request)) {
    defs = [
      { id: "submit", label: "Requested", historySteps: ["Submit"] },
      {
        id: "approver",
        label: "Higher Auth",
        historySteps: ["HigherAuthority", "Admin"],
      },
      { id: "done", label: "Approved", historySteps: [] },
    ];
  } else if (isRequesterHr(request)) {
    defs = [
      { id: "submit", label: "Requested", historySteps: ["Submit"] },
      { id: "approver", label: "Admin", historySteps: ["Admin"] },
      { id: "done", label: "Approved", historySteps: [] },
    ];
  } else if (isHeadSelf) {
    defs = [
      { id: "submit", label: "Requested", historySteps: ["Submit"] },
      { id: "hr", label: "HR", historySteps: ["HR", "Admin"] },
      { id: "done", label: "Approved", historySteps: [] },
    ];
  } else {
    defs = [
      { id: "submit", label: "Requested", historySteps: ["Submit"] },
      { id: "teamLead", label: "Dept Head", historySteps: ["TeamLead"] },
      { id: "hr", label: "HR", historySteps: ["HR", "Admin"] },
      { id: "done", label: "Approved", historySteps: [] },
    ];
  }

  const history = request.approvalHistory || [];
  let currentIndex = 1;
  let terminalState = null;

  if (status === "Pending") {
    currentIndex = 1;
  } else if (status === "TeamLeadApproved") {
    currentIndex = defs.findIndex((step) => step.id === "hr");
    if (currentIndex < 0) currentIndex = Math.min(2, defs.length - 1);
  } else if (status === "Approved") {
    currentIndex = defs.length - 1;
  } else if (status === "Rejected" || status === "Cancelled") {
    terminalState = status === "Rejected" ? "rejected" : "cancelled";
    const failEntry = [...history]
      .reverse()
      .find(
        (entry) =>
          entry.action === "Rejected" ||
          entry.action === "Cancelled" ||
          entry.step === "Cancel",
      );

    let failIndex = failEntry?.step
      ? defs.findIndex((step) =>
          (step.historySteps || []).includes(failEntry.step),
        )
      : -1;

    // Sender cancel → mark Requested as cancelled (only requester can cancel).
    if (failEntry?.step === "Cancel" || failEntry?.action === "Cancelled") {
      failIndex = 0;
    } else if (failIndex < 0) {
      // Unknown reject → mark the step that was waiting (first approver).
      failIndex = 1;
    }
    currentIndex = failIndex;
  }

  return defs.map((step, index) => {
    let state = "upcoming";
    let label = step.label;

    if (status === "Approved") {
      state = "completed";
    } else if (terminalState) {
      if (index < currentIndex) state = "completed";
      else if (index === currentIndex) state = terminalState;
      else state = "upcoming";
    } else if (index < currentIndex) {
      state = "completed";
    } else if (index === currentIndex) {
      state = "current";
    }

    if (step.id === "submit") {
      if (terminalState === "cancelled" && currentIndex === 0) {
        state = "cancelled";
        label = "Cancelled";
      } else {
        state = "completed";
        label = "Requested";
      }
    }

    return {
      id: step.id,
      label,
      state,
    };
  });
}

export function mapLeaveRequest(request) {
  const status = request.status || "Pending";
  const requesterIsHr = Boolean(request.requesterIsHr);
  const requesterIsAdmin = Boolean(request.requesterIsAdmin);
  const leaveDays = Number(request.leaveDays);
  return {
    ...request,
    leaveDays: Number.isNaN(leaveDays) ? request.leaveDays : leaveDays,
    halfDaySession: request.halfDaySession || null,
    leaveDaysLabel: formatLeaveDaysLabel(
      request.leaveDays,
      request.halfDaySession,
    ),
    status,
    requesterIsHr,
    requesterIsAdmin,
    statusLabel:
      status === "Pending" && requesterIsHr
        ? "Awaiting Admin"
        : status === "Pending" && requesterIsAdmin
          ? "Awaiting Higher Approval"
          : LEAVE_STATUS_LABEL[status] || status,
    statusClass: getStatusClass(LEAVE_STATUS, status, "Pending"),
    casualLeaveBalance: Number(request.casualLeaveBalance ?? 0),
    sickLeaveBalance: Number(request.sickLeaveBalance ?? 0),
    lopDays: Number(request.lopDays ?? 0),
    approvalHistory: (request.approvalHistory || []).map(mapApprovalHistoryEntry),
  };
}

/** True when the signed-in employee is the requester's department head (not self). */
export function isTeamLeadForRequest(request, employeeId) {
  return Boolean(
    employeeId &&
      request?.departmentHeadId &&
      employeeId === request.departmentHeadId &&
      employeeId !== request.employeeId &&
      !isRequesterHr(request) &&
      !isRequesterAdmin(request),
  );
}

/**
 * HR final approve, or HR direct-approve when the requester is the department head.
 * HR leave is approved by Admin only.
 */
export function canHrApproveRequest(request) {
  if (!request || isRequesterHr(request) || isRequesterAdmin(request)) {
    return false;
  }
  if (request.status === "TeamLeadApproved") return true;
  if (
    request.status === "Pending" &&
    request.departmentHeadId &&
    request.departmentHeadId === request.employeeId
  ) {
    return true;
  }
  return false;
}

/** Admin-only approve for HR employees' leave requests. */
export function canAdminApproveRequest(request) {
  return Boolean(
    request &&
      isRequesterHr(request) &&
      !isRequesterAdmin(request) &&
      request.status === "Pending",
  );
}

export function canAdminRejectRequest(request) {
  return canAdminApproveRequest(request);
}

/** True when the signed-in user can approve or reject this leave request. */
function canActOnLeaveApproval(request, { employeeId, role } = {}) {
  if (!request) return false;
  const asTeamLead = isTeamLeadForRequest(request, employeeId);
  if (request.status === "Pending" && asTeamLead) return true;
  if (role === "admin" && canAdminApproveRequest(request)) return true;
  if (
    role === "hr" &&
    (canHrApproveRequest(request) || canHrRejectRequest(request))
  ) {
    return true;
  }
  return false;
}

/** How many approval-queue rows still need this user's decision. */
export function countActionableLeaveApprovals(requests, userContext) {
  return (requests || []).filter((request) =>
    canActOnLeaveApproval(request, userContext),
  ).length;
}

/** Whether this user may cancel the leave request in its current status. */
export function canCancelLeaveRequest(request, { employeeId } = {}) {
  if (!request) return false;
  const status = request.status;
  if (status !== "Pending" && status !== "TeamLeadApproved") return false;

  // Only the requester can cancel. HR uses Approve / Reject for employee leave.
  return Boolean(employeeId) && request.employeeId === employeeId;
}

export function calculateLeaveDays(startDate, endDate, duration = "full") {
  if (duration === "half") {
    return startDate ? "0.5" : "";
  }
  if (!startDate || !endDate) return "";
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return "";
  const diff = Math.floor((end - start) / 86400000) + 1;
  return diff >= 1 ? String(diff) : "";
}

export function toLeavePayload(form) {
  const duration = isMaternityLeave(form.leaveType)
    ? "full"
    : form.duration === "half"
      ? "half"
      : "full";
  const startDate = form.startDate;
  const endDate = duration === "half" ? form.startDate : form.endDate;

  const payload = {
    employeeId: form.employeeId,
    leaveType: form.leaveType,
    duration,
    startDate,
    endDate,
    leaveDays: duration === "half" ? 0.5 : Number(form.leaveDays),
    reason: form.reason.trim(),
  };

  if (duration === "half") {
    payload.halfDaySession = form.halfDaySession;
  }

  if (isMaternityLeave(form.leaveType)) {
    payload.expectedDeliveryDate = String(
      form.expectedDeliveryDate || "",
    ).trim();
  }

  if (isMedicalLeave(form.leaveType)) {
    payload.attachmentUrl = String(form.attachmentUrl || "").trim();
  }

  return payload;
}

export function validateLeaveForm(form, { gender } = {}) {
  const fieldErrors = {};
  const employeeId = String(form?.employeeId ?? "").trim();
  const leaveType = String(form?.leaveType ?? "").trim();
  const startDate = String(form?.startDate ?? "").trim();
  const endDate = String(form?.endDate ?? "").trim();
  const reason = String(form?.reason ?? "").trim();
  const leaveDaysRaw = String(form?.leaveDays ?? "").trim();
  const expectedDeliveryDate = String(form?.expectedDeliveryDate ?? "").trim();
  const duration = String(form?.duration ?? "full").trim();
  const halfDaySession = String(form?.halfDaySession ?? "").trim();

  if (!employeeId) fieldErrors.employeeId = "Employee ID is required";
  if (!leaveType) fieldErrors.leaveType = "Leave type is required";
  else if (!LEAVE_TYPES.includes(leaveType)) {
    fieldErrors.leaveType = "Select a valid leave type";
  }

  if (isMaternityLeave(leaveType)) {
    if (!isFemaleEmployee(gender)) {
      fieldErrors.leaveType =
        "Maternity leave is only available for female employees";
    }
    if (!expectedDeliveryDate) {
      fieldErrors.expectedDeliveryDate = "Expected delivery date is required";
    } else {
      const maternity = maternityDatesFromDelivery(expectedDeliveryDate);
      if (!maternity) {
        fieldErrors.expectedDeliveryDate = "Enter a valid delivery date";
      } else {
        if (startDate !== maternity.startDate) {
          fieldErrors.startDate = `Must be 2 weeks before delivery (${maternity.startDate})`;
        }
        if (endDate !== maternity.endDate) {
          fieldErrors.endDate = `Must be 24 weeks after delivery (${maternity.endDate})`;
        }
        if (Number(leaveDaysRaw) !== MATERNITY_TOTAL_DAYS) {
          fieldErrors.leaveDays = `Maternity leave is ${MATERNITY_TOTAL_DAYS} paid days (26 weeks)`;
        }
      }
    }
  } else if (duration === "half") {
    if (!startDate) fieldErrors.startDate = "Leave date is required";
    if (!["first_half", "second_half"].includes(halfDaySession)) {
      fieldErrors.halfDaySession = "Select first half or second half";
    }
    if (Number(leaveDaysRaw) !== 0.5) {
      fieldErrors.leaveDays = "Half-day leave must be 0.5 days";
    }
  } else {
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
  }

  if (!reason) fieldErrors.reason = "Leave reason is required";

  if (isMedicalLeave(leaveType)) {
    const attachmentUrl = String(form?.attachmentUrl ?? "").trim();
    if (!attachmentUrl) {
      fieldErrors.attachmentUrl =
        "Upload a medical certificate or supporting document";
    } else if (!/^\/uploads\/medical-[^/]+$/i.test(attachmentUrl)) {
      fieldErrors.attachmentUrl = "Upload a valid medical document";
    }
  }

  const keys = Object.keys(fieldErrors);
  if (keys.length === 0) return { ok: true, fieldErrors: {} };

  return {
    ok: false,
    fieldErrors,
    message: "Please fix the highlighted fields and try again.",
  };
}
