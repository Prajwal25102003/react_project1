/**
 * Admin leave approval config.
 *
 * Admin is currently the top of the org chain, so Admin leave is auto-approved
 * on submit (ADMIN_LEAVE_APPROVER_ROLES is empty).
 *
 * Later, when a higher authority exists (e.g. super_admin / director):
 *   1. Add that role to users + auth
 *   2. Put it in ADMIN_LEAVE_APPROVER_ROLES below
 * Admin leave will then stay Pending until that role approves or rejects.
 */
export const ADMIN_LEAVE_APPROVER_ROLES = []

export function canApproveAdminLeave(role) {
  return ADMIN_LEAVE_APPROVER_ROLES.includes(role)
}

export function shouldAutoApproveAdminLeave() {
  return ADMIN_LEAVE_APPROVER_ROLES.length === 0
}
