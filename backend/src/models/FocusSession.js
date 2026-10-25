import mongoose from 'mongoose'

const focusSessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StudyGroup',
      default: null,
      index: true,
    },
    startTime: {
      type: Date,
      required: true,
      default: Date.now,
    },
    endTime: {
      type: Date,
      default: Date.now,
    },
    duration: {
      type: Number,
      required: true,
      min: 0, // duration in seconds
    },
    status: {
      type: String,
      enum: ['COMPLETED', 'INTERRUPTED', 'ABANDONED'],
      default: 'COMPLETED',
    },
    sessionType: {
      type: String,
      enum: ['FOCUS', 'SHORT_BREAK', 'LONG_BREAK'],
      default: 'FOCUS',
    },
    targetMinutes: {
      type: Number,
      default: 25,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    // Client-side idempotency id (Phase 7): prevents duplicate session records
    // when a timer completion is retried or reported twice.
    eventId: {
      type: String,
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
  }
)

focusSessionSchema.index({ user: 1, createdAt: -1 })
focusSessionSchema.index(
  { user: 1, eventId: 1 },
  {
    unique: true,
    partialFilterExpression: { eventId: { $type: 'string' } },
  }
)
focusSessionSchema.index({ user: 1, startTime: -1 })
focusSessionSchema.index({ groupId: 1, createdAt: -1 })

export default mongoose.model('FocusSession', focusSessionSchema)
