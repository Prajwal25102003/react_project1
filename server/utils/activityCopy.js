/**
 * Shared helpers for notification / recent-activity titles and descriptions.
 * Keep copy concise (about 2 lines) and action-oriented.
 */

const MONTHS_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]

function pad2(n) {
  return String(n).padStart(2, '0')
}

function firstName(name) {
  return String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)[0] || ''
}

/** Parse YYYY-MM-DD or Date-ish values into local calendar parts. */
export function parseCalendarDate(value) {
  if (!value) return null
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return {
      year: value.getFullYear(),
      monthIndex: value.getMonth(),
      day: value.getDate(),
    }
  }

  const text = String(value).trim()
  const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (iso) {
    return {
      year: Number(iso[1]),
      monthIndex: Number(iso[2]) - 1,
      day: Number(iso[3]),
    }
  }

  const date = new Date(text)
  if (Number.isNaN(date.getTime())) return null
  return {
    year: date.getFullYear(),
    monthIndex: date.getMonth(),
    day: date.getDate(),
  }
}

/** 24 Jul 2026 */
export function formatDisplayDate(value) {
  const parts = parseCalendarDate(value)
  if (!parts) return String(value || '').trim()
  return `${pad2(parts.day)} ${MONTHS_SHORT[parts.monthIndex]} ${parts.year}`
}

/** 24 Jul 2026 - 28 Jul 2026 (or a single date) */
export function formatDisplayRange(start, end) {
  const startText = formatDisplayDate(start)
  if (!end || String(start) === String(end)) return startText
  const endText = formatDisplayDate(end)
  if (!startText) return endText
  if (!endText) return startText
  return `${startText} - ${endText}`
}

/**
 * Normalize a leave range that may already be ISO ("2026-07-24 to 2026-07-28")
 * or display-formatted.
 */
export function formatLeaveRangeText(range) {
  const text = String(range || '').trim()
  if (!text) return ''

  const match = text.match(
    /^(\d{4}-\d{2}-\d{2})(?:\s*(?:to|-)\s*(\d{4}-\d{2}-\d{2}))?$/i,
  )
  if (match) {
    return formatDisplayRange(match[1], match[2] || match[1])
  }

  return text
}

/** 10:45 AM */
export function formatClockTime(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return ''
  let hours = date.getHours()
  const minutes = pad2(date.getMinutes())
  const period = hours >= 12 ? 'PM' : 'AM'
  hours = hours % 12
  if (hours === 0) hours = 12
  return `${pad2(hours)}:${minutes} ${period}`
}

/**
 * Notification timestamp:
 * Today • 10:45 AM | Yesterday • 03:15 PM | 24 Jul 2026 • 09:30 AM
 */
export function formatActivityTimestamp(isoDate) {
  const date = new Date(isoDate)
  if (Number.isNaN(date.getTime())) return '—'

  const now = new Date()
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  )
  const startOfThatDay = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  )
  const dayDiff = Math.round(
    (startOfToday.getTime() - startOfThatDay.getTime()) / 86400000,
  )
  const clock = formatClockTime(date)

  if (dayDiff === 0) return `Today • ${clock}`
  if (dayDiff === 1) return `Yesterday • ${clock}`
  if (dayDiff < 0) {
    const futureDays = Math.abs(dayDiff)
    if (futureDays <= 1) return 'Upcoming'
    return `In ${futureDays} days`
  }

  return `${formatDisplayDate(date)} • ${clock}`
}

/** Optional short relative phrase for very recent events. */
export function formatRelativePhrase(isoDate) {
  const date = new Date(isoDate)
  if (Number.isNaN(date.getTime())) return ''

  const diffMs = Date.now() - date.getTime()
  if (diffMs < 0) return ''

  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 1) return 'Just now'
  if (minutes === 1) return '1 minute ago'
  if (minutes < 60) return `${minutes} minutes ago`

  const hours = Math.floor(minutes / 60)
  if (hours === 1) return '1 hour ago'
  if (hours < 24) return `${hours} hours ago`

  const days = Math.floor(hours / 24)
  if (days === 1) return 'Yesterday'
  return ''
}

/**
 * Actor label for "updated by …" style copy.
 * Examples: HR Admin Rahul, Admin Priya, Team Lead Sarah
 */
export function formatActorLabel({ role, name } = {}) {
  const person = firstName(name)
  const key = String(role || '').toLowerCase()

  if (key === 'hr') return person ? `HR Admin ${person}` : 'HR Admin'
  if (key === 'admin') return person ? `Admin ${person}` : 'Admin'
  if (key === 'team_lead' || key === 'teamlead') {
    return person ? `Team Lead ${person}` : 'Team Lead'
  }
  if (key === 'employee') return person || 'Employee'
  if (person) return person
  return 'the system'
}

/**
 * Approver label for leave decisions.
 * Examples: HR Manager, HR Manager Rahul, Dept Head, Team Lead Sarah
 */
export function formatApproverLabel({ role, name, stepLabel } = {}) {
  const person = firstName(name)
  const key = String(role || '').toLowerCase()
  const step = String(stepLabel || '').trim()

  if (key === 'hr' || step.toLowerCase() === 'hr') {
    return person ? `HR Manager ${person}` : 'HR Manager'
  }
  if (key === 'admin' || step.toLowerCase() === 'admin') {
    return person ? `Admin ${person}` : 'Admin'
  }
  if (
    key === 'team_lead' ||
    key === 'teamlead' ||
    step.toLowerCase().includes('dept') ||
    step.toLowerCase().includes('head')
  ) {
    return person ? `Team Lead ${person}` : step || 'Team Lead'
  }
  if (person) return person
  if (step) return step
  return 'reviewer'
}

export function actorFromUser(user) {
  if (!user) return { role: null, name: null, employeeId: null }
  return {
    role: user.role || null,
    name: user.name || user.email || null,
    employeeId: user.employeeId || null,
  }
}
