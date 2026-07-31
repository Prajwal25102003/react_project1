/** Map recent-activity categories to sidebar nav item ids. */
export const NOTIFICATION_CATEGORY_NAV_IDS = {
  Attendance: ["attendance"],
  Employees: ["employees"],
  Departments: ["departments"],
  Holidays: ["holidays"],
};

const LEAVE_APPROVAL_STATUSES = new Set(["Pending", "TeamLeadApproved"]);
const PERSONAL_LEAVE_OUTCOME_STATUSES = new Set(["Rejected", "Approved"]);

/** Deletions stay in the header feed only — never badge a sidebar module. */
export function isRemovalOnlyNotification(notification) {
  const category = String(notification?.category || "");
  const status = String(notification?.status || "");
  const eventType = String(notification?.eventType || "");
  const title = String(notification?.title || "").toLowerCase();

  if (
    category === "Attendance" &&
    (eventType === "attendance.removed" ||
      status === "Removed" ||
      title.includes("attendance removed") ||
      title.includes("removed attendance"))
  ) {
    return true;
  }

  if (
    category === "Employees" &&
    (eventType === "employee.removed" ||
      eventType === "admin.removed" ||
      status === "Removed" ||
      title.includes("employee removed") ||
      title.includes("admin removed") ||
      title.includes("you removed employee") ||
      title.includes("you removed admin"))
  ) {
    return true;
  }

  return false;
}

/**
 * Resolve which nav module(s) should show a badge for one notification.
 *
 * Leave: open personal leave → Leave Requests; actionable org/team leave → Leave Requests.
 * Personal Rejected/Approved outcomes also badge until the employee acknowledges them.
 */
export function navIdsForNotification(
  notification,
  availableNavIds = [],
  { role } = {},
) {
  const available = new Set(availableNavIds);
  const category = String(notification?.category || "");
  const status = String(notification?.status || "");
  const audience = String(notification?.audience || "").toLowerCase();
  const direction = String(notification?.direction || "").toLowerCase();
  const isOrgAudience = audience === "org";
  const isPersonalAudience = audience === "self" || audience === "personal";
  const isStaff = role === "hr" || role === "admin";

  // Removals: header notifications only (HR, Admin, and employees) — no module badge.
  if (isRemovalOnlyNotification(notification)) {
    return [];
  }

  if (category === "Leave") {
    const stillOpen = LEAVE_APPROVAL_STATUSES.has(status);
    const isPersonalOutcome =
      PERSONAL_LEAVE_OUTCOME_STATUSES.has(status) &&
      direction === "received";

    const isPersonalLeave =
      isPersonalAudience ||
      (!isOrgAudience && (!isStaff || role === "employee"));

    if (isPersonalLeave && available.has("leave-requests")) {
      if (stillOpen || isPersonalOutcome) return ["leave-requests"];
      return [];
    }

    if (stillOpen && available.has("leave-requests")) {
      return ["leave-requests"];
    }

    return [];
  }

  // Leave balance grants from admin/HR → Leave Requests for the recipient.
  if (
    category === "Employees" &&
    (String(notification?.eventType || "") === "employee.leave_balances" ||
      /leave balance/i.test(String(notification?.title || ""))) &&
    direction === "received" &&
    available.has("leave-requests")
  ) {
    return ["leave-requests"];
  }

  // Admin maintains the calendar — header notifications only, no sidebar badge.
  if (category === "Holidays" && role === "admin") {
    return [];
  }

  const mapped = NOTIFICATION_CATEGORY_NAV_IDS[category] || [];
  return mapped.filter((id) => available.has(id));
}

/**
 * Unread personal leave Rejected/Approved count (received).
 * Used to add outcome badges on top of approver actionable-leave counts.
 */
export function countPersonalLeaveOutcomeBadges(notifications) {
  let count = 0;
  for (const notification of notifications || []) {
    if (!notification?.isNew) continue;
    if (String(notification.category || "") !== "Leave") continue;
    if (String(notification.direction || "").toLowerCase() !== "received") {
      continue;
    }
    const audience = String(notification.audience || "").toLowerCase();
    if (audience === "org") continue;
    if (!PERSONAL_LEAVE_OUTCOME_STATUSES.has(String(notification.status || ""))) {
      continue;
    }
    count += 1;
  }
  return count;
}

/**
 * Unread leave-balance grant notices (Employees → leave-requests).
 * Approver badge overwrite must include these or grants disappear from the sidebar.
 */
export function countPersonalLeaveBalanceBadges(notifications) {
  let count = 0;
  for (const notification of notifications || []) {
    if (!notification?.isNew) continue;
    if (String(notification.direction || "").toLowerCase() !== "received") {
      continue;
    }
    const audience = String(notification.audience || "").toLowerCase();
    if (audience === "org") continue;
    const eventType = String(notification.eventType || "");
    const isBalance =
      eventType === "employee.leave_balances" ||
      (String(notification.category || "") === "Employees" &&
        /leave balance/i.test(String(notification.title || "")));
    if (!isBalance) continue;
    count += 1;
  }
  return count;
}

/**
 * Count unread notifications per nav item id.
 * For leave approvers, leave-requests is overwritten in navController from
 * leaveScopeNotificationCounts (My + Employees), then personal outcomes are added.
 * Non-approvers get personal open leave + outcomes from notifications here.
 */
export function countNavBadgesFromNotifications(
  notifications,
  availableNavIds,
  { role } = {},
) {
  const counts = {};

  for (const notification of notifications || []) {
    if (!notification?.isNew) continue;
    for (const navId of navIdsForNotification(notification, availableNavIds, {
      role,
    })) {
      // Actionable leave work is counted from the approvals API in navController.
      // Keep notification badges only for an employee's own leave (open + outcomes).
      if (navId === "leave-requests") {
        if (role === "hr" || role === "admin") continue;
        const audience = String(notification?.audience || "").toLowerCase();
        if (audience === "org") continue;
      }
      counts[navId] = (counts[navId] || 0) + 1;
    }
  }

  return counts;
}

/** Attach badge counts onto nav groups without mutating the source. */
export function applyNavBadges(groups, badgeCounts = {}) {
  return (groups || []).map((group) => ({
    ...group,
    items: (group.items || []).map((item) => {
      const badge = Number(badgeCounts[item.id]) || 0;
      return badge > 0 ? { ...item, badge } : { ...item, badge: 0 };
    }),
  }));
}

export function formatNavBadgeCount(count) {
  const value = Number(count) || 0;
  if (value <= 0) return "";
  if (value > 99) return "99+";
  return String(value);
}
