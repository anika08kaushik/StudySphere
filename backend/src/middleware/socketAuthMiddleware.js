import jwt from 'jsonwebtoken'

const socketAuthMiddleware = (socket, next) => {
  try {
    const token = socket.handshake.auth?.token

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        socket.user = decoded
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
