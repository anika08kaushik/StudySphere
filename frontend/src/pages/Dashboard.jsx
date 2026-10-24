import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useApp } from '../context/AppContext'
import api from '../services/api'
import taskService from '../services/taskService'
import focusService from '../services/focusService'
import Avatar from '../components/ui/Avatar'
import FocusReportPanel from '../components/focus/FocusReportPanel'

const formatMinutes = (seconds) => {
  const mins = Math.round((seconds || 0) / 60)
  if (mins < 60) return `${mins}m`
  const h = Math.floor(mins / 60)
  return `${h}h ${mins % 60}m`
}

export default function Dashboard() {
  const { user } = useAuth()
  const { avatarConfig } = useApp()

  const userName = avatarConfig?.name || user?.name?.split(' ')[0] || 'Anika'

  // Real study-life data (Phase 8): focus stats, tasks and groups
  const [focusStats, setFocusStats] = useState(null)
  const [tasks, setTasks] = useState([])
  const [groupCount, setGroupCount] = useState(null)
  const [dLoading, setDLoading] = useState(true)
  const [dError, setDError] = useState('')

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setDLoading(true)
      setDError('')
      try {
        const [statsRes, tasksRes, groupsRes] = await Promise.allSettled([
          focusService.getFocusStats(),
          taskService.getTasks(),
          api.get('/groups/me'),
        ])

        if (cancelled) return

        if (statsRes.status === 'fulfilled') setFocusStats(statsRes.value.data?.data || null)
        if (tasksRes.status === 'fulfilled') setTasks(tasksRes.value.data?.data || [])
        if (groupsRes.status === 'fulfilled') setGroupCount((groupsRes.value.data?.data || []).length)

        if (statsRes.status === 'rejected' && tasksRes.status === 'rejected') {
          setDError('Unable to load your study data right now.')
        }
      } finally {
        if (!cancelled) setDLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  const pendingTasks = tasks.filter((t) => t.status !== 'COMPLETED')
  const upcomingDeadlines = pendingTasks
    .filter((t) => t.deadline && new Date(t.deadline).getTime() >= Date.now() - 3 * 24 * 60 * 60 * 1000)
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
    .slice(0, 5)

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Welcome Header */}
      <div className="card-soft p-6 md:p-8 bg-gradient-to-r from-[#F3ECFE] via-white to-[#FDF5F1] border-[#E8E0F2]">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E9DFFF] text-[#493A63] text-xs font-bold mb-3 border border-[#C9B8E8]">
              <span>✨</span>
              <span>WELCOME TO STUDYSPHERE CAMPUS</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-[#493A63] tracking-tight">
              Good evening, {userName} 🌙
            </h1>
            <p className="text-sm md:text-base text-[#776B88] mt-1">
              Where do you want to study today? Choose a location on campus.
            </p>
          </div>
          <Link
            to="/focus"
            className="px-6 py-3 rounded-2xl bg-[#9B7EDB] hover:bg-[#7A58C1] text-white font-bold text-sm shadow-md transition-all flex items-center gap-2 hover:scale-105 active:scale-95"
          >
            <span>📚</span>
            <span>Enter Virtual Library →</span>
          </Link>
        </div>
      </div>

      {/* Spatial Campus Map Card */}
      <div className="card-soft p-6 bg-white border-[#E8E0F2]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">🏫</span>
            <h2 className="text-lg font-bold text-[#493A63]">DIGITAL CAMPUS MAP</h2>
          </div>
          <span className="text-xs text-[#776B88] font-medium">3 active study areas</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Virtual Library Card */}
          <Link
            to="/focus"
            className="group card-purple-tint p-5 hover:border-[#9B7EDB] transition-all flex flex-col justify-between h-48 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 transform translate-x-2 -translate-y-2 opacity-20 text-7xl select-none">
              📚
            </div>
            <div>
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-xl shadow-xs mb-3 group-hover:scale-110 transition-transform">
                📚
              </div>
              <h3 className="text-base font-bold text-[#493A63]">Virtual Library</h3>
              <p className="text-xs text-[#776B88] mt-1">
                Cozy 3D study hall with seating avatars & quiet focus atmosphere.
              </p>
            </div>
            <div className="flex items-center justify-between text-xs font-semibold text-[#9B7EDB] pt-2 border-t border-[#E8E0F2]/50">
              <span>3 Students Seated</span>
              <span className="group-hover:translate-x-1 transition-transform">Enter →</span>
            </div>
          </Link>

          {/* Study Community Card */}
          <Link
            to="/groups"
            className="group card-peach-tint p-5 hover:border-[#F4C9B4] transition-all flex flex-col justify-between h-48 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 transform translate-x-2 -translate-y-2 opacity-20 text-7xl select-none">
              👥
            </div>
            <div>
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-xl shadow-xs mb-3 group-hover:scale-110 transition-transform">
                👥
              </div>
              <h3 className="text-base font-bold text-[#493A63]">Study Community</h3>
              <p className="text-xs text-[#776B88] mt-1">
                Group study rooms, shared task boards, and peer collaboration.
              </p>
            </div>
            <div className="flex items-center justify-between text-xs font-semibold text-[#E58C6B] pt-2 border-t border-[#F8DCD0]/50">
              <span>3 Active Groups</span>
              <span className="group-hover:translate-x-1 transition-transform">Explore →</span>
            </div>
          </Link>

          {/* Student Lounge Card */}
          <Link
            to="/chat"
            className="group card-sage-tint p-5 hover:border-[#BFD8C0] transition-all flex flex-col justify-between h-48 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 transform translate-x-2 -translate-y-2 opacity-20 text-7xl select-none">
              💬
            </div>
            <div>
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-xl shadow-xs mb-3 group-hover:scale-110 transition-transform">
                💬
              </div>
              <h3 className="text-base font-bold text-[#493A63]">Student Lounge</h3>
              <p className="text-xs text-[#776B88] mt-1">
                Live presence chat room to relax, ask questions, and chat with peers.
              </p>
            </div>
            <div className="flex items-center justify-between text-xs font-semibold text-[#5B8F62] pt-2 border-t border-[#D9E8DC]/50">
              <span>8 Students Online</span>
              <span className="group-hover:translate-x-1 transition-transform">Join Lounge →</span>
            </div>
          </Link>
        </div>
      </div>

      {/* Your Study Life Stats (real data from focus + task APIs) */}
      <div>
        <h2 className="text-xs font-bold text-[#776B88] uppercase tracking-wider mb-3">
          YOUR STUDY LIFE
        </h2>
        {dError && (
          <div className="card-soft p-4 bg-rose-50 border-rose-200 text-xs font-semibold text-rose-700 mb-4">
            ⚠ {dError}
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={`card-soft p-5 flex items-center gap-4 bg-gradient-to-br from-white to-[#FCF9EE] border-[#F6EBD0] ${dLoading ? 'animate-pulse' : ''}`}>
            <div className="w-12 h-12 rounded-2xl bg-[#F6D98B]/30 flex items-center justify-center text-2xl">
              🔥
            </div>
            <div>
              <p className="text-2xl font-extrabold text-[#493A63]">
                {focusStats ? `${focusStats.currentStreak} Days` : '★ Days'}
              </p>
              <p className="text-xs text-[#776B88] font-medium">Active Focus Streak</p>
            </div>
          </div>

          <div className={`card-soft p-5 flex items-center gap-4 bg-gradient-to-br from-white to-[#F3ECFE] border-[#E8E0F2] ${dLoading ? 'animate-pulse' : ''}`}>
            <div className="w-12 h-12 rounded-2xl bg-[#E9DFFF] flex items-center justify-center text-2xl">
              ⏱️
            </div>
            <div>
              <p className="text-2xl font-extrabold text-[#493A63]">
                {focusStats ? formatMinutes(focusStats.todaySeconds) : '★'}
              </p>
              <p className="text-xs text-[#776B88] font-medium">Total Focus Today</p>
            </div>
          </div>

          <div className={`card-soft p-5 flex items-center gap-4 bg-gradient-to-br from-white to-[#FDF5F1] border-[#F8DCD0] ${dLoading ? 'animate-pulse' : ''}`}>
            <div className="w-12 h-12 rounded-2xl bg-[#F4C9B4]/30 flex items-center justify-center text-2xl">
              👥
            </div>
            <div>
              <p className="text-2xl font-extrabold text-[#493A63]">
                {groupCount !== null ? `${groupCount} Group${groupCount === 1 ? '' : 's'}` : '★ Groups'}
              </p>
              <p className="text-xs text-[#776B88] font-medium">Study Communities</p>
            </div>
          </div>
        </div>
      </div>

      {/* Continue Studying & Campus Board Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Continue Studying Card */}
        <div className="card-soft p-6 bg-white border-[#E8E0F2] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[#9B7EDB]">
                CONTINUE STUDYING
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Now
              </span>
            </div>
            <h3 className="text-lg font-bold text-[#493A63]">📚 Virtual Library</h3>
            <p className="text-xs text-[#776B88] mt-1 mb-4">
              Step back into your study desk and resume your timer.
            </p>

            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-[#F8F5FF] border border-[#E8E0F2] mb-4">
              <div className="flex -space-x-2">
                <Avatar name="Maya" size="sm" status="focusing" />
                <Avatar name="Alex" size="sm" status="focusing" />
                <Avatar name="Sam" size="sm" status="focusing" />
              </div>
              <div className="text-xs">
                <p className="font-semibold text-[#493A63]">Maya, Alex & Sam</p>
                <p className="text-[#776B88]">3 students currently studying</p>
              </div>
            </div>
          </div>

          <Link
            to="/focus"
            className="w-full py-2.5 rounded-xl bg-[#9B7EDB] hover:bg-[#7A58C1] text-white font-bold text-sm text-center shadow-xs transition-colors flex items-center justify-center gap-2"
          >
            <span>Enter Room</span>
            <span>→</span>
          </Link>
        </div>

        {/* Real pending tasks & upcoming deadlines from the task backend */}
        <div className="card-soft p-6 bg-white border-[#E8E0F2]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#776B88]">
              📌 PENDING TASKS & DEADLINES
            </h3>
            <Link to="/tasks" className="text-xs text-[#9B7EDB] font-semibold cursor-pointer hover:underline">
              {pendingTasks.length} pending ‧ View all
            </Link>
          </div>

          {dLoading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="p-3 rounded-xl bg-[#F8F5FF] border border-[#E8E0F2] animate-pulse">
                  <div className="h-3 w-2/3 bg-[#E8E0F2] rounded" />
                  <div className="h-2.5 w-1/3 bg-[#F3ECFE] rounded mt-2" />
                </div>
              ))}
            </div>
          ) : pendingTasks.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-3xl mb-2">🎉</p>
              <p className="text-xs font-bold text-[#493A63]">All tasks completed!</p>
              <p className="text-xs text-[#776B88] mt-0.5">Create new tasks on your Kanban board.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingDeadlines.map((task) => (
                <div key={task._id} className="p-3 rounded-xl bg-[#FDF5F1] border border-[#F8DCD0] flex items-start gap-3">
                  <span className="text-lg shrink-0">
                    {task.priority === 'HIGH' ? '🔥' : task.priority === 'MEDIUM' ? '⚡' : '🌱'}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#493A63] truncate">{task.title}</p>
                    <p className="text-[11px] text-[#776B88] mt-0.5">
                      {task.deadline
                        ? `Due ${new Date(task.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                        : 'No deadline'}
                      {task.status && ` ‧ ${task.status.replace('_', ' ')}`}
                    </p>
                  </div>
                </div>
              ))}
              {upcomingDeadlines.length < pendingTasks.length && (
                <p className="text-[11px] font-semibold text-[#776B88] text-center">
                  + {pendingTasks.length - upcomingDeadlines.length} more on the Kanban board
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Phase 8: full focus reports (history, trends, CSV export) */}
      <FocusReportPanel />
    </div>
  )
}
