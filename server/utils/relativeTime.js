import { personalizeActivityMessage } from './activityMessages.js'
import { formatActivityTimestamp } from './activityCopy.js'
import { enrichLeaveActivityRows } from './leaveActivityWorkflow.js'

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

function mapOneActivityRow(row, viewer = null) {
  const personalized = viewer
    ? personalizeActivityMessage(row, viewer)
    : {
        title: row.title,
        description: row.description,
        direction: null,
        directionLabel: null,
      }

  const meta = parseMeta(row.meta)

  const activityTime = row.activityTime
    ? new Date(row.activityTime).toISOString()
    : null

  return {
    id: row.id,
    title: personalized.title || row.title,
    description: personalized.description || row.description,
    category: row.category,
    activityTime,
    time: formatRelativeTime(row.activityTime),
    status: row.status,
    audience: row.audience || null,
    direction: personalized.direction || null,
    directionLabel: personalized.directionLabel || null,
    eventType: row.eventType || null,
    leaveRequestId:
      meta?.leaveRequestId || leaveIdFromActivityId(row.id) || null,
    subjectEmployeeId: row.subjectEmployeeId || null,
    departmentId: meta?.departmentId || null,
    departmentName: meta?.departmentName || null,
    holidayId: meta?.holidayId || null,
    holidayDate: meta?.holidayDate || null,
    attendanceId: meta?.attendanceId || null,
    attendanceIds: Array.isArray(meta?.attendanceIds)
      ? meta.attendanceIds.map(String).filter(Boolean)
      : [],
    employeeIds: Array.isArray(meta?.employeeIds)
      ? meta.employeeIds.map(String).filter(Boolean)
      : [],
    fromLop: Number(meta?.fromLop || 0) || 0,
    willUseLop: Boolean(meta?.willUseLop) || Number(meta?.fromLop || 0) > 0,
  }
}

/** Sync map — prefer mapActivityRowsAsync when leave workflow enrichment is needed. */
export function mapActivityRows(rows, viewer = null) {
  return (rows || []).map((row) => mapOneActivityRow(row, viewer))
}

/**
 * Enrich leave rows with live hierarchy / dept head, then personalize per viewer.
 */
export async function mapActivityRowsAsync(rows, viewer = null) {
  const enriched = await enrichLeaveActivityRows(rows || [])
  return enriched.map((row) => mapOneActivityRow(row, viewer))
}
