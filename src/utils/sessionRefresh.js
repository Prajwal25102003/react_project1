export const SESSION_REFRESH_EVENT = "ems:session-refresh";

/** Ask open tabs to re-fetch /auth/me (e.g. after department head changes). */
export function requestSessionRefresh() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(SESSION_REFRESH_EVENT));
}
