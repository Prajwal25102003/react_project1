/**
 * Client-safe database error message. Logs detail server-side; never returns
 * raw PostgreSQL text to API consumers.
 */
export function formatDbError(error) {
  if (error) {
    const code = error.code ? ` [${error.code}]` : ''
    console.error(`[db]${code}`, error.message || error)
  }

  const code = error?.code

  if (code === '23505') {
    return 'A record with this value already exists'
  }
  if (code === '23503') {
    return 'Related record not found or still in use'
  }
  if (
    code === 'ECONNREFUSED' ||
    code === 'ENOTFOUND' ||
    code === 'ETIMEDOUT' ||
    code === '57P01' ||
    code === '57P03' ||
    code === '53300'
  ) {
    return 'Unable to connect to the database. Please try again later.'
  }

  return 'Something went wrong. Please try again later.'
}

/** Detailed message for server logs / startup diagnostics only. */
export function describeDbError(error) {
  if (error?.message) return error.message
  if (Array.isArray(error?.errors) && error.errors.length > 0) {
    return error.errors
      .map((err) => err.message || err.code)
      .filter(Boolean)
      .join('; ')
  }
  if (error?.code) return `Database error (${error.code})`
  return 'Unable to connect to PostgreSQL'
}
