import { query } from '../config/db.js'

const CALENDAR_SELECT = `
  year,
  status,
  TO_CHAR(released_at, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "releasedAt",
  released_by AS "releasedBy",
  TO_CHAR(created_at, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "createdAt",
  TO_CHAR(updated_at, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "updatedAt"
`

export async function findAllHolidayCalendars({ minYear } = {}) {
  if (minYear) {
    const result = await query(
      `SELECT
        hc.year,
        hc.status,
        TO_CHAR(hc.released_at, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "releasedAt",
        hc.released_by AS "releasedBy",
        TO_CHAR(hc.created_at, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "createdAt",
        TO_CHAR(hc.updated_at, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "updatedAt",
        (
          SELECT COUNT(*)::INTEGER
          FROM holidays h
          WHERE EXTRACT(YEAR FROM h.holiday_date) = hc.year
        ) AS "holidayCount"
      FROM holiday_calendars hc
      WHERE hc.year >= $1
      ORDER BY hc.year ASC`,
      [minYear],
    )
    return result.rows
  }

  const result = await query(
    `SELECT
      hc.year,
      hc.status,
      TO_CHAR(hc.released_at, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "releasedAt",
      hc.released_by AS "releasedBy",
      TO_CHAR(hc.created_at, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "createdAt",
      TO_CHAR(hc.updated_at, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "updatedAt",
      (
        SELECT COUNT(*)::INTEGER
        FROM holidays h
        WHERE EXTRACT(YEAR FROM h.holiday_date) = hc.year
      ) AS "holidayCount"
    FROM holiday_calendars hc
    ORDER BY hc.year ASC`,
  )
  return result.rows
}

export async function findHolidayCalendarByYear(year) {
  const result = await query(
    `SELECT ${CALENDAR_SELECT}
    FROM holiday_calendars
    WHERE year = $1`,
    [year],
  )
  return result.rows[0] || null
}

export async function upsertHolidayCalendarDraft(year) {
  const existing = await findHolidayCalendarByYear(year)
  if (existing?.status === 'released') {
    return existing
  }

  const result = await query(
    `INSERT INTO holiday_calendars (year, status)
    VALUES ($1, 'draft')
    ON CONFLICT (year) DO UPDATE SET updated_at = NOW()
    WHERE holiday_calendars.status IS DISTINCT FROM 'released'
    RETURNING year`,
    [year],
  )

  if (result.rowCount === 0) {
    return findHolidayCalendarByYear(year)
  }

  return findHolidayCalendarByYear(result.rows[0].year)
}

export async function releaseHolidayCalendar(year, releasedBy) {
  const existing = await findHolidayCalendarByYear(year)
  if (existing?.status === 'released') {
    const error = new Error(`${year} holiday calendar is already released`)
    error.code = 'ALREADY_RELEASED'
    error.status = 409
    throw error
  }

  const result = await query(
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

  if (result.rowCount === 0) {
    const error = new Error(`${year} holiday calendar is already released`)
    error.code = 'ALREADY_RELEASED'
    error.status = 409
    throw error
  }

  return findHolidayCalendarByYear(result.rows[0].year)
}

export async function isHolidayYearReleased(year) {
  const result = await query(
    `SELECT status FROM holiday_calendars WHERE year = $1`,
    [year],
  )
  return result.rows[0]?.status === 'released'
}
