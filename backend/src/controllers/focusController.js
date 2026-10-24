import mongoose from 'mongoose'
import FocusSession from '../models/FocusSession.js'
import StudyGroup from '../models/StudyGroup.js'
import Membership from '../models/Membership.js'
import { createActivity } from '../services/activityService.js'

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id)

// Helper to get beginning of a day
const getStartOfDay = (date = new Date()) => {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

// POST /api/focus/sessions
export const recordSession = async (request, response) => {
  try {
    const userId = request.user?.userId
    const {
      groupId,
      startTime,
      endTime,
      duration,
      status = 'COMPLETED',
      sessionType = 'FOCUS',
      targetMinutes = 25,
      notes = '',
    } = request.body

    if (duration === undefined || typeof duration !== 'number' || duration < 0) {
      return response.status(400).json({
        success: false,
        message: 'Valid duration in seconds is required',
      })
    }

    const validStatuses = ['COMPLETED', 'INTERRUPTED', 'ABANDONED']
    if (status && !validStatuses.includes(status)) {
      return response.status(400).json({
        success: false,
        message: `Status must be one of: ${validStatuses.join(', ')}`,
      })
    }

    const validSessionTypes = ['FOCUS', 'SHORT_BREAK', 'LONG_BREAK']
    if (sessionType && !validSessionTypes.includes(sessionType)) {
      return response.status(400).json({
        success: false,
        message: `Session type must be one of: ${validSessionTypes.join(', ')}`,
      })
    }

    const parsedStartTime = startTime ? new Date(startTime) : new Date(Date.now() - duration * 1000)
    const parsedEndTime = endTime ? new Date(endTime) : new Date()

    let effectiveGroupId = null
    if (groupId && isValidObjectId(groupId)) {
      effectiveGroupId = groupId
    }

    const session = await FocusSession.create({
      user: userId,
      groupId: effectiveGroupId,
      startTime: parsedStartTime,
      endTime: parsedEndTime,
      duration: Math.round(duration),
      status,
      sessionType,
      targetMinutes: Number(targetMinutes) || 25,
      notes: typeof notes === 'string' ? notes.trim() : '',
    })

    // Log Activity for completed focus sessions
    if (status === 'COMPLETED' && sessionType === 'FOCUS' && Math.round(duration) >= 60) {
      const minutes = Math.round(duration / 60)
      createActivity({
        userId,
        userName: request.user?.name || 'Member',
        groupId: effectiveGroupId,
        type: 'focus',
        action: `completed a ${minutes}-min focus session`,
        target: `${minutes} minutes focused`,
        targetId: session._id,
      }).catch(() => {})
    }

    return response.status(201).json({
      success: true,
      message: 'Focus session recorded successfully',
      data: session,
    })
  } catch (error) {
    console.error('Record focus session error:', error)
    return response.status(500).json({
      success: false,
      message: 'Unable to record focus session',
    })
  }
}

// GET /api/focus/sessions
export const getSessions = async (request, response) => {
  try {
    const userId = request.user?.userId
    const { groupId, limit = 20, page = 1 } = request.query

    const filter = { user: userId }
    if (groupId && isValidObjectId(groupId)) {
      filter.groupId = groupId
    }

    const numLimit = Math.min(Math.max(Number(limit) || 20, 1), 100)
    const numPage = Math.max(Number(page) || 1, 1)
    const skip = (numPage - 1) * numLimit

    const [sessions, total] = await Promise.all([
      FocusSession.find(filter)
        .populate('groupId', 'name')
        .sort({ startTime: -1 })
        .skip(skip)
        .limit(numLimit),
      FocusSession.countDocuments(filter),
    ])

    return response.status(200).json({
      success: true,
      data: sessions,
      pagination: {
        total,
        page: numPage,
        limit: numLimit,
        pages: Math.ceil(total / numLimit),
      },
    })
  } catch (error) {
    console.error('Get focus sessions error:', error)
    return response.status(500).json({
      success: false,
      message: 'Unable to fetch focus sessions',
    })
  }
}

// GET /api/focus/stats
export const getFocusStats = async (request, response) => {
  try {
    const userId = request.user?.userId
    const now = new Date()

    // 1. Time Boundaries
    const startOfToday = getStartOfDay(now)
    const startOfSevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const startOfThirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    // Fetch all user sessions for calculations
    const allSessions = await FocusSession.find({
      user: userId,
      sessionType: 'FOCUS',
      status: { $ne: 'ABANDONED' },
    }).sort({ startTime: 1 })

    // Aggregations
    let todaySeconds = 0
    let weeklySeconds = 0
    let monthlySeconds = 0
    let completedSessionsCount = 0

    // Set of dates string 'YYYY-MM-DD' for streak calculation
    const sessionDatesSet = new Set()

    allSessions.forEach((session) => {
      const sTime = new Date(session.startTime).getTime()
      const duration = session.duration || 0

      if (sTime >= startOfToday.getTime()) {
        todaySeconds += duration
      }
      if (sTime >= startOfSevenDaysAgo.getTime()) {
        weeklySeconds += duration
      }
      if (sTime >= startOfThirtyDaysAgo.getTime()) {
        monthlySeconds += duration
      }

      if (session.status === 'COMPLETED') {
        completedSessionsCount++
        // Record date in YYYY-MM-DD
        const dateKey = new Date(session.startTime).toISOString().split('T')[0]
        sessionDatesSet.add(dateKey)
      }
    })

    // Calculate streaks
    const uniqueDates = Array.from(sessionDatesSet).sort()
    let currentStreak = 0
    let longestStreak = 0

    if (uniqueDates.length > 0) {
      // Calculate longest streak
      let tempStreak = 1
      longestStreak = 1
      for (let i = 1; i < uniqueDates.length; i++) {
        const prev = new Date(uniqueDates[i - 1])
        const curr = new Date(uniqueDates[i])
        const diffDays = Math.round((curr - prev) / (1000 * 60 * 60 * 24))

        if (diffDays === 1) {
          tempStreak++
          longestStreak = Math.max(longestStreak, tempStreak)
        } else if (diffDays > 1) {
          tempStreak = 1
        }
      }

      // Calculate current streak
      const todayKey = now.toISOString().split('T')[0]
      const yesterdayKey = new Date(now.getTime() - 86400000).toISOString().split('T')[0]

      const hasToday = sessionDatesSet.has(todayKey)
      const hasYesterday = sessionDatesSet.has(yesterdayKey)

      if (hasToday || hasYesterday) {
        let checkDate = hasToday ? new Date(now) : new Date(now.getTime() - 86400000)
        while (true) {
          const key = checkDate.toISOString().split('T')[0]
          if (sessionDatesSet.has(key)) {
            currentStreak++
            checkDate = new Date(checkDate.getTime() - 86400000)
          } else {
            break
          }
        }
      }
    }

    // 7-day daily breakdown
    const dailyBreakdown = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000)
      const dateKey = d.toISOString().split('T')[0]
      const dayStart = getStartOfDay(d).getTime()
      const dayEnd = dayStart + 86400000

      const daySessions = allSessions.filter((s) => {
        const st = new Date(s.startTime).getTime()
        return st >= dayStart && st < dayEnd
      })

      const daySecs = daySessions.reduce((acc, curr) => acc + (curr.duration || 0), 0)

      dailyBreakdown.push({
        date: dateKey,
        dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
        focusMinutes: Math.round(daySecs / 60),
        sessionsCount: daySessions.filter((s) => s.status === 'COMPLETED').length,
      })
    }

    return response.status(200).json({
      success: true,
      data: {
        todayMinutes: Math.round(todaySeconds / 60),
        todaySeconds,
        weeklyMinutes: Math.round(weeklySeconds / 60),
        weeklySeconds,
        monthlyMinutes: Math.round(monthlySeconds / 60),
        monthlySeconds,
        totalCompletedSessions: completedSessionsCount,
        currentStreak,
        longestStreak,
        dailyBreakdown,
        recentSessions: allSessions.slice(-5).reverse(),
      },
    })
  } catch (error) {
    console.error('Get focus stats error:', error)
    return response.status(500).json({
      success: false,
      message: 'Unable to calculate focus statistics',
    })
  }
}
