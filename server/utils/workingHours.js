/**
 * Parse clock strings like "09:02 AM" / "06:05 PM" into minutes since midnight.
 * Returns null for empty, placeholder, or invalid values.
 */
function parseClockToMinutes(value) {
  if (value === null || value === undefined) return null

  const text = String(value).trim()
  if (!text || text === '—' || text === '-') return null

  const match = text.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
  if (!match) return null

  let hours = Number(match[1])
  const minutes = Number(match[2])
  const meridiem = match[3].toUpperCase()

  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null
  if (hours < 1 || hours > 12 || minutes < 0 || minutes > 59) return null

  if (meridiem === 'AM') {
    if (hours === 12) hours = 0
  } else if (hours !== 12) {
    hours += 12
  }

  return hours * 60 + minutes
}

/** Working hours from check-in / check-out, or null if not calculable. */
export function calculateWorkingHours(checkIn, checkOut) {
  const start = parseClockToMinutes(checkIn)
  const end = parseClockToMinutes(checkOut)
  if (start === null || end === null) return null

  let diff = end - start
  if (diff < 0) diff += 24 * 60

  return Number((diff / 60).toFixed(2))
}
