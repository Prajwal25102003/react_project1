import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./authContext.jsx";
import { fetchDashboard } from "../services/dashboardService.js";
import { fetchNotifications } from "../services/notificationsService.js";
import {
  withActivitySeenState,
  withOrgUnreadMessagesMetric,
} from "../models/dashboardModel.js";
import { withNotificationSeenState } from "../models/headerModel.js";
import { DASHBOARD_REFRESH_EVENT } from "../utils/dashboardRefresh.js";
import {
  NOTIFICATIONS_REFRESH_EVENT,
  requestNotificationsRefresh,
} from "../utils/notificationsRefresh.js";
import { markFeedItemSeen } from "../utils/feedSeenState.js";

const DASHBOARD_STALE_MS = 60_000;

const EMPTY = {
  variant: "org",
  primaryMetrics: [],
  metrics: [],
  secondaryMetrics: [],
  activities: [],
  departments: [],
  leaveOverview: [],
  chartTwo: null,
  unreadMessages: [],
  newEmployeesPeriod: "month",
};

export function useDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(EMPTY);
  const [newEmployeesPeriod, setNewEmployeesPeriod] = useState("month");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [messagesOpen, setMessagesOpen] = useState(false);
  const [messagesPreview, setMessagesPreview] = useState([]);
  const hasLoadedRef = useRef(false);
  const lastFetchedAtRef = useRef(0);
  const periodRef = useRef(newEmployeesPeriod);
  const seenUserKey = user?.id || user?.email || user?.employeeId || "";

  const loadUnreadMessagesMetric = useCallback(async () => {
    try {
      const items = withNotificationSeenState(
        await fetchNotifications(),
        seenUserKey,
      );
      setData((current) => withOrgUnreadMessagesMetric(current, items));
    } catch {
      setData((current) => withOrgUnreadMessagesMetric(current, []));
    }
  }, [seenUserKey]);

  const loadDashboard = useCallback(
    async ({ silent = false, scope } = {}) => {
      const isInitialLoad = !hasLoadedRef.current;
      const metricsOnly = scope === "metrics";

      try {
        if (isInitialLoad && !silent) setLoading(true);
        setError("");
        const dashboard = await fetchDashboard(newEmployeesPeriod, { scope });
        const activities = withActivitySeenState(
          dashboard.activities,
          seenUserKey,
        );

        let nextDashboard = dashboard;
        try {
          const items = withNotificationSeenState(
            await fetchNotifications(),
            seenUserKey,
          );
          nextDashboard = withOrgUnreadMessagesMetric(dashboard, items);
        } catch {
          nextDashboard = withOrgUnreadMessagesMetric(dashboard, []);
        }

        setData((current) => {
          if (metricsOnly && current.variant === "org") {
            return {
              ...current,
              primaryMetrics: nextDashboard.primaryMetrics,
              metrics: nextDashboard.metrics,
              unreadMessages: nextDashboard.unreadMessages,
              newEmployeesPeriod: nextDashboard.newEmployeesPeriod,
            };
          }

          if (metricsOnly) {
            return {
              ...current,
              unreadMessages: nextDashboard.unreadMessages,
            };
          }

          return {
            ...nextDashboard,
            activities,
            departments: nextDashboard.departments,
          };
        });
        hasLoadedRef.current = true;
        lastFetchedAtRef.current = Date.now();
      } catch (err) {
        setError(err.message || "Failed to load dashboard");
        if (isInitialLoad && !silent) setData(EMPTY);
      } finally {
        if (isInitialLoad && !silent) setLoading(false);
      }
    },
    [newEmployeesPeriod, seenUserKey],
  );

  useEffect(() => {
    const periodChanged =
      hasLoadedRef.current && periodRef.current !== newEmployeesPeriod;
    periodRef.current = newEmployeesPeriod;

    if (periodChanged) {
      loadDashboard({ silent: true, scope: "metrics" });
      return;
    }

    loadDashboard();
  }, [loadDashboard, newEmployeesPeriod]);

  useEffect(() => {
    function handleRefreshRequest() {
      loadDashboard({ silent: true });
    }

    window.addEventListener(DASHBOARD_REFRESH_EVENT, handleRefreshRequest);
    return () => {
      window.removeEventListener(DASHBOARD_REFRESH_EVENT, handleRefreshRequest);
    };
  }, [loadDashboard]);

  useEffect(() => {
    function handleNotificationsRefresh() {
      if (!hasLoadedRef.current) return;
      loadUnreadMessagesMetric();
    }

    window.addEventListener(
      NOTIFICATIONS_REFRESH_EVENT,
      handleNotificationsRefresh,
    );
    return () => {
      window.removeEventListener(
        NOTIFICATIONS_REFRESH_EVENT,
        handleNotificationsRefresh,
      );
    };
  }, [loadUnreadMessagesMetric]);

  useEffect(() => {
    function handleWindowFocus() {
      if (!hasLoadedRef.current) return;
      if (Date.now() - lastFetchedAtRef.current < DASHBOARD_STALE_MS) return;
      loadDashboard({ silent: true });
    }

    window.addEventListener("focus", handleWindowFocus);
    return () => {
      window.removeEventListener("focus", handleWindowFocus);
    };
  }, [loadDashboard]);

  const openUnreadMessages = useCallback(() => {
    setMessagesPreview(data.unreadMessages || []);
    setMessagesOpen(true);
  }, [data.unreadMessages]);

  const closeUnreadMessages = useCallback(() => {
    setMessagesOpen(false);
    setMessagesPreview([]);
  }, []);

  const acknowledgeUnreadMessage = useCallback(
    (message, options = {}) => {
      const id = message?.id;
      if (!seenUserKey || !id) return;

      markFeedItemSeen(seenUserKey, [id]);
      setMessagesPreview((current) =>
        (current || []).filter((item) => String(item.id) !== String(id)),
      );
      setData((current) => {
        const remaining = (current.unreadMessages || []).filter(
          (item) => String(item.id) !== String(id),
        );
        return {
          ...withOrgUnreadMessagesMetric(
            current,
            remaining.map((item) => ({ ...item, isNew: true })),
          ),
          activities: (current.activities || []).map((activity) =>
            String(activity.id) === String(id)
              ? { ...activity, isNew: false }
              : activity,
          ),
        };
      });
      requestNotificationsRefresh();

      if (options.navigate !== false && message.href) {
        setMessagesOpen(false);
        navigate(message.href);
      }
    },
    [seenUserKey, navigate],
  );

  const dismissUnreadMessage = useCallback(
    (message) => acknowledgeUnreadMessage(message, { navigate: false }),
    [acknowledgeUnreadMessage],
  );

  const acknowledgeActivity = useCallback(
    (activity) => {
      const id = activity?.id;
      if (!seenUserKey || !id) return;

      markFeedItemSeen(seenUserKey, [id]);
      setData((current) => {
        const remaining = (current.unreadMessages || []).filter(
          (item) => String(item.id) !== String(id),
        );
        return {
          ...withOrgUnreadMessagesMetric(
            current,
            remaining.map((item) => ({ ...item, isNew: true })),
          ),
          activities: (current.activities || []).map((item) =>
            String(item.id) === String(id) ? { ...item, isNew: false } : item,
          ),
        };
      });
      requestNotificationsRefresh();

      if (activity.href) {
        navigate(activity.href);
      }
    },
    [seenUserKey, navigate],
  );

  const markAllAsRead = useCallback(async () => {
    if (!seenUserKey) return;

    const activityIds = (data.activities || [])
      .map((activity) => activity.id)
      .filter(Boolean);
    const unreadIds = (data.unreadMessages || [])
      .map((message) => message.id)
      .filter(Boolean);

    let notificationIds = [];
    try {
      notificationIds = (await fetchNotifications())
        .map((item) => item.id)
        .filter(Boolean);
    } catch {
      notificationIds = [];
    }

    const allIds = [
      ...new Set(
        [...activityIds, ...unreadIds, ...notificationIds].map(String),
      ),
    ];
    if (allIds.length === 0) return;

    markFeedItemSeen(seenUserKey, allIds);
    setMessagesPreview([]);
    setData((current) => ({
      ...withOrgUnreadMessagesMetric(current, []),
      activities: (current.activities || []).map((activity) => ({
        ...activity,
        isNew: false,
      })),
      unreadMessages: [],
    }));
    requestNotificationsRefresh();
  }, [seenUserKey, data.activities, data.unreadMessages]);

  const handleMetricAction = useCallback(
    (metric) => {
      if (metric?.action === "unread-messages") {
        openUnreadMessages();
      }
    },
    [openUnreadMessages],
  );

  return {
    ...data,
    newEmployeesPeriod,
    setNewEmployeesPeriod,
    loading,
    error,
    messagesOpen,
    messagesPreview,
    openUnreadMessages,
    closeUnreadMessages,
    acknowledgeUnreadMessage,
    dismissUnreadMessage,
    acknowledgeActivity,
    markAllAsRead,
    handleMetricAction,
  };
}
