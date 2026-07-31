/**
 * Helpers for targeting recent_activities / notifications to the right viewers.
 */

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

/**
 * Build department + employeeIds audience for an employee subject.
 * Includes the subject and department head(s) for current/previous departments.
 */
export async function buildEmployeeAudienceMeta(
  employee,
  { findDepartmentById, previousDepartmentId = null } = {},
) {
  const departmentId = employee?.departmentId || null
  const departmentIds = uniqueIds(departmentId, previousDepartmentId)
  const headIds = []

  if (typeof findDepartmentById === 'function') {
    for (const id of departmentIds) {
      const dept = await findDepartmentById(id)
      if (dept?.headEmployeeId) headIds.push(dept.headEmployeeId)
    }
  }

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
export async function expandEmployeeIdsWithDepartmentHeads(
  employeeIds,
  { findEmployeeById, findDepartmentById } = {},
) {
  const base = uniqueIds(employeeIds)
  if (
    typeof findEmployeeById !== 'function' ||
    typeof findDepartmentById !== 'function'
  ) {
    return base
  }

  const headIds = []
  for (const id of base) {
    const employee = await findEmployeeById(id)
    if (!employee?.departmentId) continue
    const dept = await findDepartmentById(employee.departmentId)
    if (dept?.headEmployeeId) headIds.push(dept.headEmployeeId)
  }

  return uniqueIds(base, headIds)
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
