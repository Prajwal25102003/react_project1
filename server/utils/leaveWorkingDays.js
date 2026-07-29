/**
 * Leave day counting excludes Saturdays, Sundays, and company holidays.
 */

function toIsoDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function parseIsoDate(value) {
  const date = new Date(`${value}T00:00:00`)
  return Number.isNaN(date.getTime()) ? null : date
}

function toHolidaySet(holidayDates) {
  if (holidayDates instanceof Set) return holidayDates
  return new Set(
    (holidayDates || [])
      .map((value) => String(value || '').trim())
      .filter(Boolean),
  )
}

export function isWeekendDate(date) {
  const day = date.getDay()
  return day === 0 || day === 6
}

export function isWorkingLeaveDay(dateStr, holidayDates = []) {
  const date = parseIsoDate(dateStr)
  if (!date) return false
  if (isWeekendDate(date)) return false
  return !toHolidaySet(holidayDates).has(dateStr)
}

/**
 * Inclusive count of Mon–Fri days that are not in holidayDates.
 * @returns {number|null} null when dates are invalid
 */
export function countWorkingLeaveDays(startDate, endDate, holidayDates = []) {
  const start = parseIsoDate(startDate)
  const end = parseIsoDate(endDate)
  if (!start || !end) return null
  if (end < start) return 0

  const holidays = toHolidaySet(holidayDates)
  let count = 0
  const cursor = new Date(start)
  while (cursor <= end) {
    const iso = toIsoDate(cursor)
    if (!isWeekendDate(cursor) && !holidays.has(iso)) {
      count += 1
    }
    cursor.setDate(cursor.getDate() + 1)
  }
  return count
}
