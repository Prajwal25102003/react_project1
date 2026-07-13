export function formatDbError(error) {
  if (error?.message) return error.message

  if (Array.isArray(error?.errors) && error.errors.length > 0) {
    return error.errors
      .map((err) => err.message || err.code)
      .filter(Boolean)
      .join('; ')
  }

  if (error?.code) return `Database error (${error.code})`
  return 'Unable to connect to PostgreSQL. Is the postgresql-x64-18 service running?'
}
