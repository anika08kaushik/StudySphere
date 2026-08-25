import { useState, useEffect } from 'react'
import LazyCanvas from '../../components/three/shared/LazyCanvas'
import LibraryScene from '../../components/three/library/LibraryScene'
import AvatarPicker from '../../components/three/avatars/AvatarPicker'
import { useApp } from '../../context/AppContext'

export default function FocusRoom() {
  const { avatarConfig, isStudying, setIsStudying } = useApp()
  const [selectedDeskIndex, setSelectedDeskIndex] = useState(null)
  const [showAvatarPicker, setShowAvatarPicker] = useState(false)
  const [cameraMode, setCameraMode] = useState('EXPLORE')
  const [timerSecs, setTimerSecs] = useState(25 * 60)
  const [timerRunning, setTimerRunning] = useState(false)

  // Countdown timer effect
  useEffect(() => {
    let interval = null
    if (timerRunning && timerSecs > 0) {
      interval = setInterval(() => {
        setTimerSecs((prev) => prev - 1)
      }, 1000)
    } else if (timerSecs === 0) {
      setTimerRunning(false)
    }
    return () => clearInterval(interval)
  }, [timerRunning, timerSecs])

  const handleSelectDesk = (index) => {
    setSelectedDeskIndex(index)
    setCameraMode('DESK_VIEW')
  }

  const handleAvatarArrived = () => {
    setIsStudying(true)
    setTimerRunning(true)
    setCameraMode('STUDY_VIEW')
  }

  const handleLeaveDesk = () => {
    setSelectedDeskIndex(null)
    setIsStudying(false)
    setTimerRunning(false)
    setTimerSecs(25 * 60)
    setCameraMode('EXPLORE')
  }

  const toggleTimer = () => {
    setTimerRunning(!timerRunning)
  }

  const formatTimer = (secs) => {
    const mins = Math.floor(secs / 60)
    const remainder = secs % 60
    return `${String(mins).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`
  }

  return (
    <div className="space-y-4 max-w-6xl mx-auto relative">
      {/* Top Header Bar */}
      <div className="card-soft p-4 bg-white border-[#E8E0F2] flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">📚</span>
            <h1 className="text-lg font-bold text-[#493A63]">3D Virtual Library</h1>
          </div>
          <p className="text-xs text-[#776B88]">
            {selectedDeskIndex === null
              ? 'Select an available desk to start studying'
              : isStudying
              ? `Focused at Desk 0${selectedDeskIndex + 1}`
              : `Walking to Desk 0${selectedDeskIndex + 1}...`}
          </p>
        </div>

        {/* Action Controls & Avatar Preview Pill */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAvatarPicker(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#F8F5FF] hover:bg-[#E9DFFF] border border-[#E8E0F2] text-xs font-bold text-[#493A63] transition-all"
          >
            <span className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: avatarConfig?.outfitColor || '#9B7EDB' }}>
              {avatarConfig?.name?.[0] || 'A'}
            </span>
            <span>Avatar: {avatarConfig?.name || 'Anika'}</span>
            <span className="text-[#9B7EDB]">⚙️</span>
          </button>

          {isStudying && (
            <button
              onClick={handleLeaveDesk}
              className="px-4 py-2 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 font-bold text-xs transition-all"
            >
              Leave Desk
            </button>
          )}
        </div>
      </div>

      {/* 3D Library Canvas Container */}
      <div className="relative w-full h-[540px] md:h-[640px] rounded-3xl overflow-hidden card-soft border-[#E8E0F2] bg-[#F8F5FF]">
        {/* Floating Camera Toolbar */}
        <div className="absolute top-4 left-4 z-20 flex items-center gap-1.5 p-1.5 rounded-2xl bg-white/90 backdrop-blur-md border border-[#E8E0F2] shadow-sm">
          <button
            onClick={() => setCameraMode('OVERVIEW')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              cameraMode === 'OVERVIEW'
                ? 'bg-[#E9DFFF] text-[#493A63] shadow-xs'
                : 'text-[#776B88] hover:text-[#493A63]'
            }`}
          >
            🏢 Overview
          </button>
          <button
            onClick={() => setCameraMode('EXPLORE')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              cameraMode === 'EXPLORE'
                ? 'bg-[#E9DFFF] text-[#493A63] shadow-xs'
                : 'text-[#776B88] hover:text-[#493A63]'
            }`}
          >
            🧭 Explore
          </button>
          {selectedDeskIndex !== null && (
            <>
              <button
                onClick={() => setCameraMode('DESK_VIEW')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  cameraMode === 'DESK_VIEW'
                    ? 'bg-[#E9DFFF] text-[#493A63] shadow-xs'
                    : 'text-[#776B88] hover:text-[#493A63]'
                }`}
              >
                🪑 Desk View
              </button>
              <button
                onClick={() => setCameraMode('STUDY_VIEW')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  cameraMode === 'STUDY_VIEW'
                    ? 'bg-[#E9DFFF] text-[#493A63] shadow-xs'
                    : 'text-[#776B88] hover:text-[#493A63]'
                }`}
              >
                👩🎓 Study View
              </button>
            </>
          )}
        </div>

        {/* Floating Focus Timer Display */}
        {isStudying && (
          <div className="absolute top-4 right-4 z-20 p-4 rounded-2xl bg-white/95 backdrop-blur-md border border-[#E8E0F2] shadow-md flex items-center gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#9B7EDB]">FOCUS TIMER</p>
              <p className="text-2xl font-black font-mono text-[#493A63]">{formatTimer(timerSecs)}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleTimer}
                className="w-10 h-10 rounded-xl bg-[#E9DFFF] hover:bg-[#9B7EDB] hover:text-white text-[#493A63] font-bold text-sm flex items-center justify-center transition-colors shadow-xs"
              >
                {timerRunning ? '⏸' : '▶'}
              </button>
            </div>
          </div>
        )}

        <LazyCanvas camera={[0, 6, 9]} shadows>
          <LibraryScene
            userAvatarConfig={avatarConfig}
            selectedDeskIndex={selectedDeskIndex}
            onSelectDesk={handleSelectDesk}
            onAvatarArrived={handleAvatarArrived}
            cameraMode={cameraMode}
          />
        </LazyCanvas>
      </div>

      {/* Avatar Picker Modal Overlay */}
      {showAvatarPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#493A63]/30 backdrop-blur-sm">
          <div className="w-full max-w-xl">
            <AvatarPicker onClose={() => setShowAvatarPicker(false)} />
          </div>
        </div>
      )}
    </div>
  )
}

