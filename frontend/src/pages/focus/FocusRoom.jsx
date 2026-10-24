import { useState, useEffect, useRef, useMemo } from 'react'
import { Link } from 'react-router-dom'
import LazyCanvas from '../../components/three/shared/LazyCanvas'
import LibraryScene from '../../components/three/library/LibraryScene'
import AvatarPicker from '../../components/three/avatars/AvatarPicker'
import ExplorePeoplePanel from '../../components/focus/ExplorePeoplePanel'
import YearHeatmap from '../../components/focus/YearHeatmap'
import { useApp } from '../../context/AppContext'
import api from '../../services/api'
import focusService from '../../services/focusService'
import socket, {
  connectSocket,
  joinFocusRoom,
  leaveFocusRoom,
  selectFocusDesk,
  leaveFocusDesk,
  sendFocusTimerAction,
  updateFocusStatus,
  onFocusPresenceUpdate,
  offFocusPresenceUpdate,
  onFocusTimerSync,
  offFocusTimerSync,
  onFocusJoined,
  offFocusJoined,
  onChatRequestNew,
  offChatRequestNew,
  onChatRequestUpdate,
  offChatRequestUpdate,
} from '../../services/socket'

const TIMER_MODES = {
  FOCUS: { label: '🍅 Focus', duration: 25 * 60, targetMinutes: 25, type: 'FOCUS' },
  SHORT_BREAK: { label: '☕ Short Break', duration: 5 * 60, targetMinutes: 5, type: 'SHORT_BREAK' },
  LONG_BREAK: { label: '🌴 Long Break', duration: 15 * 60, targetMinutes: 15, type: 'LONG_BREAK' },
}

export default function FocusRoom() {
  const { avatarConfig, isStudying, setIsStudying } = useApp()

  // Groups and Room Selection
  const [groups, setGroups] = useState([])
  const [selectedGroupId, setSelectedGroupId] = useState('campus_lounge')

  // Desk and 3D State
  const [selectedDeskIndex, setSelectedDeskIndex] = useState(null)
  const [showAvatarPicker, setShowAvatarPicker] = useState(false)
  const [cameraMode, setCameraMode] = useState('EXPLORE')

  // Real-time Participants & Occupants
  const [participants, setParticipants] = useState([])
  const [showParticipantsDrawer, setShowParticipantsDrawer] = useState(false)

  // Phase 9: Explore People & private chat
  const [showExplorePanel, setShowExplorePanel] = useState(false)
  const [pendingExploreCount, setPendingExploreCount] = useState(0)

  // Phase 11: 365-day focus view
  const [showYearView, setShowYearView] = useState(false)

  // Pomodoro Timer State
  const [timerMode, setTimerMode] = useState('FOCUS')
  const [timerSecs, setTimerSecs] = useState(TIMER_MODES.FOCUS.duration)
  const [timerRunning, setTimerRunning] = useState(false)
  // Phase 8/7: shared toggle survives refresh so a shared room timer re-syncs on rejoin
  const [isSharedTimer, setIsSharedTimer] = useState(() => {
    try { return localStorage.getItem('focus_shared_timer') === 'true' } catch { return false }
  })
  useEffect(() => {
    try { localStorage.setItem('focus_shared_timer', String(isSharedTimer)) } catch { /* ignore */ }
  }, [isSharedTimer])

  // Session Tracking (Phase 4 & 5: Does not count paused time as focused time)
  const [activeFocusedSeconds, setActiveFocusedSeconds] = useState(0)
  const sessionStartTimeRef = useRef(null)
  const [sessionCompletedAlert, setSessionCompletedAlert] = useState('')

  // Phase 7: persistent timer state
  const timerMirrorRef = useRef({})
  const sessionEventIdRef = useRef(null)
  const newSessionEventId = () => `evt-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`

  // Keep a mirror of the latest timer values so persistence helpers and the
  // throttled interval always save fresh data without stale closures.
  useEffect(() => {
    timerMirrorRef.current = {
      mode: timerMode,
      remainingSeconds: timerSecs,
      isRunning: timerRunning,
      focusElapsedSeconds: activeFocusedSeconds,
      sessionStartedAt: sessionStartTimeRef.current,
      sessionTargetMinutes: 25,
    }
  })

  const persistTimerState = async (override = {}) => {
    try {
      await focusService.saveTimerState({
        groupId: selectedGroupId,
        ...timerMirrorRef.current,
        ...override,
      })
    } catch (err) {
      console.warn('Failed to persist timer state:', err?.message)
    }
  }

  // Phase 9: live chat-request badge + accepted/declined toast
  useEffect(() => {
    const handleRequestNew = () => {
      setPendingExploreCount((count) => count + 1)
    }
    const handleRequestUpdate = (data) => {
      setPendingExploreCount(0)
      if (data?.status === 'ACCEPTED') {
        setSessionCompletedAlert('🤝 Connection accepted - you can now chat privately!')
      } else if (data?.status === 'DECLINED') {
        setSessionCompletedAlert('Your chat request was declined.')
      }
    }
    onChatRequestNew(handleRequestNew)
    onChatRequestUpdate(handleRequestUpdate)
    return () => {
      offChatRequestNew(handleRequestNew)
      offChatRequestUpdate(handleRequestUpdate)
    }
  }, [])

  // Load Groups
  useEffect(() => {
    const loadGroups = async () => {
      try {
        let loaded = []
        try {
          const resMe = await api.get('/groups/me')
          loaded = resMe.data?.data || []
        } catch {
          const resAll = await api.get('/groups')
          loaded = resAll.data?.data || []
        }

        if (loaded.length === 0) {
          const resAll = await api.get('/groups')
          loaded = resAll.data?.data || []
        }

        setGroups(loaded)
        if (loaded.length > 0) {
          setSelectedGroupId(String(loaded[0]._id))
        }
      } catch (err) {
        console.warn('Unable to load groups for focus room:', err.message)
      }
    }

    loadGroups()
  }, [])

  // Connect Socket & Join Focus Room
  useEffect(() => {
    connectSocket()

    const handlePresence = (data) => {
      if (String(data.groupId) === String(selectedGroupId)) {
        setParticipants(data.participants || [])
      }
    }

    const handleJoined = (data) => {
      if (String(data.groupId) === String(selectedGroupId)) {
        setParticipants(data.participants || [])
        if (data.timerState && isSharedTimer) {
          setTimerSecs(data.timerState.remainingSeconds)
          setTimerRunning(data.timerState.isRunning)
          if (data.timerState.mode && TIMER_MODES[data.timerState.mode]) {
            setTimerMode(data.timerState.mode)
          }
        }
      }
    }

    const handleTimerSync = (data) => {
      if (String(data.groupId) === String(selectedGroupId) && isSharedTimer) {
        const { timerState } = data
        if (timerState) {
          setTimerSecs(timerState.remainingSeconds)
          setTimerRunning(timerState.isRunning)
          if (timerState.mode && TIMER_MODES[timerState.mode]) {
            setTimerMode(timerState.mode)
          }
        }
      }
    }

    onFocusPresenceUpdate(handlePresence)
    onFocusJoined(handleJoined)
    onFocusTimerSync(handleTimerSync)

    // Join room
    joinFocusRoom(
      selectedGroupId,
      avatarConfig,
      selectedDeskIndex,
      isStudying ? 'STUDYING' : 'IDLE'
    )

    return () => {
      leaveFocusRoom(selectedGroupId)
      offFocusPresenceUpdate(handlePresence)
      offFocusJoined(handleJoined)
      offFocusTimerSync(handleTimerSync)
    }
  }, [selectedGroupId, avatarConfig])

  // Phase 7: Restore the user's personal timer for this room after refresh.
  // Server derives elapsed time from lastRunningUpdatedAt, so a timer that ran
  // while the tab was closed resumes with the correct remaining seconds.
  useEffect(() => {
    if (isSharedTimer) return // shared timers re-sync via focus:joined
    let cancelled = false

    const restore = async () => {
      // Never clobber an already-active local session (e.g. a quick group switch)
      const live = timerMirrorRef.current || {}
      if (live.isRunning || (live.focusElapsedSeconds || 0) > 0) return

      try {
        const res = await focusService.getTimerState(selectedGroupId)
        if (cancelled) return
        const data = res.data?.data
        if (!data) return

        // Timer finished while the tab was away: record it once, then reset.
        if (data.completedWhileAway) {
          if (data.mode === 'FOCUS' && (data.focusElapsedSeconds || 0) > 0) {
            try {
              await focusService.recordSession({
                eventId: `away-${newSessionEventId()}`,
                groupId: selectedGroupId === 'campus_lounge' ? null : selectedGroupId,
                startTime: data.sessionStartedAt || new Date(Date.now() - data.focusElapsedSeconds * 1000),
                endTime: new Date(),
                duration: data.focusElapsedSeconds,
                status: 'COMPLETED',
                sessionType: 'FOCUS',
                targetMinutes: data.sessionTargetMinutes || 25,
              })
            } catch (err) {
              console.error('Failed to record away-completed session:', err)
            }
          }
          focusService.clearTimerState(selectedGroupId).catch(() => {})
          return
        }

        const hasMeaningfulState =
          data.isRunning ||
          (data.focusElapsedSeconds || 0) > 0 ||
          (data.remainingSeconds || 0) < (TIMER_MODES[data.mode]?.duration ?? 0)
        if (!hasMeaningfulState) return

        setTimerMode(TIMER_MODES[data.mode] ? data.mode : 'FOCUS')
        setTimerSecs(data.remainingSeconds || TIMER_MODES.FOCUS.duration)
        setTimerRunning(Boolean(data.isRunning))
        setActiveFocusedSeconds(data.focusElapsedSeconds || 0)
        sessionStartTimeRef.current = data.sessionStartedAt ? new Date(data.sessionStartedAt) : null
        if (!sessionEventIdRef.current) {
          sessionEventIdRef.current = newSessionEventId()
        }
      } catch (err) {
        console.warn('Unable to restore timer state:', err?.message)
      }
    }

    restore()
    return () => {
      cancelled = true
    }
  }, [selectedGroupId, isSharedTimer])

  // Throttled persistence while the timer is running (every 5s). The server
  // anchors remaining time at each save, so a refresh loses at most ~5s.
  useEffect(() => {
    if (!timerRunning) return
    const id = setInterval(() => {
      persistTimerState()
    }, 5000)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timerRunning])

  // Map participants to desk indices for 3D LibraryScene
  const occupantsMap = useMemo(() => {
    const map = {}
    participants.forEach((p) => {
      if (typeof p.deskIndex === 'number' && p.socketId !== socket.id) {
        map[p.deskIndex] = p
      }
    })
    return map
  }, [participants])

  // Pomodoro Countdown & Elapsed Time Tracker
  useEffect(() => {
    let interval = null
    if (timerRunning && timerSecs > 0) {
      if (!sessionStartTimeRef.current) {
        sessionStartTimeRef.current = new Date()
        if (!sessionEventIdRef.current) {
          sessionEventIdRef.current = newSessionEventId()
        }
      }

      interval = setInterval(() => {
        // Side effects must not live inside state updaters: React may invoke an
        // updater more than once, which would record duplicate sessions.
        if (timerSecs <= 1) {
          clearInterval(interval)
          setTimerSecs(0)
          handleTimerComplete()
          return
        }
        setTimerSecs((prev) => prev - 1)

        // Only count focused seconds when in FOCUS mode and running (excluding pause!)
        if (timerMode === 'FOCUS') {
          setActiveFocusedSeconds((prev) => prev + 1)
        }
      }, 1000)
    }

    return () => clearInterval(interval)
  }, [timerRunning, timerSecs, timerMode])

  // Handle Timer Complete
  const handleTimerComplete = async () => {
    setTimerRunning(false)
    const completedMode = timerMode
    const duration = TIMER_MODES[completedMode].duration

    setSessionCompletedAlert(`🎉 Awesome work! You finished your ${TIMER_MODES[completedMode].label} session!`)

    // Save session to backend (idempotent via eventId - no duplicate records)
    if (completedMode === 'FOCUS') {
      try {
        await focusService.recordSession({
          eventId: sessionEventIdRef.current || newSessionEventId(),
          groupId: selectedGroupId === 'campus_lounge' ? null : selectedGroupId,
          startTime: sessionStartTimeRef.current || new Date(Date.now() - duration * 1000),
          endTime: new Date(),
          duration: activeFocusedSeconds || duration,
          status: 'COMPLETED',
          sessionType: 'FOCUS',
          targetMinutes: 25,
        })
      } catch (err) {
        console.error('Failed to record completed focus session:', err)
      }
    }

    // This session is finished: reset its counters so the next pomodoro round
    // records its own duration instead of accumulating across rounds.
    setActiveFocusedSeconds(0)
    sessionStartTimeRef.current = null
    sessionEventIdRef.current = null
    // Update the mirror immediately: the persist inside switchTimerMode below
    // runs before the next render would refresh it, and must not resurrect the
    // just-finished session's elapsed focus time.
    timerMirrorRef.current = {
      ...timerMirrorRef.current,
      isRunning: false,
      focusElapsedSeconds: 0,
      sessionStartedAt: null,
    }

    // Switch automatically to Short Break or Focus
    if (completedMode === 'FOCUS') {
      switchTimerMode('SHORT_BREAK')
    } else {
      switchTimerMode('FOCUS')
    }
  }

  // Timer Mode Switcher (Focus, Short Break, Long Break)
  const switchTimerMode = (modeKey) => {
    const config = TIMER_MODES[modeKey]
    if (!config) return

    setTimerRunning(false)
    setTimerMode(modeKey)
    setTimerSecs(config.duration)

    persistTimerState({
      isRunning: false,
      mode: modeKey,
      remainingSeconds: config.duration,
      focusElapsedSeconds: timerMirrorRef.current?.focusElapsedSeconds || 0,
    })

    if (isSharedTimer) {
      sendFocusTimerAction(selectedGroupId, 'mode_change', modeKey, config.duration)
    }

    updateFocusStatus(selectedGroupId, modeKey === 'FOCUS' ? 'STUDYING' : 'BREAK')
  }

  // Timer Controls
  const handleStartTimer = () => {
    setTimerRunning(true)
    if (!sessionStartTimeRef.current) {
      sessionStartTimeRef.current = new Date()
      sessionEventIdRef.current = newSessionEventId()
    }
    persistTimerState({
      isRunning: true,
      mode: timerMode,
      remainingSeconds: timerSecs,
      focusElapsedSeconds: activeFocusedSeconds,
      sessionStartedAt: sessionStartTimeRef.current,
    })
    if (isSharedTimer) {
      sendFocusTimerAction(selectedGroupId, 'start', timerMode, timerSecs)
    }
    updateFocusStatus(selectedGroupId, 'STUDYING')
  }

  const handlePauseTimer = () => {
    // Freeze exact values at pause time - paused wall-clock is never recorded.
    persistTimerState({
      isRunning: false,
      mode: timerMode,
      remainingSeconds: timerSecs,
      focusElapsedSeconds: activeFocusedSeconds,
      sessionStartedAt: sessionStartTimeRef.current,
    })
    setTimerRunning(false)
    if (isSharedTimer) {
      sendFocusTimerAction(selectedGroupId, 'pause', timerMode, timerSecs)
    }
    updateFocusStatus(selectedGroupId, 'IDLE')
  }

  const handleResetTimer = () => {
    setTimerRunning(false)
    const defaultSecs = TIMER_MODES[timerMode].duration
    setTimerSecs(defaultSecs)
    focusService.clearTimerState(selectedGroupId).catch(() => {})
    if (isSharedTimer) {
      sendFocusTimerAction(selectedGroupId, 'reset', timerMode, defaultSecs)
    }
  }

  const handleStopAndSave = async () => {
    setTimerRunning(false)
    const duration = activeFocusedSeconds

    if (timerMode === 'FOCUS' && duration >= 30) {
      try {
        await focusService.recordSession({
          eventId: sessionEventIdRef.current || newSessionEventId(),
          groupId: selectedGroupId === 'campus_lounge' ? null : selectedGroupId,
          startTime: sessionStartTimeRef.current || new Date(Date.now() - duration * 1000),
          endTime: new Date(),
          duration,
          status: 'INTERRUPTED',
          sessionType: 'FOCUS',
          targetMinutes: 25,
        })
      } catch (err) {
        console.error('Failed to record interrupted focus session:', err)
      }
    }

    setActiveFocusedSeconds(0)
    sessionStartTimeRef.current = null
    sessionEventIdRef.current = null
    setTimerSecs(TIMER_MODES[timerMode].duration)
    focusService.clearTimerState(selectedGroupId).catch(() => {})
  }

  // Desk Interactions
  const handleSelectDesk = (index) => {
    setSelectedDeskIndex(index)
    setCameraMode('DESK_VIEW')
    selectFocusDesk(selectedGroupId, index, avatarConfig)
  }

  const handleAvatarArrived = () => {
    setIsStudying(true)
    handleStartTimer()
    setCameraMode('STUDY_VIEW')
    updateFocusStatus(selectedGroupId, 'STUDYING')
  }

  const handleLeaveDesk = () => {
    if (timerRunning && activeFocusedSeconds >= 30) {
      handleStopAndSave()
    }
    setSelectedDeskIndex(null)
    setIsStudying(false)
    setTimerRunning(false)
    setTimerSecs(TIMER_MODES.FOCUS.duration)
    setCameraMode('EXPLORE')
    leaveFocusDesk(selectedGroupId)
    updateFocusStatus(selectedGroupId, 'IDLE')
  }

  const formatTimer = (secs) => {
    const mins = Math.floor(secs / 60)
    const remainder = secs % 60
    return `${String(mins).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`
  }

  const selectedGroupObj = groups.find((g) => String(g._id) === String(selectedGroupId))

  return (
    <div className="space-y-4 max-w-7xl mx-auto relative px-2 md:px-4 py-2">
      {/* Session Completed Alert Banner */}
      {sessionCompletedAlert && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-2xl p-4 flex items-center justify-between shadow-sm animate-bounce-short">
          <div className="flex items-center gap-2.5 font-bold text-xs md:text-sm">
            <span>🎉</span>
            <span>{sessionCompletedAlert}</span>
          </div>
          <button
            onClick={() => setSessionCompletedAlert('')}
            className="text-emerald-600 hover:text-emerald-900 font-bold px-2 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Header Card */}
      <div className="card-soft p-4 bg-white border-[#E8E0F2] flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="text-2xl p-2 rounded-xl bg-[#F3ECFE] border border-[#C9B8E8]">📚</div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-[#493A63]">3D Focus Room & Library</h1>
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#EBF7EE] text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Live Socket</span>
              </span>
            </div>
            <p className="text-xs text-[#776B88]">
              {selectedDeskIndex === null
                ? 'Select any available desk to sit down and begin studying'
                : isStudying
                  ? `Focused at Desk 0${selectedDeskIndex + 1}`
                  : `Walking to Desk 0${selectedDeskIndex + 1}...`}
            </p>
          </div>
        </div>

        {/* Room Switcher, Presence Pill & Controls */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Study Group Focus Room Selector */}
          <div className="flex items-center gap-1.5 bg-[#F8F5FF] border border-[#E8E0F2] px-2.5 py-1.5 rounded-xl">
            <span className="text-xs">🚪</span>
            <select
              value={selectedGroupId}
              onChange={(e) => {
                leaveFocusRoom(selectedGroupId)
                // Freeze the saved timer for this room paused, so switching
                // rooms does not keep accruing wall-clock focused time in the
                // background while nobody is here.
                persistTimerState({ isRunning: false })
                setSelectedGroupId(e.target.value)
              }}
              className="bg-transparent text-xs font-bold text-[#493A63] focus:outline-none cursor-pointer"
            >
              <option value="campus_lounge">Campus Lounge (Global)</option>
              {groups.map((group) => (
                <option key={group._id} value={group._id}>
                  {group.name} Room
                </option>
              ))}
            </select>
          </div>

          {/* Active Participants Button */}
          <button
            onClick={() => setShowParticipantsDrawer(!showParticipantsDrawer)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F8F5FF] hover:bg-[#F3ECFE] border border-[#E8E0F2] text-xs font-bold text-[#493A63] cursor-pointer transition-colors"
          >
            <span>👥</span>
            <span>{participants.length} in room</span>
          </button>

          {/* Phase 11: 365-Day Focus View */}
          <button
            onClick={() => setShowYearView(true)}
            title="Year-at-a-glance focus activity"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F8F5FF] hover:bg-[#F3ECFE] border border-[#E8E0F2] text-xs font-bold text-[#493A63] cursor-pointer transition-colors"
          >
            <span>🗓️</span>
            <span>365</span>
          </button>

          {/* Phase 10: Calendar Link */}
          <Link
            to="/calendar"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F8F5FF] hover:bg-[#F3ECFE] border border-[#E8E0F2] text-xs font-bold text-[#493A63] transition-colors"
          >
            <span>📅</span>
          </Link>

          {/* Explore People & Private Chat (Phase 9) */}
          <button
            onClick={() => {
              setShowExplorePanel(!showExplorePanel)
              setPendingExploreCount(0)
            }}
            className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F8F5FF] hover:bg-[#F3ECFE] border border-[#E8E0F2] text-xs font-bold text-[#493A63] cursor-pointer transition-colors"
          >
            <span>🧭</span>
            <span>Explore</span>
            {pendingExploreCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center animate-pulse">
                {pendingExploreCount}
              </span>
            )}
          </button>

          {/* Avatar Settings */}
          <button
            onClick={() => setShowAvatarPicker(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F8F5FF] hover:bg-[#E9DFFF] border border-[#E8E0F2] text-xs font-bold text-[#493A63] transition-all cursor-pointer"
          >
            <span
              className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
              style={{ backgroundColor: avatarConfig?.outfitColor || '#9B7EDB' }}
            >
              {avatarConfig?.name?.[0] || 'A'}
            </span>
            <span>Avatar</span>
            <span className="text-[#9B7EDB]">⚙️</span>
          </button>

          {/* Leave Desk Button */}
          {selectedDeskIndex !== null && (
            <button
              onClick={handleLeaveDesk}
              className="px-3.5 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 font-bold text-xs transition-all cursor-pointer"
            >
              Leave Desk
            </button>
          )}
        </div>
      </div>

      {/* 3D Library Canvas Container */}
      <div className="relative w-full h-[560px] md:h-[660px] rounded-3xl overflow-hidden card-soft border-[#E8E0F2] bg-[#F8F5FF] shadow-inner">
        {/* Floating Camera Toolbar */}
        <div className="absolute top-4 left-4 z-20 flex items-center gap-1.5 p-1.5 rounded-2xl bg-white/95 backdrop-blur-md border border-[#E8E0F2] shadow-sm">
          <button
            onClick={() => setCameraMode('OVERVIEW')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              cameraMode === 'OVERVIEW'
                ? 'bg-[#E9DFFF] text-[#493A63] shadow-xs'
                : 'text-[#776B88] hover:text-[#493A63]'
            }`}
          >
            🏢 Overview
          </button>
          <button
            onClick={() => setCameraMode('EXPLORE')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
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
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  cameraMode === 'DESK_VIEW'
                    ? 'bg-[#E9DFFF] text-[#493A63] shadow-xs'
                    : 'text-[#776B88] hover:text-[#493A63]'
                }`}
              >
                🪑 Desk
              </button>
              <button
                onClick={() => setCameraMode('STUDY_VIEW')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  cameraMode === 'STUDY_VIEW'
                    ? 'bg-[#E9DFFF] text-[#493A63] shadow-xs'
                    : 'text-[#776B88] hover:text-[#493A63]'
                }`}
              >
                👩‍🎓 Focus View
              </button>
            </>
          )}
        </div>

        {/* Floating Pomodoro Timer Widget (Phase 4) */}
        <div className="absolute top-4 right-4 z-20 p-4 rounded-3xl bg-white/95 backdrop-blur-md border border-[#E8E0F2] shadow-lg max-w-xs w-full space-y-3 transition-all">
          {/* Mode Selector Pills */}
          <div className="grid grid-cols-3 gap-1 bg-[#F8F5FF] p-1 rounded-2xl border border-[#E8E0F2]">
            {Object.keys(TIMER_MODES).map((modeKey) => (
              <button
                key={modeKey}
                onClick={() => switchTimerMode(modeKey)}
                className={`py-1 px-1.5 rounded-xl text-[10px] font-bold transition-all cursor-pointer text-center ${
                  timerMode === modeKey
                    ? 'bg-white text-[#493A63] shadow-xs border border-[#E8E0F2]'
                    : 'text-[#776B88] hover:text-[#493A63]'
                }`}
              >
                {TIMER_MODES[modeKey].label}
              </button>
            ))}
          </div>

          {/* Monospace Countdown Display */}
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#9B7EDB]">
                  {TIMER_MODES[timerMode].label}
                </span>
                {timerRunning && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                )}
              </div>
              <p className="text-3xl font-black font-mono text-[#493A63] tracking-tight">
                {formatTimer(timerSecs)}
              </p>
            </div>

            {/* Play/Pause & Reset Controls */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={timerRunning ? handlePauseTimer : handleStartTimer}
                title={timerRunning ? 'Pause' : 'Start'}
                className="w-11 h-11 rounded-2xl bg-[#9B7EDB] hover:bg-[#7A58C1] text-white font-bold text-base flex items-center justify-center transition-all shadow-purple cursor-pointer"
              >
                {timerRunning ? '⏸' : '▶'}
              </button>
              <button
                onClick={handleResetTimer}
                title="Reset timer"
                className="w-9 h-9 rounded-xl bg-[#F8F5FF] hover:bg-[#E9DFFF] text-[#493A63] font-bold text-xs flex items-center justify-center border border-[#E8E0F2] cursor-pointer"
              >
                🔄
              </button>
            </div>
          </div>

          {/* Active Focused Time Counter */}
          <div className="pt-2 border-t border-[#E8E0F2] flex items-center justify-between text-[11px] text-[#776B88]">
            <span>Active focused time:</span>
            <span className="font-mono font-bold text-[#493A63]">
              {Math.floor(activeFocusedSeconds / 60)}m {activeFocusedSeconds % 60}s
            </span>
          </div>

          {/* Save / Finish Session Button */}
          {activeFocusedSeconds > 0 && (
            <button
              onClick={handleStopAndSave}
              className="w-full py-1.5 rounded-xl bg-[#F8F5FF] hover:bg-[#F3ECFE] border border-[#C9B8E8] text-[#7A58C1] font-bold text-xs transition-colors cursor-pointer"
            >
              💾 Stop & Save Focus Session
            </button>
          )}

          {/* Shared Room Sync Toggle */}
          <label className="flex items-center justify-between pt-1 text-[10px] font-bold text-[#776B88] cursor-pointer">
            <span>Sync timer with room:</span>
            <input
              type="checkbox"
              checked={isSharedTimer}
              onChange={(e) => setIsSharedTimer(e.target.checked)}
              className="rounded text-[#9B7EDB] focus:ring-[#9B7EDB] cursor-pointer"
            />
          </label>
        </div>

        {/* Phase 9: Explore People Panel */}
        {showExplorePanel && (
          <ExplorePeoplePanel
            participants={participants}
            selectedGroupId={selectedGroupId}
            onClose={() => setShowExplorePanel(false)}
          />
        )}

        {/* Real-time Room Participants Drawer (Phase 3) */}
        {showParticipantsDrawer && (
          <div className="absolute top-20 right-4 z-30 p-4 rounded-3xl bg-white/95 backdrop-blur-md border border-[#E8E0F2] shadow-xl w-64 max-h-96 overflow-y-auto space-y-2.5">
            <div className="flex items-center justify-between pb-2 border-b border-[#E8E0F2]">
              <div className="flex items-center gap-1.5">
                <span className="text-sm">👥</span>
                <h3 className="text-xs font-bold text-[#493A63]">
                  Room Presence ({participants.length})
                </h3>
              </div>
              <button
                onClick={() => setShowParticipantsDrawer(false)}
                className="text-[#776B88] hover:text-[#493A63] font-bold text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              {participants.length === 0 ? (
                <p className="text-xs text-[#776B88] text-center py-4">No other members in room</p>
              ) : (
                participants.map((p, idx) => (
                  <div
                    key={p.socketId || idx}
                    className="flex items-center justify-between bg-[#F8F5FF] p-2 rounded-xl border border-[#E8E0F2] text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                        style={{
                          backgroundColor:
                            p.avatarConfig?.outfitColor || (p.socketId === socket.id ? '#9B7EDB' : '#8FBA99'),
                        }}
                      >
                        {(p.userName || 'S').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-[#493A63] leading-tight">
                          {p.userName || 'Student'}
                          {p.socketId === socket.id && ' (You)'}
                        </p>
                        <p className="text-[10px] text-[#776B88]">
                          {typeof p.deskIndex === 'number'
                            ? `Desk 0${p.deskIndex + 1}`
                            : 'Exploring'}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                        p.status === 'STUDYING'
                          ? 'bg-emerald-100 text-emerald-800'
                          : p.status === 'BREAK'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {p.status || 'Idle'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* 3D Canvas */}
        <LazyCanvas camera={[0, 6, 9]} shadows>
          <LibraryScene
            userAvatarConfig={avatarConfig}
            selectedDeskIndex={selectedDeskIndex}
            onSelectDesk={handleSelectDesk}
            onAvatarArrived={handleAvatarArrived}
            cameraMode={cameraMode}
            occupants={occupantsMap}
          />
        </LazyCanvas>
      </div>

      {/* Phase 11: 365-Day Focus Heatmap Modal */}
      {showYearView && <YearHeatmap onClose={() => setShowYearView(false)} currentGroupId={selectedGroupId} />}

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
