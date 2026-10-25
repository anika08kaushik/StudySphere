import mongoose from 'mongoose'
import Activity from '../models/Activity.js'
import User from '../models/User.js'

const devActivities = [
  { _id: 'a1', type: 'upload', user: 'u2', userName: 'Rahul', action: 'uploaded CNN.pdf', target: 'ML Resources', createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString() },
  { _id: 'a2', type: 'complete', user: 'u4', userName: 'Karan', action: 'completed "Research Paper Summary"', target: 'Tasks', createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString() },
  { _id: 'a3', type: 'edit', user: 'u3', userName: 'Anika', action: 'edited Collaborative Notes', target: 'CNN Notes', createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString() },
  { _id: 'a4', type: 'focus', user: 'u1', userName: 'You', action: 'completed a focus session', target: '45 min', createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString() },
  { _id: 'a5', type: 'join', user: 'u5', userName: 'Aryan', action: 'joined DBMS Study Group', target: 'Groups', createdAt: new Date(Date.now() - 1000 * 60 * 240).toISOString() },
]

export const getActivities = async (request, response) => {
  try {
    const { groupId } = request.query
    const validGroupId = mongoose.isValidObjectId(groupId) ? groupId : null

    if (mongoose.connection.readyState !== 1 || (groupId && !validGroupId)) {
      const filtered = groupId ? devActivities.filter((a) => a.groupId === groupId) : devActivities
      return response.status(200).json({
        success: true,
        data: filtered,
      })
    }

    const query = validGroupId ? { groupId: validGroupId } : {}
    const activities = await Activity.find(query)
      .sort({ createdAt: -1 })
      .limit(50)

    response.status(200).json({
      success: true,
      data: activities,
    })
  } catch (error) {
    console.error('Get activities error:', error)
    response.status(500).json({ success: false, message: 'Failed to fetch activities' })
  }
}

export const createActivity = async (request, response) => {
  try {
    const { type, action, target, groupId } = request.body
    const userId = request.user?.userId || null
    let userName = request.user?.name
    if (!userName && mongoose.connection.readyState === 1 && mongoose.isValidObjectId(userId)) {
      const userDoc = await User.findById(userId).select('name').lean()
      if (userDoc?.name) userName = userDoc.name
    }
    userName = userName || 'Classmate'

    if (!action) {
      return response.status(400).json({ success: false, message: 'Action is required' })
    }

    const isDbReady = mongoose.connection.readyState === 1
    const validUserId = mongoose.isValidObjectId(userId) ? userId : null
    const validGroupId = mongoose.isValidObjectId(groupId) ? groupId : null

    if (!isDbReady) {
      const mockActivity = {
        _id: `a-${Date.now()}`,
        type: type || 'task',
        user: userId,
        userName,
        groupId: groupId || null,
        action,
        target: target || '',
        createdAt: new Date().toISOString(),
      }
      devActivities.unshift(mockActivity)
      return response.status(201).json({ success: true, data: mockActivity })
    }

    const activity = await Activity.create({
      user: validUserId,
      userName,
      groupId: validGroupId,
      type: type || 'task',
      action,
      target: target || '',
    })

    response.status(201).json({ success: true, data: activity })
  } catch (error) {
    console.error('Create activity error:', error)
    response.status(500).json({ success: false, message: 'Failed to create activity' })
  }
}
