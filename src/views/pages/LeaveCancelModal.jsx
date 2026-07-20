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
      description={`Cancel ${request.leaveType} for ${request.employeeId} (${request.startDate} to ${request.endDate}).`}
      panelClassName="relative w-full max-w-[500px] rounded-3xl bg-white p-4 lg:p-11"
    >
      <form
        className="space-y-5 px-2"
        onSubmit={(event) => {
          event.preventDefault();
          onConfirm();
        }}
      >
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
            className={TEXTAREA_CLASS}
            placeholder="Explain why this leave request is being cancelled"
          />
          <FieldError message={reasonError} />
        </div>

        <div className="flex items-center justify-center">
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
