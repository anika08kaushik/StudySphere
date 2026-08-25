import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'

const generateToken = (userId) => {
  return jwt.sign(
    { userId: String(userId) },
    process.env.JWT_SECRET,
    { expiresIn: '30d' },
  )
}

export const registerUser = async (request, response) => {
  try {
    const {
      name,
      email,
      password,
      department,
      semester,
      skills,
      bio,
    } = request.body

    if (!name || !email || !password) {
      return response.status(400).json({
        success: false,
        message: 'Name, email and password are required',
      })
    }

    if (password.length < 6) {
      return response.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters',
      })
    }

    const normalizedEmail = email.trim().toLowerCase()

    const existingUser = await User.findOne({
      email: normalizedEmail,
    })

    if (existingUser) {
      return response.status(409).json({
        success: false,
        message: 'User already exists',
      })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      department,
      semester,
      skills,
      bio,
    })

    const token = generateToken(user._id)

    return response.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          department: user.department,
          semester: user.semester,
          skills: user.skills,
          bio: user.bio,
          profilePhoto: user.profilePhoto,
        },
        token,
      },
    })
  } catch (error) {
    console.error('Registration error:', error)

    return response.status(500).json({
      success: false,
      message: 'Unable to register user',
    })
  }
}

export const loginUser = async (request, response) => {
  try {
    const { email, password } = request.body

    if (!email || !password) {
      return response.status(400).json({
        success: false,
        message: 'Email and password are required',
      })
    }

    const normalizedEmail = email.trim().toLowerCase()

    const user = await User.findOne({
      email: normalizedEmail,
    }).select('+password')

    if (!user) {
      return response.status(401).json({
        success: false,
        message: 'Invalid email or password',
      })
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.password,
    )

    if (!passwordMatches) {
      return response.status(401).json({
        success: false,
        message: 'Invalid email or password',
      })
    }

    const token = generateToken(user._id)

    return response.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          department: user.department,
          semester: user.semester,
          skills: user.skills,
          bio: user.bio,
          profilePhoto: user.profilePhoto,
        },
        token,
      },
    })
  } catch (error) {
    console.error('Login error:', error)

    return response.status(500).json({
      success: false,
      message: 'Unable to login',
    })
  }
}