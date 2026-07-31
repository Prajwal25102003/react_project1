import {
  isRemovalOnlyNotification,
  navIdsForNotification,
} from "./navBadgesModel.js";

/** Soft brand row highlight shared by non-leave modules. */
export const MODULE_ATTENTION_ROW_CLASS = "bg-brand-25 hover:bg-brand-25";
export const MODULE_IDLE_ROW_CLASS = "bg-white hover:bg-gray-50/80";

/**
 * Keys used to match a notification to a list row for a nav module.
 * Leave: personal Rejected/Approved outcomes highlight by leave request id.
 * Actionable pending approvals still use leaveRequestNeedsAttention separately.
 */
export function attentionKeysFromNotification(notification, navId) {
  if (!notification || !navId) return [];

  switch (navId) {
    case "employees": {
      if (isRemovalOnlyNotification(notification)) return [];
      return [notification.subjectEmployeeId].filter(Boolean).map(String);
    }
    case "attendance": {
      // Deletions stay in the header feed only — no row highlight.
      if (isRemovalOnlyNotification(notification)) return [];
      // Prefer record ids (import / edit) so only those rows highlight.
      const recordIds = [
        notification.attendanceId,
        ...(Array.isArray(notification.attendanceIds)
          ? notification.attendanceIds
          : []),
      ]
        .filter(Boolean)
        .map(String);
      if (recordIds.length > 0) return recordIds;
      return [
        notification.subjectEmployeeId,
        ...(Array.isArray(notification.employeeIds)
          ? notification.employeeIds
          : []),
      ]
        .filter(Boolean)
        .map(String);
    }
    case "departments": {
      // Deletions stay in the header feed only — no row highlight.
      if (isRemovalOnlyNotification(notification)) return [];
      return [notification.departmentId, notification.departmentName]
        .filter(Boolean)
        .map(String);
    }
    case "holidays":
      return [notification.holidayId, notification.holidayDate]
        .filter(Boolean)
        .map(String);
    case "leave-requests": {
      // Only closed personal outcomes — pending approvals use needsAction.
      const status = String(notification.status || "");
      if (status !== "Rejected" && status !== "Approved") return [];
      if (String(notification.direction || "").toLowerCase() !== "received") {
        return [];
      }
      return [notification.leaveRequestId].filter(Boolean).map(String);
    }
    default:
      return [];
  }
}

/** Keys from a table row for the same matching rules. */
export function attentionKeysFromRow(row, navId) {
  if (!row || !navId) return [];

  switch (navId) {
    case "employees":
      return [row.id].filter(Boolean).map(String);
    case "attendance":
      return [row.id, row.employeeId].filter(Boolean).map(String);
    case "departments":
      return [row.id, row.name].filter(Boolean).map(String);
    case "holidays":
      return [row.id, row.date].filter(Boolean).map(String);
    case "leave-requests":
      return [row.id].filter(Boolean).map(String);
    default:
      return [];
  }
}

function notificationTargetsNav(notification, navId, availableNavIds, role) {
  return navIdsForNotification(notification, availableNavIds, { role }).includes(
    navId,
  );
}

/** Unread attention keys for rows in a module. */
export function attentionKeysFromNavNotifications(
  notifications,
  navId,
  availableNavIds = [],
  { role } = {},
) {
  const keys = new Set();
  if (!navId) return keys;

  for (const notification of notifications || []) {
    if (!notification?.isNew) continue;
    if (!notificationTargetsNav(notification, navId, availableNavIds, role)) {
      continue;
    }
    for (const key of attentionKeysFromNotification(notification, navId)) {
      keys.add(key);
    }
  }

  return keys;
}

/**
 * Unread notification ids for a module that match any of the given row keys.
 * When `keys` is empty, returns unread module notifications with no row keys
 * (e.g. holiday calendar release).
 */
export function notificationIdsForAttentionKeys(
  notifications,
  navId,
  keys,
  availableNavIds = [],
  { role } = {},
) {
  if (!navId) return [];
  const keySet = new Set((keys || []).map(String).filter(Boolean));
  const ids = [];

  for (const notification of notifications || []) {
    if (!notification?.isNew) continue;
    if (!notificationTargetsNav(notification, navId, availableNavIds, role)) {
      continue;
    }

    const noticeKeys = attentionKeysFromNotification(notification, navId);
    if (keySet.size === 0) {
      if (noticeKeys.length === 0) ids.push(String(notification.id));
      continue;
    }

    if (noticeKeys.some((key) => keySet.has(key))) {
      ids.push(String(notification.id));
    }
  }

  return ids;
}

export function rowNeedsModuleAttention(row, highlightedKeys, navId) {
  if (!highlightedKeys?.size) return false;
  return attentionKeysFromRow(row, navId).some((key) =>
    highlightedKeys.has(key),
  );
}

/** All unread notification ids that target a nav module (with or without row keys). */
export function unreadNotificationIdsForNav(
  notifications,
  navId,
  availableNavIds = [],
  { role } = {},
) {
  if (!navId) return [];
  const ids = [];

  for (const notification of notifications || []) {
    if (!notification?.isNew) continue;
    if (!notificationTargetsNav(notification, navId, availableNavIds, role)) {
      continue;
    }
    ids.push(String(notification.id));
  }

  return ids;
}
