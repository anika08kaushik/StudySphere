import jwt from 'jsonwebtoken'

const socketAuthMiddleware = (socket, next) => {
  try {
    const token = socket.handshake.auth?.token

    if (!token) {
      return next(new Error('Authentication required'))
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    socket.user = decoded

    next()
  } catch {
    next(new Error('Invalid or expired token'))
  }
}

export default socketAuthMiddleware
