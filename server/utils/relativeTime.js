import { personalizeActivityMessage } from './activityMessages.js'
import { formatActivityTimestamp } from './activityCopy.js'

export function formatRelativeTime(isoDate) {
  return formatActivityTimestamp(isoDate)
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
