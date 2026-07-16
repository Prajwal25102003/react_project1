import {
  cancelLeaveRequest,
  createLeaveRequest,
  findAllLeaveRequests,
  findLeaveRequestById,
  findLeaveRequestsByEmployeeId,
  generateNextLeaveRequestId,
  updateLeaveRequestStatus,
} from '../models/leaveRequestsModel.js'
import { employeeExists } from '../models/employeesModel.js'
import { createRecentActivity } from '../models/recentActivitiesModel.js'
import { formatDbError } from '../utils/formatDbError.js'

const APPROVAL_STATUSES = new Set(['Approved', 'Rejected'])
const LEAVE_TYPES = new Set(['Sick Leave', 'Casual Leave', 'Maternity Leave'])

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

function parseLeavePayload(body) {
  const errors = []
  const employeeId = String(body?.employeeId ?? '').trim()
  const leaveType = String(body?.leaveType ?? '').trim()
  const startDate = String(body?.startDate ?? '').trim()
  const endDate = String(body?.endDate ?? '').trim()
  const reason = String(body?.reason ?? '').trim()

  if (!employeeId) errors.push('Employee is required')
  if (!leaveType) errors.push('Leave type is required')
  else if (!LEAVE_TYPES.has(leaveType)) {
    errors.push('Leave type must be Sick Leave, Casual Leave, or Maternity Leave')
  }
  if (!startDate) errors.push('Start date is required')
  else if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
    errors.push('Start date must be YYYY-MM-DD')
  }
  if (!endDate) errors.push('End date is required')
  else if (!/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
    errors.push('End date must be YYYY-MM-DD')
  }
  if (!reason) errors.push('Leave reason is required')

  let leaveDays = countLeaveDays(startDate, endDate)
  if (leaveDays === null) errors.push('Leave dates are invalid')
  else if (leaveDays < 1) errors.push('End date cannot be before start date')

  return {
    errors,
    leaveRequest: {
      employeeId,
      leaveType,
      startDate,
      endDate,
      leaveDays,
      reason,
      status: 'Pending',
    },
  }
}

export async function getLeaveRequests(req, res) {
  try {
    if (req.user?.role === 'employee') {
      if (!req.user.employeeId) {
        return res.status(403).json({
          message: 'Your account is not linked to an employee record',
        })
      }
      const leaveRequests = await findLeaveRequestsByEmployeeId(
        req.user.employeeId,
      )
      return res.json({ leaveRequests })
    }

    const leaveRequests = await findAllLeaveRequests()
    res.json({ leaveRequests })
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

    if (!(await employeeExists(leaveRequest.employeeId))) {
      return res.status(400).json({ message: 'Employee not found' })
    }

    const id = await generateNextLeaveRequestId()
    const created = await createLeaveRequest({ ...leaveRequest, id })

    await createRecentActivity({
      title: 'Leave request submitted',
      description: `${created.employeeName} requested ${created.leaveType} for ${formatLeaveRange(
        created.startDate,
        created.endDate,
      )}.`,
      category: 'Leave',
      status: 'Pending',
    })

    res.status(201).json({ leaveRequest: created })
  } catch (error) {
    res.status(500).json({ message: formatDbError(error) })
  }
}

export async function updateLeaveRequestStatusHandler(req, res) {
  try {
    const status = String(req.body?.status ?? '').trim()
    if (!APPROVAL_STATUSES.has(status)) {
      return res.status(400).json({
        message: 'Status must be Approved or Rejected',
      })
    }

    const existing = await findLeaveRequestById(req.params.id)
    if (!existing) {
      return res.status(404).json({ message: 'Leave request not found' })
    }

    if (existing.status !== 'Pending') {
      return res.status(400).json({
        message: 'Only pending leave requests can be approved or rejected',
      })
    }

    const leaveRequest = await updateLeaveRequestStatus(req.params.id, status)

    await createRecentActivity({
      title: status === 'Approved' ? 'Leave approved' : 'Leave rejected',
      description: `${leaveRequest.employeeName} — ${leaveRequest.leaveType} (${formatLeaveRange(
        leaveRequest.startDate,
        leaveRequest.endDate,
      )}) ${status.toLowerCase()}.`,
      category: 'Leave',
      status,
    })

    res.json({ leaveRequest })
  } catch (error) {
    res.status(500).json({ message: formatDbError(error) })
  }
}

export async function cancelLeaveRequestHandler(req, res) {
  try {
    if (!req.user?.employeeId) {
      return res.status(403).json({
        message: 'Your account is not linked to an employee record',
      })
    }

    const existing = await findLeaveRequestById(req.params.id)
    if (!existing) {
      return res.status(404).json({ message: 'Leave request not found' })
    }

    if (existing.employeeId !== req.user.employeeId) {
      return res.status(403).json({
        message: 'You can only cancel your own leave requests',
      })
    }

    if (existing.status !== 'Pending') {
      return res.status(400).json({
        message: 'Only pending leave requests can be cancelled',
      })
    }

    const leaveRequest = await cancelLeaveRequest(
      req.params.id,
      req.user.employeeId,
    )
    if (!leaveRequest) {
      return res.status(400).json({
        message: 'Only pending leave requests can be cancelled',
      })
    }

    await createRecentActivity({
      title: 'Leave request cancelled',
      description: `${leaveRequest.employeeName} cancelled ${leaveRequest.leaveType} (${formatLeaveRange(
        leaveRequest.startDate,
        leaveRequest.endDate,
      )}).`,
      category: 'Leave',
      status: 'Cancelled',
    })

    res.json({ leaveRequest })
  } catch (error) {
    res.status(500).json({ message: formatDbError(error) })
  }
}
