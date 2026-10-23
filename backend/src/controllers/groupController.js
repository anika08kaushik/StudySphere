import mongoose from 'mongoose'
import Membership from '../models/Membership.js'
import StudyGroup from '../models/StudyGroup.js'
import User from '../models/User.js'

const userFields = 'name email department semester skills bio profilePhoto'
const groupFields = ['name', 'description', 'subjects', 'coverImage']

const respondError = (response, status, message) =>
  response.status(status).json({ success: false, message })

const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value)

const findGroupForLeader = async (request, response) => {
  const { id } = request.params
  if (!mongoose.isValidObjectId(id)) {
    respondError(response, 400, 'Invalid group ID')
    return null
  }

  const group = await StudyGroup.findById(id)
  if (!group) {
    respondError(response, 404, 'Group not found')
    return null
  }

  const membership = await Membership.findOne({
    userId: request.user.userId,
    groupId: id,
    role: 'leader',
    status: 'active',
  })
  if (!membership) {
    respondError(response, 403, 'Only an active group leader can perform this action')
    return null
  }

  return group
}

export const createGroup = async (request, response) => {
  try {
    const { name, description, subjects, coverImage } = request.body || {}

    if (typeof name !== 'string' || !name.trim()) {
      return respondError(response, 400, 'Group name is required')
    }
    if (subjects !== undefined && (!Array.isArray(subjects) || subjects.some((subject) => typeof subject !== 'string'))) {
      return respondError(response, 400, 'Subjects must be an array of strings')
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
    return respondError(response, 500, 'Unable to create group')
  }
}

export const getAllGroups = async (request, response) => {
  try {
    const [groups, memberships] = await Promise.all([
      StudyGroup.find().populate('createdBy', userFields),
      Membership.find({ status: 'active' }),
    ])
    const groupsWithStats = groups.map((group) => {
      const groupMemberships = memberships.filter((membership) => String(membership.groupId) === String(group._id))
      return {
        ...group.toObject(),
        memberCount: groupMemberships.length,
        joined: groupMemberships.some((membership) => String(membership.userId) === String(request.user.userId)),
      }
    })

    return response.status(200).json({ success: true, data: groupsWithStats })
  } catch (error) {
    console.error('Get all groups error:', error)
    return respondError(response, 500, 'Unable to get groups')
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

    return response.status(200).json({ success: true, data: groups })
  } catch (error) {
    console.error('Get groups error:', error)
    return respondError(response, 500, 'Unable to get groups')
  }
}

export const getGroupById = async (request, response) => {
  try {
    const { id } = request.params
    if (!mongoose.isValidObjectId(id)) return respondError(response, 400, 'Invalid group ID')

    const group = await StudyGroup.findById(id).populate('createdBy', userFields)
    if (!group) return respondError(response, 404, 'Group not found')

    const membership = await Membership.findOne({
      userId: request.user.userId,
      groupId: id,
      status: 'active',
    })
    if (!membership) return respondError(response, 403, 'You must be a member of this group')

    const members = await Membership.find({ groupId: id, status: 'active' }).populate('userId', userFields)
    return response.status(200).json({
      success: true,
      data: {
        group,
        membership: { role: membership.role, status: membership.status },
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
    return respondError(response, 500, 'Unable to get group')
  }
}

export const getGroupMembers = async (request, response) => {
  try {
    const { id } = request.params
    const rawId = String(id)
    const stringGroupId = rawId === 'g1' ? '6adba5f22f2a151cd35c6192' : rawId

    if (!mongoose.isValidObjectId(stringGroupId)) {
      return respondError(response, 400, 'Invalid group ID')
    }

    const group = await StudyGroup.findById(stringGroupId)
    if (!group) return respondError(response, 404, 'Group not found')

    const isLounge = group.name === 'Student Lounge' || stringGroupId === '6adba5f22f2a151cd35c6192' || rawId === 'g1'
    if (isLounge) {
      const users = await User.find({}).select(userFields).limit(50).lean()
      return response.status(200).json({
        success: true,
        data: users.map((u) => ({
          id: u._id,
          _id: u._id,
          name: u.name,
          email: u.email,
          department: u.department,
          semester: u.semester,
          skills: u.skills,
          bio: u.bio,
          profilePhoto: u.profilePhoto,
          role: 'member',
        })),
      })
    }

    const membership = await Membership.findOne({
      userId: request.user.userId,
      groupId: stringGroupId,
      status: 'active',
    })
    if (!membership) return respondError(response, 403, 'You must be a member of this group')

    const members = await Membership.find({ groupId: stringGroupId, status: 'active' }).populate('userId', userFields)
    return response.status(200).json({
      success: true,
      data: members
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
    })
  } catch (error) {
    console.error('Get group members error:', error)
    return respondError(response, 500, 'Unable to get group members')
  }
}

export const updateGroup = async (request, response) => {
  try {
    if (!isObject(request.body)) return respondError(response, 400, 'A group update is required')
    const group = await findGroupForLeader(request, response)
    if (!group) return

    const updates = {}
    for (const field of groupFields) {
      if (request.body[field] !== undefined) updates[field] = request.body[field]
    }
    if (Object.keys(updates).length === 0) return respondError(response, 400, 'No supported group fields to update')
    if (updates.name !== undefined && (typeof updates.name !== 'string' || !updates.name.trim())) {
      return respondError(response, 400, 'Group name cannot be empty')
    }
    if (updates.name !== undefined) updates.name = updates.name.trim()
    if (updates.description !== undefined && typeof updates.description !== 'string') {
      return respondError(response, 400, 'Description must be a string')
    }
    if (updates.subjects !== undefined && (
      !Array.isArray(updates.subjects) || updates.subjects.some((subject) => typeof subject !== 'string')
    )) {
      return respondError(response, 400, 'Subjects must be an array of strings')
    }
    if (updates.coverImage !== undefined && updates.coverImage !== null && typeof updates.coverImage !== 'string') {
      return respondError(response, 400, 'Cover image must be a string or null')
    }

    Object.assign(group, updates)
    await group.save()
    return response.status(200).json({
      success: true,
      message: 'Group updated successfully',
      data: group,
    })
  } catch (error) {
    console.error('Update group error:', error)
    return respondError(response, 500, 'Unable to update group')
  }
}

export const deleteGroup = async (request, response) => {
  try {
    const group = await findGroupForLeader(request, response)
    if (!group) return

    await Membership.deleteMany({ groupId: group._id })
    await group.deleteOne()
    return response.status(200).json({ success: true, message: 'Group deleted successfully' })
  } catch (error) {
    console.error('Delete group error:', error)
    return respondError(response, 500, 'Unable to delete group')
  }
}

export const joinGroup = async (request, response) => {
  try {
    const groupId = request.params.id || request.body?.groupId
    if (!groupId || !mongoose.isValidObjectId(groupId)) {
      return respondError(response, 400, 'A valid group ID is required')
    }

    const group = await StudyGroup.findById(groupId)
    if (!group) return respondError(response, 404, 'Group not found')

    const existingMembership = await Membership.findOne({ userId: request.user.userId, groupId })
    if (existingMembership?.status === 'blocked') {
      return respondError(response, 403, 'You cannot join this group')
    }
    if (existingMembership) {
      return respondError(
        response,
        409,
        existingMembership.status === 'pending'
          ? 'Accept your invitation to join this group'
          : 'You already belong to this group',
      )
    }

    const membership = await Membership.create({
      userId: request.user.userId,
      groupId,
      role: 'student',
      status: 'active',
    })
    return response.status(201).json({
      success: true,
      message: 'Joined group successfully',
      data: membership,
    })
  } catch (error) {
    if (error.code === 11000) return respondError(response, 409, 'You already belong to this group')
    console.error('Join group error:', error)
    return respondError(response, 500, 'Unable to join group')
  }
}

export const leaveGroup = async (request, response) => {
  try {
    const groupId = request.params.id || request.body?.groupId
    if (!groupId || !mongoose.isValidObjectId(groupId)) {
      return respondError(response, 400, 'A valid group ID is required')
    }

    const membership = await Membership.findOne({
      userId: request.user.userId,
      groupId,
      status: 'active',
    })
    if (!membership) return respondError(response, 404, 'You are not an active member of this group')

    if (membership.role === 'leader') {
      const leaders = await Membership.countDocuments({ groupId, role: 'leader', status: 'active' })
      if (leaders <= 1) return respondError(response, 409, 'Transfer group leadership before leaving')
    }

    await membership.deleteOne()
    return response.status(200).json({ success: true, message: 'Left group successfully' })
  } catch (error) {
    console.error('Leave group error:', error)
    return respondError(response, 500, 'Unable to leave group')
  }
}

export const inviteMember = async (request, response) => {
  try {
    if (!isObject(request.body) || typeof request.body.email !== 'string' || !request.body.email.trim()) {
      return respondError(response, 400, 'A valid email address is required')
    }
    const group = await findGroupForLeader(request, response)
    if (!group) return

    const user = await User.findOne({ email: request.body.email.trim().toLowerCase() })
    if (!user) return respondError(response, 404, 'No registered user has that email address')

    const existingMembership = await Membership.findOne({ userId: user._id, groupId: group._id })
    if (existingMembership?.status === 'blocked') return respondError(response, 403, 'This user cannot be invited')
    if (existingMembership) return respondError(response, 409, 'This user already belongs to the group or has an invitation')

    const invitation = await Membership.create({
      userId: user._id,
      groupId: group._id,
      role: 'student',
      status: 'pending',
      joinedAt: null,
    })
    return response.status(201).json({
      success: true,
      message: 'Invitation sent successfully',
      data: invitation,
    })
  } catch (error) {
    if (error.code === 11000) return respondError(response, 409, 'This user already belongs to the group or has an invitation')
    console.error('Invite member error:', error)
    return respondError(response, 500, 'Unable to invite member')
  }
}

export const getMyInvitations = async (request, response) => {
  try {
    const invitations = await Membership.find({
      userId: request.user.userId,
      status: 'pending',
    }).populate('groupId')
    return response.status(200).json({
      success: true,
      data: invitations
        .filter((invitation) => invitation.groupId)
        .map((invitation) => ({
          id: invitation._id,
          group: invitation.groupId,
          invitedAt: invitation.createdAt,
        })),
    })
  } catch (error) {
    console.error('Get invitations error:', error)
    return respondError(response, 500, 'Unable to get invitations')
  }
}

export const acceptInvitation = async (request, response) => {
  try {
    const { id } = request.params
    if (!mongoose.isValidObjectId(id)) return respondError(response, 400, 'Invalid group ID')

    const membership = await Membership.findOneAndUpdate(
      { userId: request.user.userId, groupId: id, status: 'pending' },
      { $set: { status: 'active', joinedAt: new Date() } },
      { new: true, runValidators: true },
    )
    if (!membership) return respondError(response, 404, 'Invitation not found')
    return response.status(200).json({
      success: true,
      message: 'Invitation accepted successfully',
      data: membership,
    })
  } catch (error) {
    console.error('Accept invitation error:', error)
    return respondError(response, 500, 'Unable to accept invitation')
  }
}

export const declineInvitation = async (request, response) => {
  try {
    const { id } = request.params
    if (!mongoose.isValidObjectId(id)) return respondError(response, 400, 'Invalid group ID')

    const invitation = await Membership.findOneAndDelete({
      userId: request.user.userId,
      groupId: id,
      status: 'pending',
    })
    if (!invitation) return respondError(response, 404, 'Invitation not found')
    return response.status(200).json({ success: true, message: 'Invitation declined successfully' })
  } catch (error) {
    console.error('Decline invitation error:', error)
    return respondError(response, 500, 'Unable to decline invitation')
  }
}

export const removeMember = async (request, response) => {
  try {
    const group = await findGroupForLeader(request, response)
    if (!group) return

    const { userId } = request.params
    if (!mongoose.isValidObjectId(userId)) return respondError(response, 400, 'Invalid user ID')
    if (String(userId) === String(request.user.userId)) {
      return respondError(response, 400, 'Use the leave group endpoint to remove yourself')
    }

    const membership = await Membership.findOne({ groupId: group._id, userId })
    if (!membership) return respondError(response, 404, 'Group membership not found')
    if (membership.role === 'leader') {
      const leaders = await Membership.countDocuments({
        groupId: group._id,
        role: 'leader',
        status: 'active',
      })
      if (membership.status === 'active' && leaders <= 1) {
        return respondError(response, 409, 'A group must have at least one active leader')
      }
    }

    await membership.deleteOne()
    return response.status(200).json({ success: true, message: 'Member removed successfully' })
  } catch (error) {
    console.error('Remove member error:', error)
    return respondError(response, 500, 'Unable to remove member')
  }
}

export const getStudentLounge = async (request, response) => {
  try {
    let lounge = await StudyGroup.findOne({ name: 'Student Lounge' })
    if (!lounge) {
      const firstUser = await User.findOne()
      lounge = await StudyGroup.create({
        name: 'Student Lounge',
        description: 'General campus chat & discussions for all students',
        subjects: ['Campus Life', 'General', 'Community'],
        createdBy: firstUser?._id,
      })
    }
    return response.status(200).json({
      success: true,
      data: lounge,
    })
  } catch (error) {
    console.error('Get student lounge error:', error)
    return respondError(response, 500, 'Unable to get Student Lounge')
  }
}
