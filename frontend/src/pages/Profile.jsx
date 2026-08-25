import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useApp } from '../context/AppContext'
import AvatarPicker from '../components/three/avatars/AvatarPicker'

export default function Profile() {
  const { user } = useAuth()
  const { avatarConfig } = useApp()
  const [showPickerModal, setShowPickerModal] = useState(false)
  const [department, setDepartment] = useState(user?.department || 'Computer Science')
  const [semester, setSemester] = useState(user?.semester || 6)

  const studentName = avatarConfig?.name || user?.name || 'Anika Kaushik'

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Student Room Header */}
      <div className="card-soft p-6 md:p-8 bg-white border-[#E8E0F2]">
        <div className="flex flex-col md:flex-row items-center gap-6">
          {/* Avatar Preview Card */}
          <div className="relative group">
            <div
              className="w-24 h-24 rounded-3xl flex items-center justify-center text-4xl shadow-md border-2 border-[#E8E0F2] transition-transform group-hover:scale-105"
              style={{ backgroundColor: avatarConfig?.outfitColor || '#9B7EDB' }}
            >
              <span className="text-white font-extrabold">{studentName[0]}</span>
            </div>
            <button
              onClick={() => setShowPickerModal(true)}
              className="absolute -bottom-2 -right-2 px-2.5 py-1 rounded-xl bg-white border border-[#E8E0F2] text-[10px] font-bold text-[#493A63] shadow-xs hover:bg-[#E9DFFF]"
            >
              ✏️ Edit
            </button>
          </div>

          {/* Bio Info */}
          <div className="flex-1 text-center md:text-left space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#E9DFFF] text-[#493A63] text-xs font-bold border border-[#C9B8E8] mb-1">
              <span>🎓</span>
              <span>CAMPUS STUDENT</span>
            </div>
            <h1 className="text-2xl font-extrabold text-[#493A63] tracking-tight">{studentName}</h1>
            <p className="text-xs font-semibold text-[#776B88]">
              {department} • Semester {semester} • Student ID: #2026-CS88
            </p>
            <div className="pt-2 flex flex-wrap gap-2 justify-center md:justify-start">
              <span className="px-2.5 py-1 rounded-xl bg-[#F8F5FF] text-[#493A63] border border-[#E8E0F2] text-xs font-bold">
                🎧 Headphones: {avatarConfig?.accessory || 'Active'}
              </span>
              <span className="px-2.5 py-1 rounded-xl bg-[#F3ECFE] text-[#493A63] border border-[#C9B8E8] text-xs font-bold">
                ✨ Outfit: {avatarConfig?.outfitStyle || 'Lavender Hoodie'}
              </span>
            </div>
          </div>

          <button
            onClick={() => setShowPickerModal(true)}
            className="px-5 py-2.5 rounded-xl bg-[#9B7EDB] hover:bg-[#7A58C1] text-white font-bold text-xs shadow-xs transition-all flex items-center gap-2"
          >
            <span>🎨</span>
            <span>Customize Avatar</span>
          </button>
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card-soft p-5 bg-gradient-to-br from-white to-[#F3ECFE] border-[#E8E0F2]">
          <p className="text-xs font-bold uppercase tracking-wider text-[#9B7EDB] mb-1">Total Focus Time</p>
          <p className="text-2xl font-extrabold text-[#493A63]">42h 15m</p>
          <p className="text-[11px] text-[#776B88] mt-1">Across 84 study sessions</p>
        </div>

        <div className="card-soft p-5 bg-gradient-to-br from-white to-[#FCF9EE] border-[#F6EBD0]">
          <p className="text-xs font-bold uppercase tracking-wider text-amber-700 mb-1">Focus Streak</p>
          <p className="text-2xl font-extrabold text-[#493A63]">12 Days 🔥</p>
          <p className="text-[11px] text-[#776B88] mt-1">Personal best record!</p>
        </div>

        <div className="card-soft p-5 bg-gradient-to-br from-white to-[#F2F7F3] border-[#D9E8DC]">
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-700 mb-1">Groups Joined</p>
          <p className="text-2xl font-extrabold text-[#493A63]">3 Communities</p>
          <p className="text-[11px] text-[#776B88] mt-1">Active contributor</p>
        </div>
      </div>

      {/* Academic Preferences & Bio Form */}
      <div className="card-soft p-6 bg-white border-[#E8E0F2]">
        <h3 className="text-sm font-bold text-[#493A63] uppercase tracking-wider mb-4 pb-2 border-b border-[#E8E0F2]">
          Academic Preferences
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#776B88] uppercase mb-1">
              Major / Department
            </label>
            <input
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E0F2] bg-[#F8F5FF] text-[#493A63] font-semibold text-xs focus:outline-none focus:border-[#9B7EDB]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#776B88] uppercase mb-1">
              Current Semester
            </label>
            <input
              type="number"
              value={semester}
              onChange={(e) => setSemester(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E0F2] bg-[#F8F5FF] text-[#493A63] font-semibold text-xs focus:outline-none focus:border-[#9B7EDB]"
            />
          </div>
        </div>
      </div>

      {/* Avatar Picker Modal Overlay */}
      {showPickerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#493A63]/30 backdrop-blur-sm">
          <div className="w-full max-w-xl">
            <AvatarPicker onClose={() => setShowPickerModal(false)} />
          </div>
        </div>
      )}
    </div>
  )
}

