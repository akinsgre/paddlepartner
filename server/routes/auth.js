import express from 'express'
import jwt from 'jsonwebtoken'
import { asyncHandler } from '../middleware/errorHandler.js'
import User from '../models/User.js'

const router = express.Router()

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'paddle-partner-secret', {
    expiresIn: process.env.JWT_EXPIRE || '30d'
  })
}

// @desc    Authenticate user with Google
// @route   POST /api/auth/google
// @access  Public
router.post('/google', asyncHandler(async (req, res) => {
  const { googleId, email, name, picture } = req.body

  if (!googleId || !email || !name) {
    return res.status(400).json({
      success: false,
      error: 'Please provide googleId, email, and name'
    })
  }

  try {
    // Check if user exists
    let user = await User.findOne({ googleId })

    if (user) {
      // Update existing user
      user.name = name
      user.picture = picture
      user.lastLoginAt = new Date()
      await user.save()
    } else {
      // Create new user
      user = await User.create({
        googleId,
        email,
        name,
        picture,
        lastLoginAt: new Date()
      })
    }

    // Generate token
    const token = generateToken(user._id)

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        googleId: user.googleId,
        email: user.email,
        name: user.name,
        picture: user.picture,
        preferences: user.preferences,
        stats: user.stats,
        lastLoginAt: user.lastLoginAt
      }
    })

  } catch (error) {
    console.error('Google auth error:', error)
    res.status(500).json({
      success: false,
      error: 'Authentication failed'
    })
  }
}))

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
router.get('/me', asyncHandler(async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1]
  
  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'No token provided'
    })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'paddle-partner-secret')
    const user = await User.findById(decoded.id)

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      })
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        googleId: user.googleId,
        email: user.email,
        name: user.name,
        picture: user.picture,
        preferences: user.preferences,
        stats: user.stats,
        lastLoginAt: user.lastLoginAt
      }
    })

  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Invalid token'
    })
  }
}))

// @desc    Logout user (client-side token removal)
// @route   POST /api/auth/logout
// @access  Private
router.post('/logout', asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  })
}))

export default router