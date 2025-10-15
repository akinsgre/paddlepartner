import express from 'express'
import { asyncHandler } from '../middleware/errorHandler.js'
import { protect } from '../middleware/auth.js'
import User from '../models/User.js'
import Activity from '../models/Activity.js'

const router = express.Router()

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
router.get('/profile', protect, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)

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
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }
  })
}))

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
router.put('/profile', protect, asyncHandler(async (req, res) => {
  const { name, picture } = req.body

  const user = await User.findById(req.user._id)

  if (name) user.name = name
  if (picture) user.picture = picture

  await user.save()

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
}))

// @desc    Get user preferences
// @route   GET /api/users/preferences
// @access  Private
router.get('/preferences', protect, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)

  res.status(200).json({
    success: true,
    preferences: user.preferences
  })
}))

// @desc    Update user preferences
// @route   PUT /api/users/preferences
// @access  Private
router.put('/preferences', protect, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)

  // Update preferences
  if (req.body.units) user.preferences.units = req.body.units
  if (req.body.defaultPrivacy) user.preferences.defaultPrivacy = req.body.defaultPrivacy
  
  if (req.body.notifications) {
    user.preferences.notifications = {
      ...user.preferences.notifications,
      ...req.body.notifications
    }
  }
  
  if (req.body.dashboard) {
    user.preferences.dashboard = {
      ...user.preferences.dashboard,
      ...req.body.dashboard
    }
  }

  await user.save()

  res.status(200).json({
    success: true,
    preferences: user.preferences
  })
}))

// @desc    Update Strava tokens
// @route   PUT /api/users/strava-tokens
// @access  Private
router.put('/strava-tokens', protect, asyncHandler(async (req, res) => {
  const { accessToken, refreshToken, expiresAt, athleteId } = req.body

  const user = await User.findById(req.user._id)

  if (accessToken) user.stravaAccessToken = accessToken
  if (refreshToken) user.stravaRefreshToken = refreshToken
  if (expiresAt) user.stravaTokenExpiry = new Date(expiresAt)
  if (athleteId) user.stravaAthleteId = athleteId

  await user.save()

  res.status(200).json({
    success: true,
    message: 'Strava tokens updated successfully'
  })
}))

// @desc    Get user statistics
// @route   GET /api/users/stats
// @access  Private
router.get('/stats', protect, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)

  res.status(200).json({
    success: true,
    stats: user.stats,
    formattedStats: {
      totalDistance: user.formattedTotalDistance,
      totalTime: user.formattedTotalTime
    }
  })
}))

// @desc    Delete user account
// @route   DELETE /api/users/account
// @access  Private
router.delete('/account', protect, asyncHandler(async (req, res) => {
  // Also delete all user's activities
  await Activity.deleteMany({ userId: req.user._id })
  
  // Delete user
  await User.findByIdAndDelete(req.user._id)

  res.status(200).json({
    success: true,
    message: 'Account deleted successfully'
  })
}))

export default router