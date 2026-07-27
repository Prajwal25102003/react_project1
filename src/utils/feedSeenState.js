import { markActivitiesSeen } from "../models/dashboardModel.js";
import { markNotificationsSeen } from "../models/headerModel.js";

/**
 * Notifications, banner, and recent activities share the same activity ids.
 * Mark both seen stores so unread indicators clear everywhere after one interaction.
 */
export function markFeedItemSeen(userKey, ids, options = {}) {
  if (!userKey) return;
  const list = (ids || []).map(String).filter(Boolean);
  if (list.length === 0) return;

  markNotificationsSeen(userKey, list, options);
  markActivitiesSeen(userKey, list, options);
}
