/**
 * Maternity leave rules (mirrors server maternityLeaveModel):
 * - Female employees only
 * - 2 weeks before expected delivery + 24 weeks after (26 weeks / 182 calendar days)
 * - Paid — does not use casual, sick, or LOP balances
 */

export const MATERNITY_LEAVE_TYPE = "Maternity Leave";
export const MATERNITY_WEEKS_BEFORE = 2;
export const MATERNITY_WEEKS_AFTER = 24;
export const MATERNITY_TOTAL_DAYS =
  (MATERNITY_WEEKS_BEFORE + MATERNITY_WEEKS_AFTER) * 7;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function isMaternityLeave(leaveType) {
  return String(leaveType || "").trim() === MATERNITY_LEAVE_TYPE;
}

export function isFemaleEmployee(gender) {
  return String(gender || "").trim().toLowerCase() === "female";
}

export function addCalendarDays(isoDate, days) {
  const date = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  date.setDate(date.getDate() + days);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** start = delivery − 14 days, end = delivery + 167 days (182 days inclusive). */
export function maternityDatesFromDelivery(expectedDeliveryDate) {
  const delivery = String(expectedDeliveryDate || "").trim();
  if (!ISO_DATE.test(delivery)) return null;

  const startDate = addCalendarDays(delivery, -(MATERNITY_WEEKS_BEFORE * 7));
  const endDate = addCalendarDays(delivery, MATERNITY_WEEKS_AFTER * 7 - 1);
  if (!startDate || !endDate) return null;

  return {
    expectedDeliveryDate: delivery,
    startDate,
    endDate,
    leaveDays: String(MATERNITY_TOTAL_DAYS),
  };
}

export function leaveTypesForGender(gender, allTypes) {
  if (isFemaleEmployee(gender)) return allTypes;
  return allTypes.filter((type) => type !== MATERNITY_LEAVE_TYPE);
}

export const MATERNITY_LEAVE_HELP =
  "Paid maternity leave: 2 weeks before delivery and 24 weeks after (26 weeks / 182 days). Does not use casual or sick leave.";
