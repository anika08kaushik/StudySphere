import express from 'express'
import authenticate from '../middleware/authMiddleware.js'
import {
  createGroup,
  getMyGroups,
  getAllGroups,
  getGroupById,
  getGroupMembers,
  updateGroup,
  deleteGroup,
  joinGroup,
  leaveGroup,
  inviteMember,
  getMyInvitations,
  acceptInvitation,
  declineInvitation,
  removeMember,
} from '../controllers/groupController.js'

const router = express.Router()

router.post('/', authenticate, createGroup)
router.get('/', authenticate, getAllGroups)
router.get('/me', authenticate, getMyGroups)
router.get('/invitations', authenticate, getMyInvitations)
router.post('/join', authenticate, joinGroup)
router.post('/leave', authenticate, leaveGroup)
router.post('/:id/join', authenticate, joinGroup)
router.post('/:id/leave', authenticate, leaveGroup)
router.post('/:id/invitations', authenticate, inviteMember)
router.post('/:id/invitations/accept', authenticate, acceptInvitation)
router.post('/:id/invitations/decline', authenticate, declineInvitation)
router.get('/:id/members', authenticate, getGroupMembers)
router.delete('/:id/members/:userId', authenticate, removeMember)
router.put('/:id', authenticate, updateGroup)
router.delete('/:id', authenticate, deleteGroup)
router.get('/:id', authenticate, getGroupById)

export default router
