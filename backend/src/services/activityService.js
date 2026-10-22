import mongoose from 'mongoose'
import Activity from '../models/Activity.js'

let globalIo = null

export const setActivityIo = (io) => {
  globalIo = io
}

export const createActivity = async ({
  userId = null,
  user = null,
  userName = 'Student',
  groupId = null,
  type = 'task',
  action,
  target = '',
  targetId = null,
  metadata = {},
  io = globalIo,
}) => {
  try {
    if (!action) {
      throw new Error('Action is required for activity log')
    }

    const effectiveUser = userId || user || null
    let activityObj = null

    if (mongoose.connection.readyState === 1) {
      activityObj = await Activity.create({
        user: effectiveUser,
        userName,
        groupId: groupId || null,
        type,
        action,
        target: target || (targetId ? String(targetId) : ''),
      })
    } else {
      activityObj = {
        _id: `a-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        user: effectiveUser,
        userName,
        groupId: groupId ? String(groupId) : null,
        type,
        action,
        target: target || (targetId ? String(targetId) : ''),
        metadata,
        createdAt: new Date().toISOString(),
      }
    }

    // Real-time broadcast
    const socketServer = io || globalIo
    if (socketServer) {
      if (groupId) {
        socketServer.to(String(groupId)).emit('activity:new', activityObj)
      }
      socketServer.emit('activity:broadcast', activityObj)
    }

    return activityObj
  } catch (error) {
    console.error('Failed to create activity:', error.message)
    return null
  }
}

export default {
  createActivity,
  setActivityIo,
}
