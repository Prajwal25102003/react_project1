/**
 * Legacy admin leave config.
 *
 * Admin is no longer part of the leave module (system maintainer only).
 * These helpers remain for any historical admin leave rows in the DB.
 */
export const ADMIN_LEAVE_APPROVER_ROLES = []

export function canApproveAdminLeave(role) {
  return ADMIN_LEAVE_APPROVER_ROLES.includes(role)
}

export function shouldAutoApproveAdminLeave() {
  return ADMIN_LEAVE_APPROVER_ROLES.length === 0
}
