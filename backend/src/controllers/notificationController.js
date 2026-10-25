import mongoose from 'mongoose'
import Notification from '../models/Notification.js'

const devNotifications = [
  { _id: 'n1', type: 'mention', title: 'Mention', message: 'Rahul mentioned you in ML Chat', read: false, createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString() },
  { _id: 'n2', type: 'upload', title: 'Resource Upload', message: 'Rahul uploaded CNN.pdf to ML Resources', read: false, createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString() },
  { _id: 'n3', type: 'task', title: 'Task Assignment', message: 'You were assigned "CNN Model Architecture"', read: false, createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString() },
  { _id: 'n4', type: 'deadline', title: 'Upcoming Deadline', message: 'ML Assignment is due tomorrow', read: true, createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString() },
  { _id: 'n5', type: 'join', title: 'New Member', message: 'Aryan joined the DBMS group', read: true, createdAt: new Date(Date.now() - 1000 * 60 * 360).toISOString() },
]

export const getNotifications = async (request, response) => {
  try {
    const userId = request.user?.userId || request.user?._id || request.user?.id
    const isDbReady = mongoose.connection.readyState === 1 && mongoose.isValidObjectId(userId)

    if (!isDbReady) {
      return response.status(200).json({
        success: true,
        data: devNotifications,
      })
    }

    const notifications = await Notification.find({ recipient: userId })
      .populate('sender', 'name profilePhoto email')
      .sort({ createdAt: -1 })
      .limit(50)

    response.status(200).json({
      success: true,
      data: notifications,
    })
  } catch (error) {
    console.error('Get notifications error:', error)
    response.status(500).json({ success: false, message: 'Failed to fetch notifications' })
  }
}

export const markNotificationRead = async (request, response) => {
  try {
    const { id } = request.params
    const userId = request.user?.userId
    const isDbReady = mongoose.connection.readyState === 1 && mongoose.isValidObjectId(id) && mongoose.isValidObjectId(userId)

    if (!isDbReady) {
      const item = devNotifications.find((n) => n._id === id)
      if (item) item.read = true
      return response.status(200).json({ success: true, message: 'Notification marked as read' })
    }

    await Notification.findOneAndUpdate({ _id: id, recipient: userId }, { read: true })
    response.status(200).json({ success: true, message: 'Notification marked as read' })
  } catch (error) {
    console.error('Mark read error:', error)
    response.status(500).json({ success: false, message: 'Failed to update notification' })
  }
}

export const markAllNotificationsRead = async (request, response) => {
  try {
    const userId = request.user?.userId
    const isDbReady = mongoose.connection.readyState === 1 && mongoose.isValidObjectId(userId)

    if (!isDbReady) {
      devNotifications.forEach((n) => { n.read = true })
      return response.status(200).json({ success: true, message: 'All notifications marked as read' })
    }

    await Notification.updateMany({ recipient: userId, read: false }, { read: true })
    response.status(200).json({ success: true, message: 'All notifications marked as read' })
  } catch (error) {
    console.error('Mark all read error:', error)
    response.status(500).json({ success: false, message: 'Failed to mark all as read' })
  }
}
