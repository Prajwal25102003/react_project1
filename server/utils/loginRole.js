/**
 * Login role for directory employees.
 *
 * - Human Resources department head → `hr` (HR login / HR modules)
 * - Every other department head → stays `employee`, but is treated as Team Lead
 *   via `isDepartmentHead` (head_employee_id) for team leave approvals
 * - All other staff → `employee`
 */

export function isHumanResourcesDepartment(departmentName) {
  return String(departmentName || '').trim().toLowerCase() === 'human resources'
}

/**
 * @param {{
 *   departmentName?: string|null,
 *   employeeId?: string|null,
 *   headEmployeeId?: string|null,
 * }} input
 * @returns {'hr'|'employee'}
 */
export function loginRoleForEmployee({
  departmentName,
  employeeId,
  headEmployeeId,
} = {}) {
  if (
    isHumanResourcesDepartment(departmentName) &&
    employeeId &&
    headEmployeeId &&
    String(employeeId) === String(headEmployeeId)
  ) {
    return 'hr'
  }
  return 'employee'
}
