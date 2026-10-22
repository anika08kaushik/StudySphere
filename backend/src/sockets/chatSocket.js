import mongoose from 'mongoose'
import Message from '../models/Message.js'
import Membership from '../models/Membership.js'
import { createNotification } from '../services/notificationService.js'

// In-memory room presence tracker for active students
const groupPresence = new Map()

const registerChatSocket = (io, socket) => {
  const getSenderInfo = () => ({
    _id: socket.user?.userId || socket.id,
    id: socket.user?.userId || socket.id,
    name: socket.user?.name || 'Classmate',
    profilePhoto: socket.user?.profilePhoto || null,
  })

  // 1. Group Room Join & Presence
  socket.on('group:join', async (groupId) => {
    try {
      const stringGroupId = String(groupId)
      const userId = socket.user?.userId || socket.id
      const isDbConnected = mongoose.connection.readyState === 1

      if (process.env.NODE_ENV === 'production') {
        const membership = await Membership.findOne({
          userId: socket.user?.userId,
          groupId: stringGroupId,
          status: 'active',
        })

        if (!membership) {
          socket.emit('chat:error', {
            message: 'You are not an active member of this study group',
          })
          return
        }
      } else if (isDbConnected && socket.user?.userId) {
        const membership = await Membership.findOne({
          userId,
          groupId: stringGroupId,
          status: 'active',
        })

        if (!membership) {
          socket.emit('chat:error', {
            message: 'You are not an active member of this study group',
          })
          return
        }
      }

      socket.join(stringGroupId)

      // Track presence
      if (!groupPresence.has(stringGroupId)) {
        groupPresence.set(stringGroupId, new Map())
      }
      const roomUsers = groupPresence.get(stringGroupId)
      roomUsers.set(socket.id, getSenderInfo())

      socket.emit('group:joined', {
        groupId: stringGroupId,
      })

      // Broadcast updated online presence to room
      const activeMembers = Array.from(roomUsers.values())
      io.to(stringGroupId).emit('presence:update', {
        groupId: stringGroupId,
        onlineCount: activeMembers.length,
        members: activeMembers,
      })
    } catch (error) {
      console.error('Group join error:', error)
      socket.emit('chat:error', {
        message: 'Unable to join study group',
      })
    }
  })

  // 2. Group Room Leave
  socket.on('group:leave', (groupId) => {
    const stringGroupId = String(groupId)
    socket.leave(stringGroupId)

    if (groupPresence.has(stringGroupId)) {
      const roomUsers = groupPresence.get(stringGroupId)
      roomUsers.delete(socket.id)
      const activeMembers = Array.from(roomUsers.values())
      io.to(stringGroupId).emit('presence:update', {
        groupId: stringGroupId,
        onlineCount: activeMembers.length,
        members: activeMembers,
      })
    }
  })

  // 3. Send Message (with Reply, Mentions, Attachments, and Fallback support)
  socket.on('message:send', async ({ groupId, content, replyTo, mentions = [], attachments = [] }) => {
    try {
      const stringGroupId = String(groupId)
      const userId = socket.user?.userId || socket.id
      const sender = getSenderInfo()

      if (!content || !content.trim()) {
        socket.emit('chat:error', {
          message: 'Message content is required',
        })
        return
      }

      const isDbConnected = mongoose.connection.readyState === 1

      if (process.env.NODE_ENV === 'production') {
        const membership = await Membership.findOne({
          userId: socket.user?.userId,
          groupId: stringGroupId,
          status: 'active',
        })

        if (!membership) {
          socket.emit('chat:error', {
            message: 'You are not an active member of this study group',
          })
          return
        }
      } else if (isDbConnected && socket.user?.userId) {
        const membership = await Membership.findOne({
          userId,
          groupId: stringGroupId,
          status: 'active',
        })

        if (!membership) {
          socket.emit('chat:error', {
            message: 'You are not an active member of this study group',
          })
          return
        }
      }

      // Mention notifications
      if (Array.isArray(mentions)) {
        for (const mentionId of mentions) {
          createNotification({
            recipient: mentionId,
            sender: userId,
            groupId: stringGroupId,
            type: 'mention',
            title: 'New Chat Mention',
            message: `${sender.name} mentioned you in chat: "${content.slice(0, 50)}..."`,
            io,
          })
        }
      }

      if (isDbConnected && socket.user?.userId) {
        const message = await Message.create({
          groupId: stringGroupId,
          senderId: userId,
          content: content.trim(),
          replyTo: replyTo || null,
          mentions,
          attachments,
        })

        const populatedMessage = await message.populate('senderId', 'name profilePhoto')
        io.to(stringGroupId).emit('message:new', populatedMessage)
      } else {
        // Fallback for development without DB connection
        const mockMessage = {
          _id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          groupId: stringGroupId,
          senderId: sender,
          content: content.trim(),
          replyTo: replyTo || null,
          mentions,
          attachments,
          reactions: [],
          pinned: false,
          isEdited: false,
          createdAt: new Date().toISOString(),
        }
        io.to(stringGroupId).emit('message:new', mockMessage)
      }
    } catch (error) {
      console.error('Send message error:', error)
      socket.emit('chat:error', {
        message: 'Failed to send message',
      })
    }
  })

  // 4. Typing Indicator
  socket.on('typing:start', ({ groupId }) => {
    const stringGroupId = String(groupId)
    socket.to(stringGroupId).emit('typing:update', {
      groupId: stringGroupId,
      userId: socket.user?.userId || socket.id,
      userName: socket.user?.name || 'Classmate',
      isTyping: true,
    })
  })

  socket.on('typing:stop', ({ groupId }) => {
    const stringGroupId = String(groupId)
    socket.to(stringGroupId).emit('typing:update', {
      groupId: stringGroupId,
      userId: socket.user?.userId || socket.id,
      userName: socket.user?.name || 'Classmate',
      isTyping: false,
    })
  })

  // 5. Message Reactions
  socket.on('message:react', ({ groupId, messageId, emoji }) => {
    const stringGroupId = String(groupId)
    io.to(stringGroupId).emit('message:reaction_update', {
      groupId: stringGroupId,
      messageId,
      emoji,
      userId: socket.user?.userId || socket.id,
      userName: socket.user?.name || 'Classmate',
    })
  })

  // 6. Live Message Edit
  socket.on('message:edit', ({ groupId, messageId, content }) => {
    const stringGroupId = String(groupId)
    io.to(stringGroupId).emit('message:edited', {
      groupId: stringGroupId,
      messageId,
      content,
      isEdited: true,
      editedAt: new Date().toISOString(),
    })
  })

  // 7. Live Message Delete
  socket.on('message:delete', ({ groupId, messageId }) => {
    const stringGroupId = String(groupId)
    io.to(stringGroupId).emit('message:deleted', {
      groupId: stringGroupId,
      messageId,
    })
  })

  // 8. Live Pin/Unpin
  socket.on('message:pin', ({ groupId, messageId, pinned }) => {
    const stringGroupId = String(groupId)
    io.to(stringGroupId).emit('message:pinned', {
      groupId: stringGroupId,
      messageId,
      pinned,
    })
  })

  // 9. Disconnect Cleanup
  socket.on('disconnect', () => {
    groupPresence.forEach((roomUsers, groupId) => {
      if (roomUsers.has(socket.id)) {
        roomUsers.delete(socket.id)
        const activeMembers = Array.from(roomUsers.values())
        io.to(groupId).emit('presence:update', {
          groupId,
          onlineCount: activeMembers.length,
          members: activeMembers,
        })
      }
    })
  })
}

export default registerChatSocket
