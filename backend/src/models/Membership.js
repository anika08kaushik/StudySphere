import mongoose from 'mongoose'

const membershipSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'StudyGroup', required: true },
  role: { type: String, enum: ['student', 'leader', 'admin'], default: 'student' },
  status: { type: String, enum: ['pending', 'active', 'blocked'], default: 'active' },
  joinedAt: { type: Date, default: Date.now },
}, { timestamps: true })

membershipSchema.index({ userId: 1, groupId: 1 }, { unique: true })

export default mongoose.model('Membership', membershipSchema)
