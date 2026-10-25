import express from 'express'
import authenticate from '../middleware/authMiddleware.js'
import {
  getCalendarEvents,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
} from '../controllers/calendarEventController.js'

const router = express.Router()

router.use(authenticate)

router.route('/events').get(getCalendarEvents).post(createCalendarEvent)
router
  .route('/events/:eventId')
  .patch(updateCalendarEvent)
  .delete(deleteCalendarEvent)

export default router
