export function formatRelativeTime(isoDate) {
  const date = new Date(isoDate)
  if (Number.isNaN(date.getTime())) return '—'

  const diffMs = Date.now() - date.getTime()
  if (diffMs < 0) {
    const futureDays = Math.ceil(Math.abs(diffMs) / 86400000)
    if (futureDays <= 1) return 'Upcoming'
    return `In ${futureDays} days`
  }

  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes} min ago`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`

  const days = Math.floor(hours / 24)
  return `${days} day${days === 1 ? '' : 's'} ago`
}

export function mapActivityRows(rows) {
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category,
    time: formatRelativeTime(row.activityTime),
    status: row.status,
    audience: row.audience || null,
  }))
}
