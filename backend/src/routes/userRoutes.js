import express from 'express'
import { getProfile, updateProfile } from '../controllers/userController.js'
import authenticate from '../middleware/authMiddleware.js'

const router = express.Router()

// All user routes should be protected
router.use(authenticate)

router.get('/profile', getProfile)
router.put('/profile', updateProfile)

export default router
