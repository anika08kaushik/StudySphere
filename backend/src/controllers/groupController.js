import StudyGroup from '../models/StudyGroup.js'
import Membership from '../models/Membership.js'

export const createGroup = async (req, res) => {
  try {
    const { name, description, subjects, coverImage } = req.body

    if (!name) {
      return res.status(400).json({ success: false, message: 'Group name is required' })
    }

    const group = await StudyGroup.create({
      name,
      description,
      subjects,
      coverImage,
      createdBy: req.user.id
    })

    // Automatically add the creator as a leader
    await Membership.create({
      userId: req.user.id,
      groupId: group._id,
      role: 'leader',
      status: 'active'
    })

    res.status(201).json({ success: true, group })
  } catch (error) {
    console.error('Create group error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

export const getGroup = async (req, res) => {
  try {
    const { groupId } = req.params
    const group = await StudyGroup.findById(groupId).populate('createdBy', 'name email profilePhoto')
    
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' })
    }

    const members = await Membership.find({ groupId, status: 'active' }).populate('userId', 'name email profilePhoto')

    res.status(200).json({ success: true, group, members })
  } catch (error) {
    console.error('Get group error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

export const getAllGroups = async (req, res) => {
  try {
    const groups = await StudyGroup.find().populate('createdBy', 'name email profilePhoto')
    
    // For each group, we should probably fetch the memberships to know the member count, 
    // or just return the groups for now. We will fetch memberships for all groups.
    const memberships = await Membership.find({ status: 'active' })
    
    // Attach member count and joined status for the current user to each group
    const groupsWithStats = groups.map(group => {
      const groupMemberships = memberships.filter(m => String(m.groupId) === String(group._id))
      const isJoined = groupMemberships.some(m => String(m.userId) === String(req.user.id))
      return {
        ...group.toObject(),
        memberCount: groupMemberships.length,
        joined: isJoined
      }
    })

    res.status(200).json({ success: true, groups: groupsWithStats })
  } catch (error) {
    console.error('Get all groups error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

export const updateGroup = async (req, res) => {
  try {
    const { groupId } = req.params
    const { name, description, subjects, coverImage } = req.body

    // Check if user is leader
    const membership = await Membership.findOne({ groupId, userId: req.user.id, role: 'leader' })
    if (!membership) {
      return res.status(403).json({ success: false, message: 'Only leaders can update the group' })
    }

    const group = await StudyGroup.findByIdAndUpdate(
      groupId,
      { name, description, subjects, coverImage },
      { new: true, runValidators: true }
    )

    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' })
    }

    res.status(200).json({ success: true, group })
  } catch (error) {
    console.error('Update group error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

export const deleteGroup = async (req, res) => {
  try {
    const { groupId } = req.params

    // Check if user is leader
    const membership = await Membership.findOne({ groupId, userId: req.user.id, role: 'leader' })
    if (!membership) {
      return res.status(403).json({ success: false, message: 'Only leaders can delete the group' })
    }

    const group = await StudyGroup.findByIdAndDelete(groupId)
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' })
    }

    // Delete all memberships for this group
    await Membership.deleteMany({ groupId })

    res.status(200).json({ success: true, message: 'Group deleted successfully' })
  } catch (error) {
    console.error('Delete group error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

export const joinGroup = async (req, res) => {
  try {
    const { groupId } = req.params

    const existingMembership = await Membership.findOne({ groupId, userId: req.user.id })
    if (existingMembership) {
      return res.status(400).json({ success: false, message: 'You are already a member of this group' })
    }

    const membership = await Membership.create({
      userId: req.user.id,
      groupId,
      role: 'student',
      status: 'active'
    })

    res.status(201).json({ success: true, message: 'Joined group successfully', membership })
  } catch (error) {
    console.error('Join group error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

export const leaveGroup = async (req, res) => {
  try {
    const { groupId } = req.params

    const membership = await Membership.findOneAndDelete({ groupId, userId: req.user.id })
    if (!membership) {
      return res.status(404).json({ success: false, message: 'You are not a member of this group' })
    }

    res.status(200).json({ success: true, message: 'Left group successfully' })
  } catch (error) {
    console.error('Leave group error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

export const inviteMember = async (req, res) => {
  try {
    const { groupId } = req.params
    const { userId } = req.body

    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required' })
    }

    // Check if requester is leader
    const requesterMembership = await Membership.findOne({ groupId, userId: req.user.id, role: 'leader' })
    if (!requesterMembership) {
      return res.status(403).json({ success: false, message: 'Only leaders can invite members' })
    }

    const existingMembership = await Membership.findOne({ groupId, userId })
    if (existingMembership) {
      return res.status(400).json({ success: false, message: 'User is already a member' })
    }

    const membership = await Membership.create({
      userId,
      groupId,
      role: 'student',
      status: 'active'
    })

    res.status(201).json({ success: true, message: 'User invited successfully', membership })
  } catch (error) {
    console.error('Invite member error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

export const removeMember = async (req, res) => {
  try {
    const { groupId, userId } = req.params

    // Check if requester is leader
    const requesterMembership = await Membership.findOne({ groupId, userId: req.user.id, role: 'leader' })
    if (!requesterMembership) {
      return res.status(403).json({ success: false, message: 'Only leaders can remove members' })
    }

    if (userId === req.user.id) {
        return res.status(400).json({ success: false, message: 'You cannot remove yourself using this endpoint' })
    }

    const membership = await Membership.findOneAndDelete({ groupId, userId })
    if (!membership) {
      return res.status(404).json({ success: false, message: 'User is not a member of this group' })
    }

    res.status(200).json({ success: true, message: 'User removed successfully' })
  } catch (error) {
    console.error('Remove member error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}
