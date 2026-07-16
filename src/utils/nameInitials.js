/**
 * Initials from a person's name (e.g. "Arjun Tejas" → "AT").
 * Falls back to first character, then "?".
 */
export function getNameInitials(name, maxLetters = 2) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) return "?";

  if (parts.length === 1) {
    return parts[0].slice(0, maxLetters).toUpperCase();
  }

  return parts
    .slice(0, maxLetters)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}
