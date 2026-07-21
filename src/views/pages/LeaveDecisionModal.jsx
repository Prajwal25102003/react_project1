import ModalShell from "../components/ModalShell.jsx";
import LeaveBalancePanel from "../components/LeaveBalancePanel.jsx";
import { FieldError, RequiredMark } from "../components/forms/FormHelpers.jsx";
import {
  LABEL_CLASS,
  TEXTAREA_CLASS,
} from "../../models/formLayoutModel.js";
import { normalizeLeaveBalances } from "../../models/leaveBalancesModel.js";
import { formatLeaveDaysLabel } from "../../models/leaveRequestsModel.js";

function LeaveDecisionModal({
  request,
  status,
  deciding,
  error,
  remarks = "",
  remarksError = "",
  onRemarksChange,
  onClose,
  onConfirm,
}) {
  if (!request || !status) return null;

  const isTeamLeadApprove = status === "TeamLeadApproved";
  const isReject = status === "Rejected";
  const isApprove = !isReject;
  const isHrFinalApprove = status === "Approved";
  const isAdminApprove =
    isHrFinalApprove && Boolean(request?.requesterIsHr);

  const title = isReject
    ? "Reject Leave Request"
    : isTeamLeadApprove
      ? "Team Lead Approval"
      : isAdminApprove
        ? "Admin Approval"
        : "HR Approval";

  const daysLabel =
    request.leaveDaysLabel ||
    formatLeaveDaysLabel(request.leaveDays, request.halfDaySession);
  const dateRange =
    Number(request.leaveDays) === 0.5
      ? `${request.startDate} · ${daysLabel}`
      : `${request.startDate} to ${request.endDate}`;

  const description = isReject
    ? `Reject ${request.leaveType} for ${request.employeeId} (${dateRange}). The workflow will stop.`
    : isTeamLeadApprove
      ? `Approve ${request.leaveType} for ${request.employeeId} (${dateRange}) as team lead? HR will give the final approval.`
      : isAdminApprove
        ? `Give final Admin approval for HR leave (${request.leaveType}) for ${request.employeeId} (${dateRange})? Leave balances will be deducted now.`
        : `Give final HR approval for ${request.leaveType} for ${request.employeeId} (${dateRange})? Leave balances will be deducted now.`;

  const balances = normalizeLeaveBalances(request);

  return (
    <ModalShell
      onClose={onClose}
      title={title}
      description={description}
      panelClassName="relative w-full max-w-[560px] rounded-3xl bg-white p-4 lg:p-11"
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

        {isHrFinalApprove ? (
          <LeaveBalancePanel
            balances={balances}
            leaveType={request.leaveType}
            leaveDays={request.leaveDays}
            title="Balance impact on approval"
          />
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
            className={TEXTAREA_CLASS}
            placeholder={
              isReject
                ? "Explain why this leave request is being rejected"
                : "Add comments (optional)"
            }
          />
          <FieldError message={remarksError} />
        </div>

        <div className="flex items-center justify-center">
          <button
            type="submit"
            disabled={deciding}
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
