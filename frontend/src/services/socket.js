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

export const joinGroup = (groupId) => {
  socket.emit('group:join', String(groupId))
}

export const leaveGroup = (groupId) => {
  socket.emit('group:leave', String(groupId))
}

export const sendMessage = (groupId, content, replyTo = null) => {
  socket.emit('message:send', {
    groupId: String(groupId),
    content,
    replyTo,
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

export default socket
