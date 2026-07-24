import { personalizeActivityMessage } from './activityMessages.js'

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

function parseMeta(meta) {
  if (!meta) return null
  if (typeof meta === 'string') {
    try {
      return JSON.parse(meta) || null
    } catch {
      return null
    }
  }
  return meta
}

/** Extract leave request id from composite activity ids like "leave-LR-12". */
function leaveIdFromActivityId(id) {
  const match = String(id || '').match(/^leave-(.+)$/i)
  return match ? match[1] : null
}

export function mapActivityRows(rows, viewer = null) {
  return (rows || []).map((row) => {
    const personalized = viewer
      ? personalizeActivityMessage(row, viewer)
      : {
          title: row.title,
          description: row.description,
          direction: null,
        }

    const meta = parseMeta(row.meta)

    return {
      id: row.id,
      title: personalized.title || row.title,
      description: personalized.description || row.description,
      category: row.category,
      time: formatRelativeTime(row.activityTime),
      status: row.status,
      audience: row.audience || null,
      direction: personalized.direction || null,
      eventType: row.eventType || null,
      leaveRequestId:
        meta?.leaveRequestId || leaveIdFromActivityId(row.id) || null,
    }
  })
}
