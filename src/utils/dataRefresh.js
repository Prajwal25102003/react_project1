export const DATA_REFRESH_EVENT = "ems:data-refresh";

/** Ask open list/detail pages to refetch so signed upload URLs stay fresh. */
export function requestDataRefresh() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(DATA_REFRESH_EVENT));
}
