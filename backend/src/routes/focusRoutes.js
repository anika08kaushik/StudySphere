import express from 'express'
import authenticate from '../middleware/authMiddleware.js'
import {
  recordSession,
  getSessions,
  getFocusStats,
} from '../controllers/focusController.js'

const router = express.Router()

router.use(authenticate)

router.post('/sessions', recordSession)
router.get('/sessions', getSessions)
router.get('/stats', getFocusStats)

export default router
