import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { withNotificationSeenState } from "../models/headerModel.js";
import { fetchNotifications } from "../services/notificationsService.js";
import { markFeedItemSeen } from "../utils/feedSeenState.js";
import { NOTIFICATIONS_REFRESH_EVENT } from "../utils/notificationsRefresh.js";
import { useAuth } from "./authContext.jsx";

const NOTIFICATIONS_POLL_MS = 60_000;
const NOTIFICATIONS_STALE_MS = 60_000;

const NotificationsContext = createContext(null);

/** Shared notifications state for header, dashboard, and module attention. */
export function useNotificationsProviderValue() {
  const { user: authUser } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const lastFetchedAtRef = useRef(0);
  const inFlightRef = useRef(null);
  const seenUserKey =
    authUser?.id || authUser?.email || authUser?.employeeId || "";

  const notificationsRef = useRef(notifications);
  notificationsRef.current = notifications;

  const loadNotifications = useCallback(
    async ({ silent = false, force = false } = {}) => {
      if (!authUser) {
        setNotifications([]);
        lastFetchedAtRef.current = 0;
        return [];
      }

      if (inFlightRef.current) return inFlightRef.current;

      if (
        !force &&
        lastFetchedAtRef.current > 0 &&
        Date.now() - lastFetchedAtRef.current < NOTIFICATIONS_STALE_MS
      ) {
        return notificationsRef.current;
      }

      const request = (async () => {
        try {
          if (!silent) setLoading(true);
          const items = await fetchNotifications(authUser);
          const withSeen = withNotificationSeenState(items, seenUserKey);
          setNotifications(withSeen);
          lastFetchedAtRef.current = Date.now();
          return withSeen;
        } catch {
          setNotifications([]);
          return [];
        } finally {
          if (!silent) setLoading(false);
          inFlightRef.current = null;
        }
      })();

      inFlightRef.current = request;
      return request;
    },
    [authUser, seenUserKey],
  );

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    function handleRefreshRequest() {
      loadNotifications({ silent: true, force: true });
    }

    window.addEventListener(NOTIFICATIONS_REFRESH_EVENT, handleRefreshRequest);
    return () => {
      window.removeEventListener(
        NOTIFICATIONS_REFRESH_EVENT,
        handleRefreshRequest,
      );
    };
  }, [loadNotifications]);

  useEffect(() => {
    if (!authUser) return undefined;

    const intervalId = window.setInterval(() => {
      loadNotifications({ silent: true, force: true });
    }, NOTIFICATIONS_POLL_MS);

    function handleWindowFocus() {
      if (Date.now() - lastFetchedAtRef.current >= NOTIFICATIONS_STALE_MS) {
        loadNotifications({ silent: true, force: true });
      }
    }

    window.addEventListener("focus", handleWindowFocus);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleWindowFocus);
    };
  }, [authUser, loadNotifications]);

  const markNotificationsSeen = useCallback(
    (ids, { retainOnlyIds } = {}) => {
      const list = (Array.isArray(ids) ? ids : [ids])
        .map(String)
        .filter(Boolean);
      if (!seenUserKey || list.length === 0) return;

      markFeedItemSeen(seenUserKey, list, { retainOnlyIds });
      const marked = new Set(list);
      setNotifications((current) =>
        current.map((item) =>
          marked.has(String(item.id)) ? { ...item, isNew: false } : item,
        ),
      );
    },
    [seenUserKey],
  );

  const hasUnread = notifications.some((item) => item.isNew);

  return useMemo(
    () => ({
      notifications,
      notificationsLoading: loading,
      hasUnread,
      seenUserKey,
      loadNotifications,
      markNotificationsSeen,
      lastFetchedAt: lastFetchedAtRef.current,
    }),
    [
      notifications,
      loading,
      hasUnread,
      seenUserKey,
      loadNotifications,
      markNotificationsSeen,
    ],
  );
}

export { NotificationsContext };

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) {
    throw new Error("useNotifications must be used within NotificationsProvider");
  }
  return ctx;
}
