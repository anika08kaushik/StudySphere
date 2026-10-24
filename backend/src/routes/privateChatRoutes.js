import express from 'express'
import authenticate from '../middleware/authMiddleware.js'
import {
  sendChatRequest,
  getChatRequests,
  respondChatRequest,
  getDmMessages,
  sendDmMessage,
} from '../controllers/privateChatController.js'

const router = express.Router()

router.use(authenticate)

router.post('/requests', sendChatRequest)
router.get('/requests', getChatRequests)
router.post('/requests/:requestId/respond', respondChatRequest)
router.get('/dm/:peerId/messages', getDmMessages)
router.post('/dm/:peerId/messages', sendDmMessage)

export default router
