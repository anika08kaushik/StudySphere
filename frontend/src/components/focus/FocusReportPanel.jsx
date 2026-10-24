import { useEffect, useState, useCallback } from 'react'
import focusService from '../../services/focusService'
import api from '../../services/api'

const PERIODS = [
  { value: 'daily', label: 'Daily (14 days)' },
  { value: 'weekly', label: 'Weekly (8 weeks)' },
  { value: 'monthly', label: 'Monthly (6 months)' },
  { value: 'yearly', label: 'This year, day by day' },
]

const TYPES = [
  { value: 'ALL', label: 'All types' },
  { value: 'FOCUS', label: 'Focus only' },
  { value: 'SHORT_BREAK', label: 'Short breaks' },
  { value: 'LONG_BREAK', label: 'Long breaks' },
]

const formatMinutes = (seconds) => {
  const mins = Math.round((seconds || 0) / 60)
  if (mins < 60) return `${mins}m`
  const h = Math.floor(mins / 60)
  return `${h}h ${mins % 60}m`
}

const fmtTime = (iso) =>
  iso
    ? new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    : '???'

const fmtDate = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : '???'

const STATUS_STYLES = {
  COMPLETED: 'bg-emerald-100 text-emerald-800',
  INTERRUPTED: 'bg-amber-100 text-amber-800',
  ABANDONED: 'bg-slate-100 text-slate-700',
}

export default function FocusReportPanel() {
  const [period, setPeriod] = useState('daily')
  const [type, setType] = useState('ALL')
  const [groupId, setGroupId] = useState('ALL')
  const [groups, setGroups] = useState([])

  const [report, setReport] = useState(null)
  const [recent, setRecent] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [downloading, setDownloading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = { period, type: type || 'ALL' }
      if (groupId !== 'ALL') params.groupId = groupId
      const res = await focusService.getFocusReport(params)
      setReport(res.data?.data || null)

      const sessionsRes = await focusService.getSessions({ limit: 8, page: 1 })
      setRecent(sessionsRes.data?.data || [])
    } catch (err) {
      console.error('Unable to load focus report:', err)
      setError(err.response?.data?.message || 'Unable to load focus report')
      setReport(null)
      setRecent([])
    } finally {
      setLoading(false)
    }
  }, [period, type, groupId])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    const loadGroups = async () => {
      try {
        const res = await api.get('/groups/me')
        setGroups(res.data?.data || [])
      } catch {
        setGroups([])
      }
    }
    loadGroups()
  }, [])

  const maxSeconds = Math.max(
    1,
    ...(report?.buckets || []).map((b) => b.focusSeconds + b.breakSeconds)
  )

  const downloadCsv = async () => {
    if (!report) return
    setDownloading(true)
    try {
      const lines = [['Date', 'Focus (min)', 'Break (min)', 'Completed', 'Interrupted']]
      report.buckets.forEach((b) => {
        lines.push([
          b.key,
          Math.round(b.focusSeconds / 60),
          Math.round(b.breakSeconds / 60),
          b.completedCount,
          b.interruptedCount,
        ])
      })
      lines.push([])
      lines.push([
        'TOTAL',
        Math.round(report.totals.focusSeconds / 60),
        Math.round(report.totals.breakSeconds / 60),
        report.totals.completedCount,
        report.totals.interruptedCount,
      ])
      lines.push([])
      lines.push(['Session type', 'Status', 'Start', 'End', 'Duration (min)'])
      recent.forEach((s) => {
        lines.push([
          s.sessionType || 'FOCUS',
          s.status || 'COMPLETED',
          new Date(s.startTime).toLocaleString(),
          new Date(s.endTime).toLocaleString(),
          Math.round((s.duration || 0) / 60),
        ])
      })

      const csv = lines.map((row) => row.map((c) => `"${String(c ?? '')}"`).join(',')).join('\n')
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `focus-report-${period}-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="card-soft p-6 bg-white border-[#E8E0F2]">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2">
          <span className="text-xl">📊</span>
          <h2 className="text-lg font-bold text-[#493A63]">Focus Reports</h2>
        </div>
        <button
          onClick={downloadCsv}
          disabled={downloading || !report}
          className="px-3.5 py-1.5 rounded-xl bg-[#F8F5FF] hover:bg-[#E9DFFF] border border-[#E8E0F2] text-xs font-bold text-[#493A63] cursor-pointer transition-colors disabled:opacity-50"
        >
          ⬇ {downloading ? 'Preparing...' : 'Download CSV'}
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        {PERIODS.map((p) => (
          <button
            key={p.value}
            onClick={() => setPeriod(p.value)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              period === p.value
                ? 'bg-[#9B7EDB] text-white shadow-xs'
                : 'bg-[#F8F5FF] text-[#776B88] border border-[#E8E0F2] hover:text-[#493A63]'
            }`}
          >
            {p.label}
          </button>
        ))}

        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="ml-auto px-2.5 py-1.5 rounded-xl border border-[#E8E0F2] bg-[#F8F5FF] text-xs font-bold text-[#493A63] cursor-pointer focus:outline-none"
        >
          {TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>

        <select
          value={groupId}
          onChange={(e) => setGroupId(e.target.value)}
          className="px-2.5 py-1.5 rounded-xl border border-[#E8E0F2] bg-[#F8F5FF] text-xs font-bold text-[#493A63] cursor-pointer focus:outline-none"
        >
          <option value="ALL">All groups</option>
          {groups.map((g) => (
            <option key={g._id || g.id} value={g._id || g.id}>
              {g.name}
            </option>
          ))}
        </select>
      </div>

      {/* States */}
      {loading ? (
        <div className="flex items-end gap-1.5 h-40 animate-pulse">
          {Array.from({ length: 14 }).map((_, i) => (
            <div
              key={i}
              className="flex-1 rounded-t-lg bg-[#F3ECFE]"
              style={{ height: `${30 + ((i * 37) % 60)}%` }}
            />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-2xl bg-rose-50 border border-rose-200 p-4 text-xs font-semibold text-rose-700 flex items-center justify-between">
          <span>⚠ {error}</span>
          <button onClick={load} className="font-bold underline cursor-pointer">
            Retry
          </button>
        </div>
      ) : !report || report.totals.totalTimeSeconds === 0 ? (
        <div className="rounded-2xl bg-[#F8F5FF] border border-[#E8E0F2] p-8 text-center">
          <p className="text-3xl mb-2">🌱</p>
          <p className="text-sm font-bold text-[#493A63]">No sessions in this range yet</p>
          <p className="text-xs text-[#776B88] mt-1">
            Start a focus session in the library and it will show up here.
          </p>
        </div>
      ) : (
        <>
          {/* Totals row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            <div className="p-3 rounded-2xl bg-[#F3ECFE] border border-[#E8E0F2]">
              <p className="text-[10px] font-black uppercase tracking-wider text-[#776B88]">Focus time</p>
              <p className="text-lg font-extrabold text-[#493A63]">{formatMinutes(report.totals.focusSeconds)}</p>
            </div>
            <div className="p-3 rounded-2xl bg-[#FDF5F1] border border-[#F8DCD0]">
              <p className="text-[10px] font-black uppercase tracking-wider text-[#776B88]">Break time</p>
              <p className="text-lg font-extrabold text-[#493A63]">{formatMinutes(report.totals.breakSeconds)}</p>
            </div>
            <div className="p-3 rounded-2xl bg-[#EBF7EE] border border-[#D9E8DC]">
              <p className="text-[10px] font-black uppercase tracking-wider text-[#776B88]">Sessions</p>
              <p className="text-lg font-extrabold text-[#493A63]">
                {report.totals.completedCount}
                <span className="text-xs text-[#776B88]"> +{report.totals.interruptedCount} interrupted</span>
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-[#FCF9EE] border border-[#F6EBD0]">
              <p className="text-[10px] font-black uppercase tracking-wider text-[#776B88]">Completion rate</p>
              <p className="text-lg font-extrabold text-[#493A63]">{report.totals.completionRate}%</p>
            </div>
          </div>

          {/* Stacked bar chart */}
          <div className="flex items-end gap-1 h-36 mb-1.5">
            {report.buckets.map((b) => {
              const focusH = (b.focusSeconds / maxSeconds) * 100
              const breakH = (b.breakSeconds / maxSeconds) * 100
              const hasData = b.focusSeconds + b.breakSeconds > 0
              return (
                <div
                  key={b.key}
                  className="flex-1 flex flex-col justify-end group relative"
                  title={`${b.key}: ${formatMinutes(b.focusSeconds)} focus, ${formatMinutes(b.breakSeconds)} break (${b.completedCount} completed)`}
                >
                  <div
                    className="w-full rounded-t-md bg-[#9B7EDB] group-hover:bg-[#7A58C1] transition-colors"
                    style={{ height: `${focusH}%`, minHeight: b.focusSeconds > 0 ? 4 : 0 }}
                  />
                  <div
                    className={`w-full bg-[#F4C9B4] transition-colors ${b.focusSeconds > 0 ? '' : 'rounded-t-md'}`}
                    style={{ height: `${breakH}%`, minHeight: b.breakSeconds > 0 ? 4 : 0 }}
                  />
                  {!hasData && <div className="h-1 w-full rounded bg-[#F3ECFE]" />}
                </div>
              )
            })}
          </div>
          {/* X labels */}
          <div className="flex gap-1 mb-4">
            {report.buckets.map((b, i) => (
              <div key={b.key} className="flex-1 text-center text-[9px] font-bold text-[#776B88] truncate">
                {report.buckets.length <= 14 || i % 5 === 0 ? b.label.replace('Week of ', '') : ''}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4 mb-6 text-[10px] font-bold text-[#776B88]">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-[#9B7EDB]" /> Focus
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-[#F4C9B4]" /> Break
            </span>
            <span className="ml-auto">Hover a bar for details</span>
          </div>

          {/* Recent sessions detail */}
          <h3 className="text-xs font-black uppercase tracking-wider text-[#776B88] mb-3">
           🕐 Recent sessions
          </h3>
          {recent.length === 0 ? (
            <p className="text-xs text-[#776B88] bg-[#F8F5FF] border border-[#E8E0F2] rounded-xl p-4">
              No sessions recorded yet your first pomodoro will appear here.
            </p>
          ) : (
            <div className="space-y-2">
              {recent.map((s) => (
                <div
                  key={s._id}
                  className="flex flex-wrap items-center gap-2 p-3 rounded-xl bg-[#F8F5FF] border border-[#E8E0F2] text-xs"
                >
                  <span className="text-base">
                    {s.sessionType === 'FOCUS' ? '🍅' : s.sessionType === 'SHORT_BREAK' ? '☕' : '🌴'}
                  </span>
                  <div className="min-w-0">
                    <p className="font-bold text-[#493A63]">
                      {fmtDate(s.startTime)} ‧ {fmtTime(s.startTime)} - {fmtTime(s.endTime)}
                      {s.groupId?.name ? ` ‧ ${s.groupId.name}` : ''}
                    </p>
                    <p className="text-[#776B88]">
                      {Math.round((s.duration || 0) / 60)} min{' '}
                      {s.sessionType === 'FOCUS' ? 'focused' : 'break'}
                    </p>
                  </div>
                  <span
                    className={`ml-auto px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                      STATUS_STYLES[s.status] || 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {s.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
