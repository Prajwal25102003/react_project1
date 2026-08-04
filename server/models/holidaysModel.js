import { query } from '../config/db.js'
import pool from '../config/db.js'
import { findHolidayCalendarByYear } from './holidayCalendarsModel.js'

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
      WHERE calendar_year = $1
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

/** Distinct holiday dates (YYYY-MM-DD) within an inclusive range. */
export async function findHolidayDatesBetween(startDate, endDate) {
  if (!startDate || !endDate) return []
  const result = await query(
    `SELECT DISTINCT TO_CHAR(holiday_date, 'YYYY-MM-DD') AS date
    FROM holidays
    WHERE holiday_date >= $1::date
      AND holiday_date <= $2::date
    ORDER BY date ASC`,
    [startDate, endDate],
  )
  return result.rows.map((row) => row.date)
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

function calendarYearFromDate(date) {
  return Number(String(date).slice(0, 4))
}

export async function createHoliday(holiday) {
  const calendarYear = calendarYearFromDate(holiday.date)
  const result = await query(
    `INSERT INTO holidays (id, name, holiday_date, holiday_type, description, calendar_year)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id`,
    [
      holiday.id,
      holiday.name,
      holiday.date,
      holiday.type,
      holiday.description,
      calendarYear,
    ],
  )
  return findHolidayById(result.rows[0].id)
}

export async function updateHoliday(id, holiday) {
  const calendarYear = calendarYearFromDate(holiday.date)
  const result = await query(
    `UPDATE holidays SET
      name = $2,
      holiday_date = $3,
      holiday_type = $4,
      description = $5,
      calendar_year = $6,
      updated_at = NOW()
    WHERE id = $1
    RETURNING id`,
    [id, holiday.name, holiday.date, holiday.type, holiday.description, calendarYear],
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

/**
 * Release the year calendar (FK parent) and replace its holiday rows atomically.
 */
export async function releaseCalendarAndReplaceHolidays(year, holidays, releasedBy) {
  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    const existing = await client.query(
      `SELECT status FROM holiday_calendars WHERE year = $1 FOR UPDATE`,
      [year],
    )
    if (existing.rows[0]?.status === 'released') {
      const error = new Error(`${year} holiday calendar is already released`)
      error.code = 'ALREADY_RELEASED'
      error.status = 409
      throw error
    }

    const calendarResult = await client.query(
      `INSERT INTO holiday_calendars (year, status, released_at, released_by)
      VALUES ($1, 'released', NOW(), $2)
      ON CONFLICT (year) DO UPDATE SET
        status = 'released',
        released_at = NOW(),
        released_by = EXCLUDED.released_by,
        updated_at = NOW()
      WHERE holiday_calendars.status IS DISTINCT FROM 'released'
      RETURNING year`,
      [year, releasedBy || null],
    )

    if (calendarResult.rowCount === 0) {
      const error = new Error(`${year} holiday calendar is already released`)
      error.code = 'ALREADY_RELEASED'
      error.status = 409
      throw error
    }

    await client.query(
      `DELETE FROM holidays
      WHERE calendar_year = $1`,
      [year],
    )

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
        `INSERT INTO holidays (id, name, holiday_date, holiday_type, description, calendar_year)
        VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          id,
          holiday.name,
          holiday.date,
          holiday.type,
          holiday.description || '',
          year,
        ],
      )
    }

    await client.query('COMMIT')

    const calendar = await findHolidayCalendarByYear(year)
    const saved = await findAllHolidays({ year })
    return { calendar, holidays: saved }
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}
