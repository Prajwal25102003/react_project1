import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "./authContext.jsx";
import { fetchDashboard } from "../services/dashboardService.js";
import {
  markActivitiesSeen,
  withActivitySeenState,
} from "../models/dashboardModel.js";
import { DASHBOARD_REFRESH_EVENT } from "../utils/dashboardRefresh.js";

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
  newEmployeesPeriod: "month",
};

export function useDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(EMPTY);
  const [newEmployeesPeriod, setNewEmployeesPeriod] = useState("month");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const hasLoadedRef = useRef(false);
  const lastFetchedAtRef = useRef(0);
  const seenUserKey = user?.id || user?.email || user?.employeeId || "";

  const loadDashboard = useCallback(
    async ({ silent = false } = {}) => {
      const isInitialLoad = !hasLoadedRef.current;

      try {
        if (isInitialLoad && !silent) setLoading(true);
        setError("");
        const dashboard = await fetchDashboard(newEmployeesPeriod);
        const activities = withActivitySeenState(
          dashboard.activities,
          seenUserKey,
        );
        setData({ ...dashboard, activities });
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
    hasLoadedRef.current = false;
    loadDashboard();
  }, [loadDashboard]);

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

  return {
    ...data,
    newEmployeesPeriod,
    setNewEmployeesPeriod,
    loading,
    error,
  };
}
