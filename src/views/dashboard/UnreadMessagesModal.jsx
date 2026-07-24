import ModalShell from "../components/ModalShell.jsx";
import StatusPill from "../components/StatusPill.jsx";

function UnreadMessagesModal({ open, messages, onClose, onMessageClick }) {
  if (!open) return null;

  const count = messages?.length || 0;

  return (
    <ModalShell
      onClose={onClose}
      title="Unread Messages"
      description={
        count > 0
          ? `${count} message${count === 1 ? "" : "s"} — click to view details`
          : "You are all caught up"
      }
      panelClassName="relative mx-auto w-full min-w-0 max-w-[min(560px,calc(100vw-2.5rem))] rounded-3xl bg-white p-5 lg:p-8"
    >
      <div className="no-scrollbar max-h-[min(60vh,480px)] overflow-y-auto">
        {count === 0 ? (
          <p className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-8 text-center text-theme-sm text-gray-500">
            No unread messages right now.
          </p>
        ) : (
          <ul className="divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-200">
            {messages.map((message) => (
              <li key={message.id}>
                <button
                  type="button"
                  onClick={() => onMessageClick?.(message)}
                  className="flex w-full items-start justify-between gap-3 bg-white px-4 py-3.5 text-left transition hover:bg-gray-50 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-500/20 focus-visible:ring-inset"
                >
                  <div className="min-w-0">
                    <p className="text-theme-sm font-medium text-gray-800">
                      {message.title || "Notification"}
                    </p>
                    {message.description ? (
                      <p className="mt-1 text-theme-xs text-gray-500">
                        {message.description}
                      </p>
                    ) : null}
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-theme-xs text-gray-500">
                      {message.category ? <span>{message.category}</span> : null}
                      {message.category && message.time ? (
                        <span className="h-1 w-1 rounded-full bg-gray-400" />
                      ) : null}
                      {message.time ? <span>{message.time}</span> : null}
                    </div>
                  </div>
                  {message.status ? (
                    <StatusPill
                      label={message.status}
                      statusClass={message.statusClass}
                    />
                  ) : (
                    <span className="shrink-0 rounded-full bg-success-500 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white">
                      New
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </ModalShell>
  );
}

export default UnreadMessagesModal;
