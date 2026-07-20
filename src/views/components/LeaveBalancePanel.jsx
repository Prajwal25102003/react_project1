import { previewLeaveDeduction } from "../../models/leaveBalancesModel.js";

function Stat({ label, value, tone = "default" }) {
  const valueClass =
    tone === "warning"
      ? "text-warning-700"
      : tone === "error"
        ? "text-error-700"
        : "text-gray-800";

  return (
    <div className="min-w-0 rounded-xl border border-gray-200 bg-white px-3 py-3">
      <p className="truncate text-theme-xs text-gray-500">{label}</p>
      <p className={`mt-1 break-words text-xl font-semibold leading-tight ${valueClass}`}>
        {value}
      </p>
    </div>
  );
}

/**
 * Shows current leave quotas and optional deduction preview for a request.
 */
function LeaveBalancePanel({
  balances,
  leaveType,
  leaveDays,
  title = "Leave Balance",
  showPreview = true,
  compact = false,
}) {
  if (!balances) return null;

  const preview =
    showPreview && leaveType
      ? previewLeaveDeduction(balances, leaveType, leaveDays)
      : null;

  const showPending = balances.pendingLeaveCount != null;

  return (
    <div
      className={
        compact
          ? "rounded-2xl border border-gray-200 bg-gray-50/70 p-3.5"
          : "rounded-2xl border border-gray-200 bg-gray-50/70 p-4"
      }
    >
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h4 className="text-sm font-semibold text-gray-800">{title}</h4>
        <p className="text-theme-xs text-gray-500">Paid quota: 1 casual + 1 sick</p>
      </div>

      <div
        className={
          showPending
            ? "grid grid-cols-2 gap-2 sm:grid-cols-4"
            : "grid grid-cols-3 gap-2"
        }
      >
        <Stat label="Casual left" value={balances.casualLeaveBalance} />
        <Stat label="Sick left" value={balances.sickLeaveBalance} />
        <Stat
          label="LOP days"
          value={balances.lopDays}
          tone={balances.lopDays > 0 ? "warning" : "default"}
        />
        {showPending ? (
          <Stat
            label="Pending requests"
            value={balances.pendingLeaveCount}
            tone={balances.pendingLeaveCount > 0 ? "warning" : "default"}
          />
        ) : null}
      </div>

      {preview ? (
        <div
          className={`mt-3 rounded-xl border p-3 text-theme-sm ${
            preview.willUseLop
              ? "border-warning-500 bg-warning-50 text-warning-700"
              : "border-gray-200 bg-white text-gray-600"
          }`}
        >
          <p>{preview.summary}</p>
          {preview.willUseLop ? (
            <p className="mt-1">
              Days beyond paid leave become Loss of Pay (LOP).
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export default LeaveBalancePanel;
