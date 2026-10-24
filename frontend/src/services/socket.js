import { io } from 'socket.io-client'

const getInitialToken = () =>
  sessionStorage.getItem('studysphere_token') || localStorage.getItem('studysphere_token')

const socket = io(
  import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000',
  {
    autoConnect: false,
    auth: {
      token: getInitialToken(),
    },
  }
)

let currentActiveGroup = null

export const connectSocket = (userOverride, tokenOverride) => {
  const token =
    tokenOverride ||
    sessionStorage.getItem('studysphere_token') ||
    localStorage.getItem('studysphere_token')
  const storedUserRaw =
    sessionStorage.getItem('studysphere_user') ||
    localStorage.getItem('studysphere_user')
  let storedUser = null
  try {
    storedUser = storedUserRaw ? JSON.parse(storedUserRaw) : null
  } catch {
    storedUser = null
  }
  const user = userOverride || storedUser

  const tokenChanged = socket.auth?.token !== token
  const userChanged = String(socket.auth?.userId || '') !== String(user?._id || user?.id || '')

  socket.auth = {
    token,
    userId: user?._id || user?.id || 'u1',
    userName: user?.name || 'Student',
    profilePhoto: user?.profilePhoto || null,
  }

  if (socket.connected && (tokenChanged || userChanged)) {
    socket.disconnect().connect()
  } else if (!socket.connected) {
    socket.connect()
  }
}

export const disconnectSocket = () => {
  currentActiveGroup = null
  if (socket.connected) {
    socket.disconnect()
  }
}

// Automatically rejoin room if connection or reconnection happens
socket.on('connect', () => {
  if (currentActiveGroup) {
    socket.emit('group:join', currentActiveGroup)
  }
})

// Group Chat Sockets
export const joinGroup = (groupId) => {
  if (!groupId) return
  currentActiveGroup = String(groupId)
  if (socket.connected) {
    socket.emit('group:join', currentActiveGroup)
  }
}

export const leaveGroup = (groupId) => {
  if (currentActiveGroup === String(groupId)) {
    currentActiveGroup = null
  }
  if (socket.connected) {
    socket.emit('group:leave', String(groupId))
  }
}

export const sendMessage = (groupId, content, replyTo = null, mentions = [], attachments = [], clientTempId = null) => {
  socket.emit('message:send', {
    groupId: String(groupId),
    content,
    replyTo,
    mentions,
    attachments,
    clientTempId,
  })
}

export const emitTyping = (groupId, isTyping) => {
  socket.emit(isTyping ? 'typing:start' : 'typing:stop', {
    groupId: String(groupId),
  })
}

export const reactToMessage = (groupId, messageId, emoji) => {
  socket.emit('message:react', {
    groupId: String(groupId),
    messageId,
    emoji,
  })
}

// Collaborative Notes Real-Time Sockets
export const joinNote = (noteId) => {
  socket.emit('note:join', { noteId: String(noteId) })
}

export const leaveNote = (noteId) => {
  socket.emit('note:leave', { noteId: String(noteId) })
}

export const sendNoteChange = (noteId, content, update = null, cursor = null) => {
  socket.emit('note:change', {
    noteId: String(noteId),
    content,
    update,
    cursor,
  })
}

export const sendNoteCursor = (noteId, cursor, selection = null) => {
  socket.emit('note:cursor', {
    noteId: String(noteId),
    cursor,
    selection,
  })
}

export const sendNoteComment = (noteId, comment) => {
  socket.emit('note:comment_new', {
    noteId: String(noteId),
    comment,
  })
}

export const sendNoteVersion = (noteId, action, version, content) => {
  socket.emit('note:version_update', {
    noteId: String(noteId),
    action,
    version,
    content,
  })
}

// Focus Room Real-Time Sockets
export const joinFocusRoom = (
  groupId,
  avatarConfig = null,
  deskIndex = null,
  status = 'IDLE',
  seatId = null
) => {
  if (!groupId) return
  if (socket.connected) {
    socket.emit('focus:join', {
      groupId: String(groupId),
      avatarConfig,
      deskIndex,
      seatId,
      status,
    })
  }
}

export const leaveFocusRoom = (groupId) => {
  if (!groupId) return
  if (socket.connected) {
    socket.emit('focus:leave', { groupId: String(groupId) })
  }
}

export const selectFocusDesk = (groupId, deskIndex, avatarConfig, seatId = null) => {
  if (!groupId) return
  socket.emit('focus:select_desk', {
    groupId: String(groupId),
    deskIndex,
    seatId,
    avatarConfig,
  })
}

export const leaveFocusDesk = (groupId) => {
  if (!groupId) return
  socket.emit('focus:leave_desk', { groupId: String(groupId) })
}

export const sendFocusTimerAction = (groupId, action, mode = 'FOCUS', remainingSeconds = null) => {
  if (!groupId) return
  socket.emit('focus:timer_action', {
    groupId: String(groupId),
    action,
    mode,
    remainingSeconds,
  })
}

export const updateFocusStatus = (groupId, status) => {
  if (!groupId) return
  socket.emit('focus:status_change', { groupId: String(groupId), status })
}

export const onFocusPresenceUpdate = (handler) => {
  socket.on('focus:presence_update', handler)
}

export const offFocusPresenceUpdate = (handler) => {
  socket.off('focus:presence_update', handler)
}

export const onFocusTimerSync = (handler) => {
  socket.on('focus:timer_sync', handler)
}

export const offFocusTimerSync = (handler) => {
  socket.off('focus:timer_sync', handler)
}

export const onFocusJoined = (handler) => {
  socket.on('focus:joined', handler)
}

export const offFocusJoined = (handler) => {
  socket.off('focus:joined', handler)
}

export const onFocusSeatConflict = (handler) => {
  socket.on('focus:seat_conflict', handler)
}

export const offFocusSeatConflict = (handler) => {
  socket.off('focus:seat_conflict', handler)
}

// Notifications Real-Time Socket Emitters
export const onNewNotification = (handler) => {
  socket.on('notification:new', handler)
  socket.on('notification:broadcast', handler)
}

export const offNewNotification = (handler) => {
  socket.off('notification:new', handler)
  socket.off('notification:broadcast', handler)
}

// Phase 9: Private Chat Request & DM Sockets
export const onChatRequestNew = (handler) => {
  socket.on('chat_request:new', handler)
}

export const offChatRequestNew = (handler) => {
  socket.off('chat_request:new', handler)
}

export const onChatRequestUpdate = (handler) => {
  socket.on('chat_request:update', handler)
}

export const offChatRequestUpdate = (handler) => {
  socket.off('chat_request:update', handler)
}

export const onDmNew = (handler) => {
  socket.on('dm:new', handler)
}

export const offDmNew = (handler) => {
  socket.off('dm:new', handler)
}

export default socket

