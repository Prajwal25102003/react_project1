/** Map recent-activity categories to sidebar nav item ids. */
export const NOTIFICATION_CATEGORY_NAV_IDS = {
  Attendance: ["attendance"],
  Employees: ["employees"],
  Departments: ["departments"],
  Holidays: ["holidays"],
};

const LEAVE_APPROVAL_STATUSES = new Set(["Pending", "TeamLeadApproved"]);

/**
 * Resolve which nav module(s) should show a badge for one notification.
 * Leave is split: pending/awaiting → approvals; outcomes → my leave requests.
 */
export function navIdsForNotification(notification, availableNavIds = []) {
  const available = new Set(availableNavIds);
  const category = String(notification?.category || "");

  if (category === "Leave") {
    const preferApprovals = LEAVE_APPROVAL_STATUSES.has(
      String(notification?.status || ""),
    );
    if (preferApprovals && available.has("leave-approvals")) {
      return ["leave-approvals"];
    }
    if (available.has("leave-requests")) return ["leave-requests"];
    if (available.has("leave-approvals")) return ["leave-approvals"];
    return [];
  }

  const mapped = NOTIFICATION_CATEGORY_NAV_IDS[category] || [];
  return mapped.filter((id) => available.has(id));
}

/** Count unread notifications per nav item id.
 * Leave approvals are excluded — those badges track open approve/reject work
 * until the request is committed (see countActionableLeaveApprovals).
 */
export function countNavBadgesFromNotifications(notifications, availableNavIds) {
  const counts = {};

  for (const notification of notifications || []) {
    if (!notification?.isNew) continue;
    for (const navId of navIdsForNotification(notification, availableNavIds)) {
      if (navId === "leave-approvals") continue;
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
