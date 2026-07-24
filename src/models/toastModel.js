export const TOAST_DURATION_MS = 3500;

/** Shell classes for TailAdmin-style toast cards (light theme). */
export const TOAST_SHELL = {
  success: "border-success-500 bg-success-50",
  error: "border-error-500 bg-error-50",
  warning: "border-warning-500 bg-warning-50",
  info: "border-blue-light-500 bg-blue-light-50",
};

export const TOAST_ICON = {
  success: "text-success-500",
  error: "text-error-500",
  warning: "text-warning-500",
  info: "text-blue-light-500",
};

export const TOAST_TEXT = {
  success: "text-success-700",
  error: "text-error-700",
  warning: "text-warning-700",
  info: "text-blue-light-700",
};

let toastSeq = 0;

function createToastId() {
  toastSeq += 1;
  return `toast-${Date.now()}-${toastSeq}`;
}

function normalizeToastTone(tone) {
  if (tone && TOAST_SHELL[tone]) return tone;
  return "info";
}

/**
 * Build a single-line toast payload.
 * @param {'success'|'error'|'warning'|'info'} tone
 * @param {string} message
 */
export function buildToast(tone, message) {
  return {
    id: createToastId(),
    tone: normalizeToastTone(tone),
    message: String(message || "").trim() || "Notification",
  };
}

/** Common CRUD success copy (single line). */
export function crudSuccessMessage(entity, action) {
  const name = String(entity || "Item").trim() || "Item";
  switch (action) {
    case "create":
    case "add":
      return `${name} added successfully`;
    case "update":
    case "edit":
      return `${name} updated successfully`;
    case "delete":
    case "remove":
      return `${name} deleted successfully`;
    default:
      return `${name} saved successfully`;
  }
}
