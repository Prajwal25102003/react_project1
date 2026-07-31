import {
  normalizeLeaveBalances,
  previewLeaveDeduction,
} from "../../models/leaveBalancesModel.js";

function formatBalanceValue(value) {
  const n = Number(value);
  if (Number.isNaN(n)) return value ?? "—";
  return Number.isInteger(n) ? String(n) : String(Math.round(n * 10) / 10);
}

function formatDaysLabel(value) {
  const n = Number(value);
  if (Number.isNaN(n)) return "";
  return n === 1 ? "day" : "days";
}

/** Soft tint shells — same palette as status pills / alert banners. */
const STAT_TONE = {
  brand: {
    shell: "border-brand-500/20 bg-brand-50",
    label: "text-brand-500/80",
    value: "text-brand-500",
  },
  success: {
    shell: "border-success-500/20 bg-success-50",
    label: "text-success-700/80",
    value: "text-success-700",
  },
  info: {
    shell: "border-blue-light-500/20 bg-blue-light-50",
    label: "text-blue-light-700/80",
    value: "text-blue-light-700",
  },
  warning: {
    shell: "border-warning-500/20 bg-warning-50",
    label: "text-warning-700/80",
    value: "text-warning-700",
  },
  error: {
    shell: "border-error-500/20 bg-error-50",
    label: "text-error-700/80",
    value: "text-error-700",
  },
  default: {
    shell: "border-gray-200 bg-white",
    label: "text-gray-500",
    value: "text-gray-800",
  },
};

function Stat({ label, value, tone = "default", unit = true }) {
  const colors = STAT_TONE[tone] || STAT_TONE.default;
  const display = formatBalanceValue(value);
  const daysLabel = unit ? formatDaysLabel(value) : "";

  return (
    <div
      className={`flex h-full min-h-[4.75rem] min-w-0 flex-col justify-between rounded-xl border px-3 py-2.5 text-left ${colors.shell}`}
    >
      <p
        className={`min-h-[2.25rem] text-theme-xs font-medium leading-snug ${colors.label}`}
      >
        {label}
      </p>
      <p className="mt-1 flex min-h-[1.75rem] items-baseline gap-1 leading-none">
        <span className={`text-xl font-semibold tabular-nums ${colors.value}`}>
          {display}
        </span>
        {daysLabel ? (
          <span className={`text-theme-xs font-medium ${colors.label}`}>
            {daysLabel}
          </span>
        ) : (
          <span className="text-theme-xs font-medium text-transparent">days</span>
        )}
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
      <div className="mb-3 space-y-1">
        <h4 className="text-sm font-semibold text-gray-800">{title}</h4>
        <p className="text-theme-xs leading-relaxed text-gray-500">
          Paid leave uses this employee&apos;s casual and sick balances. LOP
          (Loss of Pay) applies only after both are used.
        </p>
      </div>

      <div
        className={
          showPending
            ? "grid grid-cols-2 items-stretch gap-2 sm:grid-cols-[repeat(5,minmax(0,1fr))]"
            : "grid grid-cols-2 items-stretch gap-2 sm:grid-cols-[repeat(4,minmax(0,1fr))]"
        }
      >
        <Stat
          label="Total available"
          value={totalAvailable}
          tone={totalAvailable > 0 ? "brand" : "warning"}
        />
        <Stat
          label="Casual leave left"
          value={normalized.casualLeaveBalance}
          tone="success"
        />
        <Stat
          label="Sick leave left"
          value={normalized.sickLeaveBalance}
          tone="info"
        />
        <Stat
          label="LOP days"
          value={normalized.lopDays}
          tone="warning"
        />
        {showPending ? (
          <Stat
            label="Pending requests"
            value={normalized.pendingLeaveCount}
            tone={normalized.pendingLeaveCount > 0 ? "error" : "default"}
            unit={false}
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
              {formatBalanceValue(preview.fromLop)} day
              {Number(preview.fromLop) === 1 ? "" : "s"} of this leave will be
              Loss of Pay (LOP).
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export default LeaveBalancePanel;
