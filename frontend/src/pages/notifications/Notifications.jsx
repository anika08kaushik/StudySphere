import { useState, useEffect } from 'react'
import { notifications as initialNotifs } from '../../mock/notifications'
import { useApp } from '../../context/AppContext'
import notificationService from '../../services/notificationService'

export default function Notifications() {
  const { setUnreadCount } = useApp()
  const [notifs, setNotifs] = useState(initialNotifs)
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await notificationService.getNotifications()
        const data = response.data?.data
        if (Array.isArray(data) && data.length > 0) {
          setNotifs(data)
          setUnreadCount(data.filter((n) => !n.read).length)
        }
      } catch (err) {
        console.warn('Using local notification data:', err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchNotifications()
  }, [setUnreadCount])

  const filtered = notifs.filter((n) => {
    if (filter === 'unread') return !n.read
    if (filter === 'mention') return n.type === 'mention'
    if (filter === 'task') return n.type === 'task' || n.type === 'deadline'
    if (filter === 'upload') return n.type === 'upload'
    return true
  })

  const unreadCount = notifs.filter((n) => !n.read).length

  const markAllRead = async () => {
    try {
      await notificationService.markAllAsRead()
    } catch {
      // optimistic
    }
    setNotifs(notifs.map((n) => ({ ...n, read: true })))
    setUnreadCount(0)
  }

  const markSingleRead = async (id) => {
    try {
      await notificationService.markAsRead(id)
    } catch {
      // optimistic
    }
    const next = notifs.map((n) => (n._id === id ? { ...n, read: true } : n))
    setNotifs(next)
    setUnreadCount(next.filter((n) => !n.read).length)
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Bar */}
      <div className="card-soft p-6 bg-white border-[#E8E0F2] flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🔔</span>
            <h1 className="text-xl font-bold text-[#493A63]">Notifications & Updates</h1>
          </div>
          <p className="text-xs text-[#776B88] mt-1">
            {unreadCount > 0 ? `${unreadCount} unread collaboration notifications` : 'All caught up!'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-[#F8F5FF] p-1 rounded-xl border border-[#E8E0F2] text-xs font-bold text-[#493A63]">
            {[
              { id: 'all', label: 'All' },
              { id: 'unread', label: `Unread (${unreadCount})` },
              { id: 'mention', label: 'Mentions' },
              { id: 'task', label: 'Tasks' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  filter === tab.id
                    ? 'bg-white shadow-xs text-[#9B7EDB]'
                    : 'text-[#776B88] hover:text-[#493A63]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="px-4 py-2 rounded-xl bg-[#E9DFFF] hover:bg-[#9B7EDB] hover:text-white text-[#493A63] font-bold text-xs transition-colors"
            >
              Mark all read
            </button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="card-soft p-4 bg-white border-[#E8E0F2] space-y-3">
        {loading ? (
          <div className="p-8 text-center text-xs font-semibold text-[#776B88]">Loading notifications...</div>
        ) : (
          filtered.map((n) => (
            <div
              key={n._id}
              onClick={() => markSingleRead(n._id)}
              className={`p-4 rounded-2xl border transition-all flex items-start gap-4 cursor-pointer ${
                !n.read
                  ? 'bg-[#F3ECFE] border-[#C9B8E8] shadow-xs'
                  : 'bg-white border-[#E8E0F2] hover:border-[#C9B8E8]'
              }`}
            >
              <div className="w-10 h-10 rounded-2xl bg-white border border-[#E8E0F2] flex items-center justify-center text-lg shrink-0 shadow-xs">
                {n.type === 'mention' ? '💬' : n.type === 'upload' ? '📁' : n.type === 'task' ? '📝' : n.type === 'deadline' ? '⏰' : '🔔'}
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-[#E9DFFF] text-[#493A63]">
                    {n.type || 'Notice'}
                  </span>
                  <span className="text-[10px] text-[#776B88]">
                    {new Date(n.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className={`text-xs md:text-sm mt-1 ${!n.read ? 'font-bold text-[#493A63]' : 'font-semibold text-[#776B88]'}`}>
                  {n.message}
                </p>
              </div>

              {!n.read && (
                <span className="w-2.5 h-2.5 rounded-full bg-[#9B7EDB] shrink-0 mt-2" />
              )}
            </div>
          ))
        )}

        {!loading && filtered.length === 0 && (
          <div className="p-8 text-center text-xs font-semibold text-[#776B88]">
            No notifications matching this filter.
          </div>
        )}
      </div>
    </div>
  )
}
