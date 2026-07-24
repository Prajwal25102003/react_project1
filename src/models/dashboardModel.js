import {
  chartTwoOptions as chartTwoBase,
} from "./chartModel.js";
import { STATUS_TONE, getStatusClass } from "./statusStylesModel.js";
import { createSeenStateHelpers } from "../utils/seenState.js";
import { getNotificationPath } from "./headerModel.js";

export const NEW_EMPLOYEE_PERIODS = [
  { value: "month", label: "This month" },
  { value: "quarter", label: "This quarter" },
  { value: "year", label: "This year" },
];

const ACTIVITY_STATUS = {
  Completed: STATUS_TONE.success,
  Pending: STATUS_TONE.warning,
  Added: STATUS_TONE.success,
  Updated: STATUS_TONE.info,
  Removed: STATUS_TONE.error,
  Approved: STATUS_TONE.success,
  Rejected: STATUS_TONE.error,
  Cancelled: STATUS_TONE.warning,
  Present: STATUS_TONE.success,
  Absent: STATUS_TONE.error,
  'Half Day': STATUS_TONE.warning,
  Info: STATUS_TONE.info,
};

function mapActivities(activities) {
  return (activities || []).map((activity) => ({
    ...activity,
    statusClass: getStatusClass(ACTIVITY_STATUS, activity.status, "Info"),
    isNew: Boolean(activity.isNew),
    href: getNotificationPath(activity),
  }));
}

const { getSeenIds: getSeenActivityIds, markSeen: markActivitiesSeen, pruneSeenToIds: pruneActivitySeen } =
  createSeenStateHelpers("ems_seen_activities_");

export { getSeenActivityIds, markActivitiesSeen };

/**
 * Latest N activities always display. Unseen → isNew; after viewing they stay
 * in the limited list without the new highlight.
 */
export function withActivitySeenState(activities, userKey) {
  const list = activities || [];
  const currentIds = list.map((activity) => String(activity.id)).filter(Boolean);
  pruneActivitySeen(userKey, currentIds);

  const seenSet = new Set(getSeenActivityIds(userKey));
  return list.map((activity) => ({
    ...activity,
    isNew: Boolean(activity.id) && !seenSet.has(String(activity.id)),
  }));
}

export function getUnreadMessages(notifications) {
  return (notifications || []).filter((item) => item.isNew);
}

export function buildUnreadMessagesMetric(notifications) {
  const unreadCount = getUnreadMessages(notifications).length;

  return {
    id: "unread-messages",
    label: "Unread Messages",
    value: String(unreadCount),
    trend: unreadCount > 0 ? "new messages" : "all clear",
    trendUp: unreadCount === 0,
    action: "unread-messages",
  };
}

/** Append / replace the Unread Messages KPI for admin/HR org dashboards. */
export function withOrgUnreadMessagesMetric(dashboard, notifications) {
  if (!dashboard || dashboard.variant !== "org") return dashboard;

  const unreadMetric = buildUnreadMessagesMetric(notifications);
  const withoutUnread = (dashboard.primaryMetrics || []).filter(
    (metric) => metric.id !== "unread-messages",
  );
  const metrics = [...withoutUnread, unreadMetric];

  return {
    ...dashboard,
    primaryMetrics: metrics,
    metrics,
    unreadMessages: getUnreadMessages(notifications),
  };
}

function mapOrgDashboard(data, newEmployeesPeriod) {
  const metrics = data.metrics || data.primaryMetrics || [];

  return {
    variant: "org",
    primaryMetrics: metrics,
    secondaryMetrics: data.secondaryMetrics || [],
    metrics,
    newEmployeesPeriod: data.newEmployeesPeriod || newEmployeesPeriod,
    activities: mapActivities(data.activities),
    departments: data.departments || [],
  };
}

function mapEmployeeDashboard(data) {
  const attendanceRate = data.charts?.activeRate ?? 0;
  const metrics = data.metrics || data.primaryMetrics || [];

  return {
    variant: "employee",
    primaryMetrics: data.primaryMetrics || metrics,
    secondaryMetrics: data.secondaryMetrics || [],
    metrics,
    newEmployeesPeriod: "month",
    activities: mapActivities(data.activities),
    departments: [],
    chartTwo: {
      title: "Attendance Rate",
      description: "Present vs marked days this month",
      options: {
        ...chartTwoBase,
        series: [attendanceRate],
      },
      meta: data.charts?.targetMeta || {
        badge: "0 days present",
        stats: [],
      },
    },
  };
}

/** Shape raw dashboard API payload for the dashboard view. */
export function mapDashboardData(data, newEmployeesPeriod = "month") {
  if (data?.variant === "employee") {
    return mapEmployeeDashboard(data);
  }
  return mapOrgDashboard(data, newEmployeesPeriod);
}
