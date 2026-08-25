import express from 'express'
import {
  createGroup,
  getGroup,
  getAllGroups,
  updateGroup,
  deleteGroup,
  joinGroup,
  leaveGroup,
  inviteMember,
  removeMember
} from '../controllers/groupController.js'
import authenticate from '../middleware/authMiddleware.js'

const router = express.Router()

// All group routes should be protected
router.use(authenticate)

router.post('/', createGroup)
router.get('/', getAllGroups)
router.get('/:groupId', getGroup)
router.put('/:groupId', updateGroup)
router.delete('/:groupId', deleteGroup)

router.post('/:groupId/join', joinGroup)
router.post('/:groupId/leave', leaveGroup)
router.post('/:groupId/invite', inviteMember)
router.delete('/:groupId/members/:userId', removeMember)

export default router
