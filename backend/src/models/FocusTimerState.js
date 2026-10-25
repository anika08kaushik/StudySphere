import mongoose from 'mongoose'

// Server-authoritative personal Pomodoro timer state (Phase 7).
// Keyed by user + room so the timer survives refreshes/reconnects:
// when the timer is running, `lastRunningUpdatedAt` marks the wall-clock
// moment the stored remaining seconds were valid, and the backend derives
// elapsed time from it on read (page tabs cannot be relied upon to tick).
const focusTimerStateSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    groupId: {
      type: String,
      default: 'personal',
      index: true,
    },
    mode: {
      type: String,
      enum: ['FOCUS', 'SHORT_BREAK', 'LONG_BREAK'],
      default: 'FOCUS',
    },
    remainingSeconds: {
      type: Number,
      default: 0,
      min: 0,
    },
    isRunning: {
      type: Boolean,
      default: false,
    },
    // Accumulated focused seconds for the current session; paused wall-clock
    // time never increases this value (it only grows while mode === FOCUS and
    // the timer is running).
    focusElapsedSeconds: {
      type: Number,
      default: 0,
      min: 0,
    },
    // When the current focus session originally began (survives refresh).
    sessionStartedAt: {
      type: Date,
      default: null,
    },
    // Full focus duration in minutes for the started session (e.g. 25).
    sessionTargetMinutes: {
      type: Number,
      default: 25,
    },
    lastRunningUpdatedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
)

focusTimerStateSchema.index({ user: 1, groupId: 1 }, { unique: true })

export default mongoose.model('FocusTimerState', focusTimerStateSchema)
