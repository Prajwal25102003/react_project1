import { TOAST_ICON, TOAST_SHELL, TOAST_TEXT } from "../../models/toastModel.js";

function SuccessIcon() {
  return (
    <svg className="fill-current" width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M3.702 12C3.702 7.417 7.417 3.702 12 3.702S20.298 7.417 20.298 12 16.583 20.298 12 20.298 3.702 16.583 3.702 12ZM12 1.902C6.423 1.902 1.902 6.423 1.902 12S6.423 22.098 12 22.098 22.098 17.577 22.098 12 17.577 1.902 12 1.902Zm3.62 8.838a.9.9 0 0 0-1.273-1.273l-3.158 3.158-1.536-1.536a.9.9 0 0 0-1.273 1.273l2.173 2.172a.9.9 0 0 0 1.273 0l4.794-4.794Z"
      />
    </svg>
  );
}

function ErrorIcon() {
  return (
    <svg className="fill-current" width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 3.702A8.298 8.298 0 1 0 20.298 12 8.307 8.307 0 0 0 12 3.702ZM1.902 12C1.902 6.423 6.423 1.902 12 1.902S22.098 6.423 22.098 12 17.577 22.098 12 22.098 1.902 17.577 1.902 12Zm6.326-2.772a.9.9 0 0 1 1.273 0L12 10.727l2.499-2.499a.9.9 0 1 1 1.273 1.273L13.273 12l2.499 2.499a.9.9 0 1 1-1.273 1.273L12 13.273l-2.499 2.499a.9.9 0 0 1-1.273-1.273L10.727 12 8.228 9.501a.9.9 0 0 1 0-1.273Z"
      />
    </svg>
  );
}

function WarningIcon() {
  return (
    <svg className="fill-current" width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M10.392 4.343c.72-1.247 2.496-1.247 3.216 0l7.54 13.064c.72 1.247-.18 2.808-1.608 2.808H4.46c-1.428 0-2.328-1.561-1.608-2.808L10.392 4.343ZM12 8.1a.9.9 0 0 1 .9.9v3.6a.9.9 0 1 1-1.8 0V9a.9.9 0 0 1 .9-.9Zm0 8.1a1.05 1.05 0 1 0 0-2.1 1.05 1.05 0 0 0 0 2.1Z"
      />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg className="fill-current" width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M3.702 12C3.702 7.417 7.417 3.702 12 3.702S20.298 7.417 20.298 12 16.583 20.298 12 20.298 3.702 16.583 3.702 12ZM12 1.902C6.423 1.902 1.902 6.423 1.902 12S6.423 22.098 12 22.098 22.098 17.577 22.098 12 17.577 1.902 12 1.902ZM12 10.2a.9.9 0 0 1 .9.9v4.5a.9.9 0 1 1-1.8 0V11.1a.9.9 0 0 1 .9-.9Zm0-1.35a1.05 1.05 0 1 0 0-2.1 1.05 1.05 0 0 0 0 2.1Z"
      />
    </svg>
  );
}

function ToastIcon({ tone }) {
  if (tone === "success") return <SuccessIcon />;
  if (tone === "error") return <ErrorIcon />;
  if (tone === "warning") return <WarningIcon />;
  return <InfoIcon />;
}

/** Single toast — one message line, one toast at a time. */
function ToastStack({ toasts = [] }) {
  const toast = toasts[0];
  if (!toast) return null;

  const tone = toast.tone || "info";
  const message = toast.message || toast.title || "Notification";

  return (
    <div
      className="pointer-events-none fixed top-4 right-4 z-[100000] w-[min(100%-2rem,22rem)]"
      aria-live="polite"
      aria-relevant="additions"
    >
      <div
        className={`pointer-events-auto rounded-xl border px-4 py-3 shadow-theme-md ${TOAST_SHELL[tone]}`}
        role="status"
      >
        <div className="flex items-center gap-3">
          <div className={`shrink-0 ${TOAST_ICON[tone]}`}>
            <ToastIcon tone={tone} />
          </div>
          <p className={`min-w-0 flex-1 truncate text-sm font-medium ${TOAST_TEXT[tone]}`}>
            {message}
          </p>
        </div>
      </div>
    </div>
  );
}

export default ToastStack;
