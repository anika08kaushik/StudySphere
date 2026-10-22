import mongoose from 'mongoose'

const activitySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    userName: {
      type: String,
      required: true,
      trim: true,
    },
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StudyGroup',
      default: null,
      index: true,
    },
    type: {
      type: String,
      enum: ['upload', 'complete', 'edit', 'focus', 'join', 'task', 'note', 'comment'],
      default: 'task',
    },
    action: {
      type: String,
      required: true,
      trim: true,
    },
    target: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { timestamps: true }
)

activitySchema.index({ groupId: 1, createdAt: -1 })

export default mongoose.model('Activity', activitySchema)
