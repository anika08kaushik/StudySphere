import express from 'express'
import authenticate from '../middleware/authMiddleware.js'
import {
  createGroup,
  getMyGroups,
  getGroupById,
  joinGroup,
} from '../controllers/groupController.js'

const router = express.Router()

router.post('/', authenticate, createGroup)
router.get('/', authenticate, getMyGroups)
router.get('/:id', authenticate, getGroupById)
router.post('/join', authenticate, joinGroup)

export default router
