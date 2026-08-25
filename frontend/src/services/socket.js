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

export const connectSocket = () => {
  const token = localStorage.getItem('studysphere_token')

  socket.auth = {
    token,
  }

  socket.connect()
}

export const disconnectSocket = () => {
  socket.disconnect()
}

export const joinGroup = (groupId) => {
  socket.emit('group:join', String(groupId))
}

export const leaveGroup = (groupId) => {
  socket.emit('group:leave', String(groupId))
}

export const sendMessage = (groupId, content) => {
  socket.emit('message:send', {
    groupId,
    content,
  })
}

export default socket
