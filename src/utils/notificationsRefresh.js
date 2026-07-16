export const NOTIFICATIONS_REFRESH_EVENT = "ems:notifications-refresh";

export function requestNotificationsRefresh() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(NOTIFICATIONS_REFRESH_EVENT));
}
