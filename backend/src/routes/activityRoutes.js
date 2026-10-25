import express from 'express'
import authMiddleware from '../middleware/authMiddleware.js'
import { getActivities, createActivity } from '../controllers/activityController.js'

const router = express.Router()

const optionalAuthInDev = (req, res, next) => {
  if (process.env.NODE_ENV !== 'production' && !req.headers.authorization) {
    req.user = { userId: 'u1', name: 'Demo Student' }
    return next()
  }
  return authMiddleware(req, res, next)
}

router.get('/', getActivities)
router.post('/', optionalAuthInDev, createActivity)

export default router
