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

  return null
}

function leaveSubmittedCopy({ isSubject, subjectName, leaveType, range }) {
  if (isSubject) {
    return {
      title: 'Leave Request Submitted',
      description: `You submitted a ${leaveType} request (${range}).`,
    }
  }
  return {
    title: 'Leave Request Submitted',
    description: `${subjectName} submitted a ${leaveType} request (${range}).`,
  }
}

function leaveCancelledCopy({ isSubject, subjectName, leaveType, range }) {
  if (isSubject) {
    return {
      title: 'Leave Request Cancelled',
      description: `You cancelled your ${leaveType} request (${range}).`,
    }
  }
  return {
    title: 'Leave Request Cancelled',
    description: `${subjectName} cancelled a ${leaveType} request (${range}).`,
  }
}

function leaveAutoApprovedCopy({ isSubject, subjectName, leaveType, range }) {
  if (isSubject) {
    return {
      title: 'Leave Request Auto-Approved',
      description: `Your ${leaveType} request (${range}) was approved automatically by the system.`,
    }
  }
  return {
    title: 'Leave Request Auto-Approved',
    description: `${subjectName}'s ${leaveType} request (${range}) was approved automatically by the system.`,
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
}) {
  const verb = approved ? 'approved' : 'rejected'
  const title = approved ? 'Leave Request Approved' : 'Leave Request Rejected'
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

  if (isActor) {
    return {
      title,
      description: `You ${verb} ${subjectName}'s ${leaveType} request (${range}).${remarkSuffix}`,
    }
  }

  if (isSubject) {
    return {
      title,
      description: `Your ${leaveType} request (${range}) has been ${verb}${byClause}.${remarkSuffix}`,
    }
  }

  return {
    title,
    description: `${subjectName}'s ${leaveType} request (${range}) was ${verb}${byClause}.${remarkSuffix}`,
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
