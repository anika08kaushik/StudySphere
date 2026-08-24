import 'dotenv/config'
import bcrypt from 'bcryptjs'
import connectDatabase from './config/db.js'
import User from './models/User.js'
import StudyGroup from './models/StudyGroup.js'
import Membership from './models/Membership.js'

const seed = async () => {
  await connectDatabase()
  if (!process.env.MONGO_URI || process.env.MONGO_URI === 'your_mongodb_connection_string') {
    throw new Error('Set MONGO_URI before running the seed script')
  }

  await Promise.all([User.deleteMany({}), StudyGroup.deleteMany({}), Membership.deleteMany({})])
  const password = await bcrypt.hash('password123', 10)
  const [leader, student1, student2] = await User.create([
    { name: 'Test Leader', email: 'leader@test.com', password },
    { name: 'Test Student 1', email: 'student1@test.com', password },
    { name: 'Test Student 2', email: 'student2@test.com', password },
  ])
  const group = await StudyGroup.create({
    name: 'Machine Learning',
    description: 'Shared development study group',
    subjects: ['Machine Learning'],
    createdBy: leader._id,
  })
  await Membership.create([
    { userId: leader._id, groupId: group._id, role: 'leader' },
    { userId: student1._id, groupId: group._id },
    { userId: student2._id, groupId: group._id },
  ])
  console.log('Seed data created')
  process.exit(0)
}

seed().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
