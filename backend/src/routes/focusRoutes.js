import express from 'express'
import authenticate from '../middleware/authMiddleware.js'
import {
  recordSession,
  getSessions,
  getFocusStats,
  getFocusReport,
  saveTimerState,
  getTimerState,
  clearTimerState,
} from '../controllers/focusController.js'

const router = express.Router()

router.use(authenticate)

router.post('/sessions', recordSession)
router.get('/sessions', getSessions)
router.get('/stats', getFocusStats)
router.post('/timer', saveTimerState)
router.get('/timer', getTimerState)
router.delete('/timer', clearTimerState)
router.get('/report', getFocusReport)

export default router
