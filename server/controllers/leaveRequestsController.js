import {
  cancelLeaveRequest,
  createLeaveApprovalHistoryEntry,
  createLeaveRequest,
  findAllLeaveRequests,
  findLeaveApprovalHistory,
  findLeaveRequestById,
  findLeaveRequestsAwaitingActor,
  findLeaveRequestsByEmployeeId,
  findLeaveRequestsForTeamApprovals,
  findLeaveRequestsVisibleToEmployee,
  findLeaveRequestsWithApproverRole,
  generateNextLeaveRequestId,
  updateLeaveRequestStatus,
} from '../models/leaveRequestsModel.js'
import { findEmployeeById } from '../models/employeesModel.js'
import { isEmployeeDepartmentHead } from '../models/departmentsModel.js'
import { deductEmployeeLeaveBalances } from '../models/leaveBalancesModel.js'
import {
  actorMatchesStep,
  findActiveHierarchyByCategory,
  findStepByOrder,
  firstActionableStepOrder,
  historyActorRoleForApprover,
  historyStepForApprover,
  isNamedLeaveApprover,
  nextStepOrder,
  resolveRequesterCategory,
  stepDisplayLabel,
} from '../models/leaveApprovalHierarchyModel.js'
import {
  isMaternityLeave,
  validateMaternityLeaveRequest,
} from '../models/maternityLeaveModel.js'
import { createRecentActivity } from '../models/recentActivitiesModel.js'
import {
  formatApproverLabel,
  formatDisplayRange,
} from '../utils/activityCopy.js'
import { formatDbError } from '../utils/formatDbError.js'
import {
  serializeMedicalAttachments,
  validateMedicalAttachmentsInput,
} from '../utils/medicalAttachments.js'
import pool, { query } from '../config/db.js'

const LEAVE_TYPES = new Set([
  'Sick Leave',
  'Casual Leave',
  'Maternity Leave',
  'Medical Leave',
  'Work from Home',
  'Loss of Pay',
])

function formatLeaveRange(startDate, endDate) {
  return formatDisplayRange(startDate, endDate)
}

function countLeaveDays(startDate, endDate) {
  const start = new Date(`${startDate}T00:00:00`)
  const end = new Date(`${endDate}T00:00:00`)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null
  const diff = Math.floor((end - start) / 86400000) + 1
  return diff
}

function isHr(role) {
  return role === 'hr'
}

function isAdmin(role) {
  return role === 'admin'
}

function actorFromRequest(req) {
  return {
    actorUserId: req.user?.id ?? null,
    actorEmployeeId: req.user?.employeeId || null,
    actorName: req.user?.name || req.user?.email || 'Unknown',
    actorRole: req.user?.role || 'employee',
  }
}

function actorCanActOnRequest(request, { role, employeeId, departmentHeadId }) {
  if (!request || request.status !== 'Pending') return false
  const step = findStepByOrder(request.hierarchySteps, request.currentStep)
  return actorMatchesStep(step, {
    role,
    employeeId,
    departmentHeadId:
      departmentHeadId !== undefined
        ? departmentHeadId
        : request.departmentHeadId,
    requesterEmployeeId: request.employeeId,
  })
}

const HALF_DAY_SESSIONS = new Set(['first_half', 'second_half'])

function parseLeavePayload(body) {
  const errors = []
  const employeeId = String(body?.employeeId ?? '').trim()
  const leaveType = String(body?.leaveType ?? '').trim()
  let startDate = String(body?.startDate ?? '').trim()
  let endDate = String(body?.endDate ?? '').trim()
  const reason = String(body?.reason ?? '').trim()
  const expectedDeliveryDate = String(body?.expectedDeliveryDate ?? '').trim()
  const duration = String(body?.duration ?? 'full').trim().toLowerCase()
  let halfDaySession = String(body?.halfDaySession ?? '').trim().toLowerCase()

  if (!employeeId) errors.push('Employee is required')
  if (!leaveType) errors.push('Leave type is required')
  else if (!LEAVE_TYPES.has(leaveType)) {
    errors.push(
      'Leave type must be Sick Leave, Casual Leave, Maternity Leave, Medical Leave, Work from Home, or Loss of Pay',
    )
  }
  if (!reason) errors.push('Leave reason is required')

  let attachmentUrl = null
  if (leaveType === 'Medical Leave') {
    const fromArray =
      body?.attachments ??
      (body?.attachmentUrl ? body.attachmentUrl : null)
    const validated = validateMedicalAttachmentsInput(fromArray)
    if (!validated.ok) {
      errors.push(validated.message)
    } else {
      attachmentUrl = serializeMedicalAttachments(validated.attachments)
    }
  }

  let leaveDays = null

  if (isMaternityLeave(leaveType)) {
    leaveDays = countLeaveDays(startDate, endDate)
    return {
      errors,
      leaveRequest: {
        employeeId,
        leaveType,
        startDate,
        endDate,
        leaveDays,
        halfDaySession: null,
        reason,
        attachmentUrl: null,
        expectedDeliveryDate,
        status: 'Pending',
      },
    }
  }

  if (!startDate) errors.push('Start date is required')
  else if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
    errors.push('Start date must be YYYY-MM-DD')
  }

  if (duration === 'half') {
    endDate = startDate
    leaveDays = 0.5
    if (!HALF_DAY_SESSIONS.has(halfDaySession)) {
      errors.push('Select first half or second half for half-day leave')
      halfDaySession = ''
    }
  } else {
    halfDaySession = ''
    if (!endDate) errors.push('End date is required')
    else if (!/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
      errors.push('End date must be YYYY-MM-DD')
    }

    leaveDays = countLeaveDays(startDate, endDate)
    if (leaveDays === null) errors.push('Leave dates are invalid')
    else if (leaveDays < 1) errors.push('End date cannot be before start date')
  }

  return {
    errors,
    leaveRequest: {
      employeeId,
      leaveType,
      startDate,
      endDate,
      leaveDays,
      halfDaySession: halfDaySession || null,
      reason,
      attachmentUrl,
      status: 'Pending',
    },
  }
}

async function withHistory(leaveRequest) {
  if (!leaveRequest) return null
  const approvalHistory = await findLeaveApprovalHistory(leaveRequest.id)
  return { ...leaveRequest, approvalHistory }
}

async function canViewLeaveRequest(req, existing) {
  const role = req.user?.role
  const employeeId = req.user?.employeeId || null

  if (existing.employeeId === employeeId) return true
  if (isHr(role)) return true
  if (actorCanActOnRequest(existing, { role, employeeId })) return true

  if (isAdmin(role)) {
    return (existing.hierarchySteps || []).some(
      (step) =>
        step.approverKind === 'role' && step.approverRole === 'admin',
    )
  }

  if (employeeId && existing.departmentHeadId === employeeId) return true

  if (employeeId) {
    return (existing.hierarchySteps || []).some(
      (step) =>
        step.approverKind === 'employee' &&
        step.approverEmployeeId === employeeId,
    )
  }

  return false
}

export async function getLeaveRequests(req, res) {
  try {
    const scope = String(req.query.scope || '').trim().toLowerCase()
    const role = req.user?.role
    const employeeId = req.user?.employeeId || null
    const asHr = isHr(role)
    const asAdmin = isAdmin(role)
    const isHead = employeeId
      ? await isEmployeeDepartmentHead(employeeId)
      : false
    const namedApprover = employeeId
      ? await isNamedLeaveApprover(employeeId)
      : false
    const canApprove = asHr || asAdmin || isHead || namedApprover

    if (asAdmin) {
      if (scope && scope !== 'admin-hr' && scope !== 'approvals') {
        return res.status(403).json({
          message: 'Admin can only view leave requests in the Admin approval queue',
        })
      }
      const byId = new Map()
      for (const row of await findLeaveRequestsAwaitingActor({
        role: 'admin',
        employeeId,
      })) {
        byId.set(row.id, row)
      }
      // Also show chains that include an Admin step (historical HR leave, etc.).
      for (const row of await findLeaveRequestsWithApproverRole('admin')) {
        byId.set(row.id, row)
      }
      const leaveRequests = [...byId.values()].sort((a, b) =>
        String(b.id).localeCompare(String(a.id), undefined, { numeric: true }),
      )
      return res.json({ leaveRequests, scope: 'admin-hr' })
    }

    if (scope === 'mine' || (!scope && !canApprove)) {
      if (!employeeId) {
        return res.status(403).json({
          message: 'Your account is not linked to an employee record',
        })
      }
      const leaveRequests = await findLeaveRequestsByEmployeeId(employeeId)
      return res.json({ leaveRequests, scope: 'mine' })
    }

    if (scope === 'approvals' || (!scope && canApprove && asHr)) {
      if (!canApprove) {
        return res.status(403).json({
          message: 'You are not allowed to view leave approvals',
        })
      }
      const leaveRequests = await findLeaveRequestsAwaitingActor({
        role: asHr ? 'hr' : role,
        employeeId,
      })
      return res.json({ leaveRequests, scope: 'approvals' })
    }

    if (scope === 'unified') {
      if (!canApprove) {
        return res.status(403).json({
          message: 'You are not allowed to view leave requests',
        })
      }

      const byId = new Map()

      if (employeeId) {
        for (const row of await findLeaveRequestsByEmployeeId(employeeId)) {
          byId.set(row.id, row)
        }
      }

      if (asHr) {
        // HR keeps org-wide visibility; action buttons still gate on current step.
        for (const row of await findAllLeaveRequests()) {
          byId.set(row.id, row)
        }
      } else if (isHead) {
        // Dept heads keep full team history after they approve (request moves to next step).
        for (const row of await findLeaveRequestsForTeamApprovals(employeeId)) {
          byId.set(row.id, row)
        }
        // Named-approver rows outside their team still appear when awaiting them.
        for (const row of await findLeaveRequestsAwaitingActor({
          employeeId,
        })) {
          byId.set(row.id, row)
        }
      } else {
        for (const row of await findLeaveRequestsAwaitingActor({
          role: role === 'employee' ? null : role,
          employeeId,
        })) {
          byId.set(row.id, row)
        }
      }

      const leaveRequests = [...byId.values()].sort((a, b) =>
        String(b.id).localeCompare(String(a.id), undefined, { numeric: true }),
      )
      return res.json({ leaveRequests, scope: 'unified' })
    }

    if (asHr) {
      return res.json({
        leaveRequests: await findAllLeaveRequests(),
        scope: 'all',
      })
    }

    const leaveRequests = await findLeaveRequestsVisibleToEmployee(employeeId)
    return res.json({ leaveRequests, scope: 'visible' })
  } catch (error) {
    res.status(500).json({ message: formatDbError(error) })
  }
}

export async function getLeaveRequestByIdHandler(req, res) {
  try {
    const existing = await findLeaveRequestById(req.params.id)
    if (!existing) {
      return res.status(404).json({ message: 'Leave request not found' })
    }

    const allowed = await canViewLeaveRequest(req, existing)
    if (!allowed) {
      return res.status(403).json({ message: 'Access denied' })
    }

    const leaveRequest = await withHistory(existing)
    res.json({ leaveRequest })
  } catch (error) {
    res.status(500).json({ message: formatDbError(error) })
  }
}

export async function createLeaveRequestHandler(req, res) {
  try {
    if (isAdmin(req.user?.role)) {
      return res.status(403).json({
        message: 'Admin accounts cannot submit leave requests',
      })
    }

    if (!req.user?.employeeId) {
      return res.status(403).json({
        message: 'Your account is not linked to an employee record',
      })
    }

    const body = { ...req.body, employeeId: req.user.employeeId }
    const { errors, leaveRequest } = parseLeavePayload(body)
    if (errors.length > 0) {
      return res.status(400).json({ message: errors.join('; ') })
    }

    const employee = await findEmployeeById(leaveRequest.employeeId)
    if (!employee) {
      return res.status(400).json({ message: 'Employee not found' })
    }

    if (isMaternityLeave(leaveRequest.leaveType)) {
      const { errors: maternityErrors, maternity } = validateMaternityLeaveRequest({
        gender: employee.gender,
        expectedDeliveryDate: leaveRequest.expectedDeliveryDate,
      })
      if (maternityErrors.length > 0 || !maternity) {
        return res.status(400).json({
          message: (maternityErrors.length > 0
            ? maternityErrors
            : ['Invalid maternity leave dates']
          ).join('; '),
        })
      }
      leaveRequest.startDate = maternity.startDate
      leaveRequest.endDate = maternity.endDate
      leaveRequest.leaveDays = maternity.leaveDays
    }

    delete leaveRequest.expectedDeliveryDate

    const deptContext = await findEmployeeDepartmentContext(
      leaveRequest.employeeId,
    )
    const departmentHeadId = deptContext.departmentHeadId
    const category = resolveRequesterCategory({
      role: req.user.role,
      employeeId: leaveRequest.employeeId,
      departmentHeadId,
      departmentName: deptContext.departmentName,
      requesterIsHr: isHr(req.user.role),
    })

    const hierarchy = await findActiveHierarchyByCategory(category)
    if (!hierarchy || !hierarchy.steps?.length) {
      return res.status(500).json({
        message: 'Leave approval hierarchy is not configured',
      })
    }

    leaveRequest.hierarchyId = hierarchy.id
    leaveRequest.hierarchySteps = hierarchy.steps
    leaveRequest.currentStep = firstActionableStepOrder(hierarchy.steps, {
      employeeId: leaveRequest.employeeId,
      departmentHeadId,
    })

    const id = await generateNextLeaveRequestId()
    const actor = actorFromRequest(req)
    const created = await createLeaveRequest({ ...leaveRequest, id })

    await createLeaveApprovalHistoryEntry({
      leaveRequestId: created.id,
      step: 'Submit',
      action: 'Submitted',
      ...actor,
      actorRole: 'employee',
      remarks: created.reason || '',
    })

    const submitRange = formatLeaveRange(created.startDate, created.endDate)
    await createRecentActivity({
      title: 'Leave Request Submitted',
      description: `${created.employeeName} submitted a ${created.leaveType} request (${submitRange}).`,
      category: 'Leave',
      status: 'Pending',
      eventType: 'leave.submitted',
      subjectEmployeeId: created.employeeId,
      actorEmployeeId: actor.actorEmployeeId || created.employeeId,
      meta: {
        leaveRequestId: created.id,
        subjectName: created.employeeName,
        leaveType: created.leaveType,
        range: submitRange,
        actorName: actor.actorName,
        actorRole: actor.actorRole,
      },
    })

    res.status(201).json({ leaveRequest: await withHistory(created) })
  } catch (error) {
    res.status(500).json({ message: formatDbError(error) })
  }
}

async function findEmployeeDepartmentContext(employeeId) {
  const result = await query(
    `SELECT
       d.head_employee_id AS "departmentHeadId",
       d.name AS "departmentName"
     FROM employees e
     LEFT JOIN departments d ON d.id = e.department_id
     WHERE e.id = $1`,
    [employeeId],
  )
  return {
    departmentHeadId: result.rows[0]?.departmentHeadId || null,
    departmentName: result.rows[0]?.departmentName || null,
  }
}

export async function updateLeaveRequestStatusHandler(req, res) {
  try {
    const status = String(req.body?.status ?? '').trim()
    const remarks = String(req.body?.remarks ?? req.body?.rejectionReason ?? '').trim()
    const role = req.user?.role
    const actorEmployeeId = req.user?.employeeId || ''
    const existing = await findLeaveRequestById(req.params.id)

    if (!existing) {
      return res.status(404).json({ message: 'Leave request not found' })
    }

    if (
      existing.status === 'Rejected' ||
      existing.status === 'Cancelled' ||
      existing.status === 'Approved'
    ) {
      return res.status(400).json({
        message: 'This leave request is already closed and cannot be updated',
      })
    }

    if (existing.requesterIsAdmin) {
      return res.status(403).json({
        message:
          'Admin accounts do not participate in leave. Legacy admin leave cannot be reviewed here.',
      })
    }

    const isReject = status === 'Rejected'
    const isApprove = status === 'Approved' || status === 'TeamLeadApproved'

    if (!isReject && !isApprove) {
      return res.status(400).json({
        message: 'Status must be Approved or Rejected',
      })
    }

    if (isReject && !remarks) {
      return res.status(400).json({
        message: 'Remarks are required when rejecting a leave request',
      })
    }

    if (existing.status !== 'Pending') {
      return res.status(400).json({
        message: 'Only pending leave requests can be updated',
      })
    }

    const currentStep = findStepByOrder(
      existing.hierarchySteps,
      existing.currentStep,
    )
    if (!currentStep) {
      return res.status(400).json({
        message: 'Leave approval step is not configured for this request',
      })
    }

    // Always use the requester's current department head so a reassigned head
    // can approve pending department_head steps (not the previous head).
    const deptContext = await findEmployeeDepartmentContext(existing.employeeId)
    const canAct = actorMatchesStep(currentStep, {
      role,
      employeeId: actorEmployeeId,
      departmentHeadId: deptContext.departmentHeadId,
      requesterEmployeeId: existing.employeeId,
    })

    if (!canAct) {
      return res.status(403).json({
        message: 'You cannot act on this leave request at the current step',
      })
    }

    const historyStep = historyStepForApprover(currentStep)
    const historyActorRole = historyActorRoleForApprover(currentStep, role)
    const stepLabel = stepDisplayLabel(currentStep)

    let leaveRequest
    let activityTitle = ''
    let historyAction = ''
    let activityStatus = status
    let finalStatus = status

    if (isReject) {
      finalStatus = 'Rejected'
      historyAction = 'Rejected'
      activityTitle = 'Leave Request Rejected'
      activityStatus = 'Rejected'

      leaveRequest = await updateLeaveRequestStatus(
        req.params.id,
        'Rejected',
        ['Pending'],
        { rejectionReason: remarks, currentStep: null },
      )
    } else {
      const upcoming = nextStepOrder(
        existing.hierarchySteps,
        existing.currentStep,
      )
      historyAction = 'Approved'

      if (upcoming == null) {
        finalStatus = 'Approved'
        activityTitle = 'Leave Request Approved'
        activityStatus = 'Approved'

        const client = await pool.connect()
        try {
          await client.query('BEGIN')
          leaveRequest = await updateLeaveRequestStatus(
            req.params.id,
            'Approved',
            ['Pending'],
            { rejectionReason: '', currentStep: null, client },
          )
          if (!leaveRequest) {
            await client.query('ROLLBACK')
            return res.status(400).json({
              message: 'Leave request status could not be updated',
            })
          }
          await deductEmployeeLeaveBalances(
            leaveRequest.employeeId,
            leaveRequest.leaveType,
            leaveRequest.leaveDays,
            client,
          )
          await client.query('COMMIT')
        } catch (balanceError) {
          await client.query('ROLLBACK')
          throw balanceError
        } finally {
          client.release()
        }
      } else {
        finalStatus = 'Pending'
        activityTitle = 'Leave Request Approved'
        activityStatus = 'Pending'

        leaveRequest = await updateLeaveRequestStatus(
          req.params.id,
          'Pending',
          ['Pending'],
          { rejectionReason: '', currentStep: upcoming },
        )
      }
    }

    if (!leaveRequest) {
      return res.status(400).json({
        message: 'Leave request status could not be updated',
      })
    }

    const actor = actorFromRequest(req)
    await createLeaveApprovalHistoryEntry({
      leaveRequestId: leaveRequest.id,
      step: historyStep,
      action: historyAction,
      ...actor,
      actorRole: historyActorRole,
      remarks,
    })

    const decisionRange = formatLeaveRange(
      leaveRequest.startDate,
      leaveRequest.endDate,
    )
    const approverLabel = formatApproverLabel({
      role: historyActorRole,
      name: actor.actorName,
      stepLabel,
    })
    const decisionVerb = historyAction === 'Approved' ? 'approved' : 'rejected'
    const decisionDescription = remarks
      ? `${leaveRequest.employeeName}'s ${leaveRequest.leaveType} request (${decisionRange}) was ${decisionVerb} by ${approverLabel}. Remarks: ${remarks}`
      : `${leaveRequest.employeeName}'s ${leaveRequest.leaveType} request (${decisionRange}) was ${decisionVerb} by ${approverLabel}.`

    await createRecentActivity({
      title: activityTitle,
      description: decisionDescription,
      category: 'Leave',
      status: activityStatus,
      eventType: historyAction === 'Approved' ? 'leave.approved' : 'leave.rejected',
      subjectEmployeeId: leaveRequest.employeeId,
      actorEmployeeId: actor.actorEmployeeId,
      meta: {
        leaveRequestId: leaveRequest.id,
        subjectName: leaveRequest.employeeName,
        leaveType: leaveRequest.leaveType,
        range: decisionRange,
        remarks,
        actorRole: historyActorRole,
        actorName: actor.actorName,
        stepLabel,
        finalStatus,
      },
    })

    res.json({ leaveRequest: await withHistory(leaveRequest) })
  } catch (error) {
    res.status(500).json({ message: formatDbError(error) })
  }
}

export async function cancelLeaveRequestHandler(req, res) {
  try {
    const role = req.user?.role
    const isManager = isHr(role)
    const cancellationReason = String(req.body?.cancellationReason ?? '').trim()

    if (!cancellationReason) {
      return res.status(400).json({
        message: 'Cancellation reason is required',
      })
    }

    if (!isManager && !req.user?.employeeId) {
      return res.status(403).json({
        message: 'Your account is not linked to an employee record',
      })
    }

    const existing = await findLeaveRequestById(req.params.id)
    if (!existing) {
      return res.status(404).json({ message: 'Leave request not found' })
    }

    if (
      existing.status === 'Rejected' ||
      existing.status === 'Cancelled' ||
      existing.status === 'Approved'
    ) {
      return res.status(400).json({
        message: 'This leave request is already closed and cannot be cancelled',
      })
    }

    const isOwner = existing.employeeId === req.user?.employeeId

    if (!isOwner) {
      return res.status(403).json({
        message: isManager
          ? 'Use approve or reject for employee leave requests'
          : 'You can only cancel your own leave requests',
      })
    }

    if (existing.status !== 'Pending') {
      return res.status(400).json({
        message: 'Only pending leave requests can be cancelled',
      })
    }

    const leaveRequest = await cancelLeaveRequest(req.params.id, {
      employeeId: req.user.employeeId,
      cancellationReason,
    })
    if (!leaveRequest) {
      return res.status(400).json({
        message: 'Only pending leave requests can be cancelled',
      })
    }

    const actor = actorFromRequest(req)
    await createLeaveApprovalHistoryEntry({
      leaveRequestId: leaveRequest.id,
      step: 'Cancel',
      action: 'Cancelled',
      ...actor,
      actorRole: isManager ? 'hr' : 'employee',
      remarks: cancellationReason,
    })

    const cancelRange = formatLeaveRange(
      leaveRequest.startDate,
      leaveRequest.endDate,
    )
    await createRecentActivity({
      title: 'Leave Request Cancelled',
      description: `${leaveRequest.employeeName} cancelled a ${leaveRequest.leaveType} request (${cancelRange}).`,
      category: 'Leave',
      status: 'Cancelled',
      eventType: 'leave.cancelled',
      subjectEmployeeId: leaveRequest.employeeId,
      actorEmployeeId: actor.actorEmployeeId || leaveRequest.employeeId,
      meta: {
        leaveRequestId: leaveRequest.id,
        subjectName: leaveRequest.employeeName,
        leaveType: leaveRequest.leaveType,
        range: cancelRange,
        actorName: actor.actorName,
        actorRole: isManager ? 'hr' : 'employee',
      },
    })

    res.json({ leaveRequest: await withHistory(leaveRequest) })
  } catch (error) {
    res.status(500).json({ message: formatDbError(error) })
  }
}
