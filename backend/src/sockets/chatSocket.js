import Message from '../models/Message.js'
import Membership from '../models/Membership.js'

const registerChatSocket = (io, socket) => {
  socket.on('group:join', async (groupId) => {
    try {
      const userId = socket.user?.userId

      if (!userId) {
        socket.emit('chat:error', {
          message: 'Authentication required',
        })
        return
      }

      const membership = await Membership.findOne({
        userId,
        groupId,
        status: 'active',
      })

      if (!membership) {
        socket.emit('chat:error', {
          message: 'You are not an active member of this study group',
        })
        return
      }

      socket.join(String(groupId))

      socket.emit('group:joined', {
        groupId: String(groupId),
      })
    } catch (error) {
      console.error('Group join error:', error)

      socket.emit('chat:error', {
        message: 'Unable to join study group',
      })
    }
  })

  socket.on('group:leave', (groupId) => {
    socket.leave(String(groupId))
  })

  socket.on('message:send', async ({ groupId, content }) => {
    try {
      const userId = socket.user?.userId

      if (!userId) {
        socket.emit('chat:error', {
          message: 'Authentication required',
        })
        return
      }

      if (!content || !content.trim()) {
        socket.emit('chat:error', {
          message: 'Message content is required',
        })
        return
      }

      const membership = await Membership.findOne({
        userId,
        groupId,
        status: 'active',
      })

      if (!membership) {
        socket.emit('chat:error', {
          message: 'You are not an active member of this study group',
        })
        return
      }

      const message = await Message.create({
        groupId,
        senderId: userId,
        content: content.trim(),
      })

      const populatedMessage = await message.populate(
        'senderId',
        'name profilePhoto'
      )

      io.to(String(groupId)).emit('message:new', populatedMessage)
    } catch (error) {
      console.error('Send message error:', error)

      socket.emit('chat:error', {
        message: 'Failed to send message',
      })
    }
  })
}

export default registerChatSocket
