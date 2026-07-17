/**
 * Indian mobile numbers: exactly 10 digits.
 * Stored/display format: +91 XXXXX XXXXX
 * Accepts 9876543210, 09876543210, +919876543210, +91 98765 43210, etc.
 */

/** @returns {string|null} Normalized "+91 XXXXX XXXXX", or null if invalid */
export function normalizeIndianPhone(value) {
  const digits = String(value ?? "").replace(/\D/g, "");
  if (!digits) return null;

  let mobile = digits;
  if (mobile.startsWith("91") && mobile.length >= 12) {
    mobile = mobile.slice(-10);
  } else if (mobile.length === 11 && mobile.startsWith("0")) {
    mobile = mobile.slice(1);
  }

  if (!/^\d{10}$/.test(mobile)) return null;
  return `+91 ${mobile.slice(0, 5)} ${mobile.slice(5)}`;
}

export function isValidIndianPhone(value) {
  return normalizeIndianPhone(value) !== null;
}

/** Keep only digits for the phone input, max 10 (Indian mobile). */
export function sanitizeIndianPhoneInput(value) {
  let digits = String(value ?? "").replace(/\D/g, "");
  if (digits.startsWith("91") && digits.length > 10) {
    digits = digits.slice(-10);
  } else if (digits.length === 11 && digits.startsWith("0")) {
    digits = digits.slice(1);
  }
  return digits.slice(0, 10);
}

/** 10 digits for form input (strips +91 if present). */
export function toIndianPhoneInputValue(value) {
  const normalized = normalizeIndianPhone(value);
  if (normalized) return normalized.replace(/\D/g, "").slice(-10);
  return sanitizeIndianPhoneInput(value);
}
