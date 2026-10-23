// In-memory room presence tracker for active note collaborators
const noteCollaborators = new Map()

const USER_COLORS = ['#9B7EDB', '#38BDF8', '#34D399', '#F472B6', '#FBBF24', '#A78BFA']

const registerNotesSocket = (io, socket) => {
  const getCollaboratorInfo = () => {
    const userId = socket.user?.userId || socket.id
    const userName = socket.user?.name || socket.handshake.auth?.userName || 'Student'
    // Deterministic color assignment based on userId
    const colorIndex = Math.abs(
      userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    ) % USER_COLORS.length

    return {
      userId,
      userName,
      color: USER_COLORS[colorIndex],
      cursor: null,
      status: 'active',
    }
  }

  // 1. Join Note Session
  socket.on('note:join', ({ noteId }) => {
    const roomKey = `note:${noteId}`
    socket.join(roomKey)

    if (!noteCollaborators.has(noteId)) {
      noteCollaborators.set(noteId, new Map())
    }

    const room = noteCollaborators.get(noteId)
    const userInfo = getCollaboratorInfo()
    room.set(socket.id, userInfo)

    const activeList = Array.from(room.values())
    io.to(roomKey).emit('note:presence_update', {
      noteId,
      collaborators: activeList,
    })
  })

  // 2. Leave Note Session
  socket.on('note:leave', ({ noteId }) => {
    const roomKey = `note:${noteId}`
    socket.leave(roomKey)

    if (noteCollaborators.has(noteId)) {
      const room = noteCollaborators.get(noteId)
      room.delete(socket.id)
      const activeList = Array.from(room.values())
      io.to(roomKey).emit('note:presence_update', {
        noteId,
        collaborators: activeList,
      })
    }
  })

  // 3. Live Synchronized Document Change
  socket.on('note:change', ({ noteId, content, update, cursor }) => {
    const roomKey = `note:${noteId}`
    const userId = socket.user?.userId || socket.id
    const userName = socket.user?.name || socket.handshake.auth?.userName || 'Student'

    socket.to(roomKey).emit('note:remote_change', {
      noteId,
      content,
      update,
      cursor,
      userId,
      userName,
    })
  })

  // 4. Live Cursor & Selection Movement
  socket.on('note:cursor', ({ noteId, cursor, selection }) => {
    const roomKey = `note:${noteId}`
    const userId = socket.user?.userId || socket.id
    const userName = socket.user?.name || socket.handshake.auth?.userName || 'Student'

    if (noteCollaborators.has(noteId)) {
      const room = noteCollaborators.get(noteId)
      const user = room.get(socket.id)
      if (user) user.cursor = cursor
    }

    socket.to(roomKey).emit('note:cursor_update', {
      noteId,
      userId,
      userName,
      cursor,
      selection,
    })
  })

  // 5. Live Note Comments
  socket.on('note:comment_new', ({ noteId, comment }) => {
    const roomKey = `note:${noteId}`
    io.to(roomKey).emit('note:comment_broadcast', {
      noteId,
      comment,
    })
  })

  // 6. Live Note Version & Rollback Notifications
  socket.on('note:version_update', ({ noteId, action, version, content }) => {
    const roomKey = `note:${noteId}`
    io.to(roomKey).emit('note:version_synced', {
      noteId,
      action,
      version,
      content,
      modifiedByName: socket.user?.name || socket.handshake.auth?.userName || 'Student',
    })
  })

  // 7. Disconnect Cleanup
  socket.on('disconnect', () => {
    noteCollaborators.forEach((room, noteId) => {
      if (room.has(socket.id)) {
        room.delete(socket.id)
        const roomKey = `note:${noteId}`
        const activeList = Array.from(room.values())
        io.to(roomKey).emit('note:presence_update', {
          noteId,
          collaborators: activeList,
        })
      }
    })
  })
}

export default registerNotesSocket
