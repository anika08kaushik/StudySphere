import mongoose from 'mongoose'
import Task from '../models/Task.js'
import StudyGroup from '../models/StudyGroup.js'
import Membership from '../models/Membership.js'
import User from '../models/User.js'
import { createActivity } from '../services/activityService.js'
import { createNotification } from '../services/notificationService.js'

const getUserId = (request) => request.user?.userId

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id)

const POPULATE_FIELDS = 'name email profilePhoto'

// GET /api/tasks (optionally with ?groupId=...)
export const getTasks = async (request, response) => {
  try {
    const userId = getUserId(request)
    const { groupId } = request.query

    if (groupId) {
      if (!isValidObjectId(groupId)) {
        return response.status(400).json({
          success: false,
          message: 'Invalid groupId format',
        })
      }

      const group = await StudyGroup.findById(groupId)
      if (!group) {
        return response.status(404).json({
          success: false,
          message: 'Study group not found',
        })
      }

      const membership = await Membership.findOne({
        userId,
        groupId,
        status: 'active',
      })
      if (!membership) {
        return response.status(403).json({
          success: false,
          message: 'You are not an active member of this study group',
        })
      }

      const tasks = await Task.find({ groupId })
        .populate('assignedTo', POPULATE_FIELDS)
        .populate('createdBy', POPULATE_FIELDS)
        .sort({ createdAt: -1 })

      return response.status(200).json({
        success: true,
        data: tasks,
      })
    }

    // If no groupId query parameter, return tasks across all groups the user actively belongs to
    const memberships = await Membership.find({ userId, status: 'active' }).select('groupId')
    const groupIds = memberships.map((m) => m.groupId)

    const tasks = await Task.find({ groupId: { $in: groupIds } })
      .populate('assignedTo', POPULATE_FIELDS)
      .populate('createdBy', POPULATE_FIELDS)
      .sort({ createdAt: -1 })

    return response.status(200).json({
      success: true,
      data: tasks,
    })
  } catch (error) {
    console.error('Get tasks error:', error)
    return response.status(500).json({
      success: false,
      message: 'Unable to fetch tasks',
    })
  }
}

// GET /api/tasks/:groupId (or single task /api/tasks/:id)
export const getTasksByGroup = async (request, response) => {
  try {
    const userId = getUserId(request)
    const identifier = request.params.groupId || request.params.id

    if (!isValidObjectId(identifier)) {
      return response.status(400).json({
        success: false,
        message: 'Invalid ID format',
      })
    }

    // Check if identifier is a StudyGroup
    const group = await StudyGroup.findById(identifier)
    if (group) {
      const membership = await Membership.findOne({
        userId,
        groupId: identifier,
        status: 'active',
      })
      if (!membership) {
        return response.status(403).json({
          success: false,
          message: 'You are not an active member of this study group',
        })
      }

      const tasks = await Task.find({ groupId: identifier })
        .populate('assignedTo', POPULATE_FIELDS)
        .populate('createdBy', POPULATE_FIELDS)
        .sort({ createdAt: -1 })

      return response.status(200).json({
        success: true,
        data: tasks,
      })
    }

    // If not a study group, check if it is a single task
    const task = await Task.findById(identifier)
      .populate('assignedTo', POPULATE_FIELDS)
      .populate('createdBy', POPULATE_FIELDS)

    if (task) {
      const membership = await Membership.findOne({
        userId,
        groupId: task.groupId,
        status: 'active',
      })
      if (!membership) {
        return response.status(403).json({
          success: false,
          message: 'You are not an active member of this study group',
        })
      }

      return response.status(200).json({
        success: true,
        data: task,
      })
    }

    return response.status(404).json({
      success: false,
      message: 'Study group or task not found',
    })
  } catch (error) {
    console.error('Get tasks by group error:', error)
    return response.status(500).json({
      success: false,
      message: 'Unable to fetch tasks',
    })
  }
}

// GET /api/tasks/:id (direct single task endpoint)
export const getTask = async (request, response) => {
  try {
    const userId = getUserId(request)
    const taskId = request.params.id || request.params.taskId

    if (!isValidObjectId(taskId)) {
      return response.status(400).json({
        success: false,
        message: 'Invalid task ID',
      })
    }

    const task = await Task.findById(taskId)
      .populate('assignedTo', POPULATE_FIELDS)
      .populate('createdBy', POPULATE_FIELDS)

    if (!task) {
      return response.status(404).json({
        success: false,
        message: 'Task not found',
      })
    }

    const membership = await Membership.findOne({
      userId,
      groupId: task.groupId,
      status: 'active',
    })

    if (!membership) {
      return response.status(403).json({
        success: false,
        message: 'You are not an active member of this study group',
      })
    }

    return response.status(200).json({
      success: true,
      data: task,
    })
  } catch (error) {
    console.error('Get task error:', error)
    return response.status(500).json({
      success: false,
      message: 'Unable to fetch task',
    })
  }
}

// POST /api/tasks
export const createTask = async (request, response) => {
  try {
    const userId = getUserId(request)
    const {
      title,
      description,
      groupId,
      assignedTo,
      status,
      priority,
      deadline,
      checklist,
      attachments,
    } = request.body

    // Input Validation
    if (!title || typeof title !== 'string' || !title.trim()) {
      return response.status(400).json({
        success: false,
        message: 'Task title is required',
      })
    }

    if (!groupId || !isValidObjectId(groupId)) {
      return response.status(400).json({
        success: false,
        message: 'Valid groupId is required',
      })
    }

    // Verify study group existence
    const group = await StudyGroup.findById(groupId)
    if (!group) {
      return response.status(404).json({
        success: false,
        message: 'Study group not found',
      })
    }

    // Verify group membership authorization
    const membership = await Membership.findOne({
      userId,
      groupId,
      status: 'active',
    })
    if (!membership) {
      return response.status(403).json({
        success: false,
        message: 'You are not an active member of this study group',
      })
    }

    // Status validation
    const validStatuses = ['TODO', 'IN_PROGRESS', 'REVIEW', 'COMPLETED']
    if (status && !validStatuses.includes(status)) {
      return response.status(400).json({
        success: false,
        message: `Status must be one of: ${validStatuses.join(', ')}`,
      })
    }

    // Priority validation
    const validPriorities = ['LOW', 'MEDIUM', 'HIGH']
    if (priority && !validPriorities.includes(priority)) {
      return response.status(400).json({
        success: false,
        message: `Priority must be one of: ${validPriorities.join(', ')}`,
      })
    }

    // Deadline validation
    let parsedDeadline = null
    if (deadline) {
      parsedDeadline = new Date(deadline)
      if (Number.isNaN(parsedDeadline.getTime())) {
        return response.status(400).json({
          success: false,
          message: 'Invalid deadline date format',
        })
      }
    }

    // AssignedTo validation
    let effectiveAssignedTo = null
    if (assignedTo && assignedTo !== '' && assignedTo !== 'unassigned') {
      if (!isValidObjectId(assignedTo)) {
        return response.status(400).json({
          success: false,
          message: 'Invalid assignedTo user ID',
        })
      }
      effectiveAssignedTo = assignedTo
    }

    // Checklist normalization
    const normalizedChecklist = Array.isArray(checklist)
      ? checklist.map((item) => ({
          text: typeof item === 'string' ? item.trim() : item.text?.trim() || '',
          completed: Boolean(item.completed),
        })).filter((item) => Boolean(item.text))
      : []

    const task = await Task.create({
      title: title.trim(),
      description: description ? description.trim() : '',
      groupId,
      createdBy: userId,
      assignedTo: effectiveAssignedTo,
      status: status || 'TODO',
      priority: priority || 'MEDIUM',
      deadline: parsedDeadline,
      checklist: normalizedChecklist,
      attachments: Array.isArray(attachments) ? attachments : [],
    })

    const populatedTask = await Task.findById(task._id)
      .populate('assignedTo', POPULATE_FIELDS)
      .populate('createdBy', POPULATE_FIELDS)

    // Log Activity
    createActivity({
      userId,
      userName: request.user?.name || 'Member',
      groupId,
      type: 'task',
      action: 'created task',
      target: populatedTask.title,
      targetId: populatedTask._id,
    }).catch(() => {})

    // Send notification if assigned to another user
    if (effectiveAssignedTo && String(effectiveAssignedTo) !== String(userId)) {
      createNotification({
        recipient: effectiveAssignedTo,
        sender: userId,
        groupId,
        type: 'task',
        title: 'New Task Assigned',
        message: `You were assigned to "${populatedTask.title}" in ${group.name}`,
        metadata: { taskId: populatedTask._id },
      }).catch(() => {})
    }

    return response.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: populatedTask,
    })
  } catch (error) {
    console.error('Create task error:', error)
    return response.status(500).json({
      success: false,
      message: 'Unable to create task',
    })
  }
}

// PUT /api/tasks/:taskId
export const updateTask = async (request, response) => {
  try {
    const userId = getUserId(request)
    const taskId = request.params.taskId || request.params.id

    if (!isValidObjectId(taskId)) {
      return response.status(400).json({
        success: false,
        message: 'Invalid task ID',
      })
    }

    const task = await Task.findById(taskId)
    if (!task) {
      return response.status(404).json({
        success: false,
        message: 'Task not found',
      })
    }

    // Authorization: User must be an active member of the study group
    const membership = await Membership.findOne({
      userId,
      groupId: task.groupId,
      status: 'active',
    })
    if (!membership) {
      return response.status(403).json({
        success: false,
        message: 'You are not an active member of this study group',
      })
    }

    const {
      title,
      description,
      assignedTo,
      status,
      priority,
      deadline,
      checklist,
      attachments,
    } = request.body

    const updates = {}

    if (title !== undefined) {
      if (typeof title !== 'string' || !title.trim()) {
        return response.status(400).json({
          success: false,
          message: 'Title cannot be empty',
        })
      }
      updates.title = title.trim()
    }

    if (description !== undefined) {
      updates.description = typeof description === 'string' ? description.trim() : ''
    }

    if (status !== undefined) {
      const validStatuses = ['TODO', 'IN_PROGRESS', 'REVIEW', 'COMPLETED']
      if (!validStatuses.includes(status)) {
        return response.status(400).json({
          success: false,
          message: `Status must be one of: ${validStatuses.join(', ')}`,
        })
      }
      updates.status = status
    }

    if (priority !== undefined) {
      const validPriorities = ['LOW', 'MEDIUM', 'HIGH']
      if (!validPriorities.includes(priority)) {
        return response.status(400).json({
          success: false,
          message: `Priority must be one of: ${validPriorities.join(', ')}`,
        })
      }
      updates.priority = priority
    }

    if (deadline !== undefined) {
      if (deadline === null || deadline === '') {
        updates.deadline = null
      } else {
        const parsed = new Date(deadline)
        if (Number.isNaN(parsed.getTime())) {
          return response.status(400).json({
            success: false,
            message: 'Invalid deadline date format',
          })
        }
        updates.deadline = parsed
      }
    }

    if (assignedTo !== undefined) {
      if (assignedTo === null || assignedTo === '' || assignedTo === 'unassigned') {
        updates.assignedTo = null
      } else {
        if (!isValidObjectId(assignedTo)) {
          return response.status(400).json({
            success: false,
            message: 'Invalid assignedTo user ID',
          })
        }
        updates.assignedTo = assignedTo
      }
    }

    if (checklist !== undefined) {
      if (!Array.isArray(checklist)) {
        return response.status(400).json({
          success: false,
          message: 'Checklist must be an array',
        })
      }
      updates.checklist = checklist.map((item) => ({
        _id: item._id && isValidObjectId(item._id) ? item._id : undefined,
        text: typeof item === 'string' ? item.trim() : item.text?.trim() || '',
        completed: Boolean(item.completed),
      })).filter((item) => Boolean(item.text))
    }

    if (attachments !== undefined) {
      if (!Array.isArray(attachments)) {
        return response.status(400).json({
          success: false,
          message: 'Attachments must be an array',
        })
      }
      updates.attachments = attachments
    }

    const updatedTask = await Task.findByIdAndUpdate(
      taskId,
      { $set: updates },
      { returnDocument: 'after', runValidators: true },
    )
      .populate('assignedTo', POPULATE_FIELDS)
      .populate('createdBy', POPULATE_FIELDS)

    // Activity logging on status update
    if (status && status !== task.status) {
      createActivity({
        userId,
        userName: request.user?.name || 'Member',
        groupId: task.groupId,
        type: 'task',
        action: status === 'COMPLETED' ? 'completed task' : `moved task to ${status}`,
        target: updatedTask.title,
        targetId: updatedTask._id,
      }).catch(() => {})
    }

    return response.status(200).json({
      success: true,
      message: 'Task updated successfully',
      data: updatedTask,
    })
  } catch (error) {
    console.error('Update task error:', error)
    return response.status(500).json({
      success: false,
      message: 'Unable to update task',
    })
  }
}

// DELETE /api/tasks/:taskId
export const deleteTask = async (request, response) => {
  try {
    const userId = getUserId(request)
    const taskId = request.params.taskId || request.params.id

    if (!isValidObjectId(taskId)) {
      return response.status(400).json({
        success: false,
        message: 'Invalid task ID',
      })
    }

    const task = await Task.findById(taskId)
    if (!task) {
      return response.status(404).json({
        success: false,
        message: 'Task not found',
      })
    }

    // Check membership
    const membership = await Membership.findOne({
      userId,
      groupId: task.groupId,
      status: 'active',
    })
    if (!membership) {
      return response.status(403).json({
        success: false,
        message: 'You are not an active member of this study group',
      })
    }

    // Authorization: User must be creator or group leader/admin
    const isCreator = String(task.createdBy) === String(userId)
    const isLeaderOrAdmin = membership.role === 'leader' || membership.role === 'admin'

    if (!isCreator && !isLeaderOrAdmin) {
      return response.status(403).json({
        success: false,
        message: 'Only the task creator or a group leader can delete this task',
      })
    }

    await Task.findByIdAndDelete(taskId)

    // Activity log
    createActivity({
      userId,
      userName: request.user?.name || 'Member',
      groupId: task.groupId,
      type: 'task',
      action: 'deleted task',
      target: task.title,
      targetId: task._id,
    }).catch(() => {})

    return response.status(200).json({
      success: true,
      message: 'Task deleted successfully',
    })
  } catch (error) {
    console.error('Delete task error:', error)
    return response.status(500).json({
      success: false,
      message: 'Unable to delete task',
    })
  }
}