import pool, { query } from '../config/db.js'
import { isHumanResourcesDepartment } from '../utils/loginRole.js'

export const HIERARCHY_CATEGORIES = ['employee', 'department_head', 'hr']

export const APPROVER_KINDS = ['department_head', 'role', 'employee']

export const APPROVER_ROLES = ['hr', 'admin']

export const CATEGORY_LABELS = {
  employee: 'Employee leave',
  department_head: 'Department head leave',
  hr: 'HR leave',
}

export const CATEGORY_APPLIES_TO = {
  employee: 'Employees',
  department_head: 'Department heads',
  hr: 'Human Resources department head only',
}

const HIERARCHY_SELECT = `
  h.id,
  h.category,
  h.name,
  h.is_active AS "isActive",
  TO_CHAR(h.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS "createdAt",
  TO_CHAR(h.updated_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS "updatedAt"
`

const STEP_SELECT = `
  s.id,
  s.hierarchy_id AS "hierarchyId",
  s.step_order AS "stepOrder",
  s.approver_kind AS "approverKind",
  s.approver_role AS "approverRole",
  s.approver_employee_id AS "approverEmployeeId",
  e.name AS "approverEmployeeName"
`

function mapStepRow(row) {
  return {
    id: row.id,
    hierarchyId: row.hierarchyId,
    stepOrder: Number(row.stepOrder),
    approverKind: row.approverKind,
    approverRole: row.approverRole || null,
    approverEmployeeId: row.approverEmployeeId || null,
    approverEmployeeName: row.approverEmployeeName || null,
  }
}

export function historyStepForApprover(step) {
  if (!step) return 'HigherAuthority'
  if (step.approverKind === 'department_head') return 'TeamLead'
  if (step.approverKind === 'role' && step.approverRole === 'hr') return 'HR'
  if (step.approverKind === 'role' && step.approverRole === 'admin') return 'Admin'
  return 'HigherAuthority'
}

export function historyActorRoleForApprover(step, fallbackRole = 'employee') {
  if (!step) return fallbackRole
  if (step.approverKind === 'department_head') return 'team_lead'
  if (step.approverKind === 'role' && step.approverRole) return step.approverRole
  return fallbackRole
}

export function stepDisplayLabel(step) {
  if (!step) return 'Approver'
  if (step.approverKind === 'department_head') return 'Dept Head'
  if (step.approverKind === 'role' && step.approverRole === 'hr') return 'HR'
  if (step.approverKind === 'role' && step.approverRole === 'admin') return 'Admin'
  if (step.approverKind === 'employee') {
    return step.approverEmployeeName || step.approverEmployeeId || 'Named Approver'
  }
  return 'Approver'
}

/**
 * True when the requester is the single Human Resources department head.
 * That person alone uses the HR leave chain; other HR staff are employees.
 */
export function isHrDepartmentHeadRequester({
  role,
  employeeId,
  departmentHeadId,
  departmentName,
  requesterIsHr = false,
} = {}) {
  const hasDepartmentContext =
    departmentName != null || departmentHeadId != null

  if (hasDepartmentContext) {
    return (
      isHumanResourcesDepartment(departmentName) &&
      Boolean(employeeId) &&
      Boolean(departmentHeadId) &&
      String(employeeId) === String(departmentHeadId)
    )
  }

  // Fallback when only the login role is available.
  return role === 'hr' || requesterIsHr
}

/**
 * Resolve which hierarchy category applies to the requester.
 * HR leave applies only to the Human Resources department head (1 person).
 */
export function resolveRequesterCategory({
  role,
  employeeId,
  departmentHeadId,
  departmentName,
  requesterIsHr = false,
}) {
  if (
    isHrDepartmentHeadRequester({
      role,
      employeeId,
      departmentHeadId,
      departmentName,
      requesterIsHr,
    })
  ) {
    return 'hr'
  }
  if (
    employeeId &&
    departmentHeadId &&
    String(employeeId) === String(departmentHeadId)
  ) {
    return 'department_head'
  }
  return 'employee'
}

/**
 * Skip steps that cannot apply (e.g. department_head when requester is the head).
 */
export function firstActionableStepOrder(steps, { employeeId, departmentHeadId }) {
  const ordered = [...(steps || [])].sort(
    (a, b) => Number(a.stepOrder) - Number(b.stepOrder),
  )
  for (const step of ordered) {
    if (
      step.approverKind === 'department_head' &&
      employeeId &&
      departmentHeadId &&
      String(employeeId) === String(departmentHeadId)
    ) {
      continue
    }
    return Number(step.stepOrder)
  }
  return ordered.length > 0 ? Number(ordered[ordered.length - 1].stepOrder) : 1
}

export function nextStepOrder(steps, currentStep) {
  const ordered = [...(steps || [])]
    .map((s) => Number(s.stepOrder))
    .sort((a, b) => a - b)
  const idx = ordered.indexOf(Number(currentStep))
  if (idx < 0 || idx >= ordered.length - 1) return null
  return ordered[idx + 1]
}

export function findStepByOrder(steps, stepOrder) {
  return (steps || []).find((s) => Number(s.stepOrder) === Number(stepOrder)) || null
}

export function actorMatchesStep(
  step,
  { role, employeeId, departmentHeadId, requesterEmployeeId },
) {
  if (!step) return false

  if (step.approverKind === 'department_head') {
    return Boolean(
      employeeId &&
        departmentHeadId &&
        String(employeeId) === String(departmentHeadId) &&
        String(employeeId) !== String(requesterEmployeeId || ''),
    )
  }

  if (step.approverKind === 'role') {
    return Boolean(step.approverRole && role === step.approverRole)
  }

  if (step.approverKind === 'employee') {
    return Boolean(
      employeeId &&
        step.approverEmployeeId &&
        String(employeeId) === String(step.approverEmployeeId),
    )
  }

  return false
}

export async function findAllHierarchiesWithSteps() {
  const result = await query(
    `SELECT ${HIERARCHY_SELECT}
     FROM leave_approval_hierarchies h
     ORDER BY
       CASE h.category
         WHEN 'employee' THEN 1
         WHEN 'department_head' THEN 2
         WHEN 'hr' THEN 3
         ELSE 4
       END`,
  )

  const hierarchies = result.rows
  if (hierarchies.length === 0) return []

  const ids = hierarchies.map((h) => h.id)
  const stepsResult = await query(
    `SELECT ${STEP_SELECT}
     FROM leave_approval_hierarchy_steps s
     LEFT JOIN employees e ON e.id = s.approver_employee_id
     WHERE s.hierarchy_id = ANY($1::int[])
     ORDER BY s.hierarchy_id ASC, s.step_order ASC`,
    [ids],
  )

  const byHierarchy = new Map()
  for (const row of stepsResult.rows) {
    const list = byHierarchy.get(row.hierarchyId) || []
    list.push(mapStepRow(row))
    byHierarchy.set(row.hierarchyId, list)
  }

  return hierarchies.map((h) => ({
    ...h,
    steps: byHierarchy.get(h.id) || [],
  }))
}

export async function findHierarchyByCategory(category) {
  const result = await query(
    `SELECT ${HIERARCHY_SELECT}
     FROM leave_approval_hierarchies h
     WHERE h.category = $1
     LIMIT 1`,
    [category],
  )
  const hierarchy = result.rows[0] || null
  if (!hierarchy) return null

  const steps = await findStepsByHierarchyId(hierarchy.id)
  return { ...hierarchy, steps }
}

export async function findActiveHierarchyByCategory(category) {
  const result = await query(
    `SELECT ${HIERARCHY_SELECT}
     FROM leave_approval_hierarchies h
     WHERE h.category = $1
       AND h.is_active = TRUE
     LIMIT 1`,
    [category],
  )
  const hierarchy = result.rows[0] || null
  if (!hierarchy) return null

  const steps = await findStepsByHierarchyId(hierarchy.id)
  return { ...hierarchy, steps }
}

export async function findStepsByHierarchyId(hierarchyId) {
  if (!hierarchyId) return []
  const result = await query(
    `SELECT ${STEP_SELECT}
     FROM leave_approval_hierarchy_steps s
     LEFT JOIN employees e ON e.id = s.approver_employee_id
     WHERE s.hierarchy_id = $1
     ORDER BY s.step_order ASC`,
    [hierarchyId],
  )
  return result.rows.map(mapStepRow)
}

export async function findStepsByHierarchyIds(hierarchyIds) {
  const ids = [...new Set((hierarchyIds || []).filter(Boolean))]
  if (ids.length === 0) return new Map()

  const result = await query(
    `SELECT ${STEP_SELECT}
     FROM leave_approval_hierarchy_steps s
     LEFT JOIN employees e ON e.id = s.approver_employee_id
     WHERE s.hierarchy_id = ANY($1::int[])
     ORDER BY s.hierarchy_id ASC, s.step_order ASC`,
    [ids],
  )

  const map = new Map()
  for (const row of result.rows) {
    const list = map.get(row.hierarchyId) || []
    list.push(mapStepRow(row))
    map.set(row.hierarchyId, list)
  }
  return map
}

export async function isNamedLeaveApprover(employeeId) {
  if (!employeeId) return false
  const result = await query(
    `SELECT 1
     WHERE EXISTS (
       SELECT 1
       FROM leave_approval_hierarchy_steps s
       INNER JOIN leave_approval_hierarchies h ON h.id = s.hierarchy_id
       WHERE s.approver_kind = 'employee'
         AND s.approver_employee_id = $1
         AND h.is_active = TRUE
     )
     OR EXISTS (
       SELECT 1
       FROM leave_request_hierarchy_steps s
       INNER JOIN leave_requests lr ON lr.id = s.leave_request_id
       WHERE s.approver_kind = 'employee'
         AND s.approver_employee_id = $1
         AND lr.status = 'Pending'
         AND lr.current_step = s.step_order
     )
     LIMIT 1`,
    [employeeId],
  )
  return result.rowCount > 0
}

export async function replaceHierarchySteps(category, { name, steps }) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const hierarchyResult = await client.query(
      `SELECT id FROM leave_approval_hierarchies WHERE category = $1 LIMIT 1`,
      [category],
    )
    const hierarchy = hierarchyResult.rows[0]
    if (!hierarchy) {
      throw Object.assign(new Error('Hierarchy category not found'), {
        statusCode: 404,
      })
    }

    const hierarchyId = hierarchy.id
    const nextName =
      String(name || CATEGORY_LABELS[category] || category).trim() ||
      CATEGORY_LABELS[category] ||
      category

    await client.query(
      `UPDATE leave_approval_hierarchies
       SET name = $2,
           updated_at = NOW()
       WHERE id = $1`,
      [hierarchyId, nextName],
    )

    await client.query(
      `DELETE FROM leave_approval_hierarchy_steps WHERE hierarchy_id = $1`,
      [hierarchyId],
    )

    for (const step of steps) {
      await client.query(
        `INSERT INTO leave_approval_hierarchy_steps (
          hierarchy_id, step_order, approver_kind, approver_role, approver_employee_id
        ) VALUES ($1, $2, $3, $4, $5)`,
        [
          hierarchyId,
          step.stepOrder,
          step.approverKind,
          step.approverRole || null,
          step.approverEmployeeId || null,
        ],
      )
    }

    await client.query('COMMIT')
    return findHierarchyByCategory(category)
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}
