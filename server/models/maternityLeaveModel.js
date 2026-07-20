/**
 * Maternity leave rules:
 * - Female employees only
 * - 2 weeks before expected delivery + 24 weeks after (26 weeks / 182 calendar days)
 * - Paid — does not use casual, sick, or LOP balances
 */

export const MATERNITY_LEAVE_TYPE = 'Maternity Leave'
export const MATERNITY_WEEKS_BEFORE = 2
export const MATERNITY_WEEKS_AFTER = 24
export const MATERNITY_TOTAL_DAYS =
  (MATERNITY_WEEKS_BEFORE + MATERNITY_WEEKS_AFTER) * 7

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

export function isMaternityLeave(leaveType) {
  return String(leaveType || '').trim() === MATERNITY_LEAVE_TYPE
}

export function isFemaleEmployee(gender) {
  return String(gender || '').trim().toLowerCase() === 'female'
}

export function addCalendarDays(isoDate, days) {
  const date = new Date(`${isoDate}T00:00:00`)
  if (Number.isNaN(date.getTime())) return null
  date.setDate(date.getDate() + days)
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** start = delivery − 14 days, end = delivery + 167 days (182 days inclusive). */
export function maternityDatesFromDelivery(expectedDeliveryDate) {
  const delivery = String(expectedDeliveryDate || '').trim()
  if (!ISO_DATE.test(delivery)) return null

  const startDate = addCalendarDays(delivery, -(MATERNITY_WEEKS_BEFORE * 7))
  const endDate = addCalendarDays(delivery, MATERNITY_WEEKS_AFTER * 7 - 1)
  if (!startDate || !endDate) return null

  return {
    expectedDeliveryDate: delivery,
    startDate,
    endDate,
    leaveDays: MATERNITY_TOTAL_DAYS,
  }
}

export function validateMaternityLeaveRequest({
  gender,
  expectedDeliveryDate,
  startDate,
  endDate,
  leaveDays,
}) {
  const errors = []

  if (!isFemaleEmployee(gender)) {
    errors.push('Maternity leave is only available for female employees')
    return { errors, maternity: null }
  }

  const maternity = maternityDatesFromDelivery(expectedDeliveryDate)
  if (!maternity) {
    errors.push('Expected delivery date is required for maternity leave (YYYY-MM-DD)')
    return { errors, maternity: null }
  }

  if (startDate && startDate !== maternity.startDate) {
    errors.push(
      `Maternity leave must start 2 weeks before delivery (${maternity.startDate})`,
    )
  }
  if (endDate && endDate !== maternity.endDate) {
    errors.push(
      `Maternity leave must end 24 weeks after delivery (${maternity.endDate})`,
    )
  }
  if (
    leaveDays != null &&
    Number(leaveDays) !== maternity.leaveDays
  ) {
    errors.push(
      `Maternity leave is a fixed paid entitlement of ${MATERNITY_TOTAL_DAYS} days (26 weeks)`,
    )
  }

  return { errors, maternity }
}
