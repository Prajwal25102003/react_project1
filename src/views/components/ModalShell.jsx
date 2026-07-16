function ModalShell({
  onClose,
  title,
  description,
  children,
  panelClassName = "relative mx-auto w-full min-w-0 max-w-[min(700px,calc(100vw-2.5rem))] rounded-3xl bg-white p-4 lg:p-11",
  closeIcon = "×",
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
          className="absolute top-4 right-4 z-[999] flex h-10 w-10 items-center justify-center text-2xl leading-none text-gray-400 transition-colors hover:text-error-500 lg:top-5 lg:right-5 lg:h-11 lg:w-11 lg:text-3xl"
          aria-label="Close modal"
        >
          {closeIcon}
        </button>
        {(title || description) && (
          <div className="px-2 pr-8">
            {title ? (
              <h4 className="mb-2 text-2xl font-semibold text-gray-800">
                {title}
              </h4>
            ) : null}
            {description ? (
              <p className="mb-6 text-sm text-gray-500 lg:mb-7">
                {description}
              </p>
            ) : null}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

export default ModalShell;
