import ModalShell from "../components/ModalShell.jsx";
import LeaveBalancePanel from "../components/LeaveBalancePanel.jsx";
import { FieldError, RequiredMark } from "../components/forms/FormHelpers.jsx";
import {
  LABEL_CLASS,
  TEXTAREA_CLASS,
} from "../../models/formLayoutModel.js";
import { normalizeLeaveBalances } from "../../models/leaveBalancesModel.js";
import {
  attachmentFileLabel,
  currentHierarchyStep,
  formatLeaveDaysLabel,
  hierarchyStepLabel,
  isFinalApprovalStep,
  leaveTypeSkipsBalanceDeduction,
  nextStepAfterCurrent,
} from "../../models/leaveRequestsModel.js";

function LeaveDecisionModal({
  request,
  status,
  deciding,
  loading = false,
  error,
  remarks = "",
  remarksError = "",
  onRemarksChange,
  onClose,
  onConfirm,
}) {
  if (!request || !status) return null;

  const isReject = status === "Rejected";
  const isApprove = !isReject;
  const currentStep = currentHierarchyStep(request);
  const stepLabel = hierarchyStepLabel(currentStep);
  const hasNextStep = Boolean(nextStepAfterCurrent(request));
  const skipsBalance = leaveTypeSkipsBalanceDeduction(request.leaveType);
  const isFinalStep = isFinalApprovalStep(request);
  // Always show balances on approve (except types that never deduct). Deduction
  // preview only appears on the final step — matching server behavior.
  const showBalancePanel = isApprove && !skipsBalance;

  const title = isReject
    ? "Reject Leave Request"
    : `${stepLabel} Approval`;

  const daysLabel =
    request.leaveDaysLabel ||
    formatLeaveDaysLabel(request.leaveDays, request.halfDaySession);
  const startLabel = request.startDateLabel || request.startDate;
  const endLabel = request.endDateLabel || request.endDate;
  const dateRange =
    Number(request.leaveDays) === 0.5
      ? `${startLabel} · ${daysLabel}`
      : `${startLabel} to ${endLabel}`;

  const balanceNote = skipsBalance
    ? "Leave balances will not be deducted."
    : isFinalStep
      ? "Leave balances will be deducted now."
      : "Leave balances are deducted on final approval.";

  const description = isReject
    ? `Reject ${request.leaveType} for ${request.employeeId} (${dateRange}). The workflow will stop.`
    : hasNextStep
      ? `Approve ${request.leaveType} for ${request.employeeId} (${dateRange}) as ${stepLabel}? The next approver will continue the workflow. ${balanceNote}`
      : `Give final ${stepLabel} approval for ${request.leaveType} for ${request.employeeId} (${dateRange})? ${balanceNote}`;

  const balances = normalizeLeaveBalances(request);

  return (
    <ModalShell
      onClose={onClose}
      title={title}
      description={description}
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

          {showBalancePanel ? (
            <LeaveBalancePanel
              balances={balances}
              leaveType={request.leaveType}
              leaveDays={request.leaveDays}
              showPreview={isFinalStep}
              title={
                isFinalStep
                  ? "Leave balance (before approval)"
                  : "Current leave balance"
              }
            />
          ) : null}

          {request.attachments?.length ? (
            <div className="rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-3">
              <p className={LABEL_CLASS}>
                Medical Document{request.attachments.length > 1 ? "s" : ""}
              </p>
              <ul className="mt-1 space-y-1.5">
                {request.attachments.map((file) => (
                  <li key={file.url}>
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex text-theme-sm font-medium text-brand-500 hover:text-brand-600"
                    >
                      View / download{" "}
                      {attachmentFileLabel(file.url, file.name)}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : request.attachmentUrl ? (
            <div className="rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-3">
              <p className={LABEL_CLASS}>Medical Document</p>
              <a
                href={request.attachmentUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-flex text-theme-sm font-medium text-brand-500 hover:text-brand-600"
              >
                View / download {attachmentFileLabel(request.attachmentUrl)}
              </a>
            </div>
          ) : null}

          <div>
            <label className={LABEL_CLASS} htmlFor="leave-decision-remarks">
              Remarks
              {isReject ? <RequiredMark /> : null}
              {!isReject ? (
                <span className="ml-1 font-normal text-gray-400">(optional)</span>
              ) : null}
            </label>
            <textarea
              id="leave-decision-remarks"
              rows={4}
              value={remarks}
              onChange={(event) => onRemarksChange?.(event.target.value)}
              disabled={deciding}
              className={`${TEXTAREA_CLASS} max-h-32 overflow-y-auto`}
              placeholder={
                isReject
                  ? "Explain why this leave request is being rejected"
                  : "Add comments (optional)"
              }
            />
            <FieldError message={remarksError} />
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-center border-t border-gray-100 pt-4">
          <button
            type="submit"
            disabled={deciding || loading}
            className={
              isApprove
                ? "rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 disabled:opacity-60"
                : "rounded-lg bg-error-500 px-5 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-error-600 disabled:opacity-60"
            }
          >
            {deciding
              ? "Saving…"
              : isApprove
                ? "Approve"
                : "Reject Request"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

export default LeaveDecisionModal;
