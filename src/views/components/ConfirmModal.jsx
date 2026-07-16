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
      ? "rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 disabled:opacity-60"
      : "rounded-lg bg-error-500 px-5 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-error-600 disabled:opacity-60";

  return (
    <ModalShell
      onClose={onClose}
      title={title}
      description={description}
      panelClassName="relative w-full max-w-[500px] rounded-3xl bg-white p-4 lg:p-11"
    >
      <div className="px-2">
        {error ? (
          <p className="mb-4 text-center text-theme-sm text-error-600">
            {error}
          </p>
        ) : null}

        {onConfirm ? (
          <div className="flex items-center justify-center">
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
      </div>
    </ModalShell>
  );
}

export default ConfirmModal;
