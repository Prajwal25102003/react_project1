import { ROLES } from "./authModel.js";
import { STATUS_TONE, getStatusClass } from "./statusStylesModel.js";
import { isRemovalOnlyNotification } from "./navBadgesModel.js";
import { createSeenStateHelpers } from "../utils/seenState.js";

const NOTIFICATION_STATUS = {
  Completed: STATUS_TONE.success,
  Pending: STATUS_TONE.warning,
  Added: STATUS_TONE.success,
  Updated: STATUS_TONE.info,
  Removed: STATUS_TONE.error,
  Approved: STATUS_TONE.success,
  Rejected: STATUS_TONE.error,
  Cancelled: STATUS_TONE.warning,
  Present: STATUS_TONE.success,
  Absent: STATUS_TONE.error,
  'Half Day': STATUS_TONE.warning,
  Info: STATUS_TONE.info,
};

export function getUserMenuItems() {
  return [
    { id: "profile", label: "My Profile", path: "/profile", icon: "profile" },
  ];
}

export function mapHeaderUser(authUser) {
  if (!authUser) {
    return {
      name: "User",
      fullName: "User",
      email: "",
      avatar: null,
    };
  }

  const firstName = String(authUser.name || "User").split(" ")[0];
  return {
    name: firstName,
    fullName: authUser.name || "User",
    email: authUser.email || "",
    avatar: authUser.avatar || null,
  };
}

/** Soft header bar tint by login role (dept head = employee + flag). */
export function getHeaderBarClass(authUser) {
  const role = authUser?.role;
  if (role === ROLES.ADMIN) return "bg-error-50";
  if (role === ROLES.HR) return "bg-brand-50";
  if (role === ROLES.EMPLOYEE && authUser?.isDepartmentHead) {
    return "bg-warning-50";
  }
  return "bg-white";
}

/**
 * Extract resource ID from notification/activity ID.
 * IDs can be like "leave-LR-001", "att-123", "ACT-01", or just "LR-001".
 */
function extractResourceId(id, prefix) {
  const str = String(id || "");
  // Match prefix-XXX pattern (e.g., leave-LR-001 → LR-001)
  const prefixMatch = str.match(new RegExp(`^${prefix}-(.+)$`, "i"));
  if (prefixMatch) return prefixMatch[1];
  // If no prefix, check if it looks like a leave ID (LR-XXX)
  if (prefix === "leave" && str.match(/^LR-/i)) return str;
  return null;
}

function samePersonId(a, b) {
  return Boolean(a && b && String(a) === String(b));
}

/** True when the viewer matches a leave hierarchy approver step snapshot. */
function viewerMatchesLeaveApproverStep(step, viewer = {}) {
  if (!step?.approverKind) return false;
  if (step.approverKind === "role") {
    return Boolean(step.approverRole && viewer.role === step.approverRole);
  }
  if (step.approverKind === "employee") {
    return samePersonId(viewer.employeeId, step.approverEmployeeId);
  }
  if (step.approverKind === "department_head") {
    if (step.departmentHeadId) {
      return samePersonId(viewer.employeeId, step.departmentHeadId);
    }
    return Boolean(viewer.isDepartmentHead);
  }
  return false;
}

/**
 * Leave details deep-link only for people on that request's workflow
 * (requester, actor, named audience, or a step in the hierarchy).
 * Uninvolved Admin/HR may still read the notification text.
 *
 * Personalized Sent/Received rows are already scoped to this viewer — always
 * allow opening leave details (including Cancelled / Approved / Rejected).
 */
export function viewerCanOpenLeaveNotification(notification, viewer = {}) {
  if (!notification || !viewer) return false;

  const direction = String(notification.direction || "").toLowerCase();
  if (direction === "sent" || direction === "received") {
    return true;
  }

  if (samePersonId(viewer.employeeId, notification.subjectEmployeeId)) {
    return true;
  }
  if (samePersonId(viewer.employeeId, notification.actorEmployeeId)) {
    return true;
  }

  const audienceIds = notification.employeeIds || [];
  if (
    viewer.employeeId &&
    audienceIds.some((id) => samePersonId(viewer.employeeId, id))
  ) {
    return true;
  }

  const steps = [
    ...(Array.isArray(notification.hierarchyApprovers)
      ? notification.hierarchyApprovers
      : []),
    notification.currentApprover,
    notification.previousApprover,
    notification.nextApprover,
  ].filter(Boolean);

  if (steps.some((step) => viewerMatchesLeaveApproverStep(step, viewer))) {
    return true;
  }

  const labels = (notification.hierarchyLabels || []).map((label) =>
    String(label).trim().toLowerCase(),
  );
  if (labels.length > 0) {
    if (viewer.role === "hr" && labels.includes("hr")) return true;
    if (viewer.role === "admin" && labels.includes("admin")) return true;
  }

  return false;
}

/**
 * Get navigation path for a notification/activity based on category and ID.
 * Pass `viewer` so leave links open only for workflow participants.
 */
export function getNotificationPath(notification, viewer = null) {
  const category = String(notification?.category || "").toLowerCase();
  const id = notification?.id || "";
  const direction = notification?.direction || null;

  // First check for explicit leaveRequestId from meta (new activities)
  const leaveRequestId = notification?.leaveRequestId;
  // Fallback: extract from composite ID like "leave-LR-001"
  const leaveIdFromId = extractResourceId(id, "leave");
  const attId = extractResourceId(id, "att");

  if (category === "leave") {
    if (viewer && !viewerCanOpenLeaveNotification(notification, viewer)) {
      return null;
    }
    const targetLeaveId = leaveRequestId || leaveIdFromId;
    if (!targetLeaveId) return "/leave-requests";
    const params = new URLSearchParams({ id: targetLeaveId });
    if (direction === "sent" || direction === "received") {
      params.set("direction", direction);
    }
    return `/leave-requests?${params.toString()}`;
  }

  // Removals stay in the feed only — the record is gone, so skip module deep-links.
  if (
    (category === "attendance" ||
      category === "employees" ||
      category === "departments" ||
      category === "holidays") &&
    isRemovalOnlyNotification(notification)
  ) {
    return null;
  }

  if (category === "attendance") {
    if (attId) return `/attendance?id=${attId}`;
    const employeeId = notification?.subjectEmployeeId;
    return employeeId
      ? `/attendance?employeeId=${encodeURIComponent(employeeId)}`
      : "/attendance";
  }

  if (category === "employees") {
    const eventType = String(notification?.eventType || "");
    const title = String(notification?.title || "");
    if (
      eventType === "employee.leave_balances" ||
      /leave balance/i.test(title)
    ) {
      return "/leave-requests";
    }
    const employeeId = notification?.subjectEmployeeId;
    return employeeId
      ? `/employees?id=${encodeURIComponent(employeeId)}`
      : "/employees";
  }

  if (category === "departments") {
    const departmentId = notification?.departmentId;
    return departmentId
      ? `/departments?id=${encodeURIComponent(departmentId)}`
      : "/departments";
  }

  if (category === "holidays") {
    const holidayId = notification?.holidayId;
    const holidayDate = notification?.holidayDate;
    if (holidayId || holidayDate) {
      const params = new URLSearchParams();
      if (holidayId) params.set("id", holidayId);
      // Include date so the page can open the right year/month without
      // filtering the full holiday list down to a single day.
      if (holidayDate) params.set("date", holidayDate);
      return `/holidays?${params.toString()}`;
    }
    return "/holidays";
  }

  // Default: stay on dashboard
  return null;
}

function activityIdSortKey(id) {
  const match = String(id || "").match(/^ACT-(\d+)$/i);
  if (match) return Number(match[1]);
  return 0;
}

export function mapNotifications(notifications, viewer = null) {
  return (notifications || []).map((notification) => {
    const mapped = {
      id: notification.id,
      title: notification.title || "",
      description: notification.description || "",
      category: notification.category || "",
      activityTime: notification.activityTime || null,
      time: notification.time || "",
      status: notification.status || "Info",
      eventType: notification.eventType || null,
      audience: notification.audience || null,
      direction: notification.direction || null,
      directionLabel: notification.directionLabel || null,
      leaveRequestId: notification.leaveRequestId || null,
      subjectEmployeeId: notification.subjectEmployeeId || null,
      actorEmployeeId: notification.actorEmployeeId || null,
      departmentId: notification.departmentId || null,
      departmentName: notification.departmentName || null,
      holidayId: notification.holidayId || null,
      holidayDate: notification.holidayDate || null,
      attendanceId: notification.attendanceId || null,
      attendanceIds: Array.isArray(notification.attendanceIds)
        ? notification.attendanceIds.map(String).filter(Boolean)
        : [],
      employeeIds: Array.isArray(notification.employeeIds)
        ? notification.employeeIds.map(String).filter(Boolean)
        : [],
      hierarchyLabels: Array.isArray(notification.hierarchyLabels)
        ? notification.hierarchyLabels.map(String).filter(Boolean)
        : [],
      hierarchyApprovers: Array.isArray(notification.hierarchyApprovers)
        ? notification.hierarchyApprovers
        : [],
      currentApprover: notification.currentApprover || null,
      previousApprover: notification.previousApprover || null,
      nextApprover: notification.nextApprover || null,
      fromLop: Number(notification.fromLop || 0) || 0,
      willUseLop: Boolean(notification.willUseLop),
      statusClass: getStatusClass(
        NOTIFICATION_STATUS,
        notification.status,
        "Info",
      ),
      isNew: false,
    };
    mapped.href = getNotificationPath(mapped, viewer);
    return mapped;
  });
}

const {
  getSeenIds: getSeenNotificationIds,
  markSeen: markNotificationsSeen,
  pruneSeenToIds: pruneNotificationSeen,
} = createSeenStateHelpers("ems_seen_notifications_v2_");

export { getSeenNotificationIds, markNotificationsSeen };

/**
 * Latest 25 notifications always display. Unseen → isNew; they stay unread
 * until the user interacts with (clicks) that notification.
 * Order is newest first (activityTime), then older below.
 */
export function withNotificationSeenState(notifications, userKey) {
  const list = notifications || [];
  const currentIds = list.map((item) => String(item.id)).filter(Boolean);
  pruneNotificationSeen(userKey, currentIds);

  const seenSet = new Set(getSeenNotificationIds(userKey));

  return list
    .map((item) => ({
      ...item,
      isNew: Boolean(item.id) && !seenSet.has(String(item.id)),
    }))
    .sort((a, b) => {
      const tb = new Date(b.activityTime || 0).getTime();
      const ta = new Date(a.activityTime || 0).getTime();
      if (tb !== ta) return tb - ta;
      return activityIdSortKey(b.id) - activityIdSortKey(a.id);
    });
}

export function notificationDotTone(status) {
  if (
    status === "Rejected" ||
    status === "Removed" ||
    status === "Absent"
  ) {
    return "error";
  }

  if (status === "Pending" || status === "Cancelled") {
    return "warning";
  }

  if (status === "Updated") {
    return "info";
  }

  return "success";
}
