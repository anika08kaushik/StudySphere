import jwt from 'jsonwebtoken'

const authenticate = (request, response, next) => {
  const token = request.headers.authorization?.replace('Bearer ', '')
  if (!token) return response.status(401).json({ success: false, message: 'Authentication required' })

  try {
    request.user = jwt.verify(token, process.env.JWT_SECRET)
    next()
  } catch {
    response.status(401).json({ success: false, message: 'Invalid or expired token' })
  }
}

export default authenticate
