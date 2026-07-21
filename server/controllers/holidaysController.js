import {
  findAllHolidayCalendars,
  findHolidayCalendarByYear,
  isHolidayYearReleased,
  releaseHolidayCalendar,
} from '../models/holidayCalendarsModel.js'
import { getHolidayTemplateForYear } from '../models/holidayTemplateModel.js'
import {
  createHoliday,
  deleteHolidayById,
  findAllHolidays,
  findHolidayById,
  generateNextHolidayId,
  replaceHolidaysForYear,
  updateHoliday,
} from '../models/holidaysModel.js'
import { createRecentActivity } from '../models/recentActivitiesModel.js'
import { formatDbError } from '../utils/formatDbError.js'
import { uniqueConstraintMessage } from '../utils/pgErrors.js'

const HOLIDAY_TYPES = new Set([
  'National Holiday',
  'Company Holiday',
  'Optional Holiday',
  'Company Event',
  'Festival Holiday',
])

const HOLIDAY_RELEASE_MAX_YEAR = 2030

const HOLIDAY_UNIQUE_MATCHERS = [
  {
    includes: 'holiday_date',
    message: 'A holiday with this name already exists on that date',
  },
  {
    includes: 'idx_holidays_date_name',
    message: 'A holiday with this name already exists on that date',
  },
]

function parseHolidayPayload(body) {
  const errors = []
  const name = String(body?.name ?? '').trim()
  const date = String(body?.date ?? '').trim()
  const type = String(body?.type ?? '').trim()
  const description = String(body?.description ?? '').trim()

  if (!name) errors.push('Holiday name is required')
  else if (name.length < 2) errors.push('Holiday name must be at least 2 characters')

  if (!date) errors.push('Date is required')
  else if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    errors.push('Date must be YYYY-MM-DD')
  }

  if (!type) errors.push('Holiday type is required')
  else if (!HOLIDAY_TYPES.has(type)) {
    errors.push('Select a valid holiday type')
  }

  return {
    errors,
    holiday: { name, date, type, description },
  }
}

function parseYear(value) {
  const year = Number(value)
  if (!Number.isFinite(year) || year < 2000 || year > 2100) return null
  return Math.floor(year)
}

function parseHolidayList(body) {
  const list = Array.isArray(body?.holidays) ? body.holidays : null
  if (!list) {
    return { errors: ['holidays array is required'], holidays: [] }
  }

  const errors = []
  const holidays = []

  list.forEach((item, index) => {
    const { errors: rowErrors, holiday } = parseHolidayPayload(item)
    if (rowErrors.length > 0) {
      errors.push(`Row ${index + 1}: ${rowErrors.join('; ')}`)
      return
    }
    holidays.push(holiday)
  })

  if (holidays.length === 0 && errors.length === 0) {
    errors.push('At least one holiday is required')
  }

  return { errors, holidays }
}

async function getCalendarForYear(year) {
  let calendar = await findHolidayCalendarByYear(year)
  if (!calendar) {
    calendar = { year, status: 'draft', releasedAt: null, releasedBy: null }
  }
  return calendar
}

export async function getHolidayCalendars(req, res) {
  try {
    const currentYear = new Date().getFullYear()
    const calendars = await findAllHolidayCalendars({ minYear: currentYear })
    res.json({ calendars })
  } catch (error) {
    res.status(500).json({ message: formatDbError(error) })
  }
}

export async function getHolidayCalendarTemplate(req, res) {
  try {
    const year = parseYear(req.params.year)
    if (!year) {
      return res.status(400).json({ message: 'Invalid year' })
    }

    const currentYear = new Date().getFullYear()
    if (year < currentYear) {
      return res.status(400).json({
        message: 'Previous years are not available for release',
      })
    }
    if (year > HOLIDAY_RELEASE_MAX_YEAR) {
      return res.status(400).json({
        message: `Holiday calendars can only be released through ${HOLIDAY_RELEASE_MAX_YEAR}`,
      })
    }

    // Always build from the calendar for the requested year — never reuse
    // another year's saved holiday listing.
    const calendar = await getCalendarForYear(year)
    if (calendar.status === 'released') {
      return res.status(409).json({
        message: `${year} holiday calendar is already released and cannot be released again`,
        calendar,
      })
    }

    const template = await getHolidayTemplateForYear(year)
    const existingCount = (await findAllHolidays({ year })).length

    res.json({
      calendar,
      holidays: template,
      source: 'template',
      year,
      existingCount,
    })
  } catch (error) {
    res.status(500).json({ message: formatDbError(error) })
  }
}

export async function releaseHolidayCalendarHandler(req, res) {
  try {
    const year = parseYear(req.params.year)
    if (!year) {
      return res.status(400).json({ message: 'Invalid year' })
    }

    const currentYear = new Date().getFullYear()
    if (year < currentYear) {
      return res.status(400).json({
        message: 'Previous years cannot be released',
      })
    }
    if (year > HOLIDAY_RELEASE_MAX_YEAR) {
      return res.status(400).json({
        message: `Holiday calendars can only be released through ${HOLIDAY_RELEASE_MAX_YEAR}`,
      })
    }

    if (await isHolidayYearReleased(year)) {
      return res.status(409).json({
        message: `${year} holiday calendar is already released and cannot be released again`,
      })
    }

    const { errors, holidays } = parseHolidayList(req.body)
    if (errors.length > 0) {
      return res.status(400).json({ message: errors.join('; ') })
    }

    const yearMismatch = holidays.find((item) => Number(item.date.slice(0, 4)) !== year)
    if (yearMismatch) {
      return res.status(400).json({
        message: `All holiday dates must fall in ${year}`,
      })
    }

    const saved = await replaceHolidaysForYear(year, holidays)
    const calendar = await releaseHolidayCalendar(year, req.user?.id)

    await createRecentActivity({
      title: 'Holiday calendar released',
      description: `Admin released the ${year} holiday calendar (${saved.length} holidays).`,
      category: 'Holidays',
      status: 'Completed',
    })

    res.json({ calendar, holidays: saved })
  } catch (error) {
    if (error.code === 'ALREADY_RELEASED') {
      return res.status(409).json({ message: error.message })
    }
    const uniqueMessage = uniqueConstraintMessage(error, HOLIDAY_UNIQUE_MATCHERS)
    if (uniqueMessage) {
      return res.status(409).json({ message: uniqueMessage })
    }
    res.status(500).json({ message: formatDbError(error) })
  }
}

export async function getHolidays(req, res) {
  try {
    const year = parseYear(req.query.year)
    const currentYear = new Date().getFullYear()

    if (year && year < currentYear) {
      return res.json({
        holidays: [],
        calendar: { year, status: 'draft', releasedAt: null, releasedBy: null },
        message: 'Previous years are not shown on the holiday calendar.',
      })
    }

    const calendar = year ? await getCalendarForYear(year) : null

    // Holiday list is only visible after the year calendar is released.
    if (year && calendar?.status !== 'released') {
      return res.json({
        holidays: [],
        calendar: { ...calendar, status: calendar?.status || 'draft' },
      })
    }

    const holidays = await findAllHolidays(year ? { year } : {})
    // Without a year filter, only include holidays from released calendars.
    if (!year) {
      const calendars = await findAllHolidayCalendars({ minYear: currentYear })
      const releasedYears = new Set(
        calendars
          .filter((item) => item.status === 'released')
          .map((item) => Number(item.year)),
      )
      return res.json({
        holidays: holidays.filter((item) =>
          releasedYears.has(Number(String(item.date).slice(0, 4))),
        ),
        calendar: null,
      })
    }

    res.json({ holidays, calendar })
  } catch (error) {
    res.status(500).json({ message: formatDbError(error) })
  }
}

export async function getHolidayById(req, res) {
  try {
    const holiday = await findHolidayById(req.params.id)
    if (!holiday) {
      return res.status(404).json({ message: 'Holiday not found' })
    }

    const year = Number(holiday.date.slice(0, 4))
    const released = await isHolidayYearReleased(year)
    if (!released) {
      return res.status(403).json({
        message: 'Holiday calendar for this year is not released',
      })
    }

    res.json({ holiday })
  } catch (error) {
    res.status(500).json({ message: formatDbError(error) })
  }
}

export async function createHolidayHandler(req, res) {
  try {
    const { errors, holiday } = parseHolidayPayload(req.body)
    if (errors.length > 0) {
      return res.status(400).json({ message: errors.join('; ') })
    }

    const year = Number(holiday.date.slice(0, 4))
    if (!(await isHolidayYearReleased(year))) {
      return res.status(403).json({
        message: `Release the ${year} holiday calendar before adding holidays to the list`,
      })
    }

    const id = await generateNextHolidayId()
    const created = await createHoliday({ ...holiday, id })

    await createRecentActivity({
      title: 'Holiday added',
      description: `Admin added "${created.name}" on ${created.date} (${created.type}).`,
      category: 'Holidays',
      status: 'Added',
    })

    res.status(201).json({ holiday: created })
  } catch (error) {
    const uniqueMessage = uniqueConstraintMessage(error, HOLIDAY_UNIQUE_MATCHERS)
    if (uniqueMessage) {
      return res.status(409).json({ message: uniqueMessage })
    }
    res.status(500).json({ message: formatDbError(error) })
  }
}

export async function updateHolidayHandler(req, res) {
  try {
    const { errors, holiday } = parseHolidayPayload(req.body)
    if (errors.length > 0) {
      return res.status(400).json({ message: errors.join('; ') })
    }

    const existing = await findHolidayById(req.params.id)
    if (!existing) {
      return res.status(404).json({ message: 'Holiday not found' })
    }

    const existingYear = Number(existing.date.slice(0, 4))
    const nextYear = Number(holiday.date.slice(0, 4))
    if (!(await isHolidayYearReleased(existingYear))) {
      return res.status(403).json({
        message: `Holiday calendar for ${existingYear} is not released`,
      })
    }
    if (nextYear !== existingYear && !(await isHolidayYearReleased(nextYear))) {
      return res.status(403).json({
        message: `Release the ${nextYear} holiday calendar before moving holidays to that year`,
      })
    }

    const updated = await updateHoliday(req.params.id, holiday)
    if (!updated) {
      return res.status(404).json({ message: 'Holiday not found' })
    }

    await createRecentActivity({
      title: 'Holiday updated',
      description: `Admin updated "${updated.name}" — now on ${updated.date} (${updated.type}).`,
      category: 'Holidays',
      status: 'Updated',
    })

    res.json({ holiday: updated })
  } catch (error) {
    const uniqueMessage = uniqueConstraintMessage(error, HOLIDAY_UNIQUE_MATCHERS)
    if (uniqueMessage) {
      return res.status(409).json({ message: uniqueMessage })
    }
    res.status(500).json({ message: formatDbError(error) })
  }
}

export async function deleteHolidayHandler(req, res) {
  try {
    const existing = await findHolidayById(req.params.id)
    if (!existing) {
      return res.status(404).json({ message: 'Holiday not found' })
    }

    const year = Number(existing.date.slice(0, 4))
    if (!(await isHolidayYearReleased(year))) {
      return res.status(403).json({
        message: `Holiday calendar for ${year} is not released`,
      })
    }

    await deleteHolidayById(req.params.id)

    await createRecentActivity({
      title: 'Holiday removed',
      description: `Admin deleted "${existing.name}" on ${existing.date}.`,
      category: 'Holidays',
      status: 'Removed',
    })

    res.json({ message: 'Holiday deleted' })
  } catch (error) {
    res.status(500).json({ message: formatDbError(error) })
  }
}
