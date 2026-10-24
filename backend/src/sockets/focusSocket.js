import mongoose from 'mongoose'
import StudyGroup from '../models/StudyGroup.js'
import Membership from '../models/Membership.js'
import { findFocusSeatConflict, resolveFocusSeat } from '../services/focusSeatService.js'

// In-memory presence and timer state per group focus room
// focusRooms: Map<groupId, Map<socketId, participant>>
const focusRooms = new Map()

// roomTimers: Map<groupId, { mode: 'FOCUS' | 'SHORT_BREAK' | 'LONG_BREAK', remainingSeconds: number, isRunning: boolean, lastUpdated: number }>
const roomTimers = new Map()

const DEFAULT_FOCUS_SECS = 25 * 60
const DEFAULT_SHORT_BREAK_SECS = 5 * 60
const DEFAULT_LONG_BREAK_SECS = 15 * 60

const getDurationForMode = (mode) => {
  switch (mode) {
    case 'SHORT_BREAK':
      return DEFAULT_SHORT_BREAK_SECS
    case 'LONG_BREAK':
      return DEFAULT_LONG_BREAK_SECS
    case 'FOCUS':
    default:
      return DEFAULT_FOCUS_SECS
  }
}

const getRoomTimer = (groupId) => {
  if (!roomTimers.has(groupId)) {
    roomTimers.set(groupId, {
      mode: 'FOCUS',
      remainingSeconds: DEFAULT_FOCUS_SECS,
      isRunning: false,
      lastUpdated: Date.now(),
    })
  }
  return roomTimers.get(groupId)
}

const getRoomParticipants = (groupId) => {
  if (!focusRooms.has(groupId)) {
    return []
  }
  return Array.from(focusRooms.get(groupId).values())
}

export const registerFocusSocket = (io, socket) => {
  const getSender = () => ({
    userId: socket.user?.userId || socket.id,
    userName: socket.user?.name || socket.handshake?.auth?.userName || 'Student',
    profilePhoto: socket.user?.profilePhoto || null,
  })

  // 1. Join Focus Room
  socket.on('focus:join', async (payload = {}) => {
    try {
      const { groupId, avatarConfig, deskIndex = null, seatId = null, status = 'IDLE' } = payload
      if (!groupId) return

      const stringGroupId = String(groupId)
      const roomKey = `focus:${stringGroupId}`
      const sender = getSender()

      // Authorization verification
      const isDbConnected =
        mongoose.connection.readyState === 1 &&
        mongoose.isValidObjectId(stringGroupId) &&
        mongoose.isValidObjectId(sender.userId)

      if (isDbConnected && process.env.NODE_ENV === 'production') {
        const membership = await Membership.findOne({
          userId: sender.userId,
          groupId: stringGroupId,
          status: 'active',
        })
        if (!membership) {
          socket.emit('focus:error', {
            message: 'You are not an active member of this study group',
          })
          return
        }
      }

      socket.join(roomKey)

      if (!focusRooms.has(stringGroupId)) {
        focusRooms.set(stringGroupId, new Map())
      }

      const room = focusRooms.get(stringGroupId)
      const requestedSeat = resolveFocusSeat(seatId, deskIndex)
      const seatConflict = requestedSeat
        ? findFocusSeatConflict(room, socket.id, requestedSeat.seatId)
        : null
      const hasSeatRequest = seatId !== null || deskIndex !== null
      const seatUnavailable = hasSeatRequest && (!requestedSeat || seatConflict)
      const participant = {
        socketId: socket.id,
        userId: sender.userId,
        userName: sender.userName,
        profilePhoto: sender.profilePhoto,
        seatId: seatUnavailable ? null : requestedSeat?.seatId || null,
        deskIndex: seatUnavailable ? null : requestedSeat?.deskIndex ?? null,
        avatarConfig: avatarConfig || null,
        status: status || 'IDLE',
        joinedAt: Date.now(),
      }
      room.set(socket.id, participant)

      const participants = getRoomParticipants(stringGroupId)
      const timerState = getRoomTimer(stringGroupId)

      // Send initial room state to joining client
      socket.emit('focus:joined', {
        groupId: stringGroupId,
        participants,
        timerState,
      })

      if (seatUnavailable) {
        socket.emit('focus:seat_conflict', {
          groupId: stringGroupId,
          seatId: requestedSeat?.seatId || seatId,
          reason: seatConflict ? 'occupied' : 'invalid',
          currentSeatId: participant.seatId,
          currentDeskIndex: participant.deskIndex,
          message: seatConflict
            ? 'That seat is already occupied. Choose another seat.'
            : 'That seat is no longer available. Choose another seat.',
        })
      }

      // Broadcast presence update to everyone in this focus room
      io.to(roomKey).emit('focus:presence_update', {
        groupId: stringGroupId,
        participants,
        count: participants.length,
      })
    } catch (error) {
      console.error('Focus room join error:', error)
      socket.emit('focus:error', { message: 'Unable to join focus room' })
    }
  })

  // 2. Select / Sit at Desk
  socket.on('focus:select_desk', ({ groupId, deskIndex, seatId, avatarConfig } = {}) => {
    if (!groupId) return
    const stringGroupId = String(groupId)
    if (!focusRooms.has(stringGroupId)) return

    const room = focusRooms.get(stringGroupId)
    const participant = room.get(socket.id)
    if (!participant) return

    const requestedSeat = resolveFocusSeat(seatId, deskIndex)
    const seatConflict = requestedSeat
      ? findFocusSeatConflict(room, socket.id, requestedSeat.seatId)
      : null
    if (!requestedSeat || seatConflict) {
      socket.emit('focus:seat_conflict', {
        groupId: stringGroupId,
        seatId: requestedSeat?.seatId || seatId,
        reason: seatConflict ? 'occupied' : 'invalid',
        currentSeatId: participant.seatId,
        currentDeskIndex: participant.deskIndex,
        message: seatConflict
          ? 'That seat is already occupied. Choose another seat.'
          : 'That seat is no longer available. Choose another seat.',
      })
      return
    }

    participant.seatId = requestedSeat.seatId
    participant.deskIndex = requestedSeat.deskIndex
    if (avatarConfig) participant.avatarConfig = avatarConfig
    participant.status = 'STUDYING'

    const participants = getRoomParticipants(stringGroupId)
    io.to(`focus:${stringGroupId}`).emit('focus:presence_update', {
      groupId: stringGroupId,
      participants,
      count: participants.length,
    })
  })

  // 3. Leave Desk
  socket.on('focus:leave_desk', ({ groupId }) => {
    const stringGroupId = String(groupId)
    if (!focusRooms.has(stringGroupId)) return

    const room = focusRooms.get(stringGroupId)
    const participant = room.get(socket.id)
    if (!participant) return

    participant.seatId = null
    participant.deskIndex = null
    participant.status = 'IDLE'

    const participants = getRoomParticipants(stringGroupId)
    io.to(`focus:${stringGroupId}`).emit('focus:presence_update', {
      groupId: stringGroupId,
      participants,
      count: participants.length,
    })
  })

  // 4. Update Focus Status (e.g. FOCUSING, BREAK, IDLE)
  socket.on('focus:status_change', ({ groupId, status }) => {
    const stringGroupId = String(groupId)
    if (!focusRooms.has(stringGroupId)) return

    const room = focusRooms.get(stringGroupId)
    const participant = room.get(socket.id)
    if (!participant) return

    participant.status = status

    const participants = getRoomParticipants(stringGroupId)
    io.to(`focus:${stringGroupId}`).emit('focus:presence_update', {
      groupId: stringGroupId,
      participants,
      count: participants.length,
    })
  })

  // 5. Pomodoro Timer Action Synchronization
  socket.on('focus:timer_action', ({ groupId, action, mode, remainingSeconds }) => {
    const stringGroupId = String(groupId)
    const timer = getRoomTimer(stringGroupId)

    switch (action) {
      case 'start':
      case 'resume':
        timer.isRunning = true
        if (typeof remainingSeconds === 'number') {
          timer.remainingSeconds = remainingSeconds
        }
        if (mode) timer.mode = mode
        timer.lastUpdated = Date.now()
        break

      case 'pause':
        timer.isRunning = false
        if (typeof remainingSeconds === 'number') {
          timer.remainingSeconds = remainingSeconds
        }
        timer.lastUpdated = Date.now()
        break

      case 'stop':
      case 'reset':
        timer.isRunning = false
        if (mode) timer.mode = mode
        timer.remainingSeconds = getDurationForMode(timer.mode)
        timer.lastUpdated = Date.now()
        break

      case 'mode_change':
        timer.isRunning = false
        timer.mode = mode || 'FOCUS'
        timer.remainingSeconds = getDurationForMode(timer.mode)
        timer.lastUpdated = Date.now()
        break

      case 'tick':
        if (typeof remainingSeconds === 'number') {
          timer.remainingSeconds = remainingSeconds
          timer.lastUpdated = Date.now()
        }
        break
    }

    io.to(`focus:${stringGroupId}`).emit('focus:timer_sync', {
      groupId: stringGroupId,
      timerState: timer,
      actionBy: getSender(),
      action,
    })
  })

  // 6. Leave Focus Room
  socket.on('focus:leave', ({ groupId }) => {
    const stringGroupId = String(groupId)
    socket.leave(`focus:${stringGroupId}`)

    if (focusRooms.has(stringGroupId)) {
      const room = focusRooms.get(stringGroupId)
      room.delete(socket.id)
      if (room.size === 0) {
        focusRooms.delete(stringGroupId)
      } else {
        const participants = getRoomParticipants(stringGroupId)
        io.to(`focus:${stringGroupId}`).emit('focus:presence_update', {
          groupId: stringGroupId,
          participants,
          count: participants.length,
        })
      }
    }
  })

  // 7. Cleanup on Disconnect
  socket.on('disconnect', () => {
    for (const [groupId, room] of focusRooms.entries()) {
      if (room.has(socket.id)) {
        room.delete(socket.id)
        const participants = getRoomParticipants(groupId)
        if (room.size === 0) {
          focusRooms.delete(groupId)
        } else {
          io.to(`focus:${groupId}`).emit('focus:presence_update', {
            groupId,
            participants,
            count: participants.length,
          })
        }
      }
    }
  })
}

export default registerFocusSocket
