import { useEffect } from "react";
import { createPortal } from "react-dom";

function ModalShell({
  onClose,
  title,
  description,
  children,
  panelClassName = "relative mx-auto my-6 w-full min-w-0 max-w-[min(600px,calc(100vw-4rem))] rounded-3xl bg-white p-5 sm:p-6",
  closeIcon = "×",
}) {
  useEffect(() => {
    const root = document.getElementById("root");
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    root?.classList.add("app-modal-open");
    return () => {
      document.body.style.overflow = previousOverflow;
      root?.classList.remove("app-modal-open");
    };
  }, []);

  return createPortal(
    <>
      <button
        type="button"
        aria-label="Close modal backdrop"
        className="fixed inset-0 z-[99999] border-0 bg-black/20"
        onClick={onClose}
      />
      <div className="pointer-events-none fixed inset-0 z-[99999] flex items-start justify-center overflow-y-auto px-6 py-8 sm:items-center">
        <div
          className={`pointer-events-auto ${panelClassName}`.trim()}
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 z-[999] flex h-10 w-10 items-center justify-center text-3xl leading-none text-gray-400 transition-colors hover:text-error-500 sm:top-4 sm:right-4 sm:h-11 sm:w-11"
            aria-label="Close modal"
          >
            {closeIcon}
          </button>
          {(title || description) && (
            <div className="shrink-0 px-2 pr-8">
              {title ? (
                <h4 className="mb-1.5 text-xl font-semibold text-gray-800 sm:text-2xl">
                  {title}
                </h4>
              ) : null}
              {description ? (
                <p className="mb-4 text-sm text-gray-500">{description}</p>
              ) : null}
            </div>
          )}
          <div className="flex min-h-0 min-w-0 flex-1 flex-col">{children}</div>
        </div>
      </div>
    </>,
    document.body,
  );
}

export default ModalShell;
