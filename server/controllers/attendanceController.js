import pool from '../config/db.js'
import {
  deleteAttendanceById,
  findAllAttendance,
  findAttendanceByEmployeeId,
  findAttendanceById,
  normalizeAttendanceDays,
  updateAttendance,
  upsertAttendanceByEmployeeDate,
} from '../models/attendanceModel.js'
import { findDepartmentById } from '../models/departmentsModel.js'
import {
  employeeExists,
  employeeHasExcludedLoginRole,
  findEmployeeById,
} from '../models/employeesModel.js'
import { createRecentActivity } from '../models/recentActivitiesModel.js'
import {
  actorFromUser,
  formatActorLabel,
  formatDisplayDate,
} from '../utils/activityCopy.js'
import { formatDbError } from '../utils/formatDbError.js'
import {
  buildEmployeeAudienceMeta,
  expandEmployeeIdsWithDepartmentHeads,
} from '../utils/notificationAudience.js'
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
  if (status !== 'Absent' && checkIn !== '—' && checkOut === '—') {
    errors.push('Check-out is required when check-in is provided')
  }
  if (status !== 'Absent' && checkOut !== '—' && checkIn === '—') {
    errors.push('Check-in is required when check-out is provided')
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

/** HR may manage others' attendance but not their own. */
function isHrEditingOwnAttendance(user, subjectEmployeeId) {
  return (
    user?.role === 'hr' &&
    Boolean(user?.employeeId) &&
    String(user.employeeId) === String(subjectEmployeeId)
  )
}

export async function getAttendance(req, res) {
  try {
    const days = normalizeAttendanceDays(req.query.days)

    if (req.user?.role === 'employee') {
      if (!req.user.employeeId) {
        return res.status(403).json({
          message: 'Your account is not linked to an employee record',
        })
      }
      const rows = await findAttendanceByEmployeeId(req.user.employeeId, {
        days,
      })
      return res.json({ records: rows.map(mapAttendanceRow), days })
    }

    const rows = await findAllAttendance({ days })
    res.json({ records: rows.map(mapAttendanceRow), days })
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

export async function updateAttendanceHandler(req, res) {
  try {
    const { errors, record } = parseAttendancePayload(req.body)
    if (errors.length > 0) {
      return res.status(400).json({ message: errors.join('; ') })
    }

    if (!(await employeeExists(record.employeeId))) {
      return res.status(400).json({ message: 'Employee not found' })
    }

    if (await employeeHasExcludedLoginRole(record.employeeId, ['admin'])) {
      return res.status(400).json({
        message: 'Attendance cannot be marked for Admin accounts',
      })
    }

    const existing = await findAttendanceById(req.params.id)
    if (!existing) {
      return res.status(404).json({ message: 'Attendance record not found' })
    }
    if (
      isHrEditingOwnAttendance(req.user, existing.employeeId) ||
      isHrEditingOwnAttendance(req.user, record.employeeId)
    ) {
      return res.status(403).json({
        message: 'You cannot edit your own attendance',
      })
    }

    const updated = await updateAttendance(req.params.id, record)
    if (!updated) {
      return res.status(404).json({ message: 'Attendance record not found' })
    }

    const actorLabel = formatActorLabel(actorFromUser(req.user))
    const dateLabel = formatDisplayDate(updated.date)
    const hasCheckIn =
      updated.checkIn && updated.checkIn !== '—' && updated.checkIn !== '-'
    let description
    if (updated.status === 'Absent') {
      description = `${updated.employeeName} was marked Absent on ${dateLabel} by ${actorLabel}.`
    } else if (hasCheckIn) {
      description = `${updated.employeeName} checked in at ${updated.checkIn} (${updated.status}) on ${dateLabel}. Updated by ${actorLabel}.`
    } else {
      description = `${updated.employeeName}'s attendance on ${dateLabel} was updated to ${updated.status} by ${actorLabel}.`
    }

    const subject = await findEmployeeById(updated.employeeId)
    const audience = await buildEmployeeAudienceMeta(subject || { id: updated.employeeId }, {
      findDepartmentById,
    })
    await createRecentActivity({
      title: 'Attendance Marked',
      description,
      category: 'Attendance',
      status: updated.status,
      eventType: 'attendance.marked',
      subjectEmployeeId: updated.employeeId,
      actorEmployeeId: req.user?.employeeId || null,
      meta: {
        subjectName: updated.employeeName,
        attendanceDate: updated.date,
        attendanceStatus: updated.status,
        attendanceId: updated.id,
        checkIn: updated.checkIn,
        departmentId: audience.departmentId,
        departmentIds: audience.departmentIds,
        employeeIds: audience.employeeIds,
        actorName: req.user?.name || null,
        actorRole: req.user?.role || null,
      },
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
    if (isHrEditingOwnAttendance(req.user, existing.employeeId)) {
      return res.status(403).json({
        message: 'You cannot delete your own attendance',
      })
    }

    await deleteAttendanceById(req.params.id)

    const actorLabel = formatActorLabel(actorFromUser(req.user))
    const dateLabel = formatDisplayDate(existing.date)
    const subject = await findEmployeeById(existing.employeeId)
    const audience = await buildEmployeeAudienceMeta(
      subject || { id: existing.employeeId },
      { findDepartmentById },
    )
    await createRecentActivity({
      title: 'Attendance Removed',
      description: `Attendance for ${existing.employeeName} on ${dateLabel} was removed by ${actorLabel}.`,
      category: 'Attendance',
      status: 'Removed',
      eventType: 'attendance.removed',
      subjectEmployeeId: existing.employeeId,
      actorEmployeeId: req.user?.employeeId || null,
      meta: {
        subjectName: existing.employeeName,
        attendanceDate: existing.date,
        attendanceId: existing.id,
        departmentId: audience.departmentId,
        departmentIds: audience.departmentIds,
        employeeIds: audience.employeeIds,
        actorName: req.user?.name || null,
        actorRole: req.user?.role || null,
      },
    })

    res.json({ message: 'Attendance record deleted' })
  } catch (error) {
    res.status(500).json({ message: formatDbError(error) })
  }
}

export async function importAttendanceHandler(req, res) {
  try {
    const records = Array.isArray(req.body?.records) ? req.body.records : null
    if (!records || records.length === 0) {
      return res.status(400).json({ message: 'No attendance records to import' })
    }
    if (records.length > 5000) {
      return res.status(400).json({
        message: 'Import is limited to 5000 rows at a time',
      })
    }

    const errors = []
    const validated = []

    // Validate every row first — reject the whole file if any row is invalid.
    for (let i = 0; i < records.length; i += 1) {
      const { errors: rowErrors, record } = parseAttendancePayload(records[i])
      if (rowErrors.length > 0) {
        errors.push(`Row ${i + 1}: ${rowErrors.join('; ')}`)
        continue
      }

      if (!(await employeeExists(record.employeeId))) {
        errors.push(`Row ${i + 1}: employee ${record.employeeId} not found`)
        continue
      }

      if (await employeeHasExcludedLoginRole(record.employeeId, ['admin'])) {
        errors.push(
          `Row ${i + 1}: attendance cannot be marked for Admin (${record.employeeId})`,
        )
        continue
      }

      if (isHrEditingOwnAttendance(req.user, record.employeeId)) {
        errors.push(
          `Row ${i + 1}: you cannot import your own attendance (${record.employeeId})`,
        )
        continue
      }

      validated.push(record)
    }

    if (errors.length > 0) {
      return res.status(400).json({
        message:
          errors.length === 1
            ? errors[0]
            : `Import rejected — ${errors.length} row error(s) found`,
        errors: errors.slice(0, 50),
        stats: {
          total: records.length,
          imported: 0,
          updated: 0,
          skipped: 0,
          failed: errors.length,
          present: 0,
          absent: 0,
          halfDay: 0,
          errors: errors.slice(0, 50),
        },
      })
    }

    let imported = 0
    let updated = 0
    let present = 0
    let absent = 0
    let halfDay = 0
    const attendanceIds = []
    const employeeIds = []

    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      for (let i = 0; i < validated.length; i += 1) {
        const record = validated[i]
        const result = await upsertAttendanceByEmployeeDate(record, client)
        if (result.action === 'inserted') imported += 1
        else updated += 1

        if (result.id) attendanceIds.push(result.id)
        if (record.employeeId) employeeIds.push(record.employeeId)

        if (record.status === 'Present') present += 1
        else if (record.status === 'Absent') absent += 1
        else if (record.status === 'Half Day') halfDay += 1
      }
      await client.query('COMMIT')
    } catch (error) {
      await client.query('ROLLBACK')
      return res.status(400).json({
        message: `Import rejected — ${formatDbError(error)}`,
        errors: [formatDbError(error)],
        stats: {
          total: records.length,
          imported: 0,
          updated: 0,
          skipped: 0,
          failed: 1,
          present: 0,
          absent: 0,
          halfDay: 0,
          errors: [formatDbError(error)],
        },
      })
    } finally {
      client.release()
    }

    const saved = imported + updated
    if (saved > 0) {
      const actorLabel = formatActorLabel(actorFromUser(req.user))
      const uniqueEmployeeIds = await expandEmployeeIdsWithDepartmentHeads(
        employeeIds,
        { findEmployeeById, findDepartmentById },
      )
      const uniqueAttendanceIds = [...new Set(attendanceIds.filter(Boolean))]
      await createRecentActivity({
        title: 'Attendance Imported',
        description: `${actorLabel} imported ${saved} attendance rows from Excel (${imported} new, ${updated} updated).`,
        category: 'Attendance',
        status: 'Updated',
        eventType: 'attendance.imported',
        actorEmployeeId: req.user?.employeeId || null,
        meta: {
          imported,
          updated,
          employeeIds: uniqueEmployeeIds,
          attendanceIds: uniqueAttendanceIds,
          actorName: req.user?.name || null,
          actorRole: req.user?.role || null,
        },
      })
    }

    res.json({
      stats: {
        total: records.length,
        imported,
        updated,
        skipped: 0,
        failed: 0,
        present,
        absent,
        halfDay,
        errors: [],
      },
    })
  } catch (error) {
    res.status(500).json({ message: formatDbError(error) })
  }
}
