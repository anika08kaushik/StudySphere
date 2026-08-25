import Task from '../models/Task.js'

const getUserId = (request) => request.user.userId

// GET /api/tasks
export const getTasks = async (request, response) => {
  try {
    const { groupId } = request.query

    const filter = {
      createdBy: getUserId(request),
    }

    if (groupId) {
      filter.groupId = groupId
    }

    const tasks = await Task.find(filter)
      .populate('assignedTo', 'name email profilePhoto')
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

// GET /api/tasks/:id
export const getTask = async (request, response) => {
  try {
    const task = await Task.findOne({
      _id: request.params.id,
      createdBy: getUserId(request),
    }).populate('assignedTo', 'name email profilePhoto')

    if (!task) {
      return response.status(404).json({
        success: false,
        message: 'Task not found',
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

    if (!title || !groupId) {
      return response.status(400).json({
        success: false,
        message: 'Title and groupId are required',
      })
    }

    const task = await Task.create({
      title,
      description,
      groupId,
      createdBy: getUserId(request),
      assignedTo: assignedTo || null,
      status: status || 'TODO',
      priority: priority || 'MEDIUM',
      deadline: deadline || null,
      checklist: checklist || [],
      attachments: attachments || [],
    })

    return response.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: task,
    })
  } catch (error) {
    console.error('Create task error:', error)

    return response.status(500).json({
      success: false,
      message: 'Unable to create task',
    })
  }
}

// PUT /api/tasks/:id
export const updateTask = async (request, response) => {
  try {
    const allowedFields = [
      'title',
      'description',
      'assignedTo',
      'status',
      'priority',
      'deadline',
      'checklist',
      'attachments',
    ]

    const updates = {}

    allowedFields.forEach((field) => {
      if (request.body[field] !== undefined) {
        updates[field] = request.body[field]
      }
    })

    const task = await Task.findOneAndUpdate(
      {
        _id: request.params.id,
        createdBy: getUserId(request),
      },
      updates,
      {
        new: true,
        runValidators: true,
      },
    ).populate('assignedTo', 'name email profilePhoto')

    if (!task) {
      return response.status(404).json({
        success: false,
        message: 'Task not found',
      })
    }

    return response.status(200).json({
      success: true,
      message: 'Task updated successfully',
      data: task,
    })
  } catch (error) {
    console.error('Update task error:', error)

    return response.status(500).json({
      success: false,
      message: 'Unable to update task',
    })
  }
}

// DELETE /api/tasks/:id
export const deleteTask = async (request, response) => {
  try {
    const task = await Task.findOneAndDelete({
      _id: request.params.id,
      createdBy: getUserId(request),
    })

    if (!task) {
      return response.status(404).json({
        success: false,
        message: 'Task not found',
      })
    }

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