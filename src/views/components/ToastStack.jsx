import {
  TOAST_ICON,
  TOAST_SHELL,
  TOAST_STACK_DEPTH,
  TOAST_TEXT,
} from "../../models/toastModel.js";

const PEEK_PX = 4;
const CARD_H = 44; // h-11 — matches dashboard notification stack

const CLOSE_HOVER = {
  success: "hover:bg-white/70 hover:text-success-700 focus-visible:ring-success-500/30 text-success-500/70",
  error:
    "hover:bg-white/70 hover:text-error-700 focus-visible:ring-error-500/30 text-error-500/70",
  warning:
    "hover:bg-white/70 hover:text-warning-700 focus-visible:ring-warning-500/30 text-warning-500/70",
  info: "hover:bg-white/70 hover:text-blue-light-700 focus-visible:ring-blue-light-500/30 text-blue-light-500/70",
};

const BADGE_TEXT = {
  success: "text-success-700",
  error: "text-error-700",
  warning: "text-warning-700",
  info: "text-blue-light-700",
};

function SuccessIcon() {
  return (
    <svg className="fill-current" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
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
    <svg className="fill-current" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
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
    <svg className="fill-current" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
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
    <svg className="fill-current" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M3.702 12C3.702 7.417 7.417 3.702 12 3.702S20.298 7.417 20.298 12 16.583 20.298 12 20.298 3.702 16.583 3.702 12ZM12 1.902C6.423 1.902 1.902 6.423 1.902 12S6.423 22.098 12 22.098 22.098 17.577 22.098 12 17.577 1.902 12 1.902ZM12 10.2a.9.9 0 0 1 .9.9v4.5a.9.9 0 1 1-1.8 0V11.1a.9.9 0 0 1 .9-.9Zm0-1.35a1.05 1.05 0 1 0 0-2.1 1.05 1.05 0 0 0 0 2.1Z"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      className="fill-current"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M6.21967 7.28131C5.92678 6.98841 5.92678 6.51354 6.21967 6.22065C6.51256 5.92775 6.98744 5.92775 7.28033 6.22065L11.999 10.9393L16.7176 6.22078C17.0105 5.92789 17.4854 5.92788 17.7782 6.22078C18.0711 6.51367 18.0711 6.98855 17.7782 7.28144L13.0597 12L17.7782 16.7186C18.0711 17.0115 18.0711 17.4863 17.7782 17.7792C17.4854 18.0721 17.0105 18.0721 16.7176 17.7792L11.999 13.0607L7.28033 17.7794C6.98744 18.0722 6.51256 18.0722 6.21967 17.7794C5.92678 17.4865 5.92678 17.0116 6.21967 16.7187L10.9384 12L6.21967 7.28131Z"
        fill="currentColor"
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

/**
 * Stacked toast alert banners — same peek stack as dashboard notifications.
 * Latest on top; older cards sit behind with a thin layer peeking below.
 */
function ToastStack({ toasts = [], onDismiss }) {
  const list = toasts || [];
  const stack = list.slice(0, TOAST_STACK_DEPTH);
  if (stack.length === 0) return null;

  const remaining = Math.max(0, list.length - 1);
  const front = stack[0];
  const frontTone = front.tone || "info";
  const peekCount = Math.max(0, stack.length - 1);
  const stackHeight = CARD_H + peekCount * PEEK_PX;

  return (
    <div
      className="pointer-events-none fixed top-4 right-4 z-[100000] w-[min(100%-2rem,22rem)]"
      style={{ height: `${stackHeight}px` }}
      aria-live="polite"
      aria-relevant="additions"
    >
      <div className="relative h-full w-full">
        {stack.map((toast, depth) => {
          const isFront = depth === 0;
          const tone = toast.tone || "info";
          const message = toast.message || toast.title || "Notification";

          return (
            <div
              key={toast.id}
              className={`absolute transition-all duration-300 ease-out ${
                isFront ? "pointer-events-auto" : "pointer-events-none"
              }`}
              style={{
                top: `${depth * PEEK_PX}px`,
                left: isFront ? 0 : `${depth * 2}px`,
                right: isFront ? 0 : `${depth * 2}px`,
                zIndex: TOAST_STACK_DEPTH - depth,
                height: `${CARD_H}px`,
              }}
              aria-hidden={!isFront}
            >
              <div
                className={`flex h-11 w-full items-center gap-2 rounded-xl border px-3 shadow-theme-xs ${TOAST_SHELL[tone]}`}
                role={isFront ? "status" : undefined}
              >
                {isFront ? (
                  <>
                    <div className={`shrink-0 ${TOAST_ICON[tone]}`}>
                      <ToastIcon tone={tone} />
                    </div>
                    <p
                      className={`min-w-0 flex-1 truncate text-theme-sm font-medium ${TOAST_TEXT[tone]}`}
                    >
                      {message}
                    </p>

                    {remaining > 0 ? (
                      <span
                        className={`shrink-0 rounded-full bg-white/70 px-1.5 py-0.5 text-[10px] font-medium ${BADGE_TEXT[frontTone]}`}
                      >
                        +{remaining}
                      </span>
                    ) : null}

                    <button
                      type="button"
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        onDismiss?.(front.id);
                      }}
                      className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition focus-visible:outline-hidden focus-visible:ring-2 ${CLOSE_HOVER[tone]}`}
                      aria-label="Dismiss notification"
                    >
                      <CloseIcon />
                    </button>
                  </>
                ) : (
                  <span className="sr-only">{message}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ToastStack;
