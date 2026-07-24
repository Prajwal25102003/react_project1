import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./authContext.jsx";
import { fetchDashboard } from "../services/dashboardService.js";
import { fetchNotifications } from "../services/notificationsService.js";
import {
  markActivitiesSeen,
  withActivitySeenState,
  withOrgUnreadMessagesMetric,
} from "../models/dashboardModel.js";
import {
  markNotificationsSeen,
  withNotificationSeenState,
} from "../models/headerModel.js";
import { DASHBOARD_REFRESH_EVENT } from "../utils/dashboardRefresh.js";
import {
  NOTIFICATIONS_REFRESH_EVENT,
  requestNotificationsRefresh,
} from "../utils/notificationsRefresh.js";

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
        if (dashboard.variant === "org") {
          try {
            const items = withNotificationSeenState(
              await fetchNotifications(),
              seenUserKey,
            );
            nextDashboard = withOrgUnreadMessagesMetric(dashboard, items);
          } catch {
            nextDashboard = withOrgUnreadMessagesMetric(dashboard, []);
          }
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

          return {
            ...nextDashboard,
            activities: metricsOnly ? current.activities : activities,
            departments: metricsOnly
              ? current.departments
              : nextDashboard.departments,
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

  useEffect(() => {
    if (!seenUserKey) return undefined;
    if (!data.activities?.length) return undefined;

    const unreadIds = data.activities
      .filter((activity) => activity.isNew)
      .map((activity) => activity.id);
    if (unreadIds.length === 0) return undefined;

    const retainIds = data.activities.map((activity) => activity.id);
    const timer = window.setTimeout(() => {
      markActivitiesSeen(seenUserKey, unreadIds, { retainOnlyIds: retainIds });
      setData((current) => ({
        ...current,
        activities: (current.activities || []).map((activity) => ({
          ...activity,
          isNew: false,
        })),
      }));
    }, 1200);

    return () => window.clearTimeout(timer);
  }, [data.activities, seenUserKey]);

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

      markNotificationsSeen(seenUserKey, [id]);
      setMessagesPreview((current) =>
        (current || []).filter((item) => String(item.id) !== String(id)),
      );
      setData((current) => {
        const remaining = (current.unreadMessages || []).filter(
          (item) => String(item.id) !== String(id),
        );
        return withOrgUnreadMessagesMetric(
          current,
          remaining.map((item) => ({ ...item, isNew: true })),
        );
      });
      requestNotificationsRefresh();

      // Stack X = dismiss only; modal row click may navigate to the module.
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
    handleMetricAction,
  };
}
