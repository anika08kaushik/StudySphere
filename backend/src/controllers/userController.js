import User from '../models/User.js'

const profileFields = 'name email department semester skills bio profilePhoto'

export const getProfile = async (request, response) => {
  try {
    const user = await User.findById(request.user.userId).select(profileFields)

    if (!user) {
      return response.status(404).json({
        success: false,
        message: 'User not found',
      })
    }

    return response.status(200).json({
      success: true,
      data: user,
    })
  } catch (error) {
    console.error('Get profile error:', error)

    return response.status(500).json({
      success: false,
      message: 'Unable to get profile',
    })
  }
}

export const updateProfile = async (request, response) => {
  try {
    const {
      name,
      department,
      semester,
      skills,
      bio,
      profilePhoto,
    } = request.body

    const updates = {}
    if (department !== undefined) updates.department = department
    if (semester !== undefined) updates.semester = semester
    if (skills !== undefined) updates.skills = skills
    if (bio !== undefined) updates.bio = bio
    if (profilePhoto !== undefined) updates.profilePhoto = profilePhoto

    if (name !== undefined && (typeof name !== 'string' || !name.trim())) {
      return response.status(400).json({
        success: false,
        message: 'Name cannot be empty',
      })
    }
    if (name !== undefined) updates.name = name.trim()

    const user = await User.findByIdAndUpdate(
      request.user.userId,
      { $set: updates },
      { new: true, runValidators: true, select: profileFields },
    )

    if (!user) {
      return response.status(404).json({
        success: false,
        message: 'User not found',
      })
    }

    return response.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: user,
    })
  } catch (error) {
    console.error('Update profile error:', error)

    return response.status(500).json({
      success: false,
      message: 'Unable to update profile',
    })
  }
}
