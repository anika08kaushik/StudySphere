import mongoose from 'mongoose'
import CalendarEvent from '../models/CalendarEvent.js'

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id)

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

// Validate and normalize the writable fields of an event payload.
// partial=true (PATCH): title/date become optional and may be omitted.
const sanitizeEventInput = (body = {}, partial = false) => {
  const errors = []
  const out = {}

  const title = typeof body.title === 'string' ? body.title.trim() : ''
  if (!title) {
    if (!partial) errors.push('Title is required')
  } else {
    out.title = title.slice(0, 120)
  }

  if (body.description !== undefined) {
    out.description = String(body.description || '').trim().slice(0, 1000)
  }

  const date = typeof body.date === 'string' ? body.date.trim() : ''
  if (!date) {
    if (!partial) errors.push('Date must be in YYYY-MM-DD format')
  } else if (!DATE_RE.test(date)) {
    errors.push('Date must be in YYYY-MM-DD format')
  } else {
    out.date = date
  }

  if (body.startTime !== undefined) {
    out.startTime = String(body.startTime || '').trim()
  }
  if (body.endTime !== undefined) {
    out.endTime = String(body.endTime || '').trim()
  }

  const validCategories = ['study', 'deadline', 'meeting', 'personal', 'other']
  if (body.category !== undefined) {
    if (!validCategories.includes(body.category)) errors.push('Invalid category')
    else out.category = body.category
  }

  if (body.emoji !== undefined) {
    out.emoji = String(body.emoji || '📚').slice(0, 8)
  }

  if (body.reminderMinutes !== undefined) {
    const minutes = Number(body.reminderMinutes)
    if (!Number.isFinite(minutes) || minutes < 0 || minutes > 10080) {
      errors.push('reminderMinutes must be between 0 and 10080')
    } else {
      out.reminderMinutes = Math.round(minutes)
    }
  }

  if (body.groupId !== undefined) {
    if (body.groupId === null || body.groupId === '') out.groupId = null
    else if (isValidObjectId(body.groupId)) out.groupId = body.groupId
    else errors.push('Invalid groupId')
  }

  if (body.linkedTaskId !== undefined) {
    if (body.linkedTaskId === null || body.linkedTaskId === '') out.linkedTaskId = null
    else if (isValidObjectId(body.linkedTaskId)) out.linkedTaskId = body.linkedTaskId
    else errors.push('Invalid linkedTaskId')
  }

  // endTime must not be earlier than startTime when both are provided
  if (out.startTime && out.endTime && out.endTime < out.startTime) {
    errors.push('End time cannot be before start time')
  }

  return { out, errors }
}

const serializeEvent = (event) => ({
  _id: event._id,
  owner: event.owner?._id || event.owner,
  groupId: event.groupId?._id || event.groupId || null,
  title: event.title,
  description: event.description,
  date: event.date,
  startTime: event.startTime,
  endTime: event.endTime,
  category: event.category,
  emoji: event.emoji,
  reminderMinutes: event.reminderMinutes,
  linkedTaskId: event.linkedTaskId?._id || event.linkedTaskId || null,
  createdAt: event.createdAt,
  updatedAt: event.updatedAt,
})

// GET /api/calendar/events?from=YYYY-MM-DD&to=YYYY-MM-DD&category=...
export const getCalendarEvents = async (request, response) => {
  try {
    const me = request.user?.userId
    if (!isValidObjectId(me)) {
      return response.status(401).json({ success: false, message: 'Authentication required' })
    }

    const query = { owner: me }
    const { from, to, category } = request.query

    if (from || to) {
      query.date = {}
      if (from && DATE_RE.test(from)) query.date.$gte = from
      if (to && DATE_RE.test(to)) query.date.$lte = to
    }
    if (category && category !== 'ALL') {
      query.category = category
    }

    const events = await CalendarEvent.find(query).sort({ date: 1, startTime: 1 })
    return response.status(200).json({ success: true, data: events.map(serializeEvent) })
  } catch (error) {
    console.error('Get calendar events error:', error)
    return response
      .status(500)
      .json({ success: false, message: 'Unable to fetch calendar events' })
  }
}

// POST /api/calendar/events
export const createCalendarEvent = async (request, response) => {
  try {
    const me = request.user?.userId
    if (!isValidObjectId(me)) {
      return response.status(401).json({ success: false, message: 'Authentication required' })
    }

    const { out, errors } = sanitizeEventInput(request.body)
    if (errors.length > 0) {
      return response.status(400).json({ success: false, message: errors.join('. ') })
    }

    const event = await CalendarEvent.create({ ...out, owner: me })
    return response.status(201).json({ success: true, data: serializeEvent(event) })
  } catch (error) {
    console.error('Create calendar event error:', error)
    return response
      .status(500)
      .json({ success: false, message: 'Unable to create calendar event' })
  }
}

// PATCH /api/calendar/events/:eventId
export const updateCalendarEvent = async (request, response) => {
  try {
    const me = request.user?.userId
    const { eventId } = request.params
    if (!isValidObjectId(me) || !isValidObjectId(eventId)) {
      return response.status(400).json({ success: false, message: 'Invalid event id' })
    }

    const event = await CalendarEvent.findOne({ _id: eventId, owner: me })
    if (!event) {
      return response.status(404).json({ success: false, message: 'Event not found' })
    }

    const { out, errors } = sanitizeEventInput(request.body, true)
    if (errors.length > 0) {
      return response.status(400).json({ success: false, message: errors.join('. ') })
    }

    // Merged validation: never allow the merged document to violate time order
    const mergedStart = out.startTime ?? event.startTime
    const mergedEnd = out.endTime ?? event.endTime
    if (mergedStart && mergedEnd && mergedEnd < mergedStart) {
      return response
        .status(400)
        .json({ success: false, message: 'End time cannot be before start time' })
    }

    Object.assign(event, out)
    await event.save()
    return response.status(200).json({ success: true, data: serializeEvent(event) })
  } catch (error) {
    console.error('Update calendar event error:', error)
    return response
      .status(500)
      .json({ success: false, message: 'Unable to update calendar event' })
  }
}

// DELETE /api/calendar/events/:eventId
export const deleteCalendarEvent = async (request, response) => {
  try {
    const me = request.user?.userId
    const { eventId } = request.params
    if (!isValidObjectId(me) || !isValidObjectId(eventId)) {
      return response.status(400).json({ success: false, message: 'Invalid event id' })
    }

    const event = await CalendarEvent.findOneAndDelete({ _id: eventId, owner: me })
    if (!event) {
      return response.status(404).json({ success: false, message: 'Event not found' })
    }
    return response
      .status(200)
      .json({ success: true, message: 'Event deleted', data: { _id: event._id } })
  } catch (error) {
    console.error('Delete calendar event error:', error)
    return response
      .status(500)
      .json({ success: false, message: 'Unable to delete calendar event' })
  }
}

export default {
  getCalendarEvents,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
}
