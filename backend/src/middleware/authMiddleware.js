import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
import User from '../models/User.js'

const authenticate = async (request, response, next) => {
  const token = request.headers.authorization?.replace('Bearer ', '')

  if (!token) {
    return response.status(401).json({
      success: false,
      message: 'Authentication required',
    })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    request.user = { ...decoded }

    if (mongoose.connection.readyState === 1 && decoded.userId && mongoose.isValidObjectId(decoded.userId)) {
      const dbUser = await User.findById(decoded.userId).select('name email profilePhoto role').lean()
      if (dbUser) {
        request.user.name = dbUser.name
        request.user.email = dbUser.email
        request.user.profilePhoto = dbUser.profilePhoto
        request.user.role = dbUser.role
      }
    }
    next()
  } catch {
    return response.status(401).json({
      success: false,
      message: 'Invalid or expired token',
    })
  }
}

export default authenticate
