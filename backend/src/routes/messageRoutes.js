import express from 'express'
import authenticate from '../middleware/authMiddleware.js'
import {
  getMessages,
  createMessage,
  editMessage,
  deleteMessage,
  togglePinMessage,
  toggleReaction,
} from '../controllers/messageController.js'

const router = express.Router()

// Optional auth in development mode for easy testing
const authGuard = (req, res, next) => {
  if (process.env.NODE_ENV !== 'production' && !req.headers.authorization) {
    req.user = { userId: 'u1', name: 'Demo Student' }
    return next()
  }
  return authenticate(req, res, next)
}

// Group Messages CRUD
router.get('/groups/:groupId/messages', authGuard, getMessages)
router.post('/groups/:groupId/messages', authGuard, createMessage)

// Message Direct Operations
router.put('/messages/:messageId', authGuard, editMessage)
router.delete('/messages/:messageId', authGuard, deleteMessage)
router.patch('/messages/:messageId/pin', authGuard, togglePinMessage)
router.post('/messages/:messageId/reactions', authGuard, toggleReaction)

export default router