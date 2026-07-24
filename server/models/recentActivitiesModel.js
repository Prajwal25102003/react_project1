import { query } from '../config/db.js'

export async function generateNextActivityId() {
  const result = await query(
    `SELECT COALESCE(
      MAX(CAST(SUBSTRING(id FROM 5) AS INTEGER)),
      0
    ) AS max_num
    FROM recent_activities
    WHERE id ~ '^ACT-[0-9]+$'`,
  )

  const nextNum = Number(result.rows[0].max_num) + 1
  return `ACT-${String(nextNum).padStart(2, '0')}`
}

export async function createRecentActivity({
  title,
  description,
  category,
  status = 'Info',
  eventType = null,
  subjectEmployeeId = null,
  actorEmployeeId = null,
  meta = null,
}) {
  const id = await generateNextActivityId()

  await query(
    `INSERT INTO recent_activities (
      id, title, description, category, activity_time, status,
      event_type, subject_employee_id, actor_employee_id, meta
    ) VALUES (
      $1, $2, $3, $4, NOW(), $5,
      $6, $7, $8, $9
    )`,
    [
      id,
      title,
      description,
      category,
      status,
      eventType,
      subjectEmployeeId,
      actorEmployeeId,
      meta ? JSON.stringify(meta) : null,
    ],
  )

  return id
}
