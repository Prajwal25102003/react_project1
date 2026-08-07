/**
 * Parse limit/offset from Express query (capped for safety).
 */
export function parsePagination(
  query = {},
  { defaultLimit = 200, maxLimit = 500 } = {},
) {
  const rawLimit = Number(query.limit)
  const rawOffset = Number(query.offset)
  const limit = Number.isFinite(rawLimit)
    ? Math.min(maxLimit, Math.max(1, Math.floor(rawLimit)))
    : defaultLimit
  const offset = Number.isFinite(rawOffset)
    ? Math.max(0, Math.floor(rawOffset))
    : 0
  return { limit, offset }
}

/** Slice an in-memory list and return pagination metadata. */
export function paginateArray(items, { limit, offset }) {
  const list = Array.isArray(items) ? items : []
  const total = list.length
  return {
    rows: list.slice(offset, offset + limit),
    total,
    limit,
    offset,
    hasMore: offset + limit < total,
  }
}
