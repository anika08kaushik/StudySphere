import mongoose from 'mongoose'
import Membership from '../models/Membership.js'
import StudyGroup from '../models/StudyGroup.js'

const userFields = 'name email department semester skills bio profilePhoto'

export const createGroup = async (request, response) => {
  try {
    const { name, description, subjects, coverImage } = request.body

    if (!name || !name.trim()) {
      return response.status(400).json({
        success: false,
        message: 'Group name is required',
      })
    }

    const group = await StudyGroup.create({
      name: name.trim(),
      description,
      subjects,
      coverImage,
      createdBy: request.user.userId,
    })

    await Membership.create({
      userId: request.user.userId,
      groupId: group._id,
      role: 'leader',
    })

    return response.status(201).json({
      success: true,
      message: 'Group created successfully',
      data: group,
    })
  } catch (error) {
    console.error('Create group error:', error)

    return response.status(500).json({
      success: false,
      message: 'Unable to create group',
    })
  }
}

export const getMyGroups = async (request, response) => {
  try {
    const memberships = await Membership.find({
      userId: request.user.userId,
      status: 'active',
    }).populate('groupId')

    const groups = memberships
      .filter((membership) => membership.groupId)
      .map((membership) => ({
        id: membership.groupId._id,
        name: membership.groupId.name,
        description: membership.groupId.description,
        subjects: membership.groupId.subjects,
        coverImage: membership.groupId.coverImage,
        createdBy: membership.groupId.createdBy,
        role: membership.role,
      }))

    return response.status(200).json({
      success: true,
      data: groups,
    })
  } catch (error) {
    console.error('Get groups error:', error)

    return response.status(500).json({
      success: false,
      message: 'Unable to get groups',
    })
  }
}

export const getGroupById = async (request, response) => {
  try {
    const { id } = request.params

    if (!mongoose.isValidObjectId(id)) {
      return response.status(400).json({
        success: false,
        message: 'Invalid group ID',
      })
    }

    const membership = await Membership.findOne({
      userId: request.user.userId,
      groupId: id,
      status: 'active',
    })

    if (!membership) {
      return response.status(403).json({
        success: false,
        message: 'You must be a member of this group',
      })
    }

    const [group, members] = await Promise.all([
      StudyGroup.findById(id).populate('createdBy', userFields),
      Membership.find({ groupId: id, status: 'active' }).populate('userId', userFields),
    ])

    if (!group) {
      return response.status(404).json({
        success: false,
        message: 'Group not found',
      })
    }

    return response.status(200).json({
      success: true,
      data: {
        group,
        membership: {
          role: membership.role,
          status: membership.status,
        },
        members: members
          .filter((entry) => entry.userId)
          .map((entry) => ({
            id: entry.userId._id,
            name: entry.userId.name,
            email: entry.userId.email,
            department: entry.userId.department,
            semester: entry.userId.semester,
            skills: entry.userId.skills,
            bio: entry.userId.bio,
            profilePhoto: entry.userId.profilePhoto,
            role: entry.role,
          })),
      },
    })
  } catch (error) {
    console.error('Get group error:', error)

    return response.status(500).json({
      success: false,
      message: 'Unable to get group',
    })
  }
}

export const joinGroup = async (request, response) => {
  try {
    const { groupId } = request.body

    if (!groupId || !mongoose.isValidObjectId(groupId)) {
      return response.status(400).json({
        success: false,
        message: 'A valid group ID is required',
      })
    }

    const group = await StudyGroup.findById(groupId)
    if (!group) {
      return response.status(404).json({
        success: false,
        message: 'Group not found',
      })
    }

    const existingMembership = await Membership.findOne({
      userId: request.user.userId,
      groupId,
    })

    if (existingMembership) {
      return response.status(409).json({
        success: false,
        message: 'You already belong to this group',
      })
    }

    const membership = await Membership.create({
      userId: request.user.userId,
      groupId,
      role: 'student',
    })

    return response.status(201).json({
      success: true,
      message: 'Joined group successfully',
      data: membership,
    })
  } catch (error) {
    if (error.code === 11000) {
      return response.status(409).json({
        success: false,
        message: 'You already belong to this group',
      })
    }

    console.error('Join group error:', error)

    return response.status(500).json({
      success: false,
      message: 'Unable to join group',
    })
  }
}
