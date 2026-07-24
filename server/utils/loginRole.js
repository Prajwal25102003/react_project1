/**
 * Login role for directory employees.
 *
 * Only the Human Resources department head gets `hr` (module maintainer).
 * Other Human Resources staff — and all other departments — use `employee`.
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
