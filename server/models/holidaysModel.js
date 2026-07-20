import { query } from '../config/db.js'
import pool from '../config/db.js'

const HOLIDAY_SELECT = `
  id,
  name,
  TO_CHAR(holiday_date, 'YYYY-MM-DD') AS date,
  holiday_type AS type,
  description,
  TO_CHAR(created_at, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "createdAt",
  TO_CHAR(updated_at, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "updatedAt"
`

export async function findAllHolidays({ year } = {}) {
  if (year) {
    const result = await query(
      `SELECT ${HOLIDAY_SELECT}
      FROM holidays
      WHERE EXTRACT(YEAR FROM holiday_date) = $1
      ORDER BY holiday_date ASC, name ASC`,
      [year],
    )
    return result.rows
  }

  const result = await query(
    `SELECT ${HOLIDAY_SELECT}
    FROM holidays
    ORDER BY holiday_date ASC, name ASC`,
  )
  return result.rows
}

export async function findHolidayById(id) {
  const result = await query(
    `SELECT ${HOLIDAY_SELECT}
    FROM holidays
    WHERE id = $1`,
    [id],
  )
  return result.rows[0] || null
}

export async function generateNextHolidayId() {
  const result = await query(
    `SELECT COALESCE(
      MAX(CAST(SUBSTRING(id FROM 5) AS INTEGER)),
      1000
    ) AS max_num
    FROM holidays
    WHERE id ~ '^HOL-[0-9]+$'`,
  )

  const nextNum = Number(result.rows[0].max_num) + 1
  return `HOL-${nextNum}`
}

export async function createHoliday(holiday) {
  const result = await query(
    `INSERT INTO holidays (id, name, holiday_date, holiday_type, description)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id`,
    [
      holiday.id,
      holiday.name,
      holiday.date,
      holiday.type,
      holiday.description,
    ],
  )
  return findHolidayById(result.rows[0].id)
}

export async function updateHoliday(id, holiday) {
  const result = await query(
    `UPDATE holidays SET
      name = $2,
      holiday_date = $3,
      holiday_type = $4,
      description = $5,
      updated_at = NOW()
    WHERE id = $1
    RETURNING id`,
    [id, holiday.name, holiday.date, holiday.type, holiday.description],
  )

  if (result.rowCount === 0) return null
  return findHolidayById(id)
}

export async function deleteHolidayById(id) {
  const result = await query(
    `DELETE FROM holidays WHERE id = $1 RETURNING id`,
    [id],
  )
  return result.rowCount > 0
}

export async function deleteHolidaysByYear(year) {
  const result = await query(
    `DELETE FROM holidays
    WHERE EXTRACT(YEAR FROM holiday_date) = $1`,
    [year],
  )
  return result.rowCount
}

export async function replaceHolidaysForYear(year, holidays) {
  const client = await pool.connect()

  try {
    await client.query('BEGIN')
    await client.query(
      `DELETE FROM holidays
      WHERE EXTRACT(YEAR FROM holiday_date) = $1`,
      [year],
    )

    const created = []
    for (const holiday of holidays) {
      const idResult = await client.query(
        `SELECT COALESCE(
          MAX(CAST(SUBSTRING(id FROM 5) AS INTEGER)),
          1000
        ) AS max_num
        FROM holidays
        WHERE id ~ '^HOL-[0-9]+$'`,
      )
      const nextNum = Number(idResult.rows[0].max_num) + 1
      const id = `HOL-${nextNum}`

      await client.query(
        `INSERT INTO holidays (id, name, holiday_date, holiday_type, description)
        VALUES ($1, $2, $3, $4, $5)`,
        [id, holiday.name, holiday.date, holiday.type, holiday.description || ''],
      )
      created.push(id)
    }

    await client.query('COMMIT')
    return findAllHolidays({ year })
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}
