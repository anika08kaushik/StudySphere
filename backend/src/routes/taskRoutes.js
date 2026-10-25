import express from 'express'
import authenticate from '../middleware/authMiddleware.js'

import {
  getTasks,
  getTasksByGroup,
  getTask,
  createTask,
  updateTask,
  deleteTask,
} from '../controllers/taskController.js'

const router = express.Router()

router.use(authenticate)

router.get('/', getTasks)
router.post('/', createTask)
router.get('/:groupId', getTasksByGroup)
router.put('/:taskId', updateTask)
router.delete('/:taskId', deleteTask)

export default router