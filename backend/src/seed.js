import 'dotenv/config'
import bcrypt from 'bcryptjs'
import mongoose from 'mongoose'
import connectDatabase from './config/db.js'
import User from './models/User.js'
import StudyGroup from './models/StudyGroup.js'
import Membership from './models/Membership.js'

const seed = async () => {
  await connectDatabase()
  try {
    const password = await bcrypt.hash('password123', 10)
    const users = await Promise.all([
      User.findOneAndUpdate(
        { email: 'leader@test.com' },
        { $set: { name: 'Test Leader', password } },
        { returnDocument: 'after', upsert: true, runValidators: true, setDefaultsOnInsert: true },
      ),
      User.findOneAndUpdate(
        { email: 'student1@test.com' },
        { $set: { name: 'Test Student 1', password } },
        { returnDocument: 'after', upsert: true, runValidators: true, setDefaultsOnInsert: true },
      ),
      User.findOneAndUpdate(
        { email: 'student2@test.com' },
        { $set: { name: 'Test Student 2', password } },
        { returnDocument: 'after', upsert: true, runValidators: true, setDefaultsOnInsert: true },
      ),
    ])
    const [leader, student1, student2] = users
    const group = await StudyGroup.findOneAndUpdate(
      { name: 'Machine Learning', createdBy: leader._id },
      {
        $set: {
          description: 'Shared development study group',
          subjects: ['Machine Learning'],
        },
      },
      { returnDocument: 'after', upsert: true, runValidators: true, setDefaultsOnInsert: true },
    )

    await Promise.all([
      Membership.findOneAndUpdate(
        { userId: leader._id, groupId: group._id },
        { $set: { role: 'leader', status: 'active' } },
        { upsert: true, runValidators: true, setDefaultsOnInsert: true },
      ),
      Membership.findOneAndUpdate(
        { userId: student1._id, groupId: group._id },
        { $set: { role: 'student', status: 'active' } },
        { upsert: true, runValidators: true, setDefaultsOnInsert: true },
      ),
      Membership.findOneAndUpdate(
        { userId: student2._id, groupId: group._id },
        { $set: { role: 'student', status: 'active' } },
        { upsert: true, runValidators: true, setDefaultsOnInsert: true },
      ),
    ])

    console.log('Seed data created or updated')
  } finally {
    await mongoose.disconnect()
  }
}

seed().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
