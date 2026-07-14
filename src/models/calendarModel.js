export const CALENDAR_EVENT_COLORS = {
  Danger: 'danger',
  Success: 'success',
  Primary: 'primary',
  Warning: 'warning',
}

function getDynamicMonth() {
  const month = new Date().getMonth() + 1
  return month < 10 ? `0${month}` : `${month}`
}

function getCurrentYear() {
  return new Date().getFullYear()
}

export function getCalendarInitialDate() {
  return `${getCurrentYear()}-${getDynamicMonth()}-07`
}

export const calendarHeaderToolbar = {
  left: 'prev,next addEventButton',
  center: 'title',
  right: 'dayGridMonth,timeGridWeek,timeGridDay',
}

export function getInitialCalendarEvents() {
  const year = getCurrentYear()
  const month = getDynamicMonth()

  return [
    {
      id: '1',
      title: 'Event Conf.',
      start: `${year}-${month}-01`,
      extendedProps: { calendar: 'Danger' },
    },
    {
      id: '2',
      title: 'Seminar #4',
      start: `${year}-${month}-07`,
      end: `${year}-${month}-10`,
      extendedProps: { calendar: 'Success' },
    },
    {
      groupId: '999',
      id: '3',
      title: 'Meeting #5',
      start: `${year}-${month}-09T16:00:00`,
      extendedProps: { calendar: 'Primary' },
    },
    {
      groupId: '999',
      id: '4',
      title: 'Submission #1',
      start: `${year}-${month}-16T16:00:00`,
      extendedProps: { calendar: 'Warning' },
    },
    {
      id: '5',
      title: 'Seminar #6',
      start: `${year}-${month}-11`,
      end: `${year}-${month}-13`,
      extendedProps: { calendar: 'Danger' },
    },
    {
      id: '6',
      title: 'Meeting 3',
      start: `${year}-${month}-12T10:30:00`,
      end: `${year}-${month}-12T12:30:00`,
      extendedProps: { calendar: 'Success' },
    },
    {
      id: '7',
      title: 'Meetup #',
      start: `${year}-${month}-12T12:00:00`,
      extendedProps: { calendar: 'Primary' },
    },
    {
      id: '8',
      title: 'Submission',
      start: `${year}-${month}-12T14:30:00`,
      extendedProps: { calendar: 'Warning' },
    },
    {
      id: '9',
      title: 'Attend event',
      start: `${year}-${month}-13T07:00:00`,
      extendedProps: { calendar: 'Success' },
    },
    {
      id: '10',
      title: 'Project submission #2',
      start: `${year}-${month}-28`,
      extendedProps: { calendar: 'Primary' },
    },
  ]
}

export function getTodayDateTimeString() {
  const currentDate = new Date()
  const dd = String(currentDate.getDate()).padStart(2, '0')
  const mm = String(currentDate.getMonth() + 1).padStart(2, '0')
  const yyyy = currentDate.getFullYear()
  return `${yyyy}-${mm}-${dd}T00:00:00`
}

export const calendarEventLevels = Object.keys(CALENDAR_EVENT_COLORS)
