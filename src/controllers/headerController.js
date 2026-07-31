import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getHeaderBarClass,
  getUserMenuItems,
  mapHeaderUser,
  withNotificationSeenState,
} from "../models/headerModel.js";
import { fetchNotifications } from "../services/notificationsService.js";
import { NOTIFICATIONS_REFRESH_EVENT } from "../utils/notificationsRefresh.js";
import { requestDashboardRefresh } from "../utils/dashboardRefresh.js";
import { markFeedItemSeen } from "../utils/feedSeenState.js";
import { useAuth } from "./authContext.jsx";

const NOTIFICATIONS_POLL_MS = 60_000;
const NOTIFICATIONS_STALE_MS = 60_000;

export function useHeader() {
  const { user: authUser, logout } = useAuth();
  const navigate = useNavigate();
  const [menuToggle, setMenuToggle] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);

  const notificationsRef = useRef(null);
  const userRef = useRef(null);
  const lastFetchedAtRef = useRef(0);
  const seenUserKey =
    authUser?.id || authUser?.email || authUser?.employeeId || "";

  // Header dropdown shows all notifications (sent + received).
  // Received-only filtering is banner-only via getUnreadMessages.
  const loadNotifications = useCallback(async ({ silent = false } = {}) => {
    if (!authUser) {
      setNotifications([]);
      return;
    }

    try {
      if (!silent) setNotificationsLoading(true);
      const items = await fetchNotifications(authUser);
      setNotifications(withNotificationSeenState(items, seenUserKey));
      lastFetchedAtRef.current = Date.now();
    } catch {
      setNotifications([]);
    } finally {
      if (!silent) setNotificationsLoading(false);
    }
  }, [authUser, seenUserKey]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    function handleRefreshRequest() {
      loadNotifications({ silent: true });
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
      loadNotifications({ silent: true });
    }, NOTIFICATIONS_POLL_MS);

    function handleWindowFocus() {
      if (Date.now() - lastFetchedAtRef.current >= NOTIFICATIONS_STALE_MS) {
        loadNotifications({ silent: true });
      }
    }

    window.addEventListener("focus", handleWindowFocus);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleWindowFocus);
    };
  }, [authUser, loadNotifications]);

  const toggleMenu = useCallback(() => {
    setMenuToggle((value) => !value);
  }, []);

  const toggleNotifications = useCallback(() => {
    setNotificationsOpen((wasOpen) => {
      const nextOpen = !wasOpen;
      if (nextOpen) {
        loadNotifications({ silent: true });
      }
      return nextOpen;
    });
  }, [loadNotifications]);

  const closeNotifications = useCallback(() => {
    setNotificationsOpen(false);
  }, []);

  const toggleUserMenu = useCallback(() => {
    setUserOpen((value) => !value);
  }, []);

  const handleSignOut = useCallback(() => {
    logout();
    navigate("/signin", { replace: true });
  }, [logout, navigate]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target)
      ) {
        setNotificationsOpen(false);
      }

      if (userRef.current && !userRef.current.contains(event.target)) {
        setUserOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const acknowledgeNotification = useCallback(
    (notification, options = {}) => {
      const id = notification?.id;
      if (!seenUserKey || !id) return;

      markFeedItemSeen(seenUserKey, [id]);
      setNotifications((current) =>
        current.map((item) =>
          String(item.id) === String(id) ? { ...item, isNew: false } : item,
        ),
      );
      requestDashboardRefresh();

      if (options.navigate !== false && notification.href) {
        setNotificationsOpen(false);
        navigate(notification.href, { replace: false });
      }
    },
    [seenUserKey, navigate],
  );

  // Bell indicator: any unread item in the dropdown (sent or received).
  const hasUnread = notifications.some((item) => item.isNew);

  return {
    menuToggle,
    notificationsOpen,
    userOpen,
    user: mapHeaderUser(authUser),
    barClassName: getHeaderBarClass(authUser),
    notifications,
    notificationsLoading,
    hasUnread,
    userMenuItems: getUserMenuItems(),
    notificationsRef,
    userRef,
    toggleMenu,
    toggleNotifications,
    closeNotifications,
    toggleUserMenu,
    acknowledgeNotification,
    handleSignOut,
  };
}
