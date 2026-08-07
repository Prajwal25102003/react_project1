import path from 'path'
import { query } from '../config/db.js'
import { canonicalizeUploadPath } from '../utils/uploadAccessToken.js'

function basenameFromUpload(urlOrName) {
  const canonical = canonicalizeUploadPath(urlOrName)
  if (canonical) return path.basename(canonical)
  const raw = path.basename(String(urlOrName || '').trim())
  if (!raw || raw === '.' || raw === '..') return null
  return raw
}

export async function recordUploadFile({
  filename,
  kind,
  uploadedByUserId,
  employeeId = null,
  originalName = null,
  client = null,
}) {
  const runner = client || { query }
  const safeName = basenameFromUpload(filename)
  if (!safeName) {
    throw new Error('Invalid upload filename')
  }

  const result = await runner.query(
    `INSERT INTO upload_files (
       filename, kind, uploaded_by_user_id, employee_id, original_name
     ) VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (filename) DO UPDATE
       SET uploaded_by_user_id = EXCLUDED.uploaded_by_user_id,
           employee_id = COALESCE(EXCLUDED.employee_id, upload_files.employee_id),
           original_name = COALESCE(EXCLUDED.original_name, upload_files.original_name)
     RETURNING
       filename,
       kind,
       uploaded_by_user_id AS "uploadedByUserId",
       employee_id AS "employeeId",
       leave_request_id AS "leaveRequestId",
       original_name AS "originalName"`,
    [
      safeName,
      kind,
      uploadedByUserId || null,
      employeeId || null,
      originalName || null,
    ],
  )
  return result.rows[0] || null
}

export async function findUploadFileByFilename(filename, client = null) {
  const runner = client || { query }
  const safeName = basenameFromUpload(filename)
  if (!safeName) return null

  const result = await runner.query(
    `SELECT
       filename,
       kind,
       uploaded_by_user_id AS "uploadedByUserId",
       employee_id AS "employeeId",
       leave_request_id AS "leaveRequestId",
       original_name AS "originalName",
       created_at AS "createdAt"
     FROM upload_files
     WHERE filename = $1`,
    [safeName],
  )
  return result.rows[0] || null
}

/**
 * Ensure every medical attachment URL was uploaded by this user and still exists.
 */
export async function assertMedicalAttachmentsOwnedByUser(
  userId,
  attachments,
  client = null,
) {
  const runner = client || { query }
  const list = Array.isArray(attachments) ? attachments : []
  if (!userId || list.length === 0) {
    return { ok: false, message: 'Medical documents are required' }
  }

  for (const item of list) {
    const url = typeof item === 'string' ? item : item?.url
    const safeName = basenameFromUpload(url)
    if (!safeName || !safeName.startsWith('medical-')) {
      return { ok: false, message: 'Upload valid medical documents only' }
    }

    const result = await runner.query(
      `SELECT uploaded_by_user_id AS "uploadedByUserId", kind
       FROM upload_files
       WHERE filename = $1`,
      [safeName],
    )
    const row = result.rows[0]
    if (!row || row.kind !== 'medical') {
      return {
        ok: false,
        message: 'One or more medical documents were not found. Please re-upload.',
      }
    }
    if (Number(row.uploadedByUserId) !== Number(userId)) {
      return {
        ok: false,
        message: 'You can only attach medical documents you uploaded',
      }
    }
  }

  return { ok: true, message: '' }
}

export async function linkUploadFilesToLeaveRequest(
  leaveRequestId,
  attachmentUrls,
  client = null,
) {
  const runner = client || { query }
  const names = (attachmentUrls || [])
    .map((url) => basenameFromUpload(url))
    .filter(Boolean)
  if (!leaveRequestId || names.length === 0) return 0

  const result = await runner.query(
    `UPDATE upload_files
     SET leave_request_id = $1
     WHERE filename = ANY($2::text[])
     RETURNING filename`,
    [leaveRequestId, names],
  )
  return result.rowCount || 0
}
