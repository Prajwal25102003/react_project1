function ModalShell({
  onClose,
  title,
  description,
  children,
  panelClassName = 'relative w-full max-w-[700px] rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11',
  closeIcon = '×',
}) {
  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center overflow-y-auto p-5">
      <button
        type="button"
        aria-label="Close modal backdrop"
        className="fixed inset-0 h-full w-full bg-gray-400/50 backdrop-blur-[32px]"
        onClick={onClose}
      />
      <div className={panelClassName}>
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 z-[999] flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:bg-white/[0.05] dark:text-gray-400"
          aria-label="Close modal"
        >
          {closeIcon}
        </button>
        {(title || description) && (
          <div className="px-2 pr-14">
            {title ? (
              <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
                {title}
              </h4>
            ) : null}
            {description ? (
              <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
                {description}
              </p>
            ) : null}
          </div>
        )}
        {children}
      </div>
    </div>
  )
}

export default ModalShell
