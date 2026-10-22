import mongoose from 'mongoose'

const connectDatabase = async () => {
  const mongoUri = process.env.MONGO_URI?.trim()
  if (!mongoUri || mongoUri === 'your_mongodb_connection_string') {
    throw new Error('MONGO_URI is not configured. Set it in backend/.env before starting the backend.')
  }

  if (!/^mongodb(?:\+srv)?:\/\//.test(mongoUri)) {
    throw new Error('MONGO_URI must start with mongodb:// or mongodb+srv://')
  }

  try {
    await mongoose.connect(mongoUri)
  } catch (error) {
    if (error.code === 18 || error.cause?.code === 18) {
      throw new Error(
        'MongoDB authentication failed. Check the database username and password, URL-encode reserved password characters, and verify the database user authentication database.',
        { cause: error },
      )
    }

    throw error
  }

  console.log('MongoDB connected')
}

export default connectDatabase
