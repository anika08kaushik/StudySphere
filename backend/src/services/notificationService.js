import mongoose from 'mongoose'
import Notification from '../models/Notification.js'

let globalIo = null

export const setNotificationIo = (io) => {
  globalIo = io
}

export const createNotification = async ({
  recipient,
  sender = null,
  groupId = null,
  type = 'general',
  title = '',
  message,
  metadata = {},
  io = globalIo,
}) => {
  try {
    if (!recipient || !message) {
      throw new Error('Recipient and message are required for notification')
    }

    let notificationObj = null

    if (mongoose.connection.readyState === 1) {
      notificationObj = await Notification.create({
        recipient,
        sender,
        groupId,
        type,
        title,
        message,
        metadata,
      })
    } else {
      notificationObj = {
        _id: `n-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        recipient: String(recipient),
        sender: sender ? String(sender) : null,
        groupId: groupId ? String(groupId) : null,
        type,
        title,
        message,
        read: false,
        metadata,
        createdAt: new Date().toISOString(),
      }
    }

    // Real-time delivery
    const socketServer = io || globalIo
    if (socketServer) {
      // Emit to recipient's personal user room and broadcast
      socketServer.to(`user:${recipient}`).emit('notification:new', notificationObj)
      socketServer.emit('notification:broadcast', notificationObj)
    }

    return notificationObj
  } catch (error) {
    console.error('Failed to create notification:', error.message)
    return null
  }
}

export default {
  createNotification,
  setNotificationIo,
}
