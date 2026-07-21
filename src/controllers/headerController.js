import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getUserMenuItems,
  mapHeaderUser,
  markNotificationsSeen,
  withNotificationSeenState,
} from "../models/headerModel.js";
import { fetchNotifications } from "../services/notificationsService.js";
import {
  NOTIFICATIONS_REFRESH_EVENT,
} from "../utils/notificationsRefresh.js";
import { useAuth } from "./authContext.jsx";

const NOTIFICATIONS_POLL_MS = 60_000;
const NOTIFICATIONS_STALE_MS = 60_000;

export function useHeader() {
  const { user: authUser, logout } = useAuth();
  const navigate = useNavigate();
  const [menuToggle, setMenuToggle] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);

  const notificationsRef = useRef(null);
  const userRef = useRef(null);
  const lastFetchedAtRef = useRef(0);
  const seenUserKey =
    authUser?.id || authUser?.email || authUser?.employeeId || "";

  const loadNotifications = useCallback(async ({ silent = false } = {}) => {
    if (!authUser) {
      setNotifications([]);
      return;
    }

    try {
      if (!silent) setNotificationsLoading(true);
      const items = await fetchNotifications();
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

  useEffect(() => {
    if (!notificationsOpen || !seenUserKey) return undefined;

    const isAdmin = authUser?.role === "admin";

    // Non-admin: Holidays stay unread until the Holiday Calendar page is viewed.
    // Admin: clear with the bell — they only need header confirmation messages.
    const unreadIds = notifications
      .filter(
        (item) =>
          item.isNew && (isAdmin || item.category !== "Holidays"),
      )
      .map((item) => item.id);
    if (unreadIds.length === 0) return undefined;

    const timer = window.setTimeout(() => {
      markNotificationsSeen(seenUserKey, unreadIds, {
        retainOnlyIds: notifications.map((item) => item.id),
      });
      setNotifications((current) =>
        current.map((item) => {
          if (!isAdmin && item.category === "Holidays") return item;
          return { ...item, isNew: false };
        }),
      );
    }, 600);

    return () => window.clearTimeout(timer);
  }, [notificationsOpen, notifications, seenUserKey, authUser?.role]);

  const hasUnread = notifications.some((item) => item.isNew);

  return {
    menuToggle,
    searchQuery,
    notificationsOpen,
    userOpen,
    user: mapHeaderUser(authUser),
    notifications,
    notificationsLoading,
    hasUnread,
    userMenuItems: getUserMenuItems(),
    notificationsRef,
    userRef,
    setSearchQuery,
    toggleMenu,
    toggleNotifications,
    closeNotifications,
    toggleUserMenu,
    handleSignOut,
  };
}
