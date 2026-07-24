const STACK_DEPTH = 3;
const PEEK_PX = 4;
const CARD_H = 44; // h-11

/** Single TailAdmin error/red tone for the dashboard notification stack. */
const STACK_TONE =
  "border-error-500 bg-error-50 text-error-700";

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

/**
 * Full-width stacked unread notifications.
 * Latest on top; older cards sit behind with a thin layer peeking below.
 */
function DashboardNotifications({ messages = [], onDismiss }) {
  const list = messages || [];
  const stack = list.slice(0, STACK_DEPTH);
  if (stack.length === 0) return null;

  const remaining = Math.max(0, list.length - 1);
  const front = stack[0];
  const peekCount = Math.max(0, stack.length - 1);
  const stackHeight = CARD_H + peekCount * PEEK_PX;

  return (
    <div
      className="relative w-full min-w-0 flex-1 self-center"
      style={{ height: `${stackHeight}px` }}
      aria-live="polite"
    >
      {stack.map((message, depth) => {
        const isFront = depth === 0;

        return (
          <div
            key={message.id}
            className={`absolute transition-all duration-300 ease-out ${
              isFront ? "" : "pointer-events-none"
            }`}
            style={{
              // Front at top; older layers step down so a thin edge shows below
              top: `${depth * PEEK_PX}px`,
              left: isFront ? 0 : `${depth * 2}px`,
              right: isFront ? 0 : `${depth * 2}px`,
              zIndex: STACK_DEPTH - depth,
              height: `${CARD_H}px`,
            }}
            aria-hidden={!isFront}
          >
            <div
              className={`flex h-11 w-full items-center gap-2 rounded-xl border px-3 shadow-theme-xs ${STACK_TONE}`}
            >
              {isFront ? (
                <>
                  <p className="min-w-0 flex-1 truncate text-theme-sm font-medium">
                    {message.title || "Notification"}
                    {message.description ? (
                      <span className="font-normal opacity-80">
                        {" "}
                        — {message.description}
                      </span>
                    ) : null}
                  </p>

                  {remaining > 0 ? (
                    <span className="shrink-0 rounded-full bg-white/70 px-1.5 py-0.5 text-[10px] font-medium text-error-700">
                      +{remaining}
                    </span>
                  ) : null}

                  <button
                    type="button"
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      onDismiss?.(front);
                    }}
                    className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-error-500/70 transition hover:bg-white/70 hover:text-error-700 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-error-500/30"
                    aria-label="Dismiss notification"
                  >
                    <CloseIcon />
                  </button>
                </>
              ) : (
                <span className="sr-only">{message.title || "Notification"}</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default DashboardNotifications;
