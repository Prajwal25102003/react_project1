/**
 * Personalize activity/notification copy for the viewing user.
 * Titles are Sent / Received based on who acted vs who is viewing.
 */

function roleLabel(role) {
  const key = String(role || '').toLowerCase()
  if (key === 'hr') return 'HR'
  if (key === 'admin') return 'Admin'
  if (key === 'team_lead' || key === 'teamlead') return 'team lead'
  if (key === 'employee') return 'employee'
  return role || 'reviewer'
}

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
    (String(row.id || '').startsWith('leave-') && sameId(viewerId, subjectId))
    || (String(row.id || '').startsWith('att-') && sameId(viewerId, subjectId))

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
    title.includes('leave auto-approved')

  if (isLeaveTitle || row.category === 'Leave') {
    if (startsWithViewerName(row.description, viewer.name)) {
      if (title.includes('cancel')) return 'sent'
      if (title.includes('submitted') || title.includes('request')) return 'sent'
    }
    if (
      title.includes('submitted') ||
      title.includes('cancelled') ||
      title.includes('approved') ||
      title.includes('rejected') ||
      title.includes('quotas')
    ) {
      // Org inbox: someone else's leave action → received
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
      title: 'Sent',
      description: `You requested ${leaveType} for ${range}.`,
    }
  }
  return {
    title: 'Received',
    description: `${subjectName} requested ${leaveType} for ${range}.`,
  }
}

function leaveCancelledCopy({ isSubject, subjectName, leaveType, range }) {
  if (isSubject) {
    return {
      title: 'Sent',
      description: `You cancelled ${leaveType} (${range}).`,
    }
  }
  return {
    title: 'Received',
    description: `${subjectName} cancelled ${leaveType} (${range}).`,
  }
}

function leaveAutoApprovedCopy({ isSubject, subjectName, leaveType, range }) {
  if (isSubject) {
    return {
      title: 'Sent',
      description: `You requested ${leaveType} for ${range} — auto-approved.`,
    }
  }
  return {
    title: 'Received',
    description: `${subjectName} requested ${leaveType} for ${range} — auto-approved.`,
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
  approved,
}) {
  const verb = approved ? 'approved' : 'rejected'
  const byRole = roleLabel(actorRole)
  const remarkSuffix = remarks ? `: ${remarks}` : ''

  if (isActor) {
    return {
      title: 'Sent',
      description: `You ${verb} ${subjectName}'s ${leaveType} (${range})${remarkSuffix}.`,
    }
  }

  if (isSubject) {
    return {
      title: 'Received',
      description: actorRole
        ? `Your ${leaveType} (${range}) was ${verb} by ${byRole}${remarkSuffix}.`
        : `Your ${leaveType} (${range}) was ${verb}${remarkSuffix}.`,
    }
  }

  return {
    title: 'Received',
    description: `${subjectName} — ${leaveType} (${range}) ${verb} by ${byRole}${remarkSuffix}`,
  }
}

/** Rewrite legacy titles that still say "Leave request submitted" etc. */
function legacyTitleForDirection(title, direction) {
  if (!direction) return title
  const lower = String(title || '').toLowerCase()
  if (
    lower.includes('leave request submitted') ||
    lower.includes('leave request sent') ||
    lower.includes('leave request cancelled') ||
    lower.includes('leave approved') ||
    lower.includes('leave rejected') ||
    lower.includes('leave auto-approved') ||
    lower.includes('leave decision')
  ) {
    return direction === 'sent' ? 'Sent' : 'Received'
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
  const range = meta.range || ''
  const remarks = meta.remarks || ''
  const actorRole = meta.actorRole || row.actorRole || ''

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
      approved: eventType === 'leave.approved',
    }))
  } else if (eventType === 'attendance.marked') {
    const date = meta.attendanceDate || ''
    const status = meta.attendanceStatus || row.status || 'Present'
    if (isSubject) {
      title =
        status === 'Absent'
          ? 'Marked absent'
          : status === 'Half Day'
            ? 'Half day recorded'
            : 'Attendance marked'
      description = date
        ? `You were marked ${status} on ${date}`
        : `You were marked ${status}`
    } else {
      title =
        status === 'Absent'
          ? 'Marked absent'
          : status === 'Half Day'
            ? 'Half day recorded'
            : 'Attendance marked'
      description = date
        ? `${subjectName} was marked ${status} on ${date}`
        : `${subjectName} was marked ${status}`
    }
  } else if (
    row.audience === 'self' ||
    (String(row.id || '').startsWith('leave-') && isSubject)
  ) {
    title = direction === 'sent' ? 'Sent' : direction === 'received' ? 'Received' : title
  } else if (direction) {
    title = legacyTitleForDirection(title, direction)
  }

  return { title, description, direction }
}
