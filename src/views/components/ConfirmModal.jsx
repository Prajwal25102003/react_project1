import ModalShell from "./ModalShell.jsx";

function ConfirmModal({
  title,
  description,
  error,
  confirmLabel = "Confirm",
  confirmingLabel = "Processing…",
  confirming = false,
  confirmVariant = "danger",
  onClose,
  onConfirm,
}) {
  const buttonClass =
    confirmVariant === "primary"
      ? "rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 disabled:opacity-60"
      : "rounded-lg bg-error-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-error-600 disabled:opacity-60";

  return (
    <ModalShell
      onClose={onClose}
      panelClassName="relative mx-auto my-6 w-full max-w-[min(420px,calc(100vw-4rem))] rounded-3xl bg-white p-5 sm:p-6"
    >
      <div className="pr-8">
        {title ? (
          <h4 className="text-lg font-semibold text-gray-800 sm:text-xl">
            {title}
          </h4>
        ) : null}
        {description ? (
          <p className="mt-2 text-sm text-gray-500">{description}</p>
        ) : null}
        {error ? (
          <p className="mt-3 text-theme-sm text-error-600">{error}</p>
        ) : null}
      </div>

      {onConfirm ? (
        <div className="mt-5 flex items-center justify-center">
          <button
            type="button"
            onClick={onConfirm}
            disabled={confirming}
            className={buttonClass}
          >
            {confirming ? confirmingLabel : confirmLabel}
          </button>
        </div>
      ) : null}
    </ModalShell>
  );
}

export default ConfirmModal;
