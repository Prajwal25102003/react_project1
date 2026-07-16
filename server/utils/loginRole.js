/**
 * Login role derived from employee department.
 * Human Resources staff use the HR dashboard and permissions.
 */
export function loginRoleForDepartmentName(departmentName) {
  const normalized = String(departmentName || '').trim().toLowerCase()
  return normalized === 'human resources' ? 'hr' : 'employee'
}
