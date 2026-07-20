/** Client-side leave balance rules (mirrors server leaveBalancesModel). */

export const DEFAULT_LEAVE_BALANCES = {
  casualLeaveBalance: 1,
  sickLeaveBalance: 1,
  lopDays: 0,
};

export function normalizeLeaveBalances(source = {}) {
  return {
    casualLeaveBalance: Math.max(0, Number(source.casualLeaveBalance ?? 0)),
    sickLeaveBalance: Math.max(0, Number(source.sickLeaveBalance ?? 0)),
    lopDays: Math.max(0, Number(source.lopDays ?? 0)),
    pendingLeaveCount:
      source.pendingLeaveCount === undefined || source.pendingLeaveCount === null
        ? null
        : Math.max(0, Number(source.pendingLeaveCount)),
  };
}

/**
 * Preview how a leave request will consume quotas on approval.
 * Medical/Sick → sick → casual → LOP
 * Casual → casual → LOP
 * Maternity → paid separately (no sick/casual/LOP change)
 * Other → LOP when no paid balance applies
 */
export function previewLeaveDeduction(balances, leaveType, leaveDays) {
  const current = normalizeLeaveBalances(balances);
  const days = Math.max(0, Number(leaveDays) || 0);
  let casual = current.casualLeaveBalance;
  let sick = current.sickLeaveBalance;
  let lop = current.lopDays;
  let remaining = days;
  let fromSick = 0;
  let fromCasual = 0;
  let fromLop = 0;

  const type = String(leaveType || "").trim();

  if (days === 0) {
    return {
      ...current,
      after: { casualLeaveBalance: casual, sickLeaveBalance: sick, lopDays: lop },
      fromSick,
      fromCasual,
      fromLop,
      willUseLop: false,
      summary: "Enter leave dates to preview balance impact.",
    };
  }

  if (type === "Maternity Leave") {
    return {
      ...current,
      after: { casualLeaveBalance: casual, sickLeaveBalance: sick, lopDays: lop },
      fromSick,
      fromCasual,
      fromLop,
      willUseLop: false,
      summary:
        "Paid maternity leave (2 weeks before + 24 weeks after delivery). Casual and sick balances are not reduced.",
    };
  }

  if (type === "Medical Leave" || type === "Sick Leave") {
    fromSick = Math.min(sick, remaining);
    sick -= fromSick;
    remaining -= fromSick;
    fromCasual = Math.min(casual, remaining);
    casual -= fromCasual;
    remaining -= fromCasual;
    fromLop = remaining;
    lop += remaining;
    remaining = 0;
  } else if (type === "Casual Leave") {
    fromCasual = Math.min(casual, remaining);
    casual -= fromCasual;
    remaining -= fromCasual;
    fromLop = remaining;
    lop += remaining;
    remaining = 0;
  } else {
    fromLop = remaining;
    lop += remaining;
    remaining = 0;
  }

  const parts = [];
  if (fromSick) parts.push(`${fromSick} sick`);
  if (fromCasual) parts.push(`${fromCasual} casual`);
  if (fromLop) parts.push(`${fromLop} LOP (loss of pay)`);

  return {
    ...current,
    after: {
      casualLeaveBalance: casual,
      sickLeaveBalance: sick,
      lopDays: lop,
    },
    fromSick,
    fromCasual,
    fromLop,
    willUseLop: fromLop > 0,
    summary:
      parts.length > 0
        ? `On approval this will use: ${parts.join(", ")}.`
        : "No paid leave will be deducted.",
  };
}
