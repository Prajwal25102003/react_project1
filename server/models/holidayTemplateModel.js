/**
 * Builds holiday rows by fetching India's holiday calendar, then keeping only
 * the company holiday set from 2027 through 2030.
 */

const INDIA_HOLIDAY_ICAL_URL =
  'https://calendar.google.com/calendar/ical/en.indian%23holiday%40group.v.calendar.google.com/public/basic.ics'

const CACHE_TTL_MS = 60 * 60 * 1000
let icalCache = { fetchedAt: 0, text: '' }

/**
 * Company holiday list (from holiday sheet) + Sankranthi.
 * Dates come from the India calendar for the selected year — not hardcoded.
 * Applied for year >= 2027.
 */
const COMPANY_HOLIDAY_RULES = [
  {
    displayName: 'New Year Day',
    type: 'National Holiday',
    description: 'Public Holiday',
    match: [/new\s*year/i],
    exclude: [/eve/i],
  },
  {
    displayName: 'Sankranthi',
    type: 'Festival Holiday',
    description: 'Sankranthi Festival',
    match: [/makar\s*sankranti/i, /sankranti/i, /sankranthi/i],
    prefer: [/makar\s*sankranti/i, /sankranthi/i, /sankranti/i],
  },
  {
    displayName: 'Republic Day',
    type: 'National Holiday',
    description: 'Statutory Holiday',
    match: [/republic\s*day/i],
  },
  {
    displayName: 'Ugadi',
    type: 'Festival Holiday',
    description: 'Festival Holiday',
    match: [/^ugadi$/i, /\bugadi\b/i],
  },
  {
    displayName: 'May Day / Buddha Poornima',
    type: 'National Holiday',
    description: 'Statutory Holiday',
    match: [
      /buddha\s*purnima/i,
      /buddha\s*poornima/i,
      /vesak/i,
      /may\s*day/i,
      /labour\s*day/i,
      /labor\s*day/i,
    ],
    prefer: [/buddha/i],
    fixedFallback: { month: 5, day: 1 },
  },
  {
    displayName: 'Bakrid',
    type: 'Festival Holiday',
    description: 'Festival Holiday',
    match: [/bakrid/i, /eid[\s-]*ul[\s-]*adha/i, /eid[\s-]*al[\s-]*adha/i],
  },
  {
    displayName: 'Independence Day',
    type: 'National Holiday',
    description: 'Statutory Holiday',
    match: [/independence\s*day/i],
  },
  {
    displayName: 'Ganesha Chaturthi',
    type: 'Festival Holiday',
    description: 'Festival Holiday',
    match: [/ganesh/i, /ganesha/i],
  },
  {
    displayName: 'Gandhi Jayanthi',
    type: 'National Holiday',
    description: 'Statutory Holiday',
    match: [/gandhi/i],
  },
  {
    displayName: 'Ayudha Pooja / Mahanavami',
    type: 'Festival Holiday',
    description: 'Festival Holiday',
    match: [
      /ayudha/i,
      /maha\s*navami/i,
      /mahanavami/i,
      /dussehra/i,
      /vijayadashami/i,
    ],
    prefer: [/ayudha/i, /maha\s*navami/i, /mahanavami/i],
  },
  {
    displayName: 'Balipadyami (Deepawali)',
    type: 'Festival Holiday',
    description: 'Festival Holiday',
    match: [/bali\s*padyami/i, /balipadyami/i, /diwali/i, /deepavali/i],
    prefer: [/bali/i, /diwali/i, /deepavali/i],
    exclude: [/eve/i],
  },
  {
    displayName: 'Kannada Rajyotsava Day',
    type: 'National Holiday',
    description: 'Statutory Holiday',
    match: [/kannada\s*rajyotsava/i, /rajyotsava/i],
    fixedFallback: { month: 11, day: 1 },
  },
  {
    displayName: 'Christmas',
    type: 'National Holiday',
    description: 'Public Holiday',
    match: [/^christmas$/i, /\bchristmas\b/i],
    exclude: [/eve/i],
  },
]

function unfoldIcal(text) {
  return String(text || '').replace(/\r?\n[ \t]/g, '')
}

function parseIcalDate(value) {
  if (!/^\d{8}$/.test(value || '')) return null
  return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`
}

function padDate(year, month, day) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function parseIcalEvents(text) {
  const unfolded = unfoldIcal(text)
  const blocks = unfolded.split('BEGIN:VEVENT').slice(1)
  const events = []

  for (const block of blocks) {
    const startRaw =
      block.match(/DTSTART;VALUE=DATE:(\d{8})/)?.[1] ||
      block.match(/DTSTART:(\d{8})/)?.[1]
    const date = parseIcalDate(startRaw)
    if (!date) continue

    const name = (block.match(/\nSUMMARY:([^\n]*)/)?.[1] || '')
      .replace(/\\,/g, ',')
      .replace(/\\n/g, ' ')
      .replace(/\s*\(tentative\)\s*$/i, '')
      .trim()
    if (!name) continue

    const description = (block.match(/\nDESCRIPTION:([^\n]*)/)?.[1] || '')
      .replace(/\\,/g, ',')
      .replace(/\\n/g, ' ')
      .trim()

    events.push({ date, name, description })
  }

  return events
}

async function fetchIndiaHolidayCalendar() {
  const now = Date.now()
  if (icalCache.text && now - icalCache.fetchedAt < CACHE_TTL_MS) {
    return icalCache.text
  }

  const response = await fetch(INDIA_HOLIDAY_ICAL_URL, {
    headers: { Accept: 'text/calendar' },
  })

  if (!response.ok) {
    throw new Error(
      `Failed to fetch India holiday calendar (${response.status})`,
    )
  }

  const text = await response.text()
  icalCache = { fetchedAt: now, text }
  return text
}

function eventMatchesRule(event, rule) {
  const name = event.name || ''
  if (rule.exclude?.some((pattern) => pattern.test(name))) return false
  return rule.match.some((pattern) => pattern.test(name))
}

function scoreEvent(event, rule) {
  const name = event.name || ''
  let score = 1
  if (rule.prefer?.some((pattern) => pattern.test(name))) score += 10
  if (String(event.description || '').toLowerCase().startsWith('public holiday')) {
    score += 2
  }
  return score
}

function pickEventForRule(events, rule) {
  const matches = events.filter((event) => eventMatchesRule(event, rule))
  if (matches.length === 0) return null
  matches.sort((a, b) => scoreEvent(b, rule) - scoreEvent(a, rule))
  return matches[0]
}

function buildCompanyHolidaysForYear(year, yearEvents) {
  const holidays = []
  const usedDates = new Set()

  for (const rule of COMPANY_HOLIDAY_RULES) {
    const matched = pickEventForRule(yearEvents, rule)
    let date = matched?.date || null

    if (!date && rule.fixedFallback) {
      date = padDate(year, rule.fixedFallback.month, rule.fixedFallback.day)
    }

    if (!date) continue

    // Avoid duplicate date rows when two rules collide.
    if (usedDates.has(date) && matched) {
      // Keep first company holiday on that date.
      continue
    }

    usedDates.add(date)
    holidays.push({
      name: rule.displayName,
      date,
      type: rule.type,
      description: rule.description,
    })
  }

  holidays.sort(
    (a, b) => a.date.localeCompare(b.date) || a.name.localeCompare(b.name),
  )
  return holidays
}

/**
 * Fetch holidays for the selected year from the India holiday calendar.
 * From 2027 onward, only the company holiday list (+ Sankranthi) is returned.
 * @param {number} year
 * @returns {Promise<Array<{name:string,date:string,type:string,description:string}>>}
 */
export async function getHolidayTemplateForYear(year) {
  const text = await fetchIndiaHolidayCalendar()
  const events = parseIcalEvents(text)
  const yearPrefix = String(year)
  const yearEvents = events.filter((event) => event.date.startsWith(yearPrefix))

  if (year >= 2027) {
    return buildCompanyHolidaysForYear(year, yearEvents)
  }

  // Pre-2027: return full calendar year (legacy behaviour).
  const byDateName = new Map()
  for (const event of yearEvents) {
    const key = `${event.date}|${event.name.toLowerCase()}`
    const existing = byDateName.get(key)
    const isPublic = String(event.description || '')
      .toLowerCase()
      .startsWith('public holiday')
    if (existing && !isPublic) continue

    byDateName.set(key, {
      name: event.name,
      date: event.date,
      type: 'Festival Holiday',
      description: 'Public Holiday',
    })
  }

  const holidays = [...byDateName.values()]
  holidays.sort(
    (a, b) => a.date.localeCompare(b.date) || a.name.localeCompare(b.name),
  )
  return holidays
}
