import express from 'express'
import authenticate from '../middleware/authMiddleware.js'
import {
  getMessages,
  createMessage,
} from '../controllers/messageController.js'

const router = express.Router()

router.get('/groups/:groupId/messages', authenticate, getMessages)
router.post('/groups/:groupId/messages', authenticate, createMessage)

export default router