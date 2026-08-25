import { useState } from 'react'
import { notifications as initialNotifs } from '../../mock/notifications'
import { useApp } from '../../context/AppContext'

export default function Notifications() {
  const { setUnreadCount } = useApp()
  const [notifs, setNotifs] = useState(initialNotifs)
  const [filter, setFilter] = useState('all')

  const filtered = filter === 'unread' ? notifs.filter((n) => !n.read) : notifs
  const unreadCount = notifs.filter((n) => !n.read).length

  const markAllRead = () => {
    setNotifs(notifs.map((n) => ({ ...n, read: true })))
    setUnreadCount(0)
  }

  const markSingleRead = (id) => {
    const next = notifs.map((n) => (n._id === id ? { ...n, read: true } : n))
    setNotifs(next)
    setUnreadCount(next.filter((n) => !n.read).length)
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Bar */}
      <div className="card-soft p-6 bg-white border-[#E8E0F2] flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🔔</span>
            <h1 className="text-xl font-bold text-[#493A63]">Notifications</h1>
          </div>
          <p className="text-xs text-[#776B88] mt-1">
            {unreadCount > 0 ? `${unreadCount} unread updates` : 'All caught up!'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-[#E8E0F2] bg-[#F8F5FF] text-[#493A63] font-semibold text-xs focus:outline-none focus:border-[#9B7EDB]"
          >
            <option value="all">All Notifications</option>
            <option value="unread">Unread Only</option>
          </select>

          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="px-4 py-2 rounded-xl bg-[#E9DFFF] hover:bg-[#9B7EDB] hover:text-white text-[#493A63] font-bold text-xs transition-colors"
            >
              Mark all as read
            </button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="card-soft p-4 bg-white border-[#E8E0F2] space-y-3">
        {filtered.map((n) => (
          <div
            key={n._id}
            onClick={() => markSingleRead(n._id)}
            className={`p-4 rounded-2xl border transition-all flex items-start gap-4 cursor-pointer ${
              !n.read
                ? 'bg-[#F3ECFE] border-[#C9B8E8]'
                : 'bg-white border-[#E8E0F2] hover:border-[#C9B8E8]'
            }`}
          >
            <div className="w-10 h-10 rounded-2xl bg-white border border-[#E8E0F2] flex items-center justify-center text-lg shrink-0 shadow-xs">
              {n.type === 'mention' ? '💬' : n.type === 'upload' ? '📁' : n.type === 'task' ? '📝' : '🔔'}
            </div>

            <div className="flex-1">
              <p className={`text-xs md:text-sm ${!n.read ? 'font-bold text-[#493A63]' : 'font-semibold text-[#776B88]'}`}>
                {n.message}
              </p>
              <p className="text-[10px] text-[#776B88] mt-1">
                {new Date(n.createdAt).toLocaleString()}
              </p>
            </div>

            {!n.read && (
              <span className="w-2.5 h-2.5 rounded-full bg-[#9B7EDB] shrink-0 mt-1" />
            )}
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="p-8 text-center text-xs font-semibold text-[#776B88]">
            No notifications to display.
          </div>
        )}
      </div>
    </div>
  )
}

