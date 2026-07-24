import {
  normalizeLeaveBalances,
  previewLeaveDeduction,
} from "../../models/leaveBalancesModel.js";

function formatBalanceValue(value) {
  const n = Number(value);
  if (Number.isNaN(n)) return value ?? "—";
  return Number.isInteger(n) ? String(n) : String(Math.round(n * 10) / 10);
}

function Stat({ label, value, tone = "default" }) {
  const valueClass =
    tone === "warning"
      ? "text-warning-700"
      : tone === "error"
        ? "text-error-700"
        : tone === "brand"
          ? "text-brand-500"
          : "text-gray-800";

  return (
    <div className="min-w-0 rounded-xl border border-gray-200 bg-white px-3 py-3">
      <p className="truncate text-theme-xs text-gray-500">{label}</p>
      <p
        className={`mt-1 break-words text-xl font-semibold leading-tight ${valueClass}`}
      >
        {formatBalanceValue(value)}
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

  const normalized = normalizeLeaveBalances(balances);
  const preview =
    showPreview && leaveType
      ? previewLeaveDeduction(normalized, leaveType, leaveDays)
      : null;

  const showPending = normalized.pendingLeaveCount != null;
  const totalAvailable = normalized.totalAvailable;

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
        <p className="text-theme-xs text-gray-500">
          Paid leave uses this employee&apos;s casual and sick balances. LOP
          applies only after both are used.
        </p>
      </div>

      <div
        className={
          showPending
            ? "grid grid-cols-2 gap-2 sm:grid-cols-5"
            : "grid grid-cols-2 gap-2 sm:grid-cols-4"
        }
      >
        <Stat
          label="Total available"
          value={totalAvailable}
          tone={totalAvailable > 0 ? "brand" : "warning"}
        />
        <Stat label="Casual left" value={normalized.casualLeaveBalance} />
        <Stat label="Sick left" value={normalized.sickLeaveBalance} />
        <Stat
          label="LOP days"
          value={normalized.lopDays}
          tone={normalized.lopDays > 0 ? "warning" : "default"}
        />
        {showPending ? (
          <Stat
            label="Pending requests"
            value={normalized.pendingLeaveCount}
            tone={normalized.pendingLeaveCount > 0 ? "warning" : "default"}
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
              Days beyond casual and sick leave become Loss of Pay (LOP).
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export default LeaveBalancePanel;
