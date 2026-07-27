/**
 * Personalize activity/notification copy for the viewing user.
 * Titles stay descriptive; direction (sent/received) is for navigation only.
 */

import {
  formatApproverLabel,
  formatDisplayDate,
  formatLeaveRangeText,
} from './activityCopy.js'

function sameId(a, b) {
  return Boolean(a && b && String(a) === String(b))
}

function parseMeta(meta) {
  if (!meta) return {}
  if (typeof meta === 'string') {
    try {
      return JSON.parse(meta) || {}
    } catch {
      return {}
    }
  }
  return meta
}

function startsWithViewerName(description, viewerName) {
  const name = String(viewerName || '').trim()
  if (!name || !description) return false
  return String(description).toLowerCase().startsWith(name.toLowerCase())
}

/**
 * @returns {'sent' | 'received' | null}
 */
export function resolveActivityDirection(row, viewer = {}) {
  const viewerId = viewer.employeeId || null
  const eventType = row.eventType || ''
  const subjectId = row.subjectEmployeeId || null
  const actorId = row.actorEmployeeId || null
  const isSubject = sameId(viewerId, subjectId)
  const isActor = sameId(viewerId, actorId)
  const isPersonalSelf =
    row.audience === 'self' ||
    (String(row.id || '').startsWith('leave-') && sameId(viewerId, subjectId)) ||
    (String(row.id || '').startsWith('att-') && sameId(viewerId, subjectId))

  if (eventType.startsWith('leave.')) {
    if (
      eventType === 'leave.submitted' ||
      eventType === 'leave.cancelled' ||
      eventType === 'leave.auto_approved'
    ) {
      if (isSubject || isActor) return 'sent'
      return 'received'
    }
    if (eventType.includes('approved') || eventType.includes('rejected')) {
      if (isActor) return 'sent'
      return 'received'
    }
  }

  // Sender / actor of any action — never treat as a received banner notification.
  if (isActor) return 'sent'

  if (eventType === 'attendance.marked') {
    return 'received'
  }

  if (isPersonalSelf) {
    const status = String(row.status || '')
    if (status === 'Pending' || status === 'Cancelled') return 'sent'
    if (
      status === 'Approved' ||
      status === 'Rejected' ||
      status === 'TeamLeadApproved'
    ) {
      return 'received'
    }
  }

  // Legacy leave rows (no event_type): infer from title + viewer name in description.
  const title = String(row.title || '').toLowerCase()
  const isLeaveTitle =
    title.includes('leave request') ||
    title.includes('leave approved') ||
    title.includes('leave rejected') ||
    title.includes('leave auto-approved') ||
    title === 'sent' ||
    title === 'received'

  if (isLeaveTitle || row.category === 'Leave') {
    if (startsWithViewerName(row.description, viewer.name)) {
      if (title.includes('cancel')) return 'sent'
      if (title.includes('submitted') || title.includes('request') || title === 'sent') {
        return 'sent'
      }
    }
    if (
      title.includes('submitted') ||
      title.includes('cancelled') ||
      title.includes('approved') ||
      title.includes('rejected') ||
      title.includes('quotas') ||
      title === 'sent' ||
      title === 'received'
    ) {
      if (!startsWithViewerName(row.description, viewer.name)) {
        return 'received'
      }
    }
  }

  // Org / module events the viewer did not perform → received.
  const category = String(row.category || '')
  if (
    eventType ||
    category === 'Holidays' ||
    category === 'Employees' ||
    category === 'Departments' ||
    category === 'Attendance' ||
    category === 'Leave'
  ) {
    return 'received'
  }

  return null
}

function formatDayCount(value) {
  const n = Math.round(Number(value) * 10) / 10
  if (!n) return ''
  return `${n} ${n === 1 ? 'day' : 'days'}`
}

/** Professional note about paid leave vs LOP allocation. */
function leaveAllocationNote(
  { fromCasual = 0, fromSick = 0, fromLop = 0 } = {},
  { past = false } = {},
) {
  const casual = Number(fromCasual) || 0
  const sick = Number(fromSick) || 0
  const lop = Number(fromLop) || 0
  if (!casual && !sick && !lop) return ''

  if (lop && !casual && !sick) {
    return past
      ? ' This leave was applied as Loss of Pay (LOP) because paid leave balance was insufficient.'
      : ' This request will be applied as Loss of Pay (LOP) because paid leave balance is insufficient.'
  }

  const parts = []
  if (casual) parts.push(`${formatDayCount(casual)} casual`)
  if (sick) parts.push(`${formatDayCount(sick)} sick`)
  if (lop) parts.push(`${formatDayCount(lop)} LOP`)
  return past
    ? ` Balance used: ${parts.join(', ')}.`
    : ` On approval this will use ${parts.join(', ')}.`
}

function leaveSubmittedCopy({
  isSubject,
  subjectName,
  leaveType,
  range,
  fromCasual = 0,
  fromSick = 0,
  fromLop = 0,
}) {
  const period = range ? ` for ${range}` : ''
  const allocation = leaveAllocationNote({ fromCasual, fromSick, fromLop })
  if (isSubject) {
    return {
      title: 'Leave Request Submitted',
      description: `Your ${leaveType} request${period} has been submitted for approval.${allocation}`,
    }
  }
  return {
    title: 'Leave Request Submitted',
    description: `${leaveType} request from ${subjectName}${period} is awaiting your review.${allocation}`,
  }
}

function leaveCancelledCopy({ isSubject, subjectName, leaveType, range }) {
  const period = range ? ` for ${range}` : ''
  if (isSubject) {
    return {
      title: 'Leave Request Cancelled',
      description: `You cancelled your ${leaveType} request${period}.`,
    }
  }
  return {
    title: 'Leave Request Cancelled',
    description: `${leaveType} request from ${subjectName}${period} has been cancelled.`,
  }
}

function leaveAutoApprovedCopy({ isSubject, subjectName, leaveType, range }) {
  const period = range ? ` for ${range}` : ''
  if (isSubject) {
    return {
      title: 'Leave Request Auto-Approved',
      description: `Your ${leaveType} request${period} was approved automatically.`,
    }
  }
  return {
    title: 'Leave Request Auto-Approved',
    description: `${leaveType} request from ${subjectName}${period} was approved automatically.`,
  }
}

function leaveDecisionCopy({
  isActor,
  isSubject,
  subjectName,
  leaveType,
  range,
  remarks,
  actorRole,
  actorName,
  stepLabel,
  approved,
  fromCasual = 0,
  fromSick = 0,
  fromLop = 0,
}) {
  const outcome = approved ? 'approved' : 'rejected'
  const title = approved ? 'Leave Request Approved' : 'Leave Request Rejected'
  const period = range ? ` for ${range}` : ''
  const hasApprover = Boolean(actorRole || actorName || stepLabel)
  const byLabel = hasApprover
    ? formatApproverLabel({
        role: actorRole,
        name: actorName,
        stepLabel,
      })
    : ''
  const byClause = byLabel ? ` by ${byLabel}` : ''
  const remarkSuffix = remarks ? ` Remarks: ${remarks}` : ''
  const allocation = approved
    ? leaveAllocationNote(
        { fromCasual, fromSick, fromLop },
        { past: true },
      )
    : ''

  if (isActor) {
    return {
      title,
      description: `You ${outcome} the ${leaveType} request from ${subjectName}${period}.${remarkSuffix}${allocation}`,
    }
  }

  if (isSubject) {
    return {
      title,
      description: `Your ${leaveType} request${period} has been ${outcome}${byClause}.${remarkSuffix}${allocation}`,
    }
  }

  return {
    title,
    description: `${leaveType} request from ${subjectName}${period} has been ${outcome}${byClause}.${remarkSuffix}${allocation}`,
  }
}

function attendanceCopy({ isSubject, subjectName, status, date, checkIn }) {
  const dateLabel = date ? formatDisplayDate(date) : ''
  const hasCheckIn = checkIn && checkIn !== '—' && checkIn !== '-'

  if (status === 'Absent') {
    return {
      title: 'Marked Absent',
      description: isSubject
        ? dateLabel
          ? `You were marked Absent on ${dateLabel}.`
          : 'You were marked Absent.'
        : dateLabel
          ? `${subjectName} was marked Absent on ${dateLabel}.`
          : `${subjectName} was marked Absent.`,
    }
  }

  if (status === 'Half Day') {
    return {
      title: 'Half Day Recorded',
      description: isSubject
        ? hasCheckIn
          ? `Half-day attendance recorded at ${checkIn}.`
          : dateLabel
            ? `Half-day attendance recorded on ${dateLabel}.`
            : 'Half-day attendance recorded.'
        : hasCheckIn
          ? `${subjectName} recorded a half day at ${checkIn}.`
          : dateLabel
            ? `${subjectName} recorded a half day on ${dateLabel}.`
            : `${subjectName} recorded a half day.`,
    }
  }

  return {
    title: 'Attendance Marked',
    description: isSubject
      ? hasCheckIn
        ? `Check-in recorded at ${checkIn}.`
        : dateLabel
          ? `Attendance marked Present on ${dateLabel}.`
          : 'Attendance marked Present.'
      : hasCheckIn
        ? `${subjectName} checked in at ${checkIn}.`
        : dateLabel
          ? `${subjectName} was marked Present on ${dateLabel}.`
          : `${subjectName} was marked Present.`,
  }
}

/** Map legacy Sent/Received leave titles to descriptive ones. */
function legacyLeaveTitle(title, status) {
  const lower = String(title || '').toLowerCase()
  if (
    lower === 'sent' ||
    lower === 'received' ||
    lower.includes('leave request submitted') ||
    lower.includes('leave request sent')
  ) {
    if (status === 'Cancelled') return 'Leave Request Cancelled'
    if (status === 'Approved' || status === 'TeamLeadApproved') {
      return 'Leave Request Approved'
    }
    if (status === 'Rejected') return 'Leave Request Rejected'
    if (status === 'Pending') return 'Leave Request Submitted'
  }
  if (lower.includes('leave request cancelled') || lower.includes('leave cancelled')) {
    return 'Leave Request Cancelled'
  }
  if (lower.includes('leave approved') || lower.includes('approved by')) {
    return 'Leave Request Approved'
  }
  if (lower.includes('leave rejected') || lower.includes('rejected by')) {
    return 'Leave Request Rejected'
  }
  if (lower.includes('leave auto-approved')) {
    return 'Leave Request Auto-Approved'
  }
  return title
}

/**
 * Returns { title, description, direction } for display.
 */
export function personalizeActivityMessage(row, viewer = {}) {
  const eventType = row.eventType || ''
  const meta = parseMeta(row.meta)
  const viewerId = viewer.employeeId || null
  const subjectId = row.subjectEmployeeId || null
  const actorId = row.actorEmployeeId || null
  const isSubject = sameId(viewerId, subjectId)
  const isActor = sameId(viewerId, actorId)
  const direction = resolveActivityDirection(row, viewer)

  const subjectName = meta.subjectName || 'Employee'
  const leaveType = meta.leaveType || 'Leave'
  const range = formatLeaveRangeText(meta.range || '')
  const remarks = meta.remarks || ''
  const actorRole = meta.actorRole || row.actorRole || ''
  const actorName = meta.actorName || ''
  const stepLabel = meta.stepLabel || ''

  let title = row.title || ''
  let description = row.description || ''

  if (eventType === 'leave.submitted' && range) {
    ;({ title, description } = leaveSubmittedCopy({
      isSubject: isSubject || isActor,
      subjectName,
      leaveType,
      range,
      fromCasual: meta.fromCasual || 0,
      fromSick: meta.fromSick || 0,
      fromLop: meta.fromLop || 0,
    }))
  } else if (eventType === 'leave.cancelled' && range) {
    ;({ title, description } = leaveCancelledCopy({
      isSubject: isSubject || isActor,
      subjectName,
      leaveType,
      range,
    }))
  } else if (eventType === 'leave.auto_approved' && range) {
    ;({ title, description } = leaveAutoApprovedCopy({
      isSubject: isSubject || isActor,
      subjectName,
      leaveType,
      range,
    }))
  } else if (
    (eventType === 'leave.approved' || eventType === 'leave.rejected') &&
    range
  ) {
    ;({ title, description } = leaveDecisionCopy({
      isActor,
      isSubject,
      subjectName,
      leaveType,
      range,
      remarks,
      actorRole,
      actorName,
      stepLabel,
      approved: eventType === 'leave.approved',
      fromCasual: meta.fromCasual || 0,
      fromSick: meta.fromSick || 0,
      fromLop: meta.fromLop || 0,
    }))
  } else if (eventType === 'attendance.marked') {
    ;({ title, description } = attendanceCopy({
      isSubject,
      subjectName,
      status: meta.attendanceStatus || row.status || 'Present',
      date: meta.attendanceDate || '',
      checkIn: meta.checkIn || '',
    }))
  } else if (
    row.audience === 'self' ||
    (String(row.id || '').startsWith('leave-') && isSubject)
  ) {
    title = legacyLeaveTitle(title, row.status)
  } else if (direction && row.category === 'Leave') {
    title = legacyLeaveTitle(title, row.status)
  }

  return { title, description, direction }
}
