/**
 * Map PostgreSQL unique-violation (23505) to a user-facing message.
 * @param {unknown} error
 * @param {{ includes: string, message: string }[]} [matchers]
 */
export function uniqueConstraintMessage(error, matchers = []) {
  if (error?.code !== '23505') return null

  const detail = String(error.detail || '')
  for (const { includes, message } of matchers) {
    if (detail.includes(includes)) return message
  }

  return 'A record with this value already exists'
}
