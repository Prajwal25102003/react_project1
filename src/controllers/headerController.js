import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getHeaderBarClass,
  getUserMenuItems,
  mapHeaderUser,
} from "../models/headerModel.js";
import { requestDashboardRefresh } from "../utils/dashboardRefresh.js";
import { useAuth } from "./authContext.jsx";
import { useNotifications } from "./notificationsContext.jsx";

export function useHeader() {
  const { user: authUser, logout } = useAuth();
  const {
    notifications,
    notificationsLoading,
    hasUnread,
    loadNotifications,
    markNotificationsSeen,
  } = useNotifications();
  const navigate = useNavigate();
  const [menuToggle, setMenuToggle] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);

  const notificationsRef = useRef(null);
  const userRef = useRef(null);

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
      if (!id) return;

      markNotificationsSeen([id]);
      requestDashboardRefresh();

      if (options.navigate !== false && notification.href) {
        setNotificationsOpen(false);
        navigate(notification.href, { replace: false });
      }
    },
    [markNotificationsSeen, navigate],
  );

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
