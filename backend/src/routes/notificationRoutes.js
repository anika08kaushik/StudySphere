import express from 'express'
import authMiddleware from '../middleware/authMiddleware.js'
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '../controllers/notificationController.js'

const router = express.Router()

// Optional auth in development mode so frontend can fetch freely
const optionalAuthInDev = (req, res, next) => {
  if (process.env.NODE_ENV !== 'production' && !req.headers.authorization) {
    req.user = { userId: 'u1' }
    return next()
  }
  return authMiddleware(req, res, next)
}

router.get('/', optionalAuthInDev, getNotifications)
router.patch('/:id/read', optionalAuthInDev, markNotificationRead)
router.patch('/read-all', optionalAuthInDev, markAllNotificationsRead)

export default router
