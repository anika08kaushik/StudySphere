import mongoose from 'mongoose'

const connectDatabase = async () => {
  const mongoUri = process.env.MONGO_URI?.trim()
  if (!mongoUri || mongoUri === 'your_mongodb_connection_string') {
    console.warn('MONGO_URI is not configured; starting without MongoDB')
    return
  }

  if (!/^mongodb(?:\+srv)?:\/\//.test(mongoUri)) {
    throw new Error('MONGO_URI must start with mongodb:// or mongodb+srv://')
  }

  await mongoose.connect(mongoUri)
  console.log('MongoDB connected')
}

export default connectDatabase
