import { requestDashboardRefresh } from "./dashboardRefresh.js";
import { requestNotificationsRefresh } from "./notificationsRefresh.js";

/** Refresh header notifications and dashboard KPIs after EMS mutations. */
export function requestEmsRefresh() {
  requestNotificationsRefresh();
  requestDashboardRefresh();
}
