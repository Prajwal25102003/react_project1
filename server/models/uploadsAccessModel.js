import path from 'path'
import { query } from '../config/db.js'
import { findStepsByLeaveRequestIds } from './leaveRequestsModel.js'
import { findUploadFileByFilename } from './uploadFilesModel.js'

/**
 * Whether an authenticated user may download a stored upload.
 * Avatars: any signed-in user.
 * Medical: leave owner / head / approver / hr / admin, or the uploader for orphans.
 */
export async function canUserAccessUploadFile(user, filename) {
  const safeName = path.basename(String(filename || '').trim())
  if (!safeName || safeName === '.' || safeName === '..') return false
  if (!user?.id) return false

  if (safeName.startsWith('avatar-')) {
    return true
  }

  if (!safeName.startsWith('medical-')) {
    return false
  }

  const role = user.role
  const marker = `/uploads/${safeName}`
  const result = await query(
    `
      SELECT
        lr.id,
        lr.employee_id AS "employeeId",
        d.head_employee_id AS "departmentHeadId"
      FROM leave_requests lr
      INNER JOIN employees e ON e.id = lr.employee_id
      LEFT JOIN departments d ON d.id = e.department_id
      WHERE lr.attachment_url = $1
         OR lr.attachment_url LIKE $2
    `,
    [marker, `%${safeName}%`],
  )

  if (result.rows.length === 0) {
    // Orphan / not yet attached — uploader only.
    const meta = await findUploadFileByFilename(safeName)
    if (!meta) return false
    return Number(meta.uploadedByUserId) === Number(user.id)
  }

  if (role === 'hr' || role === 'admin') return true

  const employeeId = user.employeeId || null
  const leaveIds = result.rows.map((row) => row.id)
  const stepsByLeave = await findStepsByLeaveRequestIds(leaveIds)

  for (const row of result.rows) {
    if (employeeId && row.employeeId === employeeId) return true
    if (employeeId && row.departmentHeadId === employeeId) return true

    const steps = stepsByLeave.get(row.id) || []
    if (
      employeeId &&
      steps.some(
        (step) =>
          step.approverKind === 'employee' &&
          step.approverEmployeeId === employeeId,
      )
    ) {
      return true
    }
  }

  // Uploader may still download even if somehow not on the leave path.
  const meta = await findUploadFileByFilename(safeName)
  if (meta && Number(meta.uploadedByUserId) === Number(user.id)) {
    return true
  }

  return false
}
