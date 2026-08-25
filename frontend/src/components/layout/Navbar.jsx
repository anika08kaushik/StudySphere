import { useLocation, Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { useAuth } from '../../hooks/useAuth'
import { useApp } from '../../context/AppContext'
import Avatar from '../ui/Avatar'

const pageTitles = {
  '/dashboard': '🏡 Digital Campus',
  '/groups': '👥 Study Community',
  '/tasks': '📝 Task Board',
  '/focus': '📚 Virtual Library',
  '/calendar': '📅 Campus Calendar',
  '/resources': '📁 Resource Library',
  '/chat': '💬 Student Lounge',
  '/notifications': '🔔 Notifications',
  '/profile': '👤 My Room',
}

export default function Navbar() {
  const { user, logout } = useAuth()
  const { avatarConfig, unreadCount } = useApp()
  const location = useLocation()
  const title = pageTitles[location.pathname] || '🎓 StudySphere'

  return (
    <header className="relative flex items-center justify-between px-4 md:px-6 py-3.5 shrink-0 z-10 bg-white border-b border-[#E8E0F2]">
      <div className="relative flex items-center justify-between w-full">
        <motion.h1
          key={title}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="text-lg md:text-xl font-bold text-[#493A63]"
        >
          {title}
        </motion.h1>

        <div className="flex items-center gap-3">
          <Link
            to="/notifications"
            className="relative p-2 text-[#776B88] hover:text-[#493A63] hover:bg-[#F8F5FF] rounded-xl transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 px-1.5 py-0.5 text-[10px] font-bold bg-[#9B7EDB] text-white rounded-full leading-none shadow-xs">
                {unreadCount}
              </span>
            )}
          </Link>

          <div className="flex items-center gap-2 pl-3 border-l border-[#E8E0F2]">
            <Avatar name={avatarConfig?.name || user?.name || 'Anika'} size="sm" status={user?.status || 'online'} />
            <span className="text-sm font-semibold text-[#493A63] hidden md:block">
              {avatarConfig?.name || user?.name?.split(' ')[0] || 'Anika'}
            </span>
            <button
              onClick={logout}
              className="text-[#776B88] hover:text-red-500 transition-colors p-1 rounded-lg hover:bg-red-50"
              title="Logout"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}

