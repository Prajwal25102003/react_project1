import { STATUS_TONE, getStatusClass } from "./statusStylesModel.js";
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
  Late: STATUS_TONE.warning,
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

export function mapNotifications(notifications) {
  return (notifications || []).map((notification) => ({
    id: notification.id,
    title: notification.title || "",
    description: notification.description || "",
    category: notification.category || "",
    time: notification.time || "",
    status: notification.status || "Info",
    statusClass: getStatusClass(
      NOTIFICATION_STATUS,
      notification.status,
      "Info",
    ),
    isNew: false,
  }));
}

const {
  getSeenIds: getSeenNotificationIds,
  markSeen: markNotificationsSeen,
  pruneSeenToIds: pruneNotificationSeen,
} = createSeenStateHelpers("ems_seen_notifications_v2_");

export { getSeenNotificationIds, markNotificationsSeen };

/**
 * Latest N notifications always display. Unseen → isNew; after opening the
 * panel they stay in the limited list without the unread highlight.
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

  if (status === "Pending" || status === "Cancelled" || status === "Late") {
    return "warning";
  }

  return "success";
}
