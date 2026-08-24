import Message from '../models/Message.js'
import Membership from '../models/Membership.js'

export const getMessages = async (request, response) => {
  try {
    const { groupId } = request.params
    const userId = request.user.userId

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