import mongoose from 'mongoose'

const connectDatabase = async () => {
  const mongoUri = process.env.MONGO_URI?.trim()
  if (!mongoUri || mongoUri === 'your_mongodb_connection_string') {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('MONGO_URI is not configured. Set it in backend/.env before starting the backend.')
    }
    console.warn('⚠️  MONGO_URI is not configured; starting backend in local mode without MongoDB.')
    return
  }

  if (!/^mongodb(?:\+srv)?:\/\//.test(mongoUri)) {
    throw new Error('MONGO_URI must start with mongodb:// or mongodb+srv://')
  }

  try {
    await mongoose.connect(mongoUri)
  } catch (error) {
    if (
      error.code === 18 ||
      error.code === 8000 ||
      error.cause?.code === 18 ||
      error.cause?.code === 8000 ||
      /bad auth|authentication failed/i.test(error.message)
    ) {
      throw new Error(
        'MongoDB authentication failed. Check your database username and password in backend/.env, URL-encode reserved password characters, and ensure the user exists in MongoDB Atlas Database Access.',
        { cause: error },
      )
    }

    throw error
  }

  console.log('MongoDB connected')
}

export default connectDatabase
