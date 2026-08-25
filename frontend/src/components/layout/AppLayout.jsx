import { Outlet, NavLink } from 'react-router-dom'
import Sidebar from './Sidebar'
import Navbar from './Navbar'
import PageTransition from '../motion/PageTransition'

const mobileNav = [
  { to: '/dashboard', label: 'Campus', icon: '🏡' },
  { to: '/focus', label: 'Library', icon: '📚' },
  { to: '/groups', label: 'Community', icon: '👥' },
  { to: '/tasks', label: 'Tasks', icon: '📝' },
  { to: '/profile', label: 'My Room', icon: '👤' },
]

export default function AppLayout() {
  return (
    <div className="flex h-screen bg-[#F8F5FF] text-[#493A63] overflow-hidden font-sans">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 md:pb-6 bg-[#F8F5FF]">
          <PageTransition>
            <Outlet />
          </PageTransition>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 px-3 py-2 bg-white border-t border-[#E8E0F2] shadow-lg">
        <div className="flex items-center justify-around py-1">
          {mobileNav.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all ${
                  isActive
                    ? 'text-[#493A63] bg-[#E9DFFF]'
                    : 'text-[#776B88] hover:text-[#493A63]'
                }`
              }
            >
              <span className="text-lg">{icon}</span>
              {label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}

