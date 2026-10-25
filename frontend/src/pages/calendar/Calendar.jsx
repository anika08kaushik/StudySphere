import { useState, useEffect, useMemo } from 'react'
import calendarService from '../../services/calendarService'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const CATEGORIES = [
  { value: 'study', label: '📚 Study' },
  { value: 'deadline', label: '🔥 Deadline' },
  { value: 'meeting', label: '👥 Group Sync' },
  { value: 'personal', label: '🌿 Personal' },
  { value: 'other', label: '📌 Other' },
]

// Phase 10: customizable emoji moods the user picks per event
const EMOJI_OPTIONS = ['📚', '🔥', '👥', '💡', '🧠', '🎯', '☕', '🏃', '🎵', '✨', '🌊', '🌙', '🗒️', '🎉', '😴', '💪']

const CATEGORY_STYLES = {
  study: 'bg-indigo-100 text-indigo-800',
  deadline: 'bg-rose-100 text-rose-800',
  meeting: 'bg-amber-100 text-amber-800',
  personal: 'bg-emerald-100 text-emerald-800',
  other: 'bg-violet-100 text-violet-800',
}

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay()
}

// Local calendar-day string (never toISOString: it shifts the date near midnight)
const localDateKey = (d = new Date()) => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const EMPTY_FORM = {
  title: '',
  description: '',
  date: localDateKey(),
  startTime: '',
  endTime: '',
  category: 'study',
  emoji: '📚',
  reminderMinutes: 0,
}

export default function Calendar() {
  const now = new Date()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [currentMonth, setCurrentMonth] = useState(now.getMonth())
  const [currentYear, setCurrentYear] = useState(now.getFullYear())

  // Modal state: null | { mode: 'add' } | { mode: 'edit', event } | { mode: 'detail', event }
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const loadEvents = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await calendarService.getEvents()
      setEvents(res.data?.data || [])
    } catch (err) {
      setError('Unable to load your events - they may not persist this session.')
      console.warn('calendar load failed:', err?.message)
    } finally {
      setLoading(false)
    }
  }

  // Persistent events: load once (they survive refresh server-side)
  useEffect(() => {
    loadEvents()
  }, [])

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

  const visibleEvents = useMemo(
    () => events.filter((e) => categoryFilter === 'ALL' || e.category === categoryFilter),
    [events, categoryFilter]
  )

  const eventsOnDay = (day) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return visibleEvents.filter((e) => e.date === dateStr)
  }

  const openAdd = (date = null) => {
    setForm({ ...EMPTY_FORM, date: date || localDateKey() })
    setFormError('')
    setModal({ mode: 'add' })
  }

  const openEdit = (event) => {
    setForm({
      title: event.title,
      description: event.description || '',
      date: event.date,
      startTime: event.startTime || '',
      endTime: event.endTime || '',
      category: event.category,
      emoji: event.emoji || '📚',
      reminderMinutes: event.reminderMinutes || 0,
    })
    setFormError('')
    setModal({ mode: 'edit', event })
  }

  const openDetail = (event) => setModal({ mode: 'detail', event })

  const handleSubmit = async (e) => {
    e.preventDefault()
    const title = form.title.trim()
    if (!title) {
      setFormError('Please enter a title')
      return
    }
    setSaving(true)
    setFormError('')
    try {
      const payload = {
        title,
        description: form.description,
        date: form.date,
        startTime: form.startTime,
        endTime: form.endTime,
        category: form.category,
        emoji: form.emoji,
        reminderMinutes: Number(form.reminderMinutes) || 0,
      }
      if (modal?.mode === 'edit') {
        await calendarService.updateEvent(modal.event._id, payload)
      } else {
        await calendarService.createEvent(payload)
      }
      setModal(null)
      await loadEvents()
    } catch (err) {
      const msg = err?.response?.data?.message || 'Unable to save event'
      setFormError(msg)
      console.warn('calendar save failed:', msg)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (eventId) => {
    try {
      await calendarService.deleteEvent(eventId)
      setModal(null)
      await loadEvents()
    } catch (err) {
      console.warn('calendar delete failed:', err?.message)
    }
  }

  const updateForm = (key, value) => setForm((prev) => ({ ...prev, [key]: value }))

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header Bar */}
      <div className="card-soft p-6 bg-white border-[#E8E0F2] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">📅</span>
            <h1 className="text-xl font-bold text-[#493A63]">Campus Calendar</h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#EBF7EE] text-emerald-700 border border-emerald-200">
              Saved ✕ Auto-persisted
            </span>
          </div>
          <p className="text-xs text-[#776B88] mt-1">
            Plan your study sessions, exams, and group deadlines - everything stays saved
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Category filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-[#E8E0F2] bg-[#F8F5FF] text-[#493A63] font-bold text-xs focus:outline-none focus:border-[#9B7EDB] cursor-pointer"
          >
            <option value="ALL">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>

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
            onClick={() => openAdd()}
            className="px-5 py-2.5 rounded-xl bg-[#9B7EDB] hover:bg-[#7A58C1] text-white font-bold text-sm shadow-xs transition-all flex items-center gap-2 cursor-pointer"
          >
            <span>➕</span>
            <span>Add Event</span>
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-rose-50 border border-rose-300 text-rose-800 rounded-2xl p-4 text-xs font-bold flex items-center gap-2">
          <span>⚠️</span> {error}
        </div>
      )}

      {/* Calendar Grid */}
      <div className="card-soft p-6 bg-white border-[#E8E0F2]">
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <div className="text-3xl animate-bounce">📅</div>
            <p className="text-xs font-bold text-[#776B88]">Loading your saved events...</p>
          </div>
        ) : (
          <>
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
                const isToday =
                  day === now.getDate() && currentMonth === now.getMonth() && currentYear === now.getFullYear()

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
                        <button
                          key={e._id}
                          onClick={() => openDetail(e)}
                          title={`${e.title}${e.startTime ? ` at ${e.startTime}` : ''}`}
                          className={`text-[10px] p-1.5 rounded-lg font-bold flex items-center gap-1 w-full truncate cursor-pointer text-left ${
                            CATEGORY_STYLES[e.category] || CATEGORY_STYLES.other
                          }`}
                        >
                          <span>{e.emoji || '📚'}</span>
                          <span className="truncate">{e.title}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Empty state */}
            {visibleEvents.length === 0 && (
              <div className="py-10 text-center space-y-2">
                <p className="text-2xl">🗓️</p>
                <p className="text-xs font-bold text-[#776B88]">
                  {categoryFilter === 'ALL'
                    ? 'No events yet - add your first event and it will be saved forever'
                    : 'No events in this category this month'}
                </p>
                <button
                  onClick={() => openAdd()}
                  className="px-4 py-2 rounded-xl bg-[#E9DFFF] text-[#7A58C1] text-xs font-bold cursor-pointer"
                >
                  ➕ Add an event
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add/Edit Modal (full persist + emoji mood) */}
      {(modal?.mode === 'add' || modal?.mode === 'edit') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#493A63]/30 backdrop-blur-sm">
          <div className="card-soft p-6 bg-white border-[#E8E0F2] max-w-md w-full shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E0F2]">
              <h2 className="text-base font-bold text-[#493A63]">
                {modal.mode === 'edit' ? '✏️ Edit Event' : 'Add Campus Event'}
              </h2>
              <button onClick={() => setModal(null)} className="text-[#776B88] font-bold cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="py-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#776B88] uppercase mb-1">Event Title</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => updateForm('title', e.target.value)}
                  placeholder="e.g. Midterm Physics Study Session"
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E8E0F2] bg-[#F8F5FF] text-[#493A63] font-semibold text-xs focus:outline-none focus:border-[#9B7EDB]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#776B88] uppercase mb-1">Details / Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => updateForm('description', e.target.value)}
                  rows={2}
                  placeholder="Chapters to cover, room, bring your laptop..."
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E8E0F2] bg-[#F8F5FF] text-[#493A63] font-semibold text-xs focus:outline-none focus:border-[#9B7EDB]"
                />
              </div>

              {/* Emoji mood picker (Phase 10: fully customizable) */}
              <div>
                <label className="block text-xs font-bold text-[#776B88] uppercase mb-1">Mood / Emoji</label>
                <div className="grid grid-cols-8 gap-1.5">
                  {EMOJI_OPTIONS.map((emo) => (
                    <button
                      key={emo}
                      type="button"
                      onClick={() => updateForm('emoji', emo)}
                      className={`py-1.5 rounded-lg text-base cursor-pointer transition-all border ${
                        form.emoji === emo
                          ? 'bg-[#E9DFFF] border-[#9B7EDB] scale-110'
                          : 'bg-[#F8F5FF] border-[#E8E0F2] hover:bg-[#F3ECFE]'
                      }`}
                    >
                      {emo}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#776B88] uppercase mb-1">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => updateForm('category', e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#E8E0F2] bg-[#F8F5FF] text-[#493A63] font-semibold text-xs focus:outline-none focus:border-[#9B7EDB]"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#776B88] uppercase mb-1">Reminder</label>
                  <select
                    value={form.reminderMinutes}
                    onChange={(e) => updateForm('reminderMinutes', e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#E8E0F2] bg-[#F8F5FF] text-[#493A63] font-semibold text-xs focus:outline-none focus:border-[#9B7EDB]"
                  >
                    <option value="0">None</option>
                    <option value="10">10 min before</option>
                    <option value="30">30 min before</option>
                    <option value="60">1 hour before</option>
                    <option value="1440">1 day before</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#776B88] uppercase mb-1">Date</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => updateForm('date', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E8E0F2] bg-[#F8F5FF] text-[#493A63] font-semibold text-xs focus:outline-none focus:border-[#9B7EDB]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#776B88] uppercase mb-1">Start</label>
                  <input
                    type="time"
                    value={form.startTime}
                    onChange={(e) => updateForm('startTime', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E8E0F2] bg-[#F8F5FF] text-[#493A63] font-semibold text-xs focus:outline-none focus:border-[#9B7EDB]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#776B88] uppercase mb-1">End</label>
                  <input
                    type="time"
                    value={form.endTime}
                    onChange={(e) => updateForm('endTime', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E8E0F2] bg-[#F8F5FF] text-[#493A63] font-semibold text-xs focus:outline-none focus:border-[#9B7EDB]"
                  />
                </div>
              </div>

              {formError && (
                <p className="text-[11px] font-bold text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
                  {formError}
                </p>
              )}

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModal(null)}
                  className="px-4 py-2 rounded-xl border border-[#E8E0F2] text-xs font-bold text-[#776B88] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-[#9B7EDB] hover:bg-[#7A58C1] text-white font-bold text-xs shadow-xs disabled:opacity-60 cursor-pointer"
                >
                  {saving ? 'Saving...' : modal.mode === 'edit' ? 'Update Event' : 'Save Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal - all persisted fields, visible on click */}
      {modal?.mode === 'detail' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#493A63]/30 backdrop-blur-sm">
          <div className="card-soft p-6 bg-white border-[#E8E0F2] max-w-md w-full shadow-xl">
            <div className="flex items-start justify-between pb-3 border-b border-[#E8E0F2]">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{modal.event.emoji || '📚'}</span>
                <div>
                  <h2 className="text-base font-bold text-[#493A63]">{modal.event.title}</h2>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      CATEGORY_STYLES[modal.event.category] || CATEGORY_STYLES.other
                    }`}
                  >
                    {modal.event.category}
                  </span>
                </div>
              </div>
              <button onClick={() => setModal(null)} className="text-[#776B88] font-bold cursor-pointer">
                ✕
              </button>
            </div>

            <div className="py-4 space-y-2.5 text-xs">
              <p className="text-[#493A63] font-semibold">
                <span className="text-[#776B88] font-bold uppercase mr-1.5">When:</span>
                {modal.event.date}
                {modal.event.startTime ? ` · ${modal.event.startTime}` : ''}
                {modal.event.endTime ? `-${modal.event.endTime}` : ''}
              </p>
              {modal.event.description && (
                <p className="text-[#493A63] font-semibold leading-relaxed">
                  <span className="text-[#776B88] font-bold uppercase mr-1.5">Details:</span>
                  {modal.event.description}
                </p>
              )}
              {modal.event.reminderMinutes > 0 && (
                <p className="text-[#493A63] font-semibold">
                  <span className="text-[#776B88] font-bold uppercase mr-1.5">Reminder:</span>
                  {modal.event.reminderMinutes >= 1440
                    ? `${modal.event.reminderMinutes / 1440} day${modal.event.reminderMinutes === 1440 ? '' : 's'} before`
                    : `${modal.event.reminderMinutes} min before`}
                </p>
              )}
            </div>

            <div className="pt-2 border-t border-[#E8E0F2] flex items-center justify-between">
              <button
                onClick={() => handleDelete(modal.event._id)}
                className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 text-xs font-bold cursor-pointer"
              >
                🗑️ Delete
              </button>
              <button
                onClick={() => openEdit(modal.event)}
                className="px-5 py-2 rounded-xl bg-[#9B7EDB] hover:bg-[#7A58C1] text-white font-bold text-xs shadow-xs cursor-pointer"
              >
                ✏️ Edit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
