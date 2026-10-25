import express from 'express'
import authenticate from '../middleware/authMiddleware.js'
import {
  getNotes,
  getNoteById,
  createNote,
  updateNote,
  createNoteVersion,
  rollbackNoteVersion,
  addNoteComment,
  replyNoteComment,
  resolveNoteComment,
  updateNotePermissions,
} from '../controllers/noteController.js'

const router = express.Router()

const authGuard = (req, res, next) => {
  if (process.env.NODE_ENV !== 'production' && !req.headers.authorization) {
    req.user = { userId: 'u1', name: 'Demo Student' }
    return next()
  }
  return authenticate(req, res, next)
}

// Group notes collection
router.get('/groups/:groupId/notes', authGuard, getNotes)
router.post('/groups/:groupId/notes', authGuard, createNote)

// Individual note operations
router.get('/notes/:noteId', authGuard, getNoteById)
router.put('/notes/:noteId', authGuard, updateNote)

// Versions & Rollback
router.post('/notes/:noteId/versions', authGuard, createNoteVersion)
router.post('/notes/:noteId/rollback', authGuard, rollbackNoteVersion)

// Discussions & Comments
router.post('/notes/:noteId/comments', authGuard, addNoteComment)
router.post('/notes/:noteId/comments/:commentId/reply', authGuard, replyNoteComment)
router.patch('/notes/:noteId/comments/:commentId/resolve', authGuard, resolveNoteComment)

// Permissions Management
router.patch('/notes/:noteId/permissions', authGuard, updateNotePermissions)

export default router
