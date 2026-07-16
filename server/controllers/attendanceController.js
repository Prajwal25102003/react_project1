import {
  createAttendance,
  deleteAttendanceById,
  findAllAttendance,
  findAttendanceByEmployeeId,
  findAttendanceById,
  generateNextAttendanceId,
  updateAttendance,
} from '../models/attendanceModel.js'
import { employeeExists, employeeHasExcludedLoginRole } from '../models/employeesModel.js'
import { createRecentActivity } from '../models/recentActivitiesModel.js'
import { formatDbError } from '../utils/formatDbError.js'
import { uniqueConstraintMessage } from '../utils/pgErrors.js'
import { calculateWorkingHours } from '../utils/workingHours.js'

const ATTENDANCE_STATUSES = new Set(['Present', 'Absent', 'Half Day'])

const ATTENDANCE_UNIQUE_MATCHERS = [
  {
    includes: 'employee_id',
    message: 'Attendance for this employee on this date already exists',
  },
  {
    includes: 'attendance_date',
    message: 'Attendance for this employee on this date already exists',
  },
]

function normalizeClock(value) {
  const text = String(value ?? '').trim()
  if (!text || text === '-' || text === '—') return '—'
  return text
}

function parseAttendancePayload(body) {
  const errors = []
  const employeeId = String(body?.employeeId ?? '').trim()
  const date = String(body?.date ?? '').trim()
  const status = String(body?.status ?? '').trim()
  const checkIn = normalizeClock(body?.checkIn)
  const checkOut = normalizeClock(body?.checkOut)

  if (!employeeId) errors.push('Employee is required')
  if (!date) errors.push('Date is required')
  else if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    errors.push('Date must be YYYY-MM-DD')
  }
  if (!status) errors.push('Attendance status is required')
  else if (!ATTENDANCE_STATUSES.has(status)) {
    errors.push('Status must be Present, Absent, or Half Day')
  }

  const clockPattern = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i
  if (checkIn !== '—' && !clockPattern.test(checkIn)) {
    errors.push('Check-in must look like 09:00 AM (or — for absent)')
  }
  if (checkOut !== '—' && !clockPattern.test(checkOut)) {
    errors.push('Check-out must look like 06:00 PM (or — for absent)')
  }

  let workingHours = calculateWorkingHours(checkIn, checkOut)
  if (workingHours === null) workingHours = 0

  return {
    errors,
    record: {
      employeeId,
      date,
      checkIn,
      checkOut,
      workingHours,
      status,
    },
  }
}

function mapAttendanceRow(row) {
  const calculated = calculateWorkingHours(row.checkIn, row.checkOut)
  const workingHours =
    calculated !== null ? calculated : Number(row.workingHours) || 0

  return {
    ...row,
    workingHours: workingHours.toFixed(2),
  }
}

export async function getAttendance(req, res) {
  try {
    if (req.user?.role === 'employee') {
      if (!req.user.employeeId) {
        return res.status(403).json({
          message: 'Your account is not linked to an employee record',
        })
      }
      const rows = await findAttendanceByEmployeeId(req.user.employeeId)
      return res.json({ records: rows.map(mapAttendanceRow) })
    }

    const rows = await findAllAttendance()
    res.json({ records: rows.map(mapAttendanceRow) })
  } catch (error) {
    res.status(500).json({ message: formatDbError(error) })
  }
}

export async function getAttendanceById(req, res) {
  try {
    if (req.user?.role === 'employee' && !req.user.employeeId) {
      return res.status(403).json({
        message: 'Your account is not linked to an employee record',
      })
    }

    const record = await findAttendanceById(req.params.id)
    if (!record) {
      return res.status(404).json({ message: 'Attendance record not found' })
    }
    if (
      req.user?.role === 'employee' &&
      record.employeeId !== req.user.employeeId
    ) {
      return res.status(403).json({ message: 'You do not have access to this resource' })
    }
    res.json({ record: mapAttendanceRow(record) })
  } catch (error) {
    res.status(500).json({ message: formatDbError(error) })
  }
}

export async function createAttendanceHandler(req, res) {
  try {
    const { errors, record } = parseAttendancePayload(req.body)
    if (errors.length > 0) {
      return res.status(400).json({ message: errors.join('; ') })
    }

    if (!(await employeeExists(record.employeeId))) {
      return res.status(400).json({ message: 'Employee not found' })
    }

    if (await employeeHasExcludedLoginRole(record.employeeId)) {
      return res.status(400).json({
        message: 'Attendance cannot be marked for HR or Admin accounts',
      })
    }

    const id = await generateNextAttendanceId()
    const created = await createAttendance({ ...record, id })

    await createRecentActivity({
      title: 'Attendance marked',
      description: `${created.employeeName} marked ${created.status} on ${created.date}.`,
      category: 'Attendance',
      status: created.status,
    })

    res.status(201).json({ record: mapAttendanceRow(created) })
  } catch (error) {
    const uniqueMessage = uniqueConstraintMessage(error, ATTENDANCE_UNIQUE_MATCHERS)
    if (uniqueMessage) {
      return res.status(409).json({ message: uniqueMessage })
    }
    res.status(500).json({ message: formatDbError(error) })
  }
}

export async function updateAttendanceHandler(req, res) {
  try {
    const { errors, record } = parseAttendancePayload(req.body)
    if (errors.length > 0) {
      return res.status(400).json({ message: errors.join('; ') })
    }

    if (!(await employeeExists(record.employeeId))) {
      return res.status(400).json({ message: 'Employee not found' })
    }

    if (await employeeHasExcludedLoginRole(record.employeeId)) {
      return res.status(400).json({
        message: 'Attendance cannot be marked for HR or Admin accounts',
      })
    }

    const updated = await updateAttendance(req.params.id, record)
    if (!updated) {
      return res.status(404).json({ message: 'Attendance record not found' })
    }

    await createRecentActivity({
      title: 'Attendance updated',
      description: `${updated.employeeName}'s attendance on ${updated.date} was updated (${updated.status}).`,
      category: 'Attendance',
      status: updated.status,
    })

    res.json({ record: mapAttendanceRow(updated) })
  } catch (error) {
    const uniqueMessage = uniqueConstraintMessage(error, ATTENDANCE_UNIQUE_MATCHERS)
    if (uniqueMessage) {
      return res.status(409).json({ message: uniqueMessage })
    }
    res.status(500).json({ message: formatDbError(error) })
  }
}

export async function deleteAttendanceHandler(req, res) {
  try {
    const existing = await findAttendanceById(req.params.id)
    if (!existing) {
      return res.status(404).json({ message: 'Attendance record not found' })
    }

    await deleteAttendanceById(req.params.id)

    await createRecentActivity({
      title: 'Attendance removed',
      description: `Attendance for ${existing.employeeName} on ${existing.date} was removed.`,
      category: 'Attendance',
      status: 'Removed',
    })

    res.json({ message: 'Attendance record deleted' })
  } catch (error) {
    res.status(500).json({ message: formatDbError(error) })
  }
}
