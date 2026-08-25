import express from 'express'
import authenticate from '../middleware/authMiddleware.js'
import {
  getProfile,
  updateProfile,
} from '../controllers/userController.js'

const router = express.Router()

router.get('/profile', authenticate, getProfile)
router.put('/profile', authenticate, updateProfile)

export default router
