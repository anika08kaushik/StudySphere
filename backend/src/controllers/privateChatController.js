import mongoose from 'mongoose'
import ChatRequest from '../models/ChatRequest.js'
import DirectMessage from '../models/DirectMessage.js'
import User from '../models/User.js'
import { getPrivateChatIo } from '../services/privateChatService.js'

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id)

const conversationKeyFor = (userA, userB) => [String(userA), String(userB)].sort().join(':')

const publicUser = (user) =>
  user
    ? {
        id: user._id || user.id || user.userId,
        name: user.name || 'Student',
        profilePhoto: user.profilePhoto || null,
      }
    : { id: null, name: 'Student', profilePhoto: null }

// Only an ACCEPTED request between the pair grants conversation access.
const findAcceptedRequest = async (userA, userB) =>
  ChatRequest.findOne({
    $or: [
      { from: userA, to: userB, status: 'ACCEPTED' },
      { from: userB, to: userA, status: 'ACCEPTED' },
    ],
  })

// POST /api/private-chat/requests  { toUserId, groupId }
export const sendChatRequest = async (request, response) => {
  try {
    const fromId = request.user?.userId
    const { toUserId, groupId = null } = request.body || {}

    if (!isValidObjectId(fromId) || !isValidObjectId(toUserId)) {
      return response.status(400).json({
        success: false,
        message: 'A valid toUserId is required',
      })
    }
    if (String(toUserId) === String(fromId)) {
      return response.status(400).json({
        success: false,
        message: 'You cannot connect with yourself',
      })
    }

    const target = await User.findById(toUserId).select('name profilePhoto')
    if (!target) {
      return response.status(404).json({
        success: false,
        message: 'User not found',
      })
    }

    // Existing request between the pair (either direction)
    const existing = await ChatRequest.findOne({
      $or: [
        { from: fromId, to: toUserId, status: { $in: ['PENDING', 'ACCEPTED'] } },
        { from: toUserId, to: fromId, status: { $in: ['PENDING', 'ACCEPTED'] } },
      ],
    })

    if (existing?.status === 'ACCEPTED') {
      return response.status(200).json({
        success: true,
        message: 'Already connected',
        data: { status: 'ACCEPTED', requestId: existing._id },
      })
    }

    if (existing?.status === 'PENDING') {
      // If the other person already asked us, treat this as mutual acceptance.
      if (String(existing.to) === String(fromId)) {
        existing.status = 'ACCEPTED'
        await existing.save()
        const io = getPrivateChatIo()
        if (io) {
          io.to(`user:${existing.from}`).emit('chat_request:update', {
            requestId: existing._id,
            action: 'accepted',
            status: 'ACCEPTED',
            peer: publicUser({ _id: toUserId, name: target.name, profilePhoto: target.profilePhoto }),
          })
        }
        return response.status(200).json({
          success: true,
          message: 'Requests matched - chat is now open',
          data: { status: 'ACCEPTED', requestId: existing._id },
        })
      }
      return response.status(200).json({
        success: true,
        message: 'Request already pending',
        data: { status: 'PENDING', requestId: existing._id },
      })
    }

    const created = await ChatRequest.create({
      from: fromId,
      to: toUserId,
      groupId: typeof groupId === 'string' ? groupId : null,
    })

    // Live notification to the recipient's personal socket room
    const io = getPrivateChatIo()
    if (io) {
      io.to(`user:${toUserId}`).emit('chat_request:new', {
        requestId: created._id,
        from: publicUser(request.user),
        groupId: created.groupId,
        createdAt: created.createdAt,
      })
    }

    return response.status(201).json({
      success: true,
      message: 'Chat request sent',
      data: {
        requestId: created._id,
        status: created.status,
        peer: publicUser(target),
      },
    })
  } catch (error) {
    console.error('Send chat request error:', error)
    return response.status(500).json({
      success: false,
      message: 'Unable to send chat request',
    })
  }
}

// GET /api/private-chat/requests - incoming, outgoing and accepted partners
export const getChatRequests = async (request, response) => {
  try {
    const me = request.user?.userId
    if (!isValidObjectId(me)) {
      return response.status(401).json({ success: false, message: 'Authentication required' })
    }

    const [incomingRaw, outgoingRaw, acceptedRaw] = await Promise.all([
      ChatRequest.find({ to: me, status: 'PENDING' }).populate('from', 'name profilePhoto').sort({ createdAt: -1 }),
      ChatRequest.find({ from: me, status: 'PENDING' }).populate('to', 'name profilePhoto').sort({ createdAt: -1 }),
      ChatRequest.find({ $or: [{ from: me }, { to: me }], status: 'ACCEPTED' }).populate(
        'from to',
        'name profilePhoto'
      ),
    ])

    const incoming = incomingRaw.map((r) => ({
      _id: r._id,
      groupId: r.groupId,
      createdAt: r.createdAt,
      peer: publicUser(r.from),
    }))
    const outgoing = outgoingRaw.map((r) => ({
      _id: r._id,
      groupId: r.groupId,
      createdAt: r.createdAt,
      peer: publicUser(r.to),
    }))

    // Accepted partners with the userId always normalized to the *other* user
    const partners = []
    acceptedRaw.forEach((r) => {
      const peerDoc = String(r.from?._id || r.from) === String(me) ? r.to : r.from
      const peer = publicUser(peerDoc)
      if (peer.id) partners.push({ requestId: r._id, ...peer })
    })

    return response.status(200).json({
      success: true,
      data: { incoming, outgoing, partners },
    })
  } catch (error) {
    console.error('Get chat requests error:', error)
    return response.status(500).json({
      success: false,
      message: 'Unable to fetch chat requests',
    })
  }
}

// POST /api/private-chat/requests/:requestId/respond  { action: accept|decline }
export const respondChatRequest = async (request, response) => {
  try {
    const me = request.user?.userId
    const { requestId } = request.params
    const { action } = request.body || {}

    if (!['accept', 'decline'].includes(action)) {
      return response.status(400).json({
        success: false,
        message: 'Action must be accept or decline',
      })
    }

    const chatRequest = await ChatRequest.findById(requestId).populate('from to', 'name profilePhoto')
    if (!chatRequest) {
      return response.status(404).json({ success: false, message: 'Request not found' })
    }
    if (String(chatRequest.to._id || chatRequest.to) !== String(me)) {
      return response.status(403).json({
        success: false,
        message: 'Only the recipient can respond to this request',
      })
    }
    if (chatRequest.status !== 'PENDING') {
      return response.status(200).json({
        success: true,
        message: `Request already ${chatRequest.status.toLowerCase()}`,
        data: chatRequest,
      })
    }

    chatRequest.status = action === 'accept' ? 'ACCEPTED' : 'DECLINED'
    await chatRequest.save()

    const io = getPrivateChatIo()
    if (io) {
      // Tell both sides the request was resolved
      io.to(`user:${String(chatRequest.from._id || chatRequest.from)}`).emit('chat_request:update', {
        requestId: chatRequest._id,
        action,
        status: chatRequest.status,
        peer: publicUser(chatRequest.to),
      })
      io.to(`user:${String(me)}`).emit('chat_request:update', {
        requestId: chatRequest._id,
        action,
        status: chatRequest.status,
        peer: publicUser(chatRequest.from),
      })
    }

    return response.status(200).json({
      success: true,
      message: action === 'accept' ? 'Chat request accepted' : 'Chat request declined',
      data: chatRequest,
    })
  } catch (error) {
    console.error('Respond chat request error:', error)
    return response.status(500).json({
      success: false,
      message: 'Unable to respond to chat request',
    })
  }
}

// GET /api/private-chat/dm/:peerId/messages - thread history (acceptors only)
export const getDmMessages = async (request, response) => {
  try {
    const me = request.user?.userId
    const { peerId } = request.params

    if (!isValidObjectId(me)) {
      return response.status(401).json({ success: false, message: 'Authentication required' })
    }
    if (!isValidObjectId(peerId)) {
      return response.status(400).json({ success: false, message: 'Invalid peer id' })
    }

    const accepted = await findAcceptedRequest(me, peerId)
    if (!accepted) {
      return response.status(403).json({
        success: false,
        message: 'Chat is only available after a connection is accepted',
      })
    }

    const messages = await DirectMessage.find({
      conversationKey: conversationKeyFor(me, peerId),
    })
      .sort({ createdAt: -1 })
      .limit(100)
    messages.reverse() // chronological order

    return response.status(200).json({ success: true, data: messages })
  } catch (error) {
    console.error('Get DM messages error:', error)
    return response.status(500).json({
      success: false,
      message: 'Unable to fetch conversation',
    })
  }
}

// POST /api/private-chat/dm/:peerId/messages  { content }
export const sendDmMessage = async (request, response) => {
  try {
    const me = request.user?.userId
    const { peerId } = request.params
    const content = typeof request.body?.content === 'string' ? request.body.content.trim() : ''

    if (!isValidObjectId(me)) {
      return response.status(401).json({ success: false, message: 'Authentication required' })
    }
    if (!isValidObjectId(peerId)) {
      return response.status(400).json({ success: false, message: 'Invalid peer id' })
    }
    if (!content) {
      return response.status(400).json({ success: false, message: 'Message content is required' })
    }

    const accepted = await findAcceptedRequest(me, peerId)
    if (!accepted) {
      return response.status(403).json({
        success: false,
        message: 'Chat is only available after a connection is accepted',
      })
    }

    const sender = await User.findById(me).select('name profilePhoto')
    const message = await DirectMessage.create({
      conversationKey: conversationKeyFor(me, peerId),
      senderId: me,
      content,
    })

    const io = getPrivateChatIo()
    if (io) {
      const payload = {
        peerId: String(peerId),
        message: {
          _id: message._id,
          conversationKey: message.conversationKey,
          senderId: String(me),
          senderName: sender?.name || 'Student',
          content: message.content,
          createdAt: message.createdAt,
        },
      }
      io.to(`user:${String(me)}`).emit('dm:new', payload)
      io.to(`user:${String(peerId)}`).emit('dm:new', payload)
    }

    return response.status(201).json({ success: true, data: message })
  } catch (error) {
    console.error('Send DM message error:', error)
    return response.status(500).json({
      success: false,
      message: 'Unable to send message',
    })
  }
}
