import { useState, useEffect, useMemo } from 'react'
import focusService from '../../services/focusService'

// Phase 11: Year-at-a-glance (365/366-day) focus activity heatmap.
// Color intensity = focused minutes that day (server-persisted sessions);
// every day is clickable and opens that day's saved session details.

const DAY_HEADERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// Lavender activity scale (cuter than the classic GitHub green)
const BLANK_COLOR = '#F3ECFE'
const SCALE = ['#E9DFFF', '#C9B8E8', '#9B7EDB', '#7A58C1', '#5A3FA8']

const localDateKey = (date) => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const minutesToNice = (mins) => {
  if (mins < 60) return `${Math.round(mins)}m`
  return `${Math.floor(mins / 60)}h ${Math.round(mins % 60)}m`
}

const levelColor = (focusMinutes) => {
  if (focusMinutes <= 0) return BLANK_COLOR
  if (focusMinutes < 15) return SCALE[0]
  if (focusMinutes < 45) return SCALE[1]
  if (focusMinutes < 90) return SCALE[2]
  if (focusMinutes < 180) return SCALE[3]
  return SCALE[4]
}

export default function YearHeatmap({ onClose, currentGroupId }) {
  const [year, setYear] = useState(new Date().getFullYear())
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedDay, setSelectedDay] = useState(null) // 'YYYY-MM-DD'

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      setError(null)
      setSelectedDay(null)
      try {
        const res = await focusService.getSessions({
          from: `${year}-01-01T00:00:00.000Z`,
          to: `${year}-12-31T23:59:59.999Z`,
          limit: 400,
        })
        if (cancelled) return
        setSessions(res.data?.data || [])
      } catch (err) {
        if (!cancelled) setError('Unable to load your year of focus sessions')
        console.warn('year heatmap load failed:', err?.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [year])

  // Aggregate daily focus + break totals from real saved sessions
  const { dailyTotals, sessionsByDay } = useMemo(() => {
    const focus = {}
    const byDay = {}
    sessions.forEach((s) => {
      const key = localDateKey(new Date(s.startTime))
      const isFocus = s.sessionType === 'FOCUS'
      const mins = (s.duration || 0) / 60
      if (isFocus) focus[key] = (focus[key] || 0) + mins
      byDay[key] = byDay[key] || []
      byDay[key].push(s)
    })
    return { dailyTotals: focus, sessionsByDay: byDay }
  }, [sessions])

  // Every real calendar day of the selected year: 365 days (366 in a leap year)
  const days = useMemo(() => {
    const list = []
    const cursor = new Date(year, 0, 1)
    while (cursor.getFullYear() === year) {
      list.push(new Date(cursor))
      cursor.setDate(cursor.getDate() + 1)
    }
    return list
  }, [year])

  const leadingBlanks = days.length > 0 ? days[0].getDay() : 0
  const dayCells = days.map((d) => {
    const key = localDateKey(d)
    return { key, date: d, focusMinutes: dailyTotals[key] || 0 }
  })

  const totals = useMemo(() => {
    let focusMins = 0
    let breakMins = 0
    let activeDays = 0
    Object.entries(dailyTotals).forEach(([, mins]) => {
      focusMins += mins
      activeDays += 1
    })
    sessions.forEach((s) => {
      if (s.sessionType !== 'FOCUS') breakMins += (s.duration || 0) / 60
    })
    return { focusMins, breakMins, activeDays, total: sessions.length }
  }, [dailyTotals, sessions])

  const selectedSessions = selectedDay ? sessionsByDay[selectedDay] || [] : []
  const todayKey = localDateKey(new Date())

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#493A63]/40 backdrop-blur-sm">
      <div className="card-soft p-6 bg-white border-[#E8E0F2] rounded-3xl shadow-xl max-w-2xl w-full max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#E8E0F2]">
          <div className="flex items-center gap-2">
            <span className="text-xl">🗓️</span>
            <div>
              <h2 className="text-base font-bold text-[#493A63]">Your Year of Focus</h2>
              <p className="text-[11px] text-[#776B88]">
                {days.length} days tracked · {totals.activeDays} active ·{' '}
                {minutesToNice(totals.focusMins)} focused · {minutesToNice(totals.breakMins)} on break
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-[#F8F5FF] p-1 rounded-xl border border-[#E8E0F2]">
              <button
                onClick={() => setYear(year - 1)}
                className="px-2 py-1 hover:bg-[#E9DFFF] rounded-lg text-[#493A63] font-bold text-xs cursor-pointer"
              >
                ←
              </button>
              <span className="text-xs font-black text-[#493A63] w-12 text-center">{year}</span>
              <button
                onClick={() => setYear(year + 1)}
                className="px-2 py-1 hover:bg-[#E9DFFF] rounded-lg text-[#493A63] font-bold text-xs cursor-pointer"
              >
                →
              </button>
            </div>
            <button
              onClick={onClose}
              className="text-[#776B88] hover:text-[#493A63] font-bold text-sm cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center space-y-2">
            <div className="text-2xl animate-bounce">💜</div>
            <p className="text-xs font-bold text-[#776B88]">Gathering your saved sessions...</p>
          </div>
        ) : error ? (
          <div className="py-12 text-center">
            <p className="text-xs font-bold text-rose-600">⚠️ {error}</p>
          </div>
        ) : (
          <>
            {/* Heatmap grid: one column per week, exact day count incl. leap years */}
            <div className="overflow-x-auto pt-4">
              <div className="flex gap-[3px] min-w-[540px]">
                <div className="flex flex-col gap-[3px] mr-1 pt-[14px]">
                  {DAY_HEADERS.map((h, idx) => (
                    <div
                      key={idx}
                      className="h-[14px] w-3 text-[7px] leading-[14px] font-bold text-[#776B88] text-center"
                    >
                      {idx % 2 === 1 ? h : ''}
                    </div>
                  ))}
                </div>
                <div className="flex gap-[3px]">
                  {/* Build weeks: split the day list into 7-day columns */}
                  {Array.from({ length: Math.ceil((leadingBlanks + days.length) / 7) }).map((_, w) => {
                    const cells = []
                    for (let dow = 0; dow < 7; dow++) {
                      const idx = w * 7 + dow - leadingBlanks
                      if (idx < 0 || idx >= days.length) {
                        cells.push(<div key={dow} className="w-[14px] h-[14px]" />)
                      } else {
                        const cell = dayCells[idx]
                        cells.push(
                          <button
                            key={dow}
                            onClick={() => setSelectedDay(cell.key === selectedDay ? null : cell.key)}
                            title={`${cell.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · ${minutesToNice(cell.focusMinutes)} focused`}
                            className={`w-[14px] h-[14px] rounded-[3px] cursor-pointer transition-transform hover:scale-125 hover:ring-2 hover:ring-[#9B7EDB] ${
                              selectedDay === cell.key ? 'ring-2 ring-[#5A3FA8]' : ''
                            } ${cell.key === todayKey ? 'ring-1 ring-emerald-400' : ''}`}
                            style={{ backgroundColor: levelColor(cell.focusMinutes) }}
                          />
                        )
                      }
                    }
                    return (
                      <div key={w} className="flex flex-col gap-[3px]">
                        {cells}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Month labels + legend */}
            <div className="flex items-center justify-between pt-3 text-[9px] font-bold text-[#776B88]">
              <span className="flex items-center gap-2">
                {MONTH_LABELS.map((m, i) => (
                  <span key={m}>{i % 2 === 0 ? m : ''}</span>
                ))}
              </span>
              <span className="flex items-center gap-1">
                Less
                {[BLANK_COLOR, ...SCALE].map((c) => (
                  <span key={c} className="w-[10px] h-[10px] rounded-[2px] inline-block" style={{ backgroundColor: c }} />
                ))}
                More
              </span>
            </div>

            {/* Selected day details - the actual saved sessions */}
            {selectedDay && (
              <div className="mt-4 p-4 rounded-2xl bg-[#F8F5FF] border border-[#E8E0F2]">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-black text-[#493A63]">
                    📅{' '}
                    {new Date(`${selectedDay}T12:00:00`).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                  <p className="text-[10px] font-bold text-[#7A58C1]">
                    {minutesToNice(dailyTotals[selectedDay] || 0)} focused
                  </p>
                </div>

                {selectedSessions.length === 0 ? (
                  <p className="text-[11px] text-[#776B88] py-2">
                    Rest day - no sessions recorded 💭
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {selectedSessions.map((s) => (
                      <div
                        key={s._id}
                        className="flex items-center justify-between bg-white p-2 rounded-xl border border-[#E8E0F2] text-[11px]"
                      >
                        <div className="flex items-center gap-2">
                          <span>{s.sessionType === 'FOCUS' ? '🍅' : s.sessionType === 'SHORT_BREAK' ? '☕' : '🌴'}</span>
                          <span className="font-bold text-[#493A63]">
                            {s.sessionType === 'FOCUS' ? 'Focus' : s.sessionType === 'SHORT_BREAK' ? 'Short break' : 'Long break'}
                          </span>
                          <span className="text-[#776B88]">
                            {s.startTime && new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            {s.endTime ? `- ${new Date(s.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-[#493A63]">{minutesToNice((s.duration || 0) / 60)}</span>
                          <span
                            className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                              s.status === 'COMPLETED'
                                ? 'bg-emerald-100 text-emerald-700'
                                : s.status === 'INTERRUPTED'
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {s.status === 'INTERRUPTED' ? 'partial' : s.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Footer note */}
        <p className="pt-3 text-[10px] text-[#776B88] text-center">
          Data comes from your saved focus sessions - complete a timer to light up today 💜
          {currentGroupId && currentGroupId !== 'campus_lounge' ? ' (includes all rooms)' : ''}
        </p>
      </div>
    </div>
  )
}
