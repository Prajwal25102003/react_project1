/**
 * Indian mobile numbers: exactly 10 digits.
 * Stored/display format: +91 XXXXX XXXXX
 */

/** @returns {string|null} Normalized +91 number, or null if invalid */
export function normalizeIndianPhone(value) {
  const digits = String(value ?? '').replace(/\D/g, '')
  if (!digits) return null

  let mobile = digits
  if (mobile.startsWith('91') && mobile.length >= 12) {
    mobile = mobile.slice(-10)
  } else if (mobile.length === 11 && mobile.startsWith('0')) {
    mobile = mobile.slice(1)
  }

  if (!/^\d{10}$/.test(mobile)) return null
  return `+91 ${mobile.slice(0, 5)} ${mobile.slice(5)}`
}

export function isValidIndianPhone(value) {
  return normalizeIndianPhone(value) !== null
}
