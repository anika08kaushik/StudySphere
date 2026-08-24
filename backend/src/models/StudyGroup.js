import mongoose from 'mongoose'

const studyGroupSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: String,
  subjects: [String],
  coverImage: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true })

export default mongoose.model('StudyGroup', studyGroupSchema)
