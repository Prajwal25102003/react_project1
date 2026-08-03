/**
 * Helpers for targeting recent_activities / notifications to the right viewers.
 */
import { findDepartmentHeadRowsByIds } from '../models/departmentsModel.js'
import { findEmployeeDepartmentRowsByIds } from '../models/employeesModel.js'

export function uniqueIds(...groups) {
  const ids = []
  for (const group of groups) {
    if (Array.isArray(group)) ids.push(...group)
    else if (group) ids.push(group)
  }
  return [...new Set(ids.map(String).filter(Boolean))]
}

/** @deprecated use uniqueIds */
export function uniqueEmployeeIds(...groups) {
  return uniqueIds(...groups)
}

async function resolveDepartmentHeads(departmentIds) {
  const rows = await findDepartmentHeadRowsByIds(departmentIds)
  return rows
    .map((row) => row.headEmployeeId)
    .filter(Boolean)
}

/**
 * Build department + employeeIds audience for an employee subject.
 * Includes the subject and department head(s) for current/previous departments.
 */
export async function buildEmployeeAudienceMeta(
  employee,
  { previousDepartmentId = null } = {},
) {
  const departmentId = employee?.departmentId || null
  const departmentIds = uniqueIds(departmentId, previousDepartmentId)
  const headIds = await resolveDepartmentHeads(departmentIds)

  return {
    departmentId,
    departmentIds,
    employeeIds: uniqueIds(employee?.id, headIds),
  }
}

/** Collect named / dept-head approver ids from frozen hierarchy steps. */
export function employeeIdsFromHierarchySteps(
  steps,
  { departmentHeadId = null, requesterEmployeeId = null } = {},
) {
  const ids = []
  if (requesterEmployeeId) ids.push(requesterEmployeeId)
  if (departmentHeadId) ids.push(departmentHeadId)

  for (const step of steps || []) {
    if (step?.approverKind === 'employee' && step.approverEmployeeId) {
      ids.push(step.approverEmployeeId)
    }
    if (step?.approverKind === 'department_head' && departmentHeadId) {
      ids.push(departmentHeadId)
    }
  }

  return uniqueEmployeeIds(ids)
}

/**
 * Expand a list of employee ids with each person's department head
 * (e.g. bulk attendance import).
 */
export async function expandEmployeeIdsWithDepartmentHeads(employeeIds) {
  const base = uniqueIds(employeeIds)
  if (base.length === 0) return base

  const employees = await findEmployeeDepartmentRowsByIds(base)
  const departmentIds = uniqueIds(
    employees.map((row) => row.departmentId),
  )
  const headIds = await resolveDepartmentHeads(departmentIds)
  return uniqueIds(base, headIds)
}

/**
 * Audience meta for bulk attendance import:
 * subjects + their department heads, and the departments involved.
 */
export async function buildImportAudienceMeta(employeeIds) {
  const base = uniqueIds(employeeIds)
  if (base.length === 0) {
    return { departmentId: null, departmentIds: [], employeeIds: [] }
  }

  const employees = await findEmployeeDepartmentRowsByIds(base)
  const departmentIds = uniqueIds(
    employees.map((row) => row.departmentId),
  )
  const headIds = await resolveDepartmentHeads(departmentIds)
  const departments = uniqueIds(departmentIds)

  return {
    departmentId: departments[0] || null,
    departmentIds: departments,
    employeeIds: uniqueIds(base, headIds),
  }
}

/**
 * Attendance rows for a regular employee feed: only their own mark/remove.
 * Bulk import notices are org/team-lead scoped (admin/HR/dept head).
 */
export function filterAttendanceForEmployeeFeed(rows, employeeId) {
  const viewer = String(employeeId || '')
  if (!viewer) return rows || []

  return (rows || []).filter((row) => {
    if (String(row?.category || '') !== 'Attendance') return true
    const eventType = String(row?.eventType || '')
    if (eventType === 'attendance.imported') return false
    return String(row?.subjectEmployeeId || '') === viewer
  })
}

/** True when the viewer is the subject or listed in meta.employeeIds. */
export function viewerIsActivityAudience(row, viewerEmployeeId, meta = {}) {
  if (!viewerEmployeeId) return false
  const viewer = String(viewerEmployeeId)
  if (String(row?.subjectEmployeeId || '') === viewer) return true
  const ids = meta.employeeIds
  if (!Array.isArray(ids)) return false
  return ids.some((id) => String(id) === viewer)
}
