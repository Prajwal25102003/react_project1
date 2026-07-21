import ModalShell from "../components/ModalShell.jsx";
import LeaveBalancePanel from "../components/LeaveBalancePanel.jsx";
import StatusPill from "../components/StatusPill.jsx";
import { LABEL_CLASS } from "../../models/formLayoutModel.js";
import { normalizeLeaveBalances } from "../../models/leaveBalancesModel.js";
import { formatLeaveDaysLabel } from "../../models/leaveRequestsModel.js";

function DetailItem({ label, children }) {
  return (
    <div className="min-w-0 rounded-xl border border-gray-100 bg-gray-50/50 px-3.5 py-2.5">
      <p className="mb-1 text-theme-xs font-medium text-gray-500">{label}</p>
      <div className="text-theme-sm font-medium text-gray-800">{children}</div>
    </div>
  );
}

function actionTone(action) {
  if (action === "Approved" || action === "Submitted") {
    return "bg-success-50 text-success-700";
  }
  if (action === "Rejected" || action === "Cancelled") {
    return "bg-error-50 text-error-700";
  }
  return "bg-gray-100 text-gray-700";
}

function LeaveViewModal({ request, onClose }) {
  if (!request) return null;

  const history = (request.approvalHistory || []).filter(
    (entry) =>
      entry.step !== "Submit" &&
      entry.action !== "Submitted" &&
      entry.stepLabel !== "Submitted",
  );

  const balances = normalizeLeaveBalances(request);
  const showBalancePreview =
    request.status === "Pending" || request.status === "TeamLeadApproved";

  return (
    <ModalShell
      onClose={onClose}
      title="Leave Request Details"
      description={`${request.employeeId || "Employee"}${request.employeeName ? ` · ${request.employeeName}` : ""}`}
      panelClassName="relative mx-auto w-full min-w-0 max-w-[min(720px,calc(100vw-2.5rem))] rounded-3xl bg-white p-5 lg:p-8"
    >
      <div className="no-scrollbar max-h-[min(70vh,640px)] space-y-4 overflow-y-auto px-1">
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          <DetailItem label="Employee ID">{request.employeeId || "—"}</DetailItem>
          <DetailItem label="Leave Type">{request.leaveType || "—"}</DetailItem>
          <DetailItem label="Days">
            {Number(request.leaveDays) === 0.5 ? (
              <span className="inline-flex flex-nowrap items-center gap-1.5 whitespace-nowrap">
                <span>0.5</span>
                {request.halfDaySession === "first_half" ||
                request.halfDaySession === "second_half" ? (
                  <span className="inline-flex shrink-0 rounded-full bg-blue-light-50 px-2 py-0.5 text-theme-xs font-medium text-blue-light-700">
                    {request.halfDaySession === "first_half"
                      ? "Morning"
                      : "Afternoon"}
                  </span>
                ) : null}
              </span>
            ) : (
              request.leaveDaysLabel ||
              formatLeaveDaysLabel(request.leaveDays, request.halfDaySession)
            )}
          </DetailItem>
          <DetailItem label="Start Date">{request.startDate || "—"}</DetailItem>
          <DetailItem label="End Date">
            {Number(request.leaveDays) === 0.5
              ? request.startDate || "—"
              : request.endDate || "—"}
          </DetailItem>
          <DetailItem label="Status">
            <StatusPill
              label={request.statusLabel || request.status}
              statusClass={request.statusClass}
            />
          </DetailItem>
        </div>

        <LeaveBalancePanel
          balances={balances}
          leaveType={request.leaveType}
          leaveDays={request.leaveDays}
          showPreview={showBalancePreview}
          compact
          title={
            showBalancePreview
              ? "Leave balance (before approval)"
              : "Current leave balance"
          }
        />

        <div className="min-w-0 rounded-2xl border border-gray-200 bg-white px-4 py-3">
          <p className={LABEL_CLASS}>Leave Reason</p>
          <p className="mt-1 whitespace-pre-wrap text-theme-sm text-gray-800">
            {request.reason?.trim() ? request.reason : "No reason provided."}
          </p>
        </div>

        <div className="min-w-0">
          <p className={`${LABEL_CLASS} mb-2`}>Approval History</p>
          {history.length === 0 ? (
            <p className="text-theme-sm text-gray-500">No approval history yet.</p>
          ) : (
            <ol className="space-y-2">
              {history.map((entry) => (
                <li
                  key={entry.id}
                  className="rounded-xl border border-gray-200 bg-white px-3.5 py-2.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-theme-sm font-medium text-gray-800">
                      {entry.stepLabel || entry.step}
                      <span className="font-normal text-gray-500">
                        {" "}
                        · {entry.actorName}
                      </span>
                    </p>
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-theme-xs font-medium ${actionTone(entry.action)}`}
                    >
                      {entry.action}
                    </span>
                  </div>
                  {entry.remarks?.trim() ? (
                    <p className="mt-1 whitespace-pre-wrap text-theme-sm text-gray-600">
                      {entry.remarks}
                    </p>
                  ) : null}
                  {entry.createdAt ? (
                    <p className="mt-1 text-theme-xs text-gray-400">
                      {new Date(entry.createdAt).toLocaleString()}
                    </p>
                  ) : null}
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </ModalShell>
  );
}

export default LeaveViewModal;
