import { NavLink } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useApp } from '../../context/AppContext'
import Avatar from '../ui/Avatar'

const navItems = [
  { to: '/dashboard', label: 'Campus', icon: '🏡' },
  { to: '/focus', label: 'Virtual Library', icon: '📚' },
  { to: '/groups', label: 'Community', icon: '👥' },
  { to: '/tasks', label: 'Task Board', icon: '📝' },
  { to: '/calendar', label: 'Calendar', icon: '📅' },
  { to: '/resources', label: 'Resource Library', icon: '📁' },
  { to: '/chat', label: 'Student Lounge', icon: '💬' },
  { to: '/notifications', label: 'Notifications', icon: '🔔' },
  { to: '/profile', label: 'My Room', icon: '👤' },
]

export default function Sidebar() {
  const { user } = useAuth()
  const { isStudying, avatarConfig } = useApp()

  return (
    <aside className="hidden md:flex flex-col w-60 lg:w-64 h-screen shrink-0 relative z-20 bg-white border-r border-[#E8E0F2]">
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-[#E8E0F2]">
          <div className="w-10 h-10 rounded-2xl bg-[#E9DFFF] border border-[#C9B8E8] flex items-center justify-center shadow-sm">
            <span className="text-xl">🎓</span>
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-[#493A63]">StudySphere</h1>
            <p className="text-[11px] text-[#776B88]">Digital Campus</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-[#E9DFFF] text-[#493A63] font-semibold shadow-xs border border-[#C9B8E8]'
                    : 'text-[#776B88] hover:bg-[#F8F5FF] hover:text-[#493A63]'
                }`
              }
            >
              <span className="text-base">{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Active focus session banner */}
        {isStudying && (
          <div className="mx-3 mb-3 p-3.5 rounded-xl bg-[#FCF9EE] border border-[#F6EBD0]">
            <p className="text-[10px] uppercase tracking-wider text-[#9B7EDB] font-bold mb-1 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              Focusing in Library
            </p>
            <p className="text-xs font-medium text-[#493A63]">Session active</p>
          </div>
        )}

        {/* User Card */}
        <div className="px-3 py-3 border-t border-[#E8E0F2]">
          <NavLink
            to="/profile"
            className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-[#F8F5FF] transition-colors"
          >
            <Avatar name={avatarConfig?.name || user?.name || 'Anika'} size="sm" status={user?.status || 'online'} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#493A63] truncate">{avatarConfig?.name || user?.name || 'Anika'}</p>
              <p className="text-xs text-[#776B88] truncate">{user?.email || 'anika@studysphere.edu'}</p>
            </div>
          </NavLink>
        </div>
      </div>
    </aside>
  )
}

