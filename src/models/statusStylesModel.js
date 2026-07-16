export const STATUS_TONE = {
  success: "bg-success-50 text-success-700",
  error: "bg-error-50 text-error-700",
  warning: "bg-warning-50 text-warning-700",
  info: "bg-blue-light-50 text-blue-light-700",
};

export function getStatusClass(statusMap, status, fallback) {
  return statusMap[status] || statusMap[fallback];
}
