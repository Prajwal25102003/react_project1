import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  attentionKeysFromNavNotifications,
  attentionKeysFromRow,
  notificationIdsForAttentionKeys,
  rowNeedsModuleAttention,
  unreadNotificationIdsForNav,
} from "../models/moduleNotificationAttentionModel.js";
import { requestDashboardRefresh } from "../utils/dashboardRefresh.js";
import { requestNotificationsRefresh } from "../utils/notificationsRefresh.js";
import { useNotifications } from "./notificationsContext.jsx";

/**
 * Highlight rows from unread module notifications; acknowledge on interact
 * (clears highlight, sidebar badge, notifications + activity seen state).
 * Leave: personal Rejected/Approved outcomes; pending approvals use needsAction.
 */
export function useModuleNotificationAttention({
  navId,
  role,
  seenUserKey,
  enabled = true,
  acknowledgeOrphansOnMount = false,
}) {
  const { notifications, markNotificationsSeen } = useNotifications();
  const [highlightedKeys, setHighlightedKeys] = useState(() => new Set());
  const [hasUnread, setHasUnread] = useState(false);
  const orphansAcknowledgedRef = useRef(false);
  const availableNavIds = useMemo(() => [navId], [navId]);

  const syncFromNotifications = useCallback(() => {
    if (!enabled || !seenUserKey || !navId) {
      setHighlightedKeys(new Set());
      setHasUnread(false);
      return;
    }

    const keys = attentionKeysFromNavNotifications(
      notifications,
      navId,
      availableNavIds,
      { role },
    );
    const unreadIds = unreadNotificationIdsForNav(
      notifications,
      navId,
      availableNavIds,
      { role },
    );
    setHighlightedKeys(keys);
    setHasUnread(unreadIds.length > 0);
  }, [availableNavIds, enabled, navId, notifications, role, seenUserKey]);

  useEffect(() => {
    syncFromNotifications();
  }, [syncFromNotifications]);

  const acknowledgeAttention = useCallback(
    async (rowOrKeys) => {
      if (!enabled || !seenUserKey || !navId) return;

      const keys = Array.isArray(rowOrKeys)
        ? rowOrKeys
        : rowOrKeys && typeof rowOrKeys === "object"
          ? attentionKeysFromRow(rowOrKeys, navId)
          : [rowOrKeys];
      const normalized = keys.map(String).filter(Boolean);
      if (normalized.length === 0) return;

      const isHighlighted = normalized.some((key) => highlightedKeys.has(key));
      if (!isHighlighted) return;

      const feedIds = notificationIdsForAttentionKeys(
        notifications,
        navId,
        normalized,
        availableNavIds,
        { role },
      );

      setHighlightedKeys((current) => {
        const next = new Set(current);
        for (const key of normalized) next.delete(key);
        return next;
      });

      if (feedIds.length === 0) {
        setHasUnread(false);
        return;
      }

      markNotificationsSeen(feedIds, {
        retainOnlyIds: notifications.map((item) => String(item.id)),
      });
      const marked = new Set(feedIds.map(String));
      const remainingIds = unreadNotificationIdsForNav(
        notifications.map((item) =>
          marked.has(String(item.id)) ? { ...item, isNew: false } : item,
        ),
        navId,
        availableNavIds,
        { role },
      );
      setHasUnread(remainingIds.length > 0);
      requestNotificationsRefresh();
      requestDashboardRefresh();
    },
    [
      availableNavIds,
      enabled,
      highlightedKeys,
      markNotificationsSeen,
      navId,
      notifications,
      role,
      seenUserKey,
    ],
  );

  // Calendar-release style notices have no row key — clear once on module visit.
  useEffect(() => {
    orphansAcknowledgedRef.current = false;
  }, [navId, seenUserKey]);

  useEffect(() => {
    if (!enabled || !acknowledgeOrphansOnMount || !seenUserKey || !navId) {
      return;
    }
    if (orphansAcknowledgedRef.current || notifications.length === 0) return;

    const feedIds = notificationIdsForAttentionKeys(
      notifications,
      navId,
      [],
      availableNavIds,
      { role },
    );
    orphansAcknowledgedRef.current = true;
    if (feedIds.length === 0) return;

    markNotificationsSeen(feedIds, {
      retainOnlyIds: notifications.map((item) => String(item.id)),
    });
    requestNotificationsRefresh();
    requestDashboardRefresh();
  }, [
    acknowledgeOrphansOnMount,
    availableNavIds,
    enabled,
    markNotificationsSeen,
    navId,
    notifications,
    role,
    seenUserKey,
  ]);

  const markAllAsRead = useCallback(async () => {
    if (!enabled || !seenUserKey || !navId) return;

    const feedIds = unreadNotificationIdsForNav(
      notifications,
      navId,
      availableNavIds,
      { role },
    );

    setHighlightedKeys(new Set());
    setHasUnread(false);
    if (feedIds.length === 0) return;

    markNotificationsSeen(feedIds, {
      retainOnlyIds: notifications.map((item) => String(item.id)),
    });
    requestNotificationsRefresh();
    requestDashboardRefresh();
  }, [
    availableNavIds,
    enabled,
    markNotificationsSeen,
    navId,
    notifications,
    role,
    seenUserKey,
  ]);

  const withAttention = useCallback(
    (rows) =>
      (rows || []).map((row) => ({
        ...row,
        needsAttention: rowNeedsModuleAttention(row, highlightedKeys, navId),
      })),
    [highlightedKeys, navId],
  );

  return {
    highlightedKeys,
    hasUnread,
    acknowledgeAttention,
    markAllAsRead,
    withAttention,
    loadHighlightKeys: syncFromNotifications,
  };
}
