import { io } from 'socket.io-client'

const socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
  autoConnect: false,
})

export const joinGroup = (groupId) => socket.emit('group:join', String(groupId))
export const leaveGroup = (groupId) => socket.emit('group:leave', String(groupId))
export default socket
