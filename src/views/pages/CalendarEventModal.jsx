import ModalShell from '../components/ModalShell.jsx'

const CLOSE_ICON = (
  <svg
    className="fill-current"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M6.04289 16.5418C5.65237 16.9323 5.65237 17.5655 6.04289 17.956C6.43342 18.3465 7.06658 18.3465 7.45711 17.956L11.9987 13.4144L16.5408 17.9565C16.9313 18.347 17.5645 18.347 17.955 17.9565C18.3455 17.566 18.3455 16.9328 17.955 16.5423L13.4129 12.0002L17.955 7.45808C18.3455 7.06756 18.3455 6.43439 17.955 6.04387C17.5645 5.65335 16.9313 5.65335 16.5408 6.04387L11.9987 10.586L7.45711 6.04439C7.06658 5.65386 6.43342 5.65386 6.04289 6.04439C5.65237 6.43491 5.65237 7.06808 6.04289 7.4586L10.5845 12.0002L6.04289 16.5418Z"
    />
  </svg>
)

function CalendarEventModal({
  open,
  mode,
  form,
  eventLevels,
  onClose,
  onFieldChange,
  onAdd,
  onUpdate,
}) {
  if (!open) {
    return null
  }

  return (
    <ModalShell
      onClose={onClose}
      closeIcon={CLOSE_ICON}
      panelClassName="relative flex w-full max-w-[700px] flex-col overflow-y-auto rounded-3xl bg-white p-6 dark:bg-gray-900 lg:p-11"
      title="Add / Edit Event"
      description="Plan your next big moment: schedule or edit an event to stay on track"
    >
      <div className="custom-scrollbar flex flex-col overflow-y-auto px-2">
        <div className="mt-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
              Event Title
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(event) => onFieldChange('title', event.target.value)}
              className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
            />
          </div>

          <div className="mt-6">
            <label className="mb-4 block text-sm font-medium text-gray-700 dark:text-gray-400">
              Event Color
            </label>
            <div className="flex flex-wrap items-center gap-4 sm:gap-5">
              {eventLevels.map((level) => (
                <label
                  key={level}
                  className="flex items-center text-sm text-gray-700 dark:text-gray-400"
                  htmlFor={`modal-${level}`}
                >
                  <span className="relative">
                    <input
                      id={`modal-${level}`}
                      className="sr-only"
                      type="radio"
                      name="event-level"
                      value={level}
                      checked={form.level === level}
                      onChange={(event) =>
                        onFieldChange('level', event.target.value)
                      }
                    />
                    <span className="box mr-2 flex h-5 w-5 items-center justify-center rounded-full border border-gray-300 dark:border-gray-700">
                      <span className="h-2 w-2 rounded-full bg-white dark:bg-transparent" />
                    </span>
                  </span>
                  {level}
                </label>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
              Enter Start Date
            </label>
            <input
              id="event-start-date"
              type="date"
              value={form.start}
              onChange={(event) => onFieldChange('start', event.target.value)}
              className="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
            />
          </div>

          <div className="mt-6">
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
              Enter End Date
            </label>
            <input
              id="event-end-date"
              type="date"
              value={form.end}
              onChange={(event) => onFieldChange('end', event.target.value)}
              className="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
            />
          </div>
        </div>

        <div className="mt-6 flex items-center gap-3 sm:justify-end">
          <button
            type="button"
            className="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] sm:w-auto"
            onClick={onClose}
          >
            Close
          </button>
          {mode === 'edit' ? (
            <button
              type="button"
              className="flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 sm:w-auto"
              onClick={onUpdate}
            >
              Update changes
            </button>
          ) : (
            <button
              type="button"
              className="flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 sm:w-auto"
              onClick={onAdd}
            >
              Add Event
            </button>
          )}
        </div>
      </div>
    </ModalShell>
  )
}

export default CalendarEventModal
