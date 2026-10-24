import mongoose from 'mongoose'

// Phase 10: persisted calendar events with descriptive details + emoji mood.
// `date` is stored as YYYY-MM-DD (calendar-day semantics, timezone-safe) and
// start/end times as HH:mm strings so an event always stays on its date.
const calendarEventSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    // Optional: a shared event created inside a study group
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StudyGroup',
      default: null,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: 1000,
    },
    date: {
      type: String,
      required: true,
      // YYYY-MM-DD
      match: /^\d{4}-\d{2}-\d{2}$/,
    },
    startTime: {
      type: String,
      default: '',
      // HH:mm (24h), optional
      match: /^$|^([01]\d|2[0-3]):[0-5]\d$/,
    },
    endTime: {
      type: String,
      default: '',
      match: /^$|^([01]\d|2[0-3]):[0-5]\d$/,
    },
    // study | deadline | meeting | personal | other
    category: {
      type: String,
      enum: ['study', 'deadline', 'meeting', 'personal', 'other'],
      default: 'study',
    },
    // Custom mood emoji chosen by the user
    emoji: {
      type: String,
      default: '📚',
      maxlength: 8,
    },
    // Reminder minutes before the event (0 = none)
    reminderMinutes: {
      type: Number,
      default: 0,
      min: 0,
      max: 10080,
    },
    // Optional linked task (Kanban)
    linkedTaskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      default: null,
    },
  },
  { timestamps: true }
)

calendarEventSchema.index({ owner: 1, date: 1 })
calendarEventSchema.index({ owner: 1, category: 1 })

export default mongoose.model('CalendarEvent', calendarEventSchema)
