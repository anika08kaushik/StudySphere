import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
import User from '../models/User.js'

const socketAuthMiddleware = async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)

        let dbUser = null
        if (mongoose.connection.readyState === 1 && mongoose.isValidObjectId(decoded.userId)) {
          dbUser = await User.findById(decoded.userId).select('name profilePhoto').lean()
        }

        socket.user = {
          userId: String(dbUser?._id || decoded.userId),
          name: dbUser?.name || socket.handshake.auth?.userName || decoded.name || 'Student',
          profilePhoto: dbUser?.profilePhoto || socket.handshake.auth?.profilePhoto || null,
        }
        return next()
      } catch (jwtError) {
        if (process.env.NODE_ENV === 'production') {
          return next(new Error('Invalid or expired token'))
        }
      }
    }

    // In local development mode, allow connecting with mock/demo identity
    if (process.env.NODE_ENV !== 'production') {
      socket.user = {
        userId: socket.handshake.auth?.userId || 'u1',
        name: socket.handshake.auth?.userName || 'Demo Student',
        profilePhoto: socket.handshake.auth?.profilePhoto || null,
      }
      return next()
    }

    return next(new Error('Authentication required'))
  } catch (error) {
    next(new Error('Authentication error'))
  }
}

export default socketAuthMiddleware
