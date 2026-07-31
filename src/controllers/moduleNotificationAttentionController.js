import { useCallback, useEffect, useMemo, useState } from "react";
import {
  attentionKeysFromNavNotifications,
  attentionKeysFromRow,
  notificationIdsForAttentionKeys,
  rowNeedsModuleAttention,
  unreadNotificationIdsForNav,
} from "../models/moduleNotificationAttentionModel.js";
import { withNotificationSeenState } from "../models/headerModel.js";
import { fetchNotifications } from "../services/notificationsService.js";
import { requestDashboardRefresh } from "../utils/dashboardRefresh.js";
import { markFeedItemSeen } from "../utils/feedSeenState.js";
import {
  NOTIFICATIONS_REFRESH_EVENT,
  requestNotificationsRefresh,
} from "../utils/notificationsRefresh.js";

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
  const [highlightedKeys, setHighlightedKeys] = useState(() => new Set());
  const [hasUnread, setHasUnread] = useState(false);
  const availableNavIds = useMemo(() => [navId], [navId]);

  const loadHighlightKeys = useCallback(async () => {
    if (!enabled || !seenUserKey || !navId) {
      setHighlightedKeys(new Set());
      setHasUnread(false);
      return [];
    }

    try {
      const items = await fetchNotifications();
      const withSeen = withNotificationSeenState(items, seenUserKey);
      const keys = attentionKeysFromNavNotifications(
        withSeen,
        navId,
        availableNavIds,
        { role },
      );
      const unreadIds = unreadNotificationIdsForNav(
        withSeen,
        navId,
        availableNavIds,
        { role },
      );
      setHighlightedKeys(keys);
      setHasUnread(unreadIds.length > 0);
      return withSeen;
    } catch {
      setHighlightedKeys(new Set());
      setHasUnread(false);
      return [];
    }
  }, [availableNavIds, enabled, navId, role, seenUserKey]);

  useEffect(() => {
    loadHighlightKeys();
  }, [loadHighlightKeys]);

  useEffect(() => {
    function handleRefresh() {
      loadHighlightKeys();
    }
    window.addEventListener(NOTIFICATIONS_REFRESH_EVENT, handleRefresh);
    return () => {
      window.removeEventListener(NOTIFICATIONS_REFRESH_EVENT, handleRefresh);
    };
  }, [loadHighlightKeys]);

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

      try {
        const items = await fetchNotifications();
        const withSeen = withNotificationSeenState(items, seenUserKey);
        const feedIds = notificationIdsForAttentionKeys(
          withSeen,
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

        markFeedItemSeen(seenUserKey, feedIds, {
          retainOnlyIds: withSeen.map((item) => String(item.id)),
        });
        const marked = new Set(feedIds.map(String));
        const remainingIds = unreadNotificationIdsForNav(
          withSeen.map((item) =>
            marked.has(String(item.id)) ? { ...item, isNew: false } : item,
          ),
          navId,
          availableNavIds,
          { role },
        );
        setHasUnread(remainingIds.length > 0);
        requestNotificationsRefresh();
        requestDashboardRefresh();
      } catch {
        // Keep highlight if acknowledge fails; refresh can retry.
      }
    },
    [
      availableNavIds,
      enabled,
      highlightedKeys,
      navId,
      role,
      seenUserKey,
    ],
  );

  // Calendar-release style notices have no row key — clear on module visit.
  useEffect(() => {
    if (!enabled || !acknowledgeOrphansOnMount || !seenUserKey || !navId) {
      return undefined;
    }

    let cancelled = false;

    async function acknowledgeOrphans() {
      try {
        const items = await fetchNotifications();
        if (cancelled) return;
        const withSeen = withNotificationSeenState(items, seenUserKey);
        const feedIds = notificationIdsForAttentionKeys(
          withSeen,
          navId,
          [],
          availableNavIds,
          { role },
        );
        if (feedIds.length === 0) return;

        markFeedItemSeen(seenUserKey, feedIds, {
          retainOnlyIds: withSeen.map((item) => String(item.id)),
        });
        requestNotificationsRefresh();
        requestDashboardRefresh();
      } catch {
        // ignore
      }
    }

    acknowledgeOrphans();
    return () => {
      cancelled = true;
    };
  }, [
    acknowledgeOrphansOnMount,
    availableNavIds,
    enabled,
    navId,
    role,
    seenUserKey,
  ]);

  const markAllAsRead = useCallback(async () => {
    if (!enabled || !seenUserKey || !navId) return;

    try {
      const items = await fetchNotifications();
      const withSeen = withNotificationSeenState(items, seenUserKey);
      const feedIds = unreadNotificationIdsForNav(
        withSeen,
        navId,
        availableNavIds,
        { role },
      );

      setHighlightedKeys(new Set());
      setHasUnread(false);
      if (feedIds.length === 0) return;

      markFeedItemSeen(seenUserKey, feedIds, {
        retainOnlyIds: withSeen.map((item) => String(item.id)),
      });
      requestNotificationsRefresh();
      requestDashboardRefresh();
    } catch {
      // Keep unread state if mark-all fails; refresh can retry.
    }
  }, [availableNavIds, enabled, navId, role, seenUserKey]);

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
    loadHighlightKeys,
  };
}
