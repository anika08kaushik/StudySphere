import mongoose from 'mongoose'

// Phase 9: private chat requests raised from focus rooms.
// A request goes PENDING until the recipient accepts or declines. Only an
// ACCEPTED request between two users grants access to their DM conversation.
const chatRequestSchema = new mongoose.Schema(
  {
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    // Focus-room identifier the request was sent from (may be a room id or
    // 'campus_lounge'); strings are allowed so guest rooms can be referenced.
    groupId: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ['PENDING', 'ACCEPTED', 'DECLINED'],
      default: 'PENDING',
      index: true,
    },
  },
  { timestamps: true }
)

chatRequestSchema.index({ to: 1, status: 1, createdAt: -1 })
chatRequestSchema.index({ from: 1, status: 1, createdAt: -1 })

export default mongoose.model('ChatRequest', chatRequestSchema)
