import ModalShell from "../components/ModalShell.jsx";
import { FieldError, RequiredMark } from "../components/forms/FormHelpers.jsx";
import {
  LABEL_CLASS,
  TEXTAREA_CLASS,
} from "../../models/formLayoutModel.js";

function LeaveCancelModal({
  request,
  reason,
  reasonError,
  cancelling,
  error,
  onClose,
  onReasonChange,
  onConfirm,
}) {
  if (!request) return null;

  return (
    <ModalShell
      onClose={onClose}
      title="Cancel Leave Request"
      description={`Cancel ${request.leaveType} for ${request.employeeId} (${request.startDateLabel || request.startDate} to ${request.endDateLabel || request.endDate}).`}
      panelClassName="relative mx-auto my-6 flex max-h-[calc(100vh-6rem)] w-full min-w-0 max-w-[min(600px,calc(100vw-4rem))] flex-col overflow-hidden rounded-3xl bg-white p-5 sm:p-6"
    >
      <form
        className="flex min-h-0 flex-1 flex-col"
        onSubmit={(event) => {
          event.preventDefault();
          onConfirm();
        }}
      >
        <div className="custom-scrollbar min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-1 pb-1">
          {error ? (
            <p className="text-theme-sm text-error-600">{error}</p>
          ) : null}

          <div>
            <label className={LABEL_CLASS} htmlFor="leave-cancel-reason">
              Reason for cancellation
              <RequiredMark />
            </label>
            <textarea
              id="leave-cancel-reason"
              rows={4}
              value={reason}
              onChange={(event) => onReasonChange(event.target.value)}
              disabled={cancelling}
              className={`${TEXTAREA_CLASS} max-h-32 overflow-y-auto`}
              placeholder="Explain why this leave request is being cancelled"
            />
            <FieldError message={reasonError} />
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-center border-t border-gray-100 pt-4">
          <button
            type="submit"
            disabled={cancelling}
            className="rounded-lg bg-error-500 px-5 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-error-600 disabled:opacity-60"
          >
            {cancelling ? "Cancelling…" : "Cancel Request"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

export default LeaveCancelModal;
