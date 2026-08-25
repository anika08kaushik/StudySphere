import { useState } from 'react'
import { calendarEvents as initialEvents } from '../../mock/calendar'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay()
}

export default function Calendar() {
  const now = new Date()
  const [events, setEvents] = useState(initialEvents)
  const [currentMonth, setCurrentMonth] = useState(now.getMonth())
  const [currentYear, setCurrentYear] = useState(now.getFullYear())

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false)
  const [eventTitle, setEventTitle] = useState('')
  const [eventDate, setEventDate] = useState(now.toISOString().split('T')[0])
  const [eventType, setEventType] = useState('study')

  const daysInMonth = getDaysInMonth(currentYear, currentMonth)
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth)

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear(currentYear - 1)
    } else setCurrentMonth(currentMonth - 1)
  }

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear(currentYear + 1)
    } else setCurrentMonth(currentMonth + 1)
  }

  const monthName = new Date(currentYear, currentMonth).toLocaleString('en-US', {
    month: 'long',
    year: 'numeric',
  })

  const eventsOnDay = (day) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return events.filter((e) => e.date === dateStr)
  }

  const handleAddEvent = (e) => {
    e.preventDefault()
    if (!eventTitle.trim()) return

    const newEvent = {
      _id: `evt-${Date.now()}`,
      title: eventTitle,
      date: eventDate,
      type: eventType,
    }

    setEvents([...events, newEvent])
    setEventTitle('')
    setShowAddModal(false)
  }

  const handleDeleteEvent = (eventId) => {
    setEvents((prev) => prev.filter((e) => e._id !== eventId))
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header Bar */}
      <div className="card-soft p-6 bg-white border-[#E8E0F2] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">📅</span>
            <h1 className="text-xl font-bold text-[#493A63]">Campus Calendar</h1>
          </div>
          <p className="text-xs text-[#776B88] mt-1">Plan your study sessions, exams, and group deadlines</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-[#F8F5FF] p-1.5 rounded-xl border border-[#E8E0F2]">
            <button onClick={prevMonth} className="px-3 py-1 hover:bg-[#E9DFFF] rounded-lg text-[#493A63] font-bold">
              ←
            </button>
            <span className="text-xs font-bold text-[#493A63] w-32 text-center">{monthName}</span>
            <button onClick={nextMonth} className="px-3 py-1 hover:bg-[#E9DFFF] rounded-lg text-[#493A63] font-bold">
              →
            </button>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-5 py-2.5 rounded-xl bg-[#9B7EDB] hover:bg-[#7A58C1] text-white font-bold text-sm shadow-xs transition-all flex items-center gap-2"
          >
            <span>➕</span>
            <span>Add Event</span>
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="card-soft p-6 bg-white border-[#E8E0F2]">
        <div className="grid grid-cols-7 gap-2">
          {DAYS.map((d) => (
            <div key={d} className="p-2 text-xs font-extrabold text-[#776B88] text-center uppercase tracking-wider">
              {d}
            </div>
          ))}

          {/* Empty cells before month start */}
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} className="p-2 min-h-[90px] rounded-xl bg-[#F8F5FF]/40 border border-transparent" />
          ))}

          {/* Days of current month */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1
            const dayEvents = eventsOnDay(day)
            const isToday = day === now.getDate() && currentMonth === now.getMonth() && currentYear === now.getFullYear()

            return (
              <div
                key={day}
                className={`p-2 min-h-[90px] rounded-2xl border transition-all flex flex-col justify-between ${
                  isToday
                    ? 'bg-[#E9DFFF] border-[#9B7EDB] shadow-xs'
                    : 'bg-[#F8F5FF] border-[#E8E0F2] hover:border-[#C9B8E8]'
                }`}
              >
                <span className={`text-xs font-extrabold ${isToday ? 'text-[#493A63]' : 'text-[#776B88]'}`}>
                  {day}
                </span>

                <div className="space-y-1 mt-1 flex-1 overflow-y-auto">
                  {dayEvents.map((e) => (
                    <div
                      key={e._id}
                      className={`text-[10px] p-1.5 rounded-lg font-bold flex items-center justify-between group truncate ${
                        e.type === 'deadline'
                          ? 'bg-rose-100 text-rose-800'
                          : e.type === 'meeting'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-indigo-100 text-indigo-800'
                      }`}
                    >
                      <span className="truncate">{e.title}</span>
                      <button
                        onClick={() => handleDeleteEvent(e._id)}
                        className="hidden group-hover:block text-xs font-bold text-red-600 ml-1"
                        title="Delete"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Add Event Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#493A63]/30 backdrop-blur-sm">
          <div className="card-soft p-6 bg-white border-[#E8E0F2] max-w-md w-full shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E0F2]">
              <h2 className="text-base font-bold text-[#493A63]">Add Campus Event</h2>
              <button onClick={() => setShowAddModal(false)} className="text-[#776B88] font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleAddEvent} className="py-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#776B88] uppercase mb-1">
                  Event Title
                </label>
                <input
                  type="text"
                  required
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  placeholder="e.g. Midterm Physics Study Session"
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E8E0F2] bg-[#F8F5FF] text-[#493A63] font-semibold text-xs focus:outline-none focus:border-[#9B7EDB]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#776B88] uppercase mb-1">
                  Event Type
                </label>
                <select
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E8E0F2] bg-[#F8F5FF] text-[#493A63] font-semibold text-xs focus:outline-none focus:border-[#9B7EDB]"
                >
                  <option value="study">📚 Study Session</option>
                  <option value="deadline">🔥 Exam / Deadline</option>
                  <option value="meeting">👥 Group Sync</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#776B88] uppercase mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E8E0F2] bg-[#F8F5FF] text-[#493A63] font-semibold text-xs focus:outline-none focus:border-[#9B7EDB]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-[#E8E0F2] text-xs font-bold text-[#776B88]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#9B7EDB] hover:bg-[#7A58C1] text-white font-bold text-xs shadow-xs"
                >
                  Save Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

