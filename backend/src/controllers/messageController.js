import mongoose from 'mongoose'
import Message from '../models/Message.js'
import Membership from '../models/Membership.js'

// In-memory fallback message storage for local development without MongoDB
const devMessagesStore = new Map()

export const getMessages = async (request, response) => {
  try {
    const { groupId } = request.params
    const userId = request.user?.userId || 'u1'

    if (mongoose.connection.readyState !== 1) {
      if (!devMessagesStore.has(groupId)) {
        devMessagesStore.set(groupId, [
          {
            _id: 'msg-demo-1',
            groupId,
            senderId: { _id: 'u2', name: 'Rahul', profilePhoto: null },
            content: 'Hey everyone! Welcome to the group chat.',
            createdAt: new Date(Date.now() - 3600000).toISOString(),
            reactions: [{ emoji: '👋', userName: 'Anika' }],
          },
          {
            _id: 'msg-demo-2',
            groupId,
            senderId: { _id: 'u3', name: 'Anika', profilePhoto: null },
            content: "Let's review the notes and collaborate on upcoming tasks.",
            createdAt: new Date(Date.now() - 1800000).toISOString(),
            reactions: [{ emoji: '🚀', userName: 'Rahul' }],
          },
        ])
      }

      return response.status(200).json({
        success: true,
        data: devMessagesStore.get(groupId),
      })
    }

    const membership = await Membership.findOne({
      userId,
      groupId,
      status: 'active',
    })

    if (!membership) {
      return response.status(403).json({
        success: false,
        message: 'You are not an active member of this study group',
      })
    }

    const messages = await Message.find({ groupId })
      .populate('senderId', 'name profilePhoto')
      .sort({ createdAt: 1 })

    response.status(200).json({
      success: true,
      data: messages,
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
    const { content } = request.body
    const userId = request.user.userId

    if (!content || !content.trim()) {
      return response.status(400).json({
        success: false,
        message: 'Message content is required',
      })
    }

    if (mongoose.connection.readyState !== 1) {
      const mockCreated = {
        _id: `msg-${Date.now()}`,
        groupId,
        senderId: { _id: userId, name: 'You', profilePhoto: null },
        content: content.trim(),
        reactions: [],
        createdAt: new Date().toISOString(),
      }
      if (!devMessagesStore.has(groupId)) devMessagesStore.set(groupId, [])
      devMessagesStore.get(groupId).push(mockCreated)

      return response.status(201).json({
        success: true,
        data: mockCreated,
      })
    }

    const membership = await Membership.findOne({
      userId,
      groupId,
      status: 'active',
    })

    if (!membership) {
      return response.status(403).json({
        success: false,
        message: 'You are not an active member of this study group',
      })
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