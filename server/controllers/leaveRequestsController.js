import {
  cancelLeaveRequest,
  createLeaveApprovalHistoryEntry,
  createLeaveRequest,
  findAllLeaveRequests,
  findLeaveApprovalHistory,
  findLeaveRequestById,
  findLeaveRequestsByEmployeeId,
  findLeaveRequestsForHrApprovals,
  findLeaveRequestsForTeamApprovals,
  findLeaveRequestsVisibleToEmployee,
  generateNextLeaveRequestId,
  updateLeaveRequestStatus,
} from '../models/leaveRequestsModel.js'
import { findEmployeeById } from '../models/employeesModel.js'
import { isEmployeeDepartmentHead } from '../models/departmentsModel.js'
import { deductEmployeeLeaveBalances } from '../models/leaveBalancesModel.js'
import {
  isMaternityLeave,
  validateMaternityLeaveRequest,
} from '../models/maternityLeaveModel.js'
import { createRecentActivity } from '../models/recentActivitiesModel.js'
import {
  canApproveAdminLeave,
  shouldAutoApproveAdminLeave,
} from '../models/leaveApprovalConfigModel.js'
import { formatDbError } from '../utils/formatDbError.js'
import pool from '../config/db.js'

const LEAVE_TYPES = new Set([
  'Sick Leave',
  'Casual Leave',
  'Maternity Leave',
  'Medical Leave',
  'Loss of Pay',
])

function formatLeaveRange(startDate, endDate) {
  if (startDate === endDate) return startDate
  return `${startDate} to ${endDate}`
}

function countLeaveDays(startDate, endDate) {
  const start = new Date(`${startDate}T00:00:00`)
  const end = new Date(`${endDate}T00:00:00`)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null
  const diff = Math.floor((end - start) / 86400000) + 1
  return diff
}

function isHrOrAdmin(role) {
  return role === 'hr' || role === 'admin'
}

function isAdmin(role) {
  return role === 'admin'
}

function isTeamLeadFor(request, employeeId) {
  return Boolean(
    employeeId &&
      request.departmentHeadId &&
      employeeId === request.departmentHeadId &&
      employeeId !== request.employeeId,
  )
}

function requesterIsHrUser(request) {
  return Boolean(request?.requesterIsHr)
}

function requesterIsAdminUser(request) {
  return Boolean(request?.requesterIsAdmin)
}

function actorFromRequest(req) {
  return {
    actorUserId: req.user?.id ?? null,
    actorEmployeeId: req.user?.employeeId || null,
    actorName: req.user?.name || req.user?.email || 'Unknown',
    actorRole: req.user?.role || 'employee',
  }
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
      'Leave type must be Sick Leave, Casual Leave, Maternity Leave, Medical Leave, or Loss of Pay',
    )
  }
  if (!reason) errors.push('Leave reason is required')

  let leaveDays = null

  if (isMaternityLeave(leaveType)) {
    // Gender + delivery window are validated in the handler after loading the employee.
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
      status: 'Pending',
    },
  }
}

async function withHistory(leaveRequest) {
  if (!leaveRequest) return null
  const approvalHistory = await findLeaveApprovalHistory(leaveRequest.id)
  return { ...leaveRequest, approvalHistory }
}

export async function getLeaveRequests(req, res) {
  try {
    const scope = String(req.query.scope || '').trim().toLowerCase()
    const role = req.user?.role
    const employeeId = req.user?.employeeId || null
    const asHr = isHrOrAdmin(role)

    // Personal leave list
    if (scope === 'mine' || (!scope && !asHr)) {
      if (!employeeId) {
        return res.status(403).json({
          message: 'Your account is not linked to an employee record',
        })
      }
      const leaveRequests = await findLeaveRequestsByEmployeeId(employeeId)
      return res.json({ leaveRequests, scope: 'mine' })
    }

    // Approvals queue (team / all employees)
    if (scope === 'approvals' || (!scope && asHr)) {
      if (asHr) {
        const leaveRequests = await findLeaveRequestsForHrApprovals(employeeId)
        return res.json({ leaveRequests, scope: 'approvals' })
      }

      if (!employeeId) {
        return res.status(403).json({
          message: 'Your account is not linked to an employee record',
        })
      }

      const isHead = await isEmployeeDepartmentHead(employeeId)
      if (!isHead) {
        return res.status(403).json({
          message: 'Only department heads or HR can view leave approvals',
        })
      }

      const leaveRequests = await findLeaveRequestsForTeamApprovals(employeeId)
      return res.json({ leaveRequests, scope: 'approvals' })
    }

    // Legacy fallback
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

    const role = req.user?.role
    const employeeId = req.user?.employeeId
    const allowed =
      isHrOrAdmin(role) ||
      existing.employeeId === employeeId ||
      isTeamLeadFor(existing, employeeId)

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

    const id = await generateNextLeaveRequestId()
    const actor = actorFromRequest(req)
    const autoApproveAdmin =
      isAdmin(req.user.role) && shouldAutoApproveAdminLeave()

    let created

    if (autoApproveAdmin) {
      const client = await pool.connect()
      try {
        await client.query('BEGIN')
        created = await createLeaveRequest(
          { ...leaveRequest, id, status: 'Approved' },
          client,
        )
        await deductEmployeeLeaveBalances(
          created.employeeId,
          created.leaveType,
          created.leaveDays,
          client,
        )
        await createLeaveApprovalHistoryEntry(
          {
            leaveRequestId: created.id,
            step: 'Submit',
            action: 'Submitted',
            ...actor,
            actorRole: 'admin',
            remarks: created.reason || '',
          },
          client,
        )
        await createLeaveApprovalHistoryEntry(
          {
            leaveRequestId: created.id,
            step: 'Admin',
            action: 'Approved',
            ...actor,
            actorRole: 'admin',
            remarks:
              'Auto-approved: Admin is the highest authority. Configure a higher approver role later if needed.',
          },
          client,
        )
        await client.query('COMMIT')
      } catch (balanceError) {
        await client.query('ROLLBACK')
        throw balanceError
      } finally {
        client.release()
      }

      await createRecentActivity({
        title: 'Leave auto-approved for Admin',
        description: `${created.employeeName} requested ${created.leaveType} for ${formatLeaveRange(
          created.startDate,
          created.endDate,
        )} — auto-approved.`,
        category: 'Leave',
        status: 'Approved',
      })
    } else {
      created = await createLeaveRequest({ ...leaveRequest, id })

      await createLeaveApprovalHistoryEntry({
        leaveRequestId: created.id,
        step: 'Submit',
        action: 'Submitted',
        ...actor,
        actorRole: isAdmin(req.user.role) ? 'admin' : 'employee',
        remarks: created.reason || '',
      })

      await createRecentActivity({
        title: 'Leave request submitted',
        description: `${created.employeeName} requested ${created.leaveType} for ${formatLeaveRange(
          created.startDate,
          created.endDate,
        )}.`,
        category: 'Leave',
        status: 'Pending',
      })
    }

    res.status(201).json({ leaveRequest: await withHistory(created) })
  } catch (error) {
    res.status(500).json({ message: formatDbError(error) })
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

    if (existing.status === 'Rejected' || existing.status === 'Cancelled' || existing.status === 'Approved') {
      return res.status(400).json({
        message: 'This leave request is already closed and cannot be updated',
      })
    }

    const isReject = status === 'Rejected'
    if (isReject && !remarks) {
      return res.status(400).json({
        message: 'Remarks are required when rejecting a leave request',
      })
    }

    const asHr = isHrOrAdmin(role)
    const asAdmin = isAdmin(role)
    const asTeamLead = isTeamLeadFor(existing, actorEmployeeId)
    const requesterIsDeptHead =
      existing.departmentHeadId &&
      existing.departmentHeadId === existing.employeeId
    const requesterIsHr = requesterIsHrUser(existing)
    const requesterIsAdmin = requesterIsAdminUser(existing)

    let allowedFrom = []
    let activityTitle = ''
    let historyStep = ''
    let historyAction = ''
    let historyActorRole = role

    if (requesterIsAdmin) {
      if (!canApproveAdminLeave(role)) {
        return res.status(403).json({
          message:
            'Admin leave is auto-approved. Configure a higher approver role to review these requests.',
        })
      }
      if (status !== 'Approved' && status !== 'Rejected') {
        return res.status(400).json({
          message: 'Admin leave can only be approved or rejected by a higher role',
        })
      }
      if (existing.status !== 'Pending') {
        return res.status(400).json({
          message: 'Only pending Admin leave requests can be reviewed',
        })
      }
      allowedFrom = ['Pending']
      activityTitle =
        status === 'Approved'
          ? 'Leave approved for Admin'
          : 'Leave rejected for Admin'
      historyStep = 'HigherAuthority'
      historyAction = status === 'Approved' ? 'Approved' : 'Rejected'
      historyActorRole = role
    } else if (status === 'TeamLeadApproved') {
      if (requesterIsHr) {
        return res.status(400).json({
          message: 'HR leave requests must be approved by Admin only',
        })
      }
      if (!asTeamLead) {
        return res.status(403).json({
          message: 'Only the department team lead can approve at this stage',
        })
      }
      if (existing.status !== 'Pending') {
        return res.status(400).json({
          message: 'Only pending leave requests can be approved by the team lead',
        })
      }
      allowedFrom = ['Pending']
      activityTitle = 'Leave approved by team lead'
      historyStep = 'TeamLead'
      historyAction = 'Approved'
      historyActorRole = 'team_lead'
    } else if (status === 'Approved') {
      if (requesterIsHr) {
        if (!asAdmin) {
          return res.status(403).json({
            message: 'Only Admin can approve HR leave requests',
          })
        }
        if (existing.status !== 'Pending') {
          return res.status(400).json({
            message: 'Only pending HR leave requests can be approved by Admin',
          })
        }
        allowedFrom = ['Pending']
        activityTitle = 'Leave approved by Admin'
        historyStep = 'Admin'
        historyAction = 'Approved'
        historyActorRole = 'admin'
      } else if (!asHr) {
        return res.status(403).json({
          message: 'Only HR or Admin can give final leave approval',
        })
      } else if (existing.status === 'TeamLeadApproved') {
        allowedFrom = ['TeamLeadApproved']
        activityTitle = 'Leave approved by HR'
        historyStep = 'HR'
        historyAction = 'Approved'
        historyActorRole = role === 'admin' ? 'admin' : 'hr'
      } else if (existing.status === 'Pending' && requesterIsDeptHead) {
        allowedFrom = ['Pending']
        activityTitle = role === 'admin' ? 'Leave approved by Admin' : 'Leave approved by HR'
        historyStep = role === 'admin' ? 'Admin' : 'HR'
        historyAction = 'Approved'
        historyActorRole = role === 'admin' ? 'admin' : 'hr'
      } else if (existing.status === 'Pending') {
        return res.status(400).json({
          message:
            'This leave must be approved by the team lead before HR approval',
        })
      } else {
        return res.status(400).json({
          message: 'This leave request cannot be approved in its current status',
        })
      }
    } else if (status === 'Rejected') {
      if (requesterIsHr) {
        if (!asAdmin) {
          return res.status(403).json({
            message: 'Only Admin can reject HR leave requests',
          })
        }
        if (existing.status !== 'Pending') {
          return res.status(400).json({
            message: 'Only pending HR leave requests can be rejected by Admin',
          })
        }
        allowedFrom = ['Pending']
        activityTitle = 'Leave rejected by Admin'
        historyStep = 'Admin'
        historyAction = 'Rejected'
        historyActorRole = 'admin'
      } else if (existing.status === 'Pending' && asTeamLead) {
        allowedFrom = ['Pending']
        activityTitle = 'Leave rejected by team lead'
        historyStep = 'TeamLead'
        historyAction = 'Rejected'
        historyActorRole = 'team_lead'
      } else if (asHr && existing.status === 'TeamLeadApproved') {
        allowedFrom = ['TeamLeadApproved']
        activityTitle = 'Leave rejected by HR'
        historyStep = 'HR'
        historyAction = 'Rejected'
        historyActorRole = role === 'admin' ? 'admin' : 'hr'
      } else if (asHr && existing.status === 'Pending' && requesterIsDeptHead) {
        allowedFrom = ['Pending']
        activityTitle = role === 'admin' ? 'Leave rejected by Admin' : 'Leave rejected by HR'
        historyStep = role === 'admin' ? 'Admin' : 'HR'
        historyAction = 'Rejected'
        historyActorRole = role === 'admin' ? 'admin' : 'hr'
      } else if (asHr && existing.status === 'Pending') {
        return res.status(400).json({
          message:
            'Team lead must act first. HR can reject only after team lead approval, or when the requester is a department head.',
        })
      } else {
        return res.status(403).json({
          message: 'You cannot reject this leave request',
        })
      }
    } else {
      return res.status(400).json({
        message: 'Status must be TeamLeadApproved, Approved, or Rejected',
      })
    }

    let leaveRequest

    if (status === 'Approved') {
      const client = await pool.connect()
      try {
        await client.query('BEGIN')
        leaveRequest = await updateLeaveRequestStatus(
          req.params.id,
          status,
          allowedFrom,
          { rejectionReason: '', client },
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
      leaveRequest = await updateLeaveRequestStatus(
        req.params.id,
        status,
        allowedFrom,
        { rejectionReason: status === 'Rejected' ? remarks : '' },
      )
      if (!leaveRequest) {
        return res.status(400).json({
          message: 'Leave request status could not be updated',
        })
      }
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

    await createRecentActivity({
      title: activityTitle,
      description: `${leaveRequest.employeeName} — ${leaveRequest.leaveType} (${formatLeaveRange(
        leaveRequest.startDate,
        leaveRequest.endDate,
      )}) ${historyAction.toLowerCase()}: ${remarks}`,
      category: 'Leave',
      status: status === 'TeamLeadApproved' ? 'Pending' : status,
    })

    res.json({ leaveRequest: await withHistory(leaveRequest) })
  } catch (error) {
    res.status(500).json({ message: formatDbError(error) })
  }
}

export async function cancelLeaveRequestHandler(req, res) {
  try {
    const role = req.user?.role
    const isManager = isHrOrAdmin(role)
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

    const canCancelAsOwner =
      !isManager && existing.employeeId === req.user.employeeId

    if (!isManager && !canCancelAsOwner) {
      return res.status(403).json({
        message: 'You can only cancel your own leave requests',
      })
    }

    if (
      existing.status !== 'Pending' &&
      existing.status !== 'TeamLeadApproved'
    ) {
      return res.status(400).json({
        message:
          'Only pending or team-lead-approved leave requests can be cancelled',
      })
    }

    const leaveRequest = await cancelLeaveRequest(req.params.id, {
      employeeId: isManager ? null : req.user.employeeId,
      cancellationReason,
    })
    if (!leaveRequest) {
      return res.status(400).json({
        message:
          'Only pending or team-lead-approved leave requests can be cancelled',
      })
    }

    const actor = actorFromRequest(req)
    await createLeaveApprovalHistoryEntry({
      leaveRequestId: leaveRequest.id,
      step: 'Cancel',
      action: 'Cancelled',
      ...actor,
      actorRole: isManager ? (role === 'admin' ? 'admin' : 'hr') : 'employee',
      remarks: cancellationReason,
    })

    await createRecentActivity({
      title: 'Leave request cancelled',
      description: `${leaveRequest.employeeName} cancelled ${leaveRequest.leaveType} (${formatLeaveRange(
        leaveRequest.startDate,
        leaveRequest.endDate,
      )}).`,
      category: 'Leave',
      status: 'Cancelled',
    })

    res.json({ leaveRequest: await withHistory(leaveRequest) })
  } catch (error) {
    res.status(500).json({ message: formatDbError(error) })
  }
}
