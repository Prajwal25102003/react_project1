import { STATUS_TONE, getStatusClass } from "./statusStylesModel.js";
import { createSeenStateHelpers } from "../utils/seenState.js";

const NOTIFICATION_STATUS = {
  Completed: STATUS_TONE.success,
  Pending: STATUS_TONE.warning,
  Added: STATUS_TONE.success,
  Updated: STATUS_TONE.info,
  Removed: STATUS_TONE.error,
  TeamLeadApproved: STATUS_TONE.info,
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

/**
 * Get navigation path for a notification/activity based on category and ID.
 */
export function getNotificationPath(notification) {
  const category = String(notification?.category || "").toLowerCase();
  const id = notification?.id || "";
  const direction = notification?.direction || null;

  // First check for explicit leaveRequestId from meta (new activities)
  const leaveRequestId = notification?.leaveRequestId;
  // Fallback: extract from composite ID like "leave-LR-001"
  const leaveIdFromId = extractResourceId(id, "leave");
  const attId = extractResourceId(id, "att");

  if (category === "leave") {
    const targetLeaveId = leaveRequestId || leaveIdFromId;
    if (!targetLeaveId) return "/leave-requests";
    const params = new URLSearchParams({ id: targetLeaveId });
    if (direction === "sent" || direction === "received") {
      params.set("direction", direction);
    }
    return `/leave-requests?${params.toString()}`;
  }

  if (category === "attendance") {
    return attId ? `/attendance?id=${attId}` : "/attendance";
  }

  if (category === "employees") {
    return "/employees";
  }

  if (category === "departments") {
    return "/departments";
  }

  if (category === "holidays") {
    return "/holidays";
  }

  // Default: stay on dashboard
  return null;
}

export function mapNotifications(notifications) {
  return (notifications || []).map((notification) => {
    const mapped = {
      id: notification.id,
      title: notification.title || "",
      description: notification.description || "",
      category: notification.category || "",
      time: notification.time || "",
      status: notification.status || "Info",
      audience: notification.audience || null,
      direction: notification.direction || null,
      leaveRequestId: notification.leaveRequestId || null,
      statusClass: getStatusClass(
        NOTIFICATION_STATUS,
        notification.status,
        "Info",
      ),
      isNew: false,
    };
    mapped.href = getNotificationPath(mapped);
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
 * Latest N notifications always display. Unseen → isNew; they stay unread
 * until the user interacts with (clicks) that notification.
 */
export function withNotificationSeenState(notifications, userKey) {
  const list = notifications || [];
  const currentIds = list.map((item) => String(item.id)).filter(Boolean);
  pruneNotificationSeen(userKey, currentIds);

  const seenSet = new Set(getSeenNotificationIds(userKey));

  return list.map((item) => ({
    ...item,
    isNew: Boolean(item.id) && !seenSet.has(String(item.id)),
  }));
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

  if (status === "Updated" || status === "TeamLeadApproved") {
    return "info";
  }

  return "success";
}
