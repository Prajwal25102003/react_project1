import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import listPlugin from '@fullcalendar/list'
import interactionPlugin from '@fullcalendar/interaction'
import { useCalendar } from '../../controllers/calendarController.js'
import CalendarEventModal from './CalendarEventModal.jsx'

function CalendarPage() {
  const {
    events,
    modalOpen,
    modalMode,
    form,
    eventLevels,
    headerToolbar,
    initialDate,
    setFormField,
    closeModal,
    handleAddEvent,
    handleUpdateEvent,
    handleSelect,
    handleDateClick,
    handleEventClick,
    eventClassNames,
    openAddModal,
  } = useCalendar()

  return (
    <>
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div id="calendar" className="min-h-screen">
          <FullCalendar
            plugins={[
              dayGridPlugin,
              timeGridPlugin,
              listPlugin,
              interactionPlugin,
            ]}
            selectable
            initialView="dayGridMonth"
            initialDate={initialDate}
            headerToolbar={headerToolbar}
            events={events}
            select={handleSelect}
            eventClick={handleEventClick}
            dateClick={handleDateClick}
            eventClassNames={eventClassNames}
            customButtons={{
              addEventButton: {
                text: 'Add Event +',
                click: () => openAddModal(),
              },
            }}
          />
        </div>
      </div>

      <CalendarEventModal
        open={modalOpen}
        mode={modalMode}
        form={form}
        eventLevels={eventLevels}
        onClose={closeModal}
        onFieldChange={setFormField}
        onAdd={handleAddEvent}
        onUpdate={handleUpdateEvent}
      />
    </>
  )
}

export default CalendarPage
