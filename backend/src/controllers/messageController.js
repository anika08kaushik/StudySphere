import mongoose from 'mongoose'
import Message from '../models/Message.js'
import Membership from '../models/Membership.js'
import StudyGroup from '../models/StudyGroup.js'
import { createNotification } from '../services/notificationService.js'

// In-memory fallback message storage for local development without MongoDB
const devMessagesStore = new Map()

export const getMessages = async (request, response) => {
  try {
    const { groupId } = request.params
    const rawGroupId = String(groupId)
    const stringGroupId = rawGroupId === 'g1' ? '6adba5f22f2a151cd35c6192' : rawGroupId
    const userId = request.user?.userId || 'u1'
    const isDbReady = mongoose.connection.readyState === 1 && mongoose.isValidObjectId(stringGroupId)

    if (!isDbReady) {
      if (!devMessagesStore.has(rawGroupId)) {
        devMessagesStore.set(rawGroupId, [
          {
            _id: 'msg-demo-1',
            groupId: rawGroupId,
            senderId: { _id: 'u2', name: 'Rahul', profilePhoto: null },
            content: 'Hey everyone! Welcome to the group chat.',
            createdAt: new Date(Date.now() - 3600000).toISOString(),
            reactions: [{ emoji: '👋', userName: 'Anika' }],
            pinned: false,
          },
          {
            _id: 'msg-demo-2',
            groupId: rawGroupId,
            senderId: { _id: 'u3', name: 'Anika', profilePhoto: null },
            content: "Let's review the notes and collaborate on upcoming tasks.",
            createdAt: new Date(Date.now() - 1800000).toISOString(),
            reactions: [{ emoji: '🚀', userName: 'Rahul' }],
            pinned: true,
          },
        ])
      }

      let data = devMessagesStore.get(rawGroupId)
      const { search } = request.query
      if (search && search.trim()) {
        const s = search.trim().toLowerCase()
        data = data.filter((m) => m.content?.toLowerCase().includes(s))
      }

      return response.status(200).json({
        success: true,
        data,
      })
    }

    // Verify group membership (Student Lounge is public to all campus members)
    const groupDoc = isDbReady ? await StudyGroup.findById(stringGroupId).select('name').lean() : null
    const isLounge = (groupDoc && groupDoc.name === 'Student Lounge') || stringGroupId === '6adba5f22f2a151cd35c6192' || rawGroupId === 'g1'

    if (!isLounge) {
      const membership = await Membership.findOne({
        userId,
        groupId: stringGroupId,
        status: 'active',
      })

      if (!membership && process.env.NODE_ENV === 'production') {
        return response.status(403).json({
          success: false,
          message: 'You are not an active member of this study group',
        })
      }
    }

    const { search } = request.query
    const query = { groupId: stringGroupId }
    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i')
      query.$or = [
        { content: regex },
        { 'attachments.name': regex },
      ]
    }

    const messages = await Message.find(query)
      .populate('senderId', 'name profilePhoto')
      .populate('replyTo.messageId')
      .sort({ createdAt: 1 })

    const devList = devMessagesStore.get(rawGroupId) || devMessagesStore.get(stringGroupId) || []
    const combined = [...messages.map((m) => (m.toObject ? m.toObject() : m)), ...devList]

    response.status(200).json({
      success: true,
      data: combined,
    })
  } catch (error) {
    console.error('Get messages error:', error)
    response.status(500).json({
      success: false,
      message: 'Failed to fetch messages',
    })
  }
}

export const createMessage = async (request, response) => {
  try {
    const { groupId } = request.params
    const rawGroupId = String(groupId)
    const stringGroupId = rawGroupId === 'g1' ? '6adba5f22f2a151cd35c6192' : rawGroupId
    const { content, replyTo, mentions = [], attachments = [] } = request.body
    const userId = request.user?.userId || 'u1'
    const userName = request.user?.name || 'Classmate'

    const trimmedContent = (content || '').trim()

    if (!trimmedContent && (!attachments || attachments.length === 0)) {
      return response.status(400).json({
        success: false,
        message: 'Message content or attachment is required',
      })
    }

    const isDbReady =
      mongoose.connection.readyState === 1 &&
      mongoose.isValidObjectId(stringGroupId) &&
      mongoose.isValidObjectId(userId)

    if (!isDbReady) {
      const mockCreated = {
        _id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        groupId: stringGroupId,
        senderId: { _id: userId, name: userName, profilePhoto: null },
        content: trimmedContent,
        replyTo: replyTo || null,
        mentions,
        attachments,
        reactions: [],
        pinned: false,
        isEdited: false,
        createdAt: new Date().toISOString(),
      }
      if (!devMessagesStore.has(rawGroupId)) devMessagesStore.set(rawGroupId, [])
      devMessagesStore.get(rawGroupId).push(mockCreated)
      if (rawGroupId !== stringGroupId) {
        if (!devMessagesStore.has(stringGroupId)) devMessagesStore.set(stringGroupId, [])
        devMessagesStore.get(stringGroupId).push(mockCreated)
      }

      // Trigger notifications for mentions in dev mode
      if (Array.isArray(mentions)) {
        for (const mentionId of mentions) {
          createNotification({
            recipient: mentionId,
            sender: userId,
            groupId: stringGroupId,
            type: 'mention',
            title: 'New Chat Mention',
            message: `${userName} mentioned you in chat: "${trimmedContent.slice(0, 50)}..."`,
          })
        }
      }

      return response.status(201).json({
        success: true,
        data: mockCreated,
      })
    }

    const groupDoc = await StudyGroup.findById(stringGroupId).select('name').lean()
    const isLounge = groupDoc && groupDoc.name === 'Student Lounge'

    if (!isLounge) {
      const membership = await Membership.findOne({
        userId,
        groupId: stringGroupId,
        status: 'active',
      })

      if (!membership && process.env.NODE_ENV === 'production') {
        return response.status(403).json({
          success: false,
          message: 'You are not an active member of this study group',
        })
      }
    }

    const message = await Message.create({
      groupId: stringGroupId,
      senderId: userId,
      content: trimmedContent,
      replyTo: replyTo || null,
      mentions,
      attachments,
    })

    const populatedMessage = await message.populate('senderId', 'name profilePhoto')

    // Trigger mention notifications
    if (Array.isArray(mentions)) {
      for (const mentionId of mentions) {
        createNotification({
          recipient: mentionId,
          sender: userId,
          groupId: stringGroupId,
          type: 'mention',
          title: 'New Chat Mention',
          message: `${userName} mentioned you in chat: "${content.slice(0, 50)}..."`,
        })
      }
    }

    response.status(201).json({
      success: true,
      data: populatedMessage,
    })
  } catch (error) {
    console.error('Create message error:', error)
    response.status(500).json({
      success: false,
      message: 'Failed to create message',
    })
  }
}

export const editMessage = async (request, response) => {
  try {
    const { messageId } = request.params
    const { content } = request.body
    const userId = request.user?.userId || 'u1'

    if (!content || !content.trim()) {
      return response.status(400).json({ success: false, message: 'Updated content is required' })
    }

    const isDbReady = mongoose.connection.readyState === 1 && mongoose.isValidObjectId(messageId)

    if (!isDbReady) {
      let found = null
      for (const list of devMessagesStore.values()) {
        const item = list.find((m) => m._id === messageId)
        if (item) {
          const itemSenderId = item.senderId?._id || item.senderId
          if (String(itemSenderId) !== String(userId) && process.env.NODE_ENV === 'production') {
            return response.status(403).json({ success: false, message: 'You can only edit your own messages' })
          }
          item.content = content.trim()
          item.isEdited = true
          item.editedAt = new Date().toISOString()
          found = item
          break
        }
      }
      if (!found) {
        return response.status(404).json({ success: false, message: 'Message not found' })
      }
      return response.status(200).json({ success: true, data: found })
    }

    const message = await Message.findById(messageId)
    if (!message) {
      return response.status(404).json({ success: false, message: 'Message not found' })
    }

    if (String(message.senderId) !== String(userId)) {
      return response.status(403).json({ success: false, message: 'You can only edit your own messages' })
    }

    message.content = content.trim()
    message.isEdited = true
    message.editedAt = new Date()
    await message.save()

    const populated = await message.populate('senderId', 'name profilePhoto')
    response.status(200).json({ success: true, data: populated })
  } catch (error) {
    console.error('Edit message error:', error)
    response.status(500).json({ success: false, message: 'Failed to edit message' })
  }
}

export const deleteMessage = async (request, response) => {
  try {
    const { messageId } = request.params
    const userId = request.user?.userId || 'u1'

    const isDbReady = mongoose.connection.readyState === 1 && mongoose.isValidObjectId(messageId)

    if (!isDbReady) {
      let deleted = false
      for (const [groupId, list] of devMessagesStore.entries()) {
        const idx = list.findIndex((m) => m._id === messageId)
        if (idx !== -1) {
          list.splice(idx, 1)
          deleted = true
          break
        }
      }
      return response.status(200).json({ success: true, message: 'Message deleted successfully' })
    }

    const message = await Message.findById(messageId)
    if (!message) {
      return response.status(404).json({ success: false, message: 'Message not found' })
    }

    // Check if user is the sender or a group leader/admin
    const isSender = String(message.senderId) === String(userId)
    if (!isSender) {
      const membership = await Membership.findOne({
        userId,
        groupId: message.groupId,
        role: { $in: ['leader', 'admin'] },
        status: 'active',
      })
      if (!membership && process.env.NODE_ENV === 'production') {
        return response.status(403).json({ success: false, message: 'You do not have permission to delete this message' })
      }
    }

    await Message.findByIdAndDelete(messageId)
    response.status(200).json({ success: true, message: 'Message deleted successfully' })
  } catch (error) {
    console.error('Delete message error:', error)
    response.status(500).json({ success: false, message: 'Failed to delete message' })
  }
}

export const togglePinMessage = async (request, response) => {
  try {
    const { messageId } = request.params
    const isDbReady = mongoose.connection.readyState === 1 && mongoose.isValidObjectId(messageId)

    if (!isDbReady) {
      for (const list of devMessagesStore.values()) {
        const item = list.find((m) => m._id === messageId)
        if (item) {
          item.pinned = !item.pinned
          return response.status(200).json({ success: true, data: item })
        }
      }
      return response.status(200).json({ success: true, message: 'Pin state updated' })
    }

    const message = await Message.findById(messageId)
    if (!message) {
      return response.status(404).json({ success: false, message: 'Message not found' })
    }

    message.pinned = !message.pinned
    await message.save()

    response.status(200).json({ success: true, data: message })
  } catch (error) {
    console.error('Toggle pin error:', error)
    response.status(500).json({ success: false, message: 'Failed to pin/unpin message' })
  }
}

export const toggleReaction = async (request, response) => {
  try {
    const { messageId } = request.params
    const { emoji } = request.body
    const userId = request.user?.userId || 'u1'
    const userName = request.user?.name || 'Classmate'

    if (!emoji) {
      return response.status(400).json({ success: false, message: 'Emoji is required' })
    }

    const isDbReady = mongoose.connection.readyState === 1 && mongoose.isValidObjectId(messageId)

    if (!isDbReady) {
      return response.status(200).json({ success: true, message: 'Reaction toggled' })
    }

    const message = await Message.findById(messageId)
    if (!message) {
      return response.status(404).json({ success: false, message: 'Message not found' })
    }

    const existingIndex = message.reactions.findIndex(
      (r) => r.emoji === emoji && String(r.userId) === String(userId)
    )

    if (existingIndex > -1) {
      message.reactions.splice(existingIndex, 1)
    } else {
      message.reactions.push({ emoji, userId, userName })
    }

    await message.save()
    response.status(200).json({ success: true, data: message.reactions })
  } catch (error) {
    console.error('Toggle reaction error:', error)
    response.status(500).json({ success: false, message: 'Failed to toggle reaction' })
  }
}