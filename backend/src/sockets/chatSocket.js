import mongoose from 'mongoose'
import Message from '../models/Message.js'
import Membership from '../models/Membership.js'
import StudyGroup from '../models/StudyGroup.js'
import { createNotification } from '../services/notificationService.js'

// In-memory room presence tracker for active students
const groupPresence = new Map()

const registerChatSocket = (io, socket) => {
  const getSenderInfo = () => ({
    _id: socket.user?.userId || socket.id,
    id: socket.user?.userId || socket.id,
    name: socket.user?.name || socket.handshake.auth?.userName || 'Student',
    profilePhoto: socket.user?.profilePhoto || null,
  })

  const getActiveMembers = (roomUsers) => {
    if (!roomUsers) return []
    const map = new Map()
    for (const info of roomUsers.values()) {
      const key = String(info.id || info._id)
      if (!map.has(key)) {
        map.set(key, info)
      }
    }
    return Array.from(map.values())
  }

  // 1. Group Room Join & Presence
  socket.on('group:join', async (groupId) => {
    try {
      const rawGroupId = String(groupId)
      const stringGroupId = rawGroupId === 'g1' ? '6adba5f22f2a151cd35c6192' : rawGroupId
      const userId = socket.user?.userId || socket.id
      const isDbConnected =
        mongoose.connection.readyState === 1 &&
        mongoose.isValidObjectId(stringGroupId) &&
        mongoose.isValidObjectId(userId)

      const groupDoc = isDbConnected ? await StudyGroup.findById(stringGroupId).select('name').lean() : null
      const isLounge = (groupDoc && groupDoc.name === 'Student Lounge') || stringGroupId === '6adba5f22f2a151cd35c6192' || rawGroupId === 'g1'

      if (!isLounge) {
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
      }

      socket.join(stringGroupId)
      if (rawGroupId !== stringGroupId) {
        socket.join(rawGroupId)
      }

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
      const activeMembers = getActiveMembers(roomUsers)
      io.to(stringGroupId).emit('presence:update', {
        groupId: stringGroupId,
        onlineCount: activeMembers.length,
        members: activeMembers,
      })
      // Direct emit to joining socket for instant local render
      socket.emit('presence:update', {
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
      const activeMembers = getActiveMembers(roomUsers)
      io.to(stringGroupId).emit('presence:update', {
        groupId: stringGroupId,
        onlineCount: activeMembers.length,
        members: activeMembers,
      })
    }
  })

  // 3. Send Message (with Reply, Mentions, Attachments, and Fallback support)
  socket.on('message:send', async ({ groupId, content, replyTo, mentions = [], attachments = [], clientTempId }) => {
    try {
      const rawGroupId = String(groupId)
      const stringGroupId = rawGroupId === 'g1' ? '6adba5f22f2a151cd35c6192' : rawGroupId
      const userId = socket.user?.userId || socket.id
      const sender = getSenderInfo()
      const trimmedContent = (content || '').trim()

      if (!trimmedContent && (!attachments || attachments.length === 0)) {
        socket.emit('chat:error', {
          message: 'Message content or attachment is required',
        })
        return
      }

      const isDbConnected =
        mongoose.connection.readyState === 1 &&
        mongoose.isValidObjectId(stringGroupId) &&
        mongoose.isValidObjectId(userId)

      const groupDoc = isDbConnected ? await StudyGroup.findById(stringGroupId).select('name').lean() : null
      const isLounge = (groupDoc && groupDoc.name === 'Student Lounge') || stringGroupId === '6adba5f22f2a151cd35c6192' || rawGroupId === 'g1'

      if (!isLounge) {
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
      }

      // Mention notifications
      if (Array.isArray(mentions) && trimmedContent) {
        for (const mentionId of mentions) {
          createNotification({
            recipient: mentionId,
            sender: userId,
            groupId: stringGroupId,
            type: 'mention',
            title: 'New Chat Mention',
            message: `${sender.name} mentioned you in chat: "${trimmedContent.slice(0, 50)}..."`,
            io,
          })
        }
      }

      if (isDbConnected && socket.user?.userId) {
        const message = await Message.create({
          groupId: stringGroupId,
          senderId: userId,
          content: trimmedContent,
          replyTo: replyTo || null,
          mentions,
          attachments,
        })

        const populatedMessage = await message.populate('senderId', 'name profilePhoto')
        const messageObj = populatedMessage.toObject ? populatedMessage.toObject() : populatedMessage
        const roomsToNotify = rawGroupId && rawGroupId !== stringGroupId ? [stringGroupId, rawGroupId] : [stringGroupId]
        io.to(roomsToNotify).emit('message:new', { ...messageObj, clientTempId })
      } else {
        // Fallback for development without DB connection
        const mockMessage = {
          _id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          groupId: stringGroupId,
          senderId: sender,
          content: trimmedContent,
          replyTo: replyTo || null,
          mentions,
          attachments,
          reactions: [],
          pinned: false,
          isEdited: false,
          createdAt: new Date().toISOString(),
        }
        io.to(stringGroupId).emit('message:new', { ...mockMessage, clientTempId })
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
      userName: socket.user?.name || socket.handshake.auth?.userName || 'Student',
      isTyping: true,
    })
  })

  socket.on('typing:stop', ({ groupId }) => {
    const stringGroupId = String(groupId)
    socket.to(stringGroupId).emit('typing:update', {
      groupId: stringGroupId,
      userId: socket.user?.userId || socket.id,
      userName: socket.user?.name || socket.handshake.auth?.userName || 'Student',
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
      userName: socket.user?.name || socket.handshake.auth?.userName || 'Student',
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
        const activeMembers = getActiveMembers(roomUsers)
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
