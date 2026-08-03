/**
 * Personalize activity/notification copy for the viewing user.
 * Leave titles adapt to hierarchy workflow (sent / received / you / forwarded).
 * Direction labels items for navigation and banner filtering — lists show both.
 */

import {
  formatActorLabel,
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

function isLeaveBalanceRecipient(meta, viewerId) {
  if (!viewerId || !meta) return false
  const ids = meta.employeeIds
  if (!Array.isArray(ids)) return false
  return ids.some((id) => sameId(id, viewerId))
}

/**
 * True when the viewing user performed the action.
 * Prefer employee id; fall back to meta.actorName for accounts without employeeId (e.g. admin).
 */
function isViewerActor(row, viewer = {}) {
  const viewerId = viewer.employeeId || null
  const actorId = row.actorEmployeeId || null
  if (sameId(viewerId, actorId)) return true

  const meta = parseMeta(row.meta)
  const actorName = String(meta.actorName || '').trim().toLowerCase()
  const viewerName = String(viewer.name || '').trim().toLowerCase()
  return Boolean(actorName && viewerName && actorName === viewerName)
}

function awaitingLabel(stepMeta, fallback = 'the next approver') {
  if (!stepMeta) return fallback
  if (stepMeta.stepLabel) return stepMeta.stepLabel
  return (
    formatApproverLabel({
      role: stepMeta.approverRole,
      stepLabel: stepMeta.stepLabel,
    }) || fallback
  )
}

/**
 * Match viewer to an approver step from leave hierarchy meta.
 * Uses frozen step kind/role/employee plus live departmentHeadId when present.
 */
export function viewerMatchesApproverStep(stepMeta, viewer = {}) {
  if (!stepMeta?.approverKind) return false
  if (stepMeta.approverKind === 'role') {
    return Boolean(
      stepMeta.approverRole && viewer.role === stepMeta.approverRole,
    )
  }
  if (stepMeta.approverKind === 'employee') {
    return sameId(viewer.employeeId, stepMeta.approverEmployeeId)
  }
  if (stepMeta.approverKind === 'department_head') {
    if (!viewer.employeeId) return false
    if (sameId(viewer.employeeId, stepMeta.requesterEmployeeId)) return false
    const headId =
      stepMeta.departmentHeadId || viewer.departmentHeadId || null
    if (headId) return sameId(viewer.employeeId, headId)
    return Boolean(viewer.isDepartmentHead)
  }
  return false
}

/** True when viewer is on a later hierarchy step than the live current step. */
export function viewerMatchesFutureApproverStep(meta = {}, viewer = {}) {
  const approvers = Array.isArray(meta.hierarchyApprovers)
    ? meta.hierarchyApprovers
    : []
  if (approvers.length === 0) return false

  const currentOrder = Number(
    meta.currentStepOrder ??
      meta.currentApprover?.stepOrder ??
      meta.nextApprover?.stepOrder ??
      0,
  )
  if (!currentOrder) return false

  return approvers.some((step) => {
    const order = Number(step?.stepOrder)
    if (!order || order <= currentOrder) return false
    return viewerMatchesApproverStep(step, viewer)
  })
}

/**
 * @returns {'sent' | 'received' | null}
 */
export function resolveActivityDirection(row, viewer = {}) {
  const viewerId = viewer.employeeId || null
  const eventType = row.eventType || ''
  const subjectId = row.subjectEmployeeId || null
  const isSubject =
    sameId(viewerId, subjectId) ||
    (eventType === 'employee.leave_balances' &&
      isLeaveBalanceRecipient(parseMeta(row.meta), viewerId))
  const isActor = isViewerActor(row, viewer)
  const meta = parseMeta(row.meta)
  const isBalanceRecipient =
    eventType === 'employee.leave_balances' &&
    isLeaveBalanceRecipient(meta, viewerId)
  const isPersonalSelf =
    row.audience === 'self' ||
    (String(row.id || '').startsWith('leave-') && sameId(viewerId, subjectId)) ||
    (String(row.id || '').startsWith('att-') && sameId(viewerId, subjectId)) ||
    isBalanceRecipient

  if (eventType === 'employee.leave_balances') {
    if (isActor) return 'sent'
    if (isBalanceRecipient || isSubject) return 'received'
    if (viewer.role === 'hr' || viewer.role === 'admin') return 'received'
    return null
  }

  if (eventType.startsWith('leave.')) {
    const finalStatus = String(meta.finalStatus || row.status || '')
    const leaveClosed =
      finalStatus === 'Rejected' ||
      finalStatus === 'Approved' ||
      finalStatus === 'Cancelled'
    const isStaffViewer =
      viewer.role === 'hr' || viewer.role === 'admin'

    if (
      eventType === 'leave.submitted' ||
      eventType === 'leave.cancelled' ||
      eventType === 'leave.auto_approved'
    ) {
      // Closed leave: submit rows are suppressed in enrich; if any remain, hide them.
      if (eventType === 'leave.submitted' && leaveClosed) {
        return null
      }
      if (isSubject || isActor) return 'sent'
      if (eventType === 'leave.submitted') {
        // Admin/HR oversee the full approval stepper — always inbound for them.
        if (isStaffViewer) return 'received'
        if (meta.currentApprover) {
          if (viewerMatchesApproverStep(meta.currentApprover, viewer)) {
            return 'received'
          }
          if (viewerMatchesFutureApproverStep(meta, viewer)) {
            return 'received'
          }
          return null
        }
        return 'received'
      }
      return 'received'
    }
    if (eventType.includes('approved') || eventType.includes('rejected')) {
      const awaitsNext =
        Boolean(meta.awaitsNext) || meta.finalStatus === 'Pending'
      if (awaitsNext && eventType.includes('approved')) {
        const nextTarget = meta.nextApprover || meta.currentApprover
        // Next approver must see this as inbound even if they acted earlier.
        if (
          nextTarget &&
          viewerMatchesApproverStep(nextTarget, viewer)
        ) {
          return 'received'
        }
        if (isActor) return 'sent'
        if (nextTarget) {
          if (viewerMatchesFutureApproverStep(meta, viewer)) {
            return 'received'
          }
          if (isSubject || isStaffViewer) return 'received'
          return null
        }
        if (isSubject || isStaffViewer) {
          return 'received'
        }
        return null
      }
      if (isActor) return 'sent'
      // Terminal reject/approve: actor (above), subject, staff, or prior step.
      if (isSubject) return 'received'
      if (isStaffViewer) return 'received'
      if (
        meta.previousApprover &&
        viewerMatchesApproverStep(meta.previousApprover, viewer)
      ) {
        return 'received'
      }
      // Team feeds already scope rows; treat remaining viewers as received.
      return 'received'
    }
  }

  if (isActor) return 'sent'

  if (eventType === 'employee.leave_balances') {
    return 'received'
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
      if (
        title.includes('submitted') ||
        title.includes('request') ||
        title === 'sent'
      ) {
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

/**
 * UI chip based on viewer role in the workflow.
 * Leave mid-chain approvals → Forwarded; actor actions → Sent; inbound → Received.
 */
export function resolveDirectionLabel({
  direction,
  eventType,
  title,
  awaitsNext,
  isActor = false,
  isCurrentApprover = false,
} = {}) {
  const dir = String(direction || '').toLowerCase()
  const type = String(eventType || '')
  const heading = String(title || '')

  if (
    /forwarded/i.test(heading) ||
    (isActor &&
      awaitsNext &&
      (type.includes('approved') || /in progress/i.test(heading)))
  ) {
    return 'Forwarded'
  }

  if (
    isCurrentApprover &&
    (/approval needed/i.test(heading) ||
      type === 'leave.submitted' ||
      (type.includes('approved') && awaitsNext))
  ) {
    return 'Received'
  }

  if (dir === 'sent' || (isActor && dir !== 'received')) return 'Sent'
  if (dir === 'received') return 'Received'
  return null
}

function formatDayCount(value) {
  const n = Math.round(Number(value) * 10) / 10
  if (!n) return ''
  return `${n} ${n === 1 ? 'day' : 'days'}`
}

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
  isCurrentApprover,
  isFutureApprover,
  currentStepLabel,
  hierarchyLabels = [],
  subjectName,
  leaveType,
  range,
  fromCasual = 0,
  fromSick = 0,
  fromLop = 0,
}) {
  const period = range ? ` for ${range}` : ''
  const allocation = leaveAllocationNote({ fromCasual, fromSick, fromLop })
  const chain =
    hierarchyLabels.length > 1
      ? ` Approval path: ${hierarchyLabels.join(' → ')}.`
      : ''
  const awaiting = currentStepLabel
    ? ` awaiting ${currentStepLabel}`
    : ' for approval'

  if (isSubject) {
    return {
      title: 'Leave Request Sent',
      description: `You sent a ${leaveType} request${period}; it is${awaiting}.${chain}${allocation}`,
    }
  }
  if (isCurrentApprover) {
    return {
      title: 'Leave Approval Needed',
      description: `${leaveType} request from ${subjectName}${period} is awaiting your review.${allocation}`,
    }
  }
  if (isFutureApprover) {
    const reviewer = currentStepLabel || 'the previous approver'
    return {
      title: `Waiting for ${currentStepLabel || 'Earlier Approver'}`,
      description: `${subjectName} applied for ${leaveType}${period}. This request is with ${reviewer} right now. You do not need to take any action yet. After ${reviewer} approves, it will be sent to you.${chain}${allocation}`,
    }
  }
  // Overseers (Admin/HR) and other inbound viewers — received + waiting.
  return {
    title: 'Leave Request Received',
    description: `${leaveType} request from ${subjectName}${period} has been received and is${awaiting}.${chain}${allocation}`,
  }
}

function leaveCancelledCopy({ isSubject, isActor, subjectName, leaveType, range }) {
  const period = range ? ` for ${range}` : ''
  if (isSubject) {
    return {
      title: 'Leave Request Cancelled',
      description: `You cancelled your ${leaveType} request${period}.`,
    }
  }
  if (isActor) {
    return {
      title: 'Leave Request Cancelled',
      description: `You cancelled the ${leaveType} request from ${subjectName}${period}.`,
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
  isNextApprover,
  isFutureApprover,
  nextStepLabel,
  currentStepLabel,
  hierarchyLabels = [],
  subjectName,
  leaveType,
  range,
  remarks,
  actorRole,
  actorName,
  stepLabel,
  approved,
  awaitsNext,
  fromCasual = 0,
  fromSick = 0,
  fromLop = 0,
}) {
  const outcome = approved ? 'approved' : 'rejected'
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
  const nextLabel = nextStepLabel || currentStepLabel || 'the next approver'
  const chain =
    hierarchyLabels.length > 1
      ? ` Path: ${hierarchyLabels.join(' → ')}.`
      : ''
  const allocation =
    approved && !awaitsNext
      ? leaveAllocationNote(
          { fromCasual, fromSick, fromLop },
          { past: true },
        )
      : ''

  if (approved && awaitsNext) {
    if (isNextApprover) {
      return {
        title: 'Leave Approval Needed',
        description: `${leaveType} request from ${subjectName}${period} is awaiting your review after approval${byClause}.${remarkSuffix}`,
      }
    }
    if (isFutureApprover) {
      return {
        title: `Waiting for ${nextLabel}`,
        description: `${subjectName} applied for ${leaveType}${period}. This request is with ${nextLabel} right now. You do not need to take any action yet. After ${nextLabel} approves, it will be sent to you.${chain}${remarkSuffix}`,
      }
    }
    if (isActor) {
      return {
        title: 'Leave Request Forwarded',
        description: `You approved the ${leaveType} request from ${subjectName}${period}. It is now forwarded to ${nextLabel}.${remarkSuffix}`,
      }
    }
    if (isSubject) {
      return {
        title: 'Leave Request In Progress',
        description: `Your ${leaveType} request${period} was approved${byClause} and is now awaiting ${nextLabel}.${chain}${remarkSuffix}`,
      }
    }
    return {
      title: 'Leave Request In Progress',
      description: `${leaveType} request from ${subjectName}${period} was approved${byClause} and is awaiting ${nextLabel}.${remarkSuffix}`,
    }
  }

  const title = approved ? 'Leave Request Approved' : 'Leave Request Rejected'

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

function attendanceCopy({
  isActor,
  isSubject,
  subjectName,
  status,
  date,
  checkIn,
  actorRole,
  actorName,
}) {
  const dateLabel = date ? formatDisplayDate(date) : ''
  const hasCheckIn = checkIn && checkIn !== '—' && checkIn !== '-'
  const byLabel = formatActorLabel({ role: actorRole, name: actorName })
  const byClause = byLabel && !isActor ? ` by ${byLabel}` : ''
  const onDate = dateLabel ? ` on ${dateLabel}` : ''

  if (status === 'Absent') {
    if (isActor && !isSubject) {
      return {
        title: 'You Marked Absent',
        description: `You marked ${subjectName} Absent${onDate}.`,
      }
    }
    if (isSubject) {
      return {
        title: 'Your Attendance Updated',
        description: `Your attendance has been marked Absent${onDate}${byClause}.`,
      }
    }
    return {
      title: 'Marked Absent',
      description: `${subjectName} was marked Absent${onDate}${byClause}.`,
    }
  }

  if (status === 'Half Day') {
    if (isActor && !isSubject) {
      return {
        title: 'You Recorded Half Day',
        description: hasCheckIn
          ? `You recorded a half day for ${subjectName} at ${checkIn}.`
          : `You recorded a half day for ${subjectName}${onDate}.`,
      }
    }
    if (isSubject) {
      return {
        title: 'Your Attendance Updated',
        description: hasCheckIn
          ? `Your attendance has been marked Half Day at ${checkIn}${byClause}.`
          : `Your attendance has been marked Half Day${onDate}${byClause}.`,
      }
    }
    return {
      title: 'Half Day Recorded',
      description: hasCheckIn
        ? `${subjectName} recorded a half day at ${checkIn}.`
        : `${subjectName} recorded a half day${onDate}.`,
    }
  }

  if (isActor && !isSubject) {
    return {
      title: 'You Marked Attendance',
      description: hasCheckIn
        ? `You marked ${subjectName} Present at ${checkIn}.`
        : `You marked ${subjectName} Present${onDate}.`,
    }
  }

  if (isSubject) {
    return {
      title: 'Your Attendance Updated',
      description: hasCheckIn
        ? `Your attendance has been marked Present at ${checkIn}${byClause}.`
        : `Your attendance has been marked Present${onDate}${byClause}.`,
    }
  }

  return {
    title: 'Attendance Marked',
    description: hasCheckIn
      ? `${subjectName} checked in at ${checkIn}.`
      : `${subjectName} was marked Present${onDate}.`,
  }
}

function attendanceRemovedCopy({
  isActor,
  isSubject,
  subjectName,
  date,
  actorRole,
  actorName,
}) {
  const dateLabel = date ? formatDisplayDate(date) : ''
  const onDate = dateLabel ? ` on ${dateLabel}` : ''
  const byLabel = formatActorLabel({ role: actorRole, name: actorName })
  const byClause = byLabel ? ` by ${byLabel}` : ''

  if (isActor && !isSubject) {
    return {
      title: 'You Removed Attendance',
      description: `You removed attendance for ${subjectName}${onDate}.`,
    }
  }

  if (isSubject) {
    return {
      title: 'Your Attendance Removed',
      description: `Your attendance has been removed${onDate}${byClause}.`,
    }
  }

  return {
    title: 'Attendance Removed',
    description: `Attendance for ${subjectName}${onDate} was removed${byClause}.`,
  }
}

function holidayCopy({ isActor, status, title, meta, actorRole, actorName }) {
  const byLabel = formatActorLabel({ role: actorRole, name: actorName })
  const name = meta.holidayName || 'Holiday'
  const dateLabel = meta.holidayDate ? formatDisplayDate(meta.holidayDate) : ''
  const year = meta.year || ''
  const count = meta.holidayCount
  const datePart = dateLabel ? ` (${dateLabel})` : ''
  const lower = String(title || '').toLowerCase()

  if (lower.includes('released') || status === 'Completed') {
    if (isActor) {
      return {
        title: 'You Released Holiday Calendar',
        description: year
          ? `You released the ${year} holiday calendar${
              count != null ? ` with ${count} holidays` : ''
            }.`
          : 'You released the holiday calendar.',
      }
    }
    return {
      title: 'Holiday Calendar Released',
      description: year
        ? `${byLabel} released the ${year} holiday calendar${
            count != null ? ` with ${count} holidays` : ''
          }.`
        : `${byLabel} released the holiday calendar.`,
    }
  }

  if (lower.includes('removed') || status === 'Removed') {
    if (isActor) {
      return {
        title: 'You Removed Holiday',
        description: `You removed ${name}${datePart} from the holiday calendar.`,
      }
    }
    return {
      title: 'Holiday Removed from Calendar',
      description: `${name}${datePart} was removed from the holiday calendar by ${byLabel}.`,
    }
  }

  if (lower.includes('updated') || status === 'Updated') {
    if (isActor) {
      return {
        title: 'You Updated Holiday',
        description: `You updated ${name}${datePart} on the holiday calendar.`,
      }
    }
    return {
      title: 'Holiday Updated',
      description: `${name}${datePart} was updated on the holiday calendar by ${byLabel}.`,
    }
  }

  // Added
  if (isActor) {
    return {
      title: 'You Added Holiday',
      description: `You added ${name}${datePart} to the company holiday calendar.`,
    }
  }
  return {
    title: 'Holiday Added to Calendar',
    description: `${name}${datePart} was added to the company holiday calendar by ${byLabel}.`,
  }
}

function departmentCopy({ isActor, status, title, meta, actorRole, actorName, description }) {
  const byLabel = formatActorLabel({ role: actorRole, name: actorName })
  const dept = meta.departmentName || 'Department'
  const lower = String(title || '').toLowerCase()
  const stored = String(description || '')

  if (lower.includes('created') || status === 'Added') {
    if (isActor) {
      return {
        title: `${dept} Department Created`,
        description: `You added the ${dept} department to the organization.`,
      }
    }
    return {
      title: `${dept} Department Created`,
      description: `${byLabel} added the ${dept} department to the organization.`,
    }
  }

  if (lower.includes('removed') || status === 'Removed') {
    if (isActor) {
      return {
        title: `${dept} Department Removed`,
        description: `You removed the ${dept} department from the organization.`,
      }
    }
    return {
      title: `${dept} Department Removed`,
      description: `${byLabel} removed the ${dept} department from the organization.`,
    }
  }

  // Updated — preserve head/rename detail from stored copy when present
  if (isActor) {
    let youDesc = `You updated the ${dept} department.`
    if (/department head changed/i.test(stored)) {
      const match = stored.match(
        /Department Head changed from (.+?) to (.+?)\.?$/i,
      )
      youDesc = match
        ? `You updated the ${dept} department. Department Head changed from ${match[1]} to ${match[2]}.`
        : youDesc
    } else if (/renamed the department from/i.test(stored)) {
      const match = stored.match(
        /renamed the department from (.+?) to (.+?)\.?$/i,
      )
      youDesc = match
        ? `You renamed the department from ${match[1]} to ${match[2]}.`
        : youDesc
    }
    return {
      title: `You Updated ${dept} Department`,
      description: youDesc,
    }
  }

  return {
    title: `${dept} Department Updated`,
    description:
      stored || `${byLabel} updated the ${dept} department.`,
  }
}

function employeeProfileCopy({
  isActor,
  isSubject,
  subjectName,
  actorRole,
  actorName,
  description,
  status,
  title,
  meta,
}) {
  const byLabel = formatActorLabel({ role: actorRole, name: actorName })
  const lower = String(title || '').toLowerCase()
  const stored = String(description || '')

  if (lower.includes('leave balance') || /leave balances/i.test(stored)) {
    const casual = meta.casualLeaveBalance
    const sick = meta.sickLeaveBalance
    const mode = String(meta.mode || '').toLowerCase()
    const amounts =
      casual !== undefined && sick !== undefined
        ? ` (casual ${casual}, sick ${sick})`
        : ''
    if (isActor) {
      return {
        title: 'You Updated Leave Balances',
        description: stored.replace(
          new RegExp(`^${escapeRegExp(byLabel)}\\s+`, 'i'),
          'You ',
        ),
      }
    }
    if (isSubject) {
      return {
        title: 'Your Leave Balances Were Updated',
        description:
          mode === 'add'
            ? `${byLabel} added leave to your balance${amounts}.`
            : `${byLabel} set your leave balances${amounts}.`,
      }
    }
    return {
      title: 'Leave Balances Updated',
      description: stored || `${byLabel} updated leave balances.`,
    }
  }

  if (lower.includes('new employee') || status === 'Added') {
    const dept = meta.departmentName || 'a department'
    const designation = meta.designation || 'an employee'
    if (isActor) {
      return {
        title: 'You Added Employee',
        description: `You added ${subjectName} to the ${dept} Department as ${designation}.`,
      }
    }
    if (isSubject) {
      return {
        title: 'Welcome',
        description: `You were added to the ${dept} Department as ${designation} by ${byLabel}.`,
      }
    }
    return {
      title: 'New Employee Added',
      description:
        stored ||
        `${subjectName} joined the ${dept} Department as ${designation}. Added by ${byLabel}.`,
    }
  }

  if (lower.includes('removed') || status === 'Removed') {
    if (isActor) {
      return {
        title: 'You Removed Employee',
        description: `You removed ${subjectName} from the employee directory.`,
      }
    }
    return {
      title: 'Employee Removed',
      description: `${subjectName} was removed from the employee directory by ${byLabel}.`,
    }
  }

  // Profile updated
  const detailMatch = stored.match(/:\s*(.+)\.?$/)
  const detail = detailMatch ? detailMatch[1].replace(/\.$/, '') : ''
  const detailSuffix = detail ? `: ${detail}.` : '.'

  if (isActor) {
    return {
      title: 'You Updated Employee Profile',
      description: detail
        ? `You updated ${subjectName}'s profile${detailSuffix}`
        : `You updated ${subjectName}'s employee profile.`,
    }
  }
  if (isSubject) {
    return {
      title: 'Your Profile Was Updated',
      description: detail
        ? `Your profile was updated by ${byLabel}${detailSuffix}`
        : `Your employee profile was updated by ${byLabel}.`,
    }
  }
  return {
    title: 'Employee Profile Updated',
    description:
      stored ||
      `${subjectName}'s employee profile was updated by ${byLabel}.`,
  }
}

function escapeRegExp(value) {
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Last-resort rewrite: same-account actor → "You …" / "… by you".
 * Used when category handlers did not rebuild the copy.
 */
function youifyStoredCopy({ title, description, isActor, actorRole, actorName }) {
  if (!isActor) {
    return { title, description }
  }

  const byLabel = formatActorLabel({ role: actorRole, name: actorName })
  let nextTitle = title
  let nextDescription = String(description || '')

  if (byLabel && byLabel !== 'the system') {
    const labelRe = new RegExp(escapeRegExp(byLabel), 'gi')
    nextDescription = nextDescription
      .replace(new RegExp(`^${escapeRegExp(byLabel)}\\s+`, 'i'), 'You ')
      .replace(new RegExp(`\\bby\\s+${escapeRegExp(byLabel)}\\b`, 'gi'), 'by you')
      .replace(labelRe, (match, offset) =>
        offset === 0 ? 'You' : 'you',
      )
    // Collapse accidental "You You"
    nextDescription = nextDescription.replace(/\bYou\s+You\b/g, 'You')
  }

  if (!/^you\b/i.test(String(nextTitle || ''))) {
    // Prefer keeping professional titles; Sent/Received chips carry perspective.
  }

  return { title: nextTitle, description: nextDescription }
}

function adminAddedCopy({ isActor, isSubject, subjectName, actorRole, actorName }) {
  const byLabel = formatActorLabel({ role: actorRole, name: actorName })
  if (isActor) {
    return {
      title: 'You Added Admin',
      description: `You granted admin access to ${subjectName}.`,
    }
  }
  if (isSubject) {
    return {
      title: 'Admin Access Granted',
      description: `You were granted admin access by ${byLabel}.`,
    }
  }
  return {
    title: 'Admin Added',
    description: `${subjectName} was granted admin access by ${byLabel}.`,
  }
}

function adminRemovedCopy({ isActor, subjectName, actorRole, actorName }) {
  const byLabel = formatActorLabel({ role: actorRole, name: actorName })
  if (isActor) {
    return {
      title: 'You Removed Admin',
      description: `You removed admin access for ${subjectName}.`,
    }
  }
  return {
    title: 'Admin Removed',
    description: `${subjectName}'s admin access was removed by ${byLabel}.`,
  }
}

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
    if (status === 'Pending') return 'Leave Request Sent'
  }
  if (
    lower.includes('leave request cancelled') ||
    lower.includes('leave cancelled')
  ) {
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
  if (lower.includes('forwarded')) return 'Leave Request Forwarded'
  if (lower.includes('in progress')) return 'Leave Request In Progress'
  if (lower.includes('awaiting approval') || lower.includes('approval needed')) {
    return title
  }
  return title
}

/**
 * Returns { title, description, direction, directionLabel } for display.
 */
export function personalizeActivityMessage(row, viewer = {}) {
  const eventType = row.eventType || ''
  const meta = parseMeta(row.meta)
  const viewerId = viewer.employeeId || null
  const subjectId = row.subjectEmployeeId || null
  const isSubject =
    sameId(viewerId, subjectId) ||
    (eventType === 'employee.leave_balances' &&
      isLeaveBalanceRecipient(meta, viewerId)) ||
    (row.category === 'Employees' &&
      /leave balance/i.test(String(row.title || '')) &&
      isLeaveBalanceRecipient(meta, viewerId))
  const isActor = isViewerActor(row, viewer)
  const direction = resolveActivityDirection(row, viewer)
  const isCurrentApprover = viewerMatchesApproverStep(
    meta.currentApprover,
    viewer,
  )
  const isNextApprover = viewerMatchesApproverStep(
    meta.nextApprover || (meta.awaitsNext ? meta.currentApprover : null),
    viewer,
  )
  const isFutureApprover =
    !isCurrentApprover &&
    !isNextApprover &&
    viewerMatchesFutureApproverStep(meta, viewer)
  const awaitsNext = Boolean(meta.awaitsNext) || meta.finalStatus === 'Pending'

  const subjectName = meta.subjectName || 'Employee'
  const leaveType = meta.leaveType || 'Leave'
  const range = formatLeaveRangeText(meta.range || '')
  const remarks = meta.remarks || ''
  const actorRole = meta.actorRole || row.actorRole || ''
  const actorName = meta.actorName || ''
  const stepLabel = meta.stepLabel || ''
  const currentStepLabel =
    meta.currentApprover?.stepLabel ||
    meta.currentStepLabel ||
    awaitingLabel(meta.currentApprover, '')
  const nextStepLabel =
    meta.nextApprover?.stepLabel ||
    meta.nextStepLabel ||
    awaitingLabel(meta.nextApprover, '')
  const hierarchyLabels = Array.isArray(meta.hierarchyLabels)
    ? meta.hierarchyLabels
    : []

  let title = row.title || ''
  let description = row.description || ''

  if (eventType === 'leave.submitted' && range) {
    ;({ title, description } = leaveSubmittedCopy({
      isSubject: isSubject || isActor,
      isCurrentApprover,
      isFutureApprover,
      currentStepLabel,
      hierarchyLabels,
      subjectName,
      leaveType,
      range,
      fromCasual: meta.fromCasual || 0,
      fromSick: meta.fromSick || 0,
      fromLop: meta.fromLop || 0,
    }))
  } else if (eventType === 'leave.cancelled' && range) {
    ;({ title, description } = leaveCancelledCopy({
      isSubject,
      isActor,
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
      isNextApprover,
      isFutureApprover,
      nextStepLabel,
      currentStepLabel,
      hierarchyLabels,
      subjectName,
      leaveType,
      range,
      remarks,
      actorRole,
      actorName,
      stepLabel,
      approved: eventType === 'leave.approved',
      awaitsNext: eventType === 'leave.approved' && awaitsNext,
      fromCasual: meta.fromCasual || 0,
      fromSick: meta.fromSick || 0,
      fromLop: meta.fromLop || 0,
    }))
  } else if (eventType === 'attendance.marked') {
    ;({ title, description } = attendanceCopy({
      isActor,
      isSubject,
      subjectName,
      status: meta.attendanceStatus || row.status || 'Present',
      date: meta.attendanceDate || '',
      checkIn: meta.checkIn || '',
      actorRole,
      actorName,
    }))
  } else if (
    eventType === 'attendance.removed' ||
    String(row.title || '').toLowerCase() === 'attendance removed'
  ) {
    ;({ title, description } = attendanceRemovedCopy({
      isActor,
      isSubject,
      subjectName,
      date: meta.attendanceDate || '',
      actorRole,
      actorName,
    }))
  } else if (
    eventType === 'admin.added' ||
    String(row.title || '').toLowerCase() === 'admin added'
  ) {
    ;({ title, description } = adminAddedCopy({
      isActor,
      isSubject,
      subjectName,
      actorRole,
      actorName,
    }))
  } else if (
    eventType === 'admin.removed' ||
    String(row.title || '').toLowerCase() === 'admin removed'
  ) {
    ;({ title, description } = adminRemovedCopy({
      isActor,
      subjectName,
      actorRole,
      actorName,
    }))
  } else if (
    row.category === 'Holidays' ||
    String(eventType || '').startsWith('holiday.')
  ) {
    ;({ title, description } = holidayCopy({
      isActor,
      status: row.status,
      title,
      meta,
      actorRole,
      actorName,
    }))
  } else if (
    row.category === 'Departments' ||
    String(eventType || '').startsWith('department.')
  ) {
    ;({ title, description } = departmentCopy({
      isActor,
      status: row.status,
      title,
      meta,
      actorRole,
      actorName,
      description,
    }))
  } else if (
    row.category === 'Employees' ||
    eventType === 'employee.added' ||
    eventType === 'employee.updated' ||
    eventType === 'employee.removed' ||
    eventType === 'employee.leave_balances' ||
    /leave balances updated/i.test(title)
  ) {
    ;({ title, description } = employeeProfileCopy({
      isActor,
      isSubject,
      subjectName: meta.subjectName || subjectName,
      actorRole,
      actorName,
      description,
      status: row.status,
      title,
      meta,
    }))
  } else if (
    row.audience === 'self' ||
    (String(row.id || '').startsWith('leave-') && isSubject)
  ) {
    title = legacyLeaveTitle(title, row.status)
    ;({ title, description } = youifyStoredCopy({
      title,
      description,
      isActor,
      actorRole,
      actorName,
    }))
  } else if (direction && row.category === 'Leave') {
    title = legacyLeaveTitle(title, row.status)
  } else if (isActor && actorName) {
    ;({ title, description } = youifyStoredCopy({
      title,
      description,
      isActor,
      actorRole,
      actorName,
    }))
  }

  const directionLabel = resolveDirectionLabel({
    direction,
    eventType,
    title,
    awaitsNext:
      (eventType === 'leave.approved' ||
        String(title || '').toLowerCase().includes('forwarded') ||
        String(title || '').toLowerCase().includes('in progress')) &&
      awaitsNext,
    isActor,
    isSubject,
    isCurrentApprover: isCurrentApprover || isNextApprover,
  })

  return { title, description, direction, directionLabel }
}
