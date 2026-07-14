import { useCallback, useState } from 'react'
import {
  CALENDAR_EVENT_COLORS,
  calendarEventLevels,
  calendarHeaderToolbar,
  getCalendarInitialDate,
  getInitialCalendarEvents,
  getTodayDateTimeString,
} from '../models/calendarModel.js'

const EMPTY_FORM = {
  title: '',
  start: '',
  end: '',
  level: '',
}

export function useCalendar() {
  const [events, setEvents] = useState(getInitialCalendarEvents)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState('add')
  const [selectedEventId, setSelectedEventId] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)

  const resetForm = useCallback(() => {
    setForm(EMPTY_FORM)
    setSelectedEventId(null)
  }, [])

  const closeModal = useCallback(() => {
    setModalOpen(false)
    setModalMode('add')
    resetForm()
  }, [resetForm])

  const openAddModal = useCallback((start = '', end = '') => {
    setModalMode('add')
    setSelectedEventId(null)
    setForm({
      title: '',
      start: start || getTodayDateTimeString(),
      end: end || start || getTodayDateTimeString(),
      level: '',
    })
    setModalOpen(true)
  }, [])

  const openEditModal = useCallback((event) => {
    setModalMode('edit')
    setSelectedEventId(String(event.id))
    setForm({
      title: event.title,
      start: event.startStr?.slice(0, 10) || '',
      end: event.endStr?.slice(0, 10) || '',
      level: event.extendedProps?.calendar || '',
    })
    setModalOpen(true)
  }, [])

  const setFormField = useCallback((field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
  }, [])

  const handleAddEvent = useCallback(() => {
    setEvents((current) => [
      ...current,
      {
        id: String(Date.now()),
        title: form.title,
        start: form.start,
        end: form.end || undefined,
        allDay: true,
        extendedProps: { calendar: form.level },
      },
    ])
    closeModal()
  }, [closeModal, form.end, form.level, form.start, form.title])

  const handleUpdateEvent = useCallback(() => {
    if (!selectedEventId) {
      return
    }

    setEvents((current) =>
      current.map((event) =>
        String(event.id) === selectedEventId
          ? {
              ...event,
              title: form.title,
              start: form.start,
              end: form.end || undefined,
              extendedProps: { calendar: form.level },
            }
          : event,
      ),
    )
    closeModal()
  }, [closeModal, form.end, form.level, form.start, form.title, selectedEventId])

  const handleSelect = useCallback(
    (info) => {
      openAddModal(info.startStr, info.endStr || info.startStr)
    },
    [openAddModal],
  )

  const handleDateClick = useCallback(() => {
    openAddModal()
  }, [openAddModal])

  const handleEventClick = useCallback(
    (info) => {
      const { event } = info

      if (event.url) {
        window.open(event.url)
        info.jsEvent.preventDefault()
        return
      }

      openEditModal(event)
    },
    [openEditModal],
  )

  const eventClassNames = useCallback(({ event: calendarEvent }) => {
    const colorValue =
      CALENDAR_EVENT_COLORS[calendarEvent.extendedProps?.calendar]
    return ['event-fc-color', `fc-bg-${colorValue}`]
  }, [])

  return {
    events,
    modalOpen,
    modalMode,
    form,
    eventLevels: calendarEventLevels,
    headerToolbar: calendarHeaderToolbar,
    initialDate: getCalendarInitialDate(),
    setFormField,
    closeModal,
    handleAddEvent,
    handleUpdateEvent,
    handleSelect,
    handleDateClick,
    handleEventClick,
    eventClassNames,
    openAddModal,
  }
}
