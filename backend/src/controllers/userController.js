import User from '../models/User.js'

export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }
    res.status(200).json({ success: true, user })
  } catch (error) {
    console.error('Get profile error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

export const updateProfile = async (req, res) => {
  try {
    const allowedUpdates = ['name', 'department', 'semester', 'skills', 'bio', 'profilePhoto']
    const updates = {}
    
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key]
      }
    })

    const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true, runValidators: true })
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }
    
    res.status(200).json({ success: true, user })
  } catch (error) {
    console.error('Update profile error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}
