import mongoose from 'mongoose'
import Membership from '../models/Membership.js'

const authorizeGroup = async (request, response, next) => {
  try {
    const groupId = request.params?.groupId
      ?? request.body?.groupId
      ?? request.query?.groupId

    if (!groupId) {
      return response.status(400).json({
        success: false,
        message: 'Group ID is required',
      })
    }

    // Check if user is a member of the group
    // Convert to ObjectId for type consistency with Membership model
    const objectGroupId = mongoose.isValidObjectId(groupId)
      ? groupId
      : null

    if (!objectGroupId) {
      return response.status(400).json({
        success: false,
        message: 'Invalid group ID format',
      })
    }

    const isMember = await Membership.findOne({
      userId: mongoose.isValidObjectId(request.user.userId)
        ? new mongoose.Types.ObjectId(request.user.userId)
        : null,
      groupId: new mongoose.Types.ObjectId(objectGroupId),
      status: 'active',
    })

    if (!isMember) {
      return response.status(403).json({
        success: false,
        message: 'Access denied: You are not a member of this study group',
      })
    }

    request.authorizedGroupId = String(new mongoose.Types.ObjectId(objectGroupId))
    request.authorizedMembership = isMember
    next()
  } catch (error) {
    console.error('Authorization error:', error)
    return response.status(500).json({
      success: false,
      message: 'Authorization error',
    })
  }
}

export default authorizeGroup