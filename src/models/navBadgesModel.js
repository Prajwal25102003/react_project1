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
 * Each module only receives messages that belong to it.
 *
 * Leave:
 * - personal + still open (Pending) → My Leave Requests
 * - personal + closed (Approved/Rejected/Cancelled) → no sidebar badge
 * - org/team awaiting decision → Employee Leave Requests (approvals count)
 * - org-wide leave outcomes → no sidebar module badge
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
  const isOrgAudience = audience === "org";
  const isPersonalAudience = audience === "self" || audience === "personal";
  const isStaff = role === "hr" || role === "admin";

  if (category === "Leave") {
    const stillOpen = LEAVE_APPROVAL_STATUSES.has(status);

    // Personal leave: badge My Leave only while the request is still open.
    const isPersonalLeave =
      isPersonalAudience ||
      (!isOrgAudience && (!isStaff || role === "employee"));

    if (isPersonalLeave && available.has("leave-requests")) {
      return stillOpen ? ["leave-requests"] : [];
    }

    // Org/team items still awaiting a decision → approvals module.
    if (stillOpen && available.has("leave-approvals")) {
      return ["leave-approvals"];
    }

    return [];
  }

  const mapped = NOTIFICATION_CATEGORY_NAV_IDS[category] || [];
  return mapped.filter((id) => available.has(id));
}

/**
 * Count unread notifications per nav item id.
 * Leave approvals are excluded — those badges track open approve/reject work
 * (see countActionableLeaveApprovals).
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
