export const DASHBOARD_REFRESH_EVENT = "ems:dashboard-refresh";

export function requestDashboardRefresh() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(DASHBOARD_REFRESH_EVENT));
}
