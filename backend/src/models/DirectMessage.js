import mongoose from 'mongoose'

// Phase 9: persisted private (direct) messages between two accepted users.
// conversationKey is the sorted "userIdA:userIdB" pair so either side can
// load the same thread and only those two users can reach it.
const directMessageSchema = new mongoose.Schema(
  {
    conversationKey: {
      type: String,
      required: true,
      index: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
  },
  { timestamps: true }
)

directMessageSchema.index({ conversationKey: 1, createdAt: 1 })

export default mongoose.model('DirectMessage', directMessageSchema)
