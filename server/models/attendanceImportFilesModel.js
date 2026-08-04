import { query } from '../config/db.js'

/**
 * Persist one Excel/CSV import batch for later cleanup when attendance rows are deleted.
 * @param {{
 *   filename: string,
 *   uploadedBy?: string|null,
 *   rows: Array<Record<string, unknown>>,
 * }} input
 */
export async function createAttendanceImportFile(
  { filename, uploadedBy = null, rows },
  client = null,
) {
  const runner = client || { query }
  const list = Array.isArray(rows) ? rows : []
  const safeName = String(filename || 'attendance-import').trim() || 'attendance-import'

  const result = await runner.query(
    `INSERT INTO attendance_import_files (
       filename, row_count, rows, uploaded_by
     ) VALUES ($1, $2, $3::jsonb, $4)
     RETURNING id`,
    [safeName, list.length, JSON.stringify(list), uploadedBy || null],
  )

  return result.rows[0]?.id || null
}

function matchesImportRow(elem, entry) {
  const attendanceId = entry?.attendanceId ? String(entry.attendanceId) : ''
  const employeeId = entry?.employeeId ? String(entry.employeeId) : ''
  const date = entry?.date ? String(entry.date) : ''

  if (attendanceId && elem?.attendanceId && String(elem.attendanceId) === attendanceId) {
    return true
  }
  if (
    employeeId &&
    date &&
    String(elem?.employeeId || '') === employeeId &&
    String(elem?.date || '') === date
  ) {
    return true
  }
  return false
}

/**
 * Remove imported attendance entries from import-file logs.
 * Deletes the import-file row when no rows remain.
 * @param {Array<{ attendanceId?: string, employeeId?: string, date?: string }>} entries
 */
export async function removeAttendanceEntriesFromImportFiles(
  entries,
  client = null,
) {
  const list = (Array.isArray(entries) ? entries : []).filter(
    (entry) => entry?.attendanceId || (entry?.employeeId && entry?.date),
  )
  if (list.length === 0) return { updatedFiles: 0, deletedFiles: 0 }

  const runner = client || { query }
  const files = await runner.query(
    `SELECT id, rows
     FROM attendance_import_files
     ORDER BY id ASC`,
  )

  let updatedFiles = 0
  let deletedFiles = 0

  for (const file of files.rows) {
    const currentRows = Array.isArray(file.rows) ? file.rows : []
    if (currentRows.length === 0) {
      await runner.query(`DELETE FROM attendance_import_files WHERE id = $1`, [
        file.id,
      ])
      deletedFiles += 1
      continue
    }

    const nextRows = currentRows.filter(
      (elem) => !list.some((entry) => matchesImportRow(elem, entry)),
    )

    if (nextRows.length === currentRows.length) continue

    if (nextRows.length === 0) {
      await runner.query(`DELETE FROM attendance_import_files WHERE id = $1`, [
        file.id,
      ])
      deletedFiles += 1
      continue
    }

    await runner.query(
      `UPDATE attendance_import_files
       SET rows = $2::jsonb,
           row_count = $3
       WHERE id = $1`,
      [file.id, JSON.stringify(nextRows), nextRows.length],
    )
    updatedFiles += 1
  }

  return { updatedFiles, deletedFiles }
}

/**
 * Drop every import-file row that belongs to an employee (used when employee is deleted).
 */
export async function removeEmployeeFromAttendanceImportFiles(
  employeeId,
  client = null,
) {
  const id = String(employeeId || '').trim()
  if (!id) return { updatedFiles: 0, deletedFiles: 0 }

  const runner = client || { query }
  const files = await runner.query(
    `SELECT id, rows
     FROM attendance_import_files
     WHERE rows @> $1::jsonb
        OR EXISTS (
          SELECT 1
          FROM jsonb_array_elements(rows) elem
          WHERE elem->>'employeeId' = $2
        )
     ORDER BY id ASC`,
    [JSON.stringify([{ employeeId: id }]), id],
  )

  let updatedFiles = 0
  let deletedFiles = 0

  for (const file of files.rows) {
    const currentRows = Array.isArray(file.rows) ? file.rows : []
    const nextRows = currentRows.filter(
      (elem) => String(elem?.employeeId || '') !== id,
    )

    if (nextRows.length === currentRows.length) continue

    if (nextRows.length === 0) {
      await runner.query(`DELETE FROM attendance_import_files WHERE id = $1`, [
        file.id,
      ])
      deletedFiles += 1
      continue
    }

    await runner.query(
      `UPDATE attendance_import_files
       SET rows = $2::jsonb,
           row_count = $3
       WHERE id = $1`,
      [file.id, JSON.stringify(nextRows), nextRows.length],
    )
    updatedFiles += 1
  }

  return { updatedFiles, deletedFiles }
}
