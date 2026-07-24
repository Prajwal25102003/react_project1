import { requestDashboardRefresh } from "./dashboardRefresh.js";
import { requestNotificationsRefresh } from "./notificationsRefresh.js";
import { requestSessionRefresh } from "./sessionRefresh.js";

/** Refresh header notifications, dashboard KPIs, and auth headship flags. */
export function requestEmsRefresh() {
  requestNotificationsRefresh();
  requestDashboardRefresh();
  requestSessionRefresh();
}
