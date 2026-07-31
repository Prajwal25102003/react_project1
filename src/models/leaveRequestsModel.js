import { STATUS_TONE, getStatusClass } from "./statusStylesModel.js";
import { formatDateDisplay } from "./datePickerModel.js";
import {
  isFemaleEmployee,
  isMaternityLeave,
  maternityDatesFromDelivery,
  MATERNITY_TOTAL_DAYS,
} from "./maternityLeaveModel.js";
import {
  countWorkingLeaveDays,
  isWorkingLeaveDay,
} from "./leaveWorkingDaysModel.js";

export const LEAVE_TYPES = [
  "Sick Leave",
  "Casual Leave",
  "Maternity Leave",
  "Medical Leave",
  "Work from Home",
];

/** Includes legacy Loss of Pay rows for list filters only — not selectable on the form. */
export const LEAVE_TYPE_FILTER_OPTIONS = [...LEAVE_TYPES, "Loss of Pay"];

export const MEDICAL_LEAVE_TYPE = "Medical Leave";
export const WORK_FROM_HOME_TYPE = "Work from Home";
export const MAX_MEDICAL_ATTACHMENTS = 5;
export const MEDICAL_ATTACHMENT_URL_PATTERN =
  /^\/uploads\/medical-[^/]+$/i;

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
  attachments: [],
};

/**
 * Normalize medical attachments from API / form into [{ url, name }].
 * Supports legacy single URL strings and JSON arrays.
 */
export function parseMedicalAttachments(raw) {
  if (raw == null) return [];

  if (Array.isArray(raw)) {
    return raw
      .map((item) => normalizeAttachmentItem(item))
      .filter(Boolean);
  }

  const text = String(raw).trim();
  if (!text) return [];

  if (text.startsWith("[")) {
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        return parsed
          .map((item) => normalizeAttachmentItem(item))
          .filter(Boolean);
      }
    } catch {
      /* legacy single URL */
    }
  }

  if (MEDICAL_ATTACHMENT_URL_PATTERN.test(text)) {
    return [{ url: text, name: "" }];
  }

  return [];
}

function normalizeAttachmentItem(item) {
  if (typeof item === "string") {
    const url = item.trim();
    return MEDICAL_ATTACHMENT_URL_PATTERN.test(url)
      ? { url, name: "" }
      : null;
  }
  if (item && typeof item === "object") {
    const url = String(item.url || "").trim();
    if (!MEDICAL_ATTACHMENT_URL_PATTERN.test(url)) return null;
    return {
      url,
      name: String(item.name || item.originalName || "").trim(),
    };
  }
  return null;
}

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
  TeamLeadApproved: "Awaiting next",
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

export function hierarchyStepLabel(step) {
  if (!step) return "Approver";
  if (step.approverKind === "department_head") return "Dept Head";
  if (step.approverKind === "role" && step.approverRole === "hr") return "HR";
  if (step.approverKind === "role" && step.approverRole === "admin") {
    return "Admin";
  }
  if (step.approverKind === "employee") {
    return (
      step.approverEmployeeName ||
      step.approverEmployeeId ||
      "Named Approver"
    );
  }
  return "Approver";
}

export function historyStepForHierarchyStep(step) {
  if (!step) return "HigherAuthority";
  if (step.approverKind === "department_head") return "TeamLead";
  if (step.approverKind === "role" && step.approverRole === "hr") return "HR";
  if (step.approverKind === "role" && step.approverRole === "admin") {
    return "Admin";
  }
  return "HigherAuthority";
}

export function currentHierarchyStep(request) {
  if (!request?.currentStep) return null;
  return (
    (request.hierarchySteps || []).find(
      (step) => Number(step.stepOrder) === Number(request.currentStep),
    ) || null
  );
}

export function nextStepAfterCurrent(request) {
  const steps = [...(request?.hierarchySteps || [])].sort(
    (a, b) => Number(a.stepOrder) - Number(b.stepOrder),
  );
  const current = Number(request?.currentStep);
  const idx = steps.findIndex((step) => Number(step.stepOrder) === current);
  if (idx < 0 || idx >= steps.length - 1) return null;
  return steps[idx + 1];
}

/** True when this approval is the last hierarchy step (balances deduct on approve). */
export function isFinalApprovalStep(request) {
  return Boolean(request) && !nextStepAfterCurrent(request);
}

/** True when the signed-in user matches the request's current hierarchy step. */
export function actorMatchesCurrentStep(request, { employeeId, role } = {}) {
  if (!request || request.status !== "Pending") return false;
  const step = currentHierarchyStep(request);
  if (!step) return false;
  return actorMatchesHierarchyStep(request, step, { employeeId, role });
}

/** True when actor matches a specific hierarchy step definition. */
export function actorMatchesHierarchyStep(
  request,
  step,
  { employeeId, role } = {},
) {
  if (!request || !step) return false;

  if (step.approverKind === "department_head") {
    return Boolean(
      employeeId &&
        request.departmentHeadId &&
        String(employeeId) === String(request.departmentHeadId) &&
        String(employeeId) !== String(request.employeeId || ""),
    );
  }

  if (step.approverKind === "role") {
    return Boolean(step.approverRole && role === step.approverRole);
  }

  if (step.approverKind === "employee") {
    return Boolean(
      employeeId &&
        step.approverEmployeeId &&
        String(employeeId) === String(step.approverEmployeeId),
    );
  }

  return false;
}

/**
 * True when the user is on a later hierarchy step than the live current step
 * (earlier approvers still need to act first).
 */
export function actorMatchesFutureStep(request, { employeeId, role } = {}) {
  if (!request || request.status !== "Pending") return false;
  if (actorMatchesCurrentStep(request, { employeeId, role })) return false;
  const current = Number(request.currentStep);
  if (!current) return false;

  return (request.hierarchySteps || []).some((step) => {
    if (Number(step.stepOrder) <= current) return false;
    return actorMatchesHierarchyStep(request, step, { employeeId, role });
  });
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
    actorName: String(entry.actorName || "").trim() || "Unknown",
  };
}

/**
 * Resolve display name for a tracker step (requester or approver).
 */
function resolveApprovalStepName(stepDef, request, history) {
  if (stepDef.id === "submit") {
    return String(request?.employeeName || "").trim() || null;
  }

  if (stepDef.id === "done") {
    return null;
  }

  const historySteps = stepDef.historySteps || [];
  if (historySteps.length > 0) {
    const match = [...(history || [])]
      .reverse()
      .find((entry) => historySteps.includes(entry.step) && entry.actorName);
    if (match?.actorName) {
      return String(match.actorName).trim() || null;
    }
  }

  if (stepDef.approverKind === "department_head") {
    return String(request?.departmentHeadName || "").trim() || null;
  }

  if (stepDef.approverKind === "employee") {
    return (
      String(stepDef.approverEmployeeName || "").trim() ||
      String(stepDef.approverEmployeeId || "").trim() ||
      null
    );
  }

  // Pending role steps: show the HR person when known; Admin is a login pool.
  if (stepDef.approverKind === "role" && stepDef.approverRole === "hr") {
    return String(request?.hrApproverName || "").trim() || "No HR assigned";
  }

  if (stepDef.approverKind === "role" && stepDef.approverRole === "admin") {
    return "Any Admin";
  }

  return null;
}

/**
 * Multilevel approval steps for the leave details stepper.
 * Prefer request.hierarchySteps when present; fall back to legacy paths.
 */
export function buildLeaveApprovalSteps(request) {
  if (!request) return [];

  const status = request.status || "Pending";
  const hierarchySteps = [...(request.hierarchySteps || [])].sort(
    (a, b) => Number(a.stepOrder) - Number(b.stepOrder),
  );

  let defs;
  if (hierarchySteps.length > 0) {
    defs = [
      { id: "submit", label: "Requested", historySteps: ["Submit"] },
      ...hierarchySteps.map((step) => ({
        id: `step-${step.stepOrder}`,
        label: hierarchyStepLabel(step),
        historySteps: [historyStepForHierarchyStep(step)],
        stepOrder: Number(step.stepOrder),
        approverKind: step.approverKind,
        approverRole: step.approverRole || "",
        approverEmployeeName: step.approverEmployeeName,
        approverEmployeeId: step.approverEmployeeId,
      })),
      { id: "done", label: "Approved", historySteps: [] },
    ];
  } else {
    // Legacy fallback for rows without a hierarchy snapshot.
    const isHeadSelf =
      Boolean(request.departmentHeadId) &&
      request.departmentHeadId === request.employeeId;

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
        {
          id: "hr",
          label: "HR",
          historySteps: ["HR", "Admin"],
          approverKind: "role",
          approverRole: "hr",
        },
        { id: "done", label: "Approved", historySteps: [] },
      ];
    } else {
      defs = [
        { id: "submit", label: "Requested", historySteps: ["Submit"] },
        {
          id: "teamLead",
          label: "Dept Head",
          historySteps: ["TeamLead"],
          approverKind: "department_head",
        },
        {
          id: "hr",
          label: "HR",
          historySteps: ["HR", "Admin"],
          approverKind: "role",
          approverRole: "hr",
        },
        { id: "done", label: "Approved", historySteps: [] },
      ];
    }
  }

  const history = request.approvalHistory || [];
  let currentIndex = 1;
  let terminalState = null;

  if (status === "Pending") {
    if (request.currentStep != null) {
      const idx = defs.findIndex(
        (step) => Number(step.stepOrder) === Number(request.currentStep),
      );
      currentIndex = idx >= 0 ? idx : 1;
    } else {
      currentIndex = 1;
    }
  } else if (status === "TeamLeadApproved") {
    currentIndex = Math.min(2, defs.length - 1);
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

    if (failEntry?.step === "Cancel" || failEntry?.action === "Cancelled") {
      failIndex = 0;
    } else if (failIndex < 0) {
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

    if (step.id === "done" && status === "Approved") {
      label = "Approved";
    }

    return {
      id: step.id,
      label,
      name: resolveApprovalStepName(step, request, history),
      state,
    };
  });
}

function pendingStatusLabel(request) {
  const step = currentHierarchyStep(request);
  if (step) return `Awaiting ${hierarchyStepLabel(step)}`;
  if (isRequesterHr(request)) return "Awaiting Admin";
  if (isRequesterAdmin(request)) return "Awaiting Higher Approval";
  return LEAVE_STATUS_LABEL.Pending;
}

export function mapLeaveRequest(request) {
  const status = request.status || "Pending";
  const requesterIsHr = Boolean(request.requesterIsHr);
  const requesterIsAdmin = Boolean(request.requesterIsAdmin);
  const leaveDays = Number(request.leaveDays);
  const hierarchySteps = request.hierarchySteps || [];
  const currentStep =
    request.currentStep === null || request.currentStep === undefined
      ? null
      : Number(request.currentStep);
  const attachments = parseMedicalAttachments(
    request.attachments ?? request.attachmentUrl,
  );

  const startDate = request.startDate || "";
  const endDate = request.endDate || "";

  return {
    ...request,
    startDate,
    endDate,
    startDateLabel: formatDateDisplay(startDate) || startDate,
    endDateLabel: formatDateDisplay(endDate) || endDate,
    leaveDays: Number.isNaN(leaveDays) ? request.leaveDays : leaveDays,
    halfDaySession: request.halfDaySession || null,
    leaveDaysLabel: formatLeaveDaysLabel(
      request.leaveDays,
      request.halfDaySession,
    ),
    attachments,
    attachmentUrl: attachments[0]?.url || "",
    attachmentName: attachments[0]?.name || "",
    status,
    requesterIsHr,
    requesterIsAdmin,
    hierarchyId: request.hierarchyId ?? null,
    currentStep,
    hierarchySteps,
    statusLabel:
      status === "Pending"
        ? pendingStatusLabel({
            ...request,
            currentStep,
            hierarchySteps,
            requesterIsHr,
            requesterIsAdmin,
          })
        : LEAVE_STATUS_LABEL[status] || status,
    statusClass: getStatusClass(LEAVE_STATUS, status, "Pending"),
    casualLeaveBalance: Number(request.casualLeaveBalance ?? 0),
    sickLeaveBalance: Number(request.sickLeaveBalance ?? 0),
    lopDays: Number(request.lopDays ?? 0),
    approvalHistory: (request.approvalHistory || []).map(mapApprovalHistoryEntry),
  };
}

/** @deprecated Prefer actorMatchesCurrentStep */
export function isTeamLeadForRequest(request, employeeId) {
  return actorMatchesCurrentStep(request, {
    employeeId,
    role: "employee",
  }) && currentHierarchyStep(request)?.approverKind === "department_head";
}

/** @deprecated Prefer actorMatchesCurrentStep */
export function canHrApproveRequest(request) {
  return actorMatchesCurrentStep(request, { role: "hr" });
}

/** @deprecated Prefer actorMatchesCurrentStep */
export function canHrRejectRequest(request) {
  return canHrApproveRequest(request);
}

/** @deprecated Prefer actorMatchesCurrentStep */
export function canAdminApproveRequest(request) {
  return actorMatchesCurrentStep(request, { role: "admin" });
}

export function canAdminRejectRequest(request) {
  return canAdminApproveRequest(request);
}

/** True when the signed-in user can approve or reject this leave request. */
export function isActionableLeaveApproval(request, { employeeId, role } = {}) {
  return actorMatchesCurrentStep(request, { employeeId, role });
}

/** How many approval-queue rows still need this user's decision. */
export function countActionableLeaveApprovals(requests, userContext) {
  return (requests || []).filter((request) =>
    isActionableLeaveApproval(request, userContext),
  ).length;
}

/** Leave request ids that still need this user's decision. */
export function actionableLeaveApprovalIds(requests, userContext) {
  return new Set(
    (requests || [])
      .filter((request) => isActionableLeaveApproval(request, userContext))
      .map((request) => request.id),
  );
}

/**
 * Badge counts for My / Employees tabs and the leave-requests nav module.
 * - employees: requests awaiting this user's approve/reject, or later in their chain
 * - mine: own Pending leave (open / awaiting others), plus any self-actionable
 * - total: mine + employees (module sidebar badge)
 */
export function leaveScopeNotificationCounts(requests, userContext = {}) {
  const actionableIds = actionableLeaveApprovalIds(requests, userContext);
  const myId = userContext.employeeId
    ? String(userContext.employeeId)
    : "";
  let mine = 0;
  let employees = 0;

  for (const row of requests || []) {
    const isMine = Boolean(myId) && String(row.employeeId) === myId;
    if (actionableIds.has(row.id)) {
      if (isMine) mine += 1;
      else employees += 1;
      continue;
    }
    if (actorMatchesFutureStep(row, userContext)) {
      if (isMine) mine += 1;
      else employees += 1;
      continue;
    }
    if (isMine && row.status === "Pending") {
      mine += 1;
    }
  }

  return { mine, employees, total: mine + employees };
}

/** Row highlight: actionable, future-chain awaiting, or own open leave. */
export function leaveRequestNeedsAttention(request, userContext = {}) {
  if (!request) return false;
  if (isActionableLeaveApproval(request, userContext)) return true;
  if (actorMatchesFutureStep(request, userContext)) return true;
  const myId = userContext.employeeId
    ? String(userContext.employeeId)
    : "";
  return (
    Boolean(myId) &&
    String(request.employeeId) === myId &&
    request.status === "Pending"
  );
}

/** Count actionable + future-chain pending rows (Admin sidebar badge). */
export function countLeaveApproverAttention(requests, userContext) {
  return (requests || []).filter(
    (request) =>
      isActionableLeaveApproval(request, userContext) ||
      actorMatchesFutureStep(request, userContext),
  ).length;
}

/** Whether this user may cancel the leave request in its current status. */
export function canCancelLeaveRequest(request, { employeeId } = {}) {
  if (!request) return false;
  if (request.status !== "Pending") return false;
  return Boolean(employeeId) && request.employeeId === employeeId;
}

export function calculateLeaveDays(
  startDate,
  endDate,
  duration = "full",
  holidayDates = [],
) {
  if (duration === "half") {
    if (!startDate) return "";
    return isWorkingLeaveDay(startDate, holidayDates) ? "0.5" : "";
  }
  if (!startDate || !endDate) return "";
  const days = countWorkingLeaveDays(startDate, endDate, holidayDates);
  if (days === null) return "";
  return days >= 1 ? String(days) : "";
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
    payload.attachments = parseMedicalAttachments(form.attachments).map(
      ({ url, name }) => ({ url, name: name || "" }),
    );
  }

  return payload;
}

export function validateLeaveForm(form, { gender, holidayDates = [] } = {}) {
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
    else if (!isWorkingLeaveDay(startDate, holidayDates)) {
      fieldErrors.startDate =
        "Cannot apply leave on a Saturday, Sunday, or company holiday";
    }
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
    if (!leaveDaysRaw) {
      fieldErrors.leaveDays =
        startDate && endDate && endDate >= startDate
          ? "No working days in this range (weekends and holidays are excluded)"
          : "Leave days are required";
    } else {
      const days = Number(leaveDaysRaw);
      const expected = countWorkingLeaveDays(startDate, endDate, holidayDates);
      if (Number.isNaN(days) || days < 1) {
        fieldErrors.leaveDays =
          "Leave days must be at least 1 working day (weekends and holidays excluded)";
      } else if (expected != null && days !== expected) {
        fieldErrors.leaveDays = `Leave days must be ${expected} (weekends and holidays excluded)`;
      }
    }
  }

  if (!reason) fieldErrors.reason = "Leave reason is required";

  if (isMedicalLeave(leaveType)) {
    const attachments = parseMedicalAttachments(form?.attachments);
    if (!attachments.length) {
      fieldErrors.attachments =
        "Upload at least one medical certificate or supporting document";
    } else if (attachments.length > MAX_MEDICAL_ATTACHMENTS) {
      fieldErrors.attachments = `You can upload up to ${MAX_MEDICAL_ATTACHMENTS} documents`;
    } else if (
      attachments.some(
        (item) => !MEDICAL_ATTACHMENT_URL_PATTERN.test(item.url),
      )
    ) {
      fieldErrors.attachments = "Upload valid medical documents only";
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
