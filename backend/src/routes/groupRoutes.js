import express from 'express'
import authenticate from '../middleware/authMiddleware.js'
import {
  createGroup,
  getMyGroups,
  getAllGroups,
  getGroupById,
  joinGroup,
  leaveGroup,
} from '../controllers/groupController.js'

const router = express.Router()

router.post('/', authenticate, createGroup)
router.get('/', authenticate, getAllGroups)
router.get('/me', authenticate, getMyGroups)
router.get('/:id', authenticate, getGroupById)
router.post('/join', authenticate, joinGroup)
router.post('/leave', authenticate, leaveGroup)

export default router
