import { io } from 'socket.io-client'

const socket = io(
  import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000',
  {
    autoConnect: false,
    auth: {
      token: localStorage.getItem('studysphere_token'),
    },
  }
)

export const connectSocket = (userOverride) => {
  const token = localStorage.getItem('studysphere_token')
  const storedUser = localStorage.getItem('studysphere_user')
  const user = userOverride || (storedUser ? JSON.parse(storedUser) : null)

  socket.auth = {
    token,
    userId: user?._id || user?.id || 'u1',
    userName: user?.name || 'Classmate',
    profilePhoto: user?.profilePhoto || null,
  }

  if (!socket.connected) {
    socket.connect()
  }
}

export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect()
  }
}

// Group Chat Sockets
export const joinGroup = (groupId) => {
  socket.emit('group:join', String(groupId))
}

export const leaveGroup = (groupId) => {
  socket.emit('group:leave', String(groupId))
}

export const sendMessage = (groupId, content, replyTo = null, mentions = [], attachments = []) => {
  socket.emit('message:send', {
    groupId: String(groupId),
    content,
    replyTo,
    mentions,
    attachments,
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

export default socket
