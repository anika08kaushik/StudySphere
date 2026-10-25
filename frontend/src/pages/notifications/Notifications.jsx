import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { notifications as initialNotifs } from '../../mock/notifications'
import { useApp } from '../../context/AppContext'
import { useAuth } from '../../hooks/useAuth'
import notificationService from '../../services/notificationService'
import { onNewNotification, offNewNotification } from '../../services/socket'

export default function Notifications() {
  const { setUnreadCount } = useApp()
  const { user } = useAuth()
  const [notifs, setNotifs] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  const currentUserId = user?.id || user?._id || null

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true)
      const response = await notificationService.getNotifications()
      const data = response.data?.data

      if (Array.isArray(data)) {
        setNotifs(data)
        setUnreadCount(data.filter((n) => !n.read).length)
      } else {
        setNotifs([])
        setUnreadCount(0)
      }
    } catch (err) {
      console.warn('Notification fetch warning:', err.message)
      // Only fallback to mock if completely unauthenticated in local dev
      const token = localStorage.getItem('studysphere_token')
      if (!token && process.env.NODE_ENV !== 'production') {
        setNotifs(initialNotifs)
        setUnreadCount(initialNotifs.filter((n) => !n.read).length)
      } else {
        setNotifs([])
        setUnreadCount(0)
      }
    } finally {
      setLoading(false)
    }
  }, [setUnreadCount])

  useEffect(() => {
    fetchNotifications()

    // Real-time listener for incoming notifications
    const handleIncomingNotif = (newNotif) => {
      if (!newNotif) return
      const storedUser = localStorage.getItem('studysphere_user')
      const myId = currentUserId || (storedUser ? JSON.parse(storedUser)?.id || JSON.parse(storedUser)?._id : null)

      const isTargeted = !newNotif.recipient || (myId && String(newNotif.recipient) === String(myId))
      if (isTargeted) {
        setNotifs((prev) => {
          if (prev.some((item) => String(item._id) === String(newNotif._id))) {
            return prev
          }
          const updated = [newNotif, ...prev]
          setUnreadCount(updated.filter((n) => !n.read).length)
          return updated
        })
      }
    }

    onNewNotification(handleIncomingNotif)
    return () => {
      offNewNotification(handleIncomingNotif)
    }
  }, [fetchNotifications, currentUserId, setUnreadCount])

  const filtered = notifs.filter((n) => {
    if (filter === 'unread') return !n.read
    if (filter === 'mention') return n.type === 'mention'
    if (filter === 'task') return n.type === 'task' || n.type === 'deadline'
    if (filter === 'upload') return n.type === 'upload'
    if (filter === 'note') return n.type === 'note' || n.type === 'comment'
    return true
  })

  const unreadCount = notifs.filter((n) => !n.read).length

  const markAllRead = async () => {
    try {
      await notificationService.markAllAsRead()
    } catch {
      // optimistic
    }
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })))
    setUnreadCount(0)
  }

  const markSingleRead = async (id) => {
    try {
      await notificationService.markAsRead(id)
    } catch {
      // optimistic
    }
    setNotifs((prev) => {
      const next = prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      setUnreadCount(next.filter((n) => !n.read).length)
      return next
    })
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'mention':
        return '💬'
      case 'upload':
        return '📁'
      case 'task':
        return '📝'
      case 'deadline':
        return '⏰'
      case 'note':
      case 'comment':
        return '📓'
      case 'focus':
        return '⏱️'
      case 'join':
        return '👥'
      default:
        return '🔔'
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Bar */}
      <div className="card-soft p-6 bg-white border-[#E8E0F2] flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🔔</span>
            <h1 className="text-xl font-bold text-[#493A63]">Notifications & Updates</h1>
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Real-Time
            </span>
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
              { id: 'note', label: 'Notes' },
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
          <div className="p-12 text-center text-xs font-semibold text-[#776B88]">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-[#9B7EDB] mb-2" />
            <p>Loading real-time notifications...</p>
          </div>
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
                {getNotificationIcon(n.type)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-[#E9DFFF] text-[#493A63]">
                    {n.type || 'Notice'}
                  </span>
                  {n.title && (
                    <span className="text-xs font-bold text-[#493A63] truncate">{n.title}</span>
                  )}
                  <span className="text-[10px] text-[#776B88] ml-auto shrink-0">
                    {n.createdAt ? new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                  </span>
                </div>
                <p className={`text-xs md:text-sm mt-1.5 ${!n.read ? 'font-bold text-[#493A63]' : 'font-semibold text-[#776B88]'}`}>
                  {n.message}
                </p>

                {n.groupId && (
                  <div className="mt-2 flex items-center gap-2">
                    <Link
                      to={n.type === 'mention' ? '/chat' : `/groups/${n.groupId}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-[11px] font-bold text-[#9B7EDB] hover:underline flex items-center gap-1"
                    >
                      <span>View in {n.type === 'mention' ? 'Chat' : 'Workspace'}</span>
                      <span>→</span>
                    </Link>
                  </div>
                )}
              </div>

              {!n.read && (
                <span className="w-2.5 h-2.5 rounded-full bg-[#9B7EDB] shrink-0 mt-2" title="Unread" />
              )}
            </div>
          ))
        )}

        {!loading && filtered.length === 0 && (
          <div className="p-12 text-center space-y-2">
            <span className="text-3xl">🔔</span>
            <p className="text-sm font-bold text-[#493A63]">No notifications right now</p>
            <p className="text-xs text-[#776B88]">
              {filter === 'unread'
                ? "You've caught up with all your notifications!"
                : "You're completely up to date with your study groups and peers."}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
