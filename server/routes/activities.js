import express from 'express'
import { asyncHandler } from '../middleware/errorHandler.js'
import { protect } from '../middleware/auth.js'
import Activity from '../models/Activity.js'
import User from '../models/User.js'
import WaterType from '../models/WaterType.js'

const router = express.Router()

// @desc    Get user activities
// @route   GET /api/activities
// @access  Private
router.get('/', protect, asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 30,
    sort = '-startDate',
    sportType,
    waterType,
    startDate,
    endDate,
    search,
    isPublic
  } = req.query

  // Build query
  const query = { userGoogleId: req.user.googleId }

  if (sportType) {
    query.sportType = sportType
  }

  if (waterType) {
    if (waterType === 'undefined') {
      // Filter for activities where waterType is not set (null or undefined)
      query.waterType = { $in: [null, undefined] }
    } else {
      // Filter for specific waterType value
      query.waterType = waterType
    }
  }

  if (startDate || endDate) {
    query.startDate = {}
    if (startDate) query.startDate.$gte = new Date(startDate)
    if (endDate) query.startDate.$lte = new Date(endDate)
  }

  if (search) {
    // Support multiple NOT terms: e.g., 'NOT Greenlick AND NOT ERG'
    const notTerms = search.match(/NOT\s+[^A]+(?: AND NOT [^A]+)*/gi)
    if (notTerms) {
      // Split and clean up each NOT term
      const negatives = search.split(/AND/i)
        .map(s => s.trim())
        .filter(s => /^NOT\s+/i.test(s))
        .map(s => s.replace(/^NOT\s+/i, '').trim())
        .filter(Boolean)
      // Build $and array of $not regexes for each negative term
      query.$and = negatives.flatMap(neg => [
        { name: { $not: new RegExp(neg, 'i') } },
        { notes: { $not: new RegExp(neg, 'i') } },
        { 'location.city': { $not: new RegExp(neg, 'i') } }
      ])
    } else {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } },
        { 'location.city': { $regex: search, $options: 'i' } }
      ]
    }
  }

  if (isPublic !== undefined) {
    query.isPublic = isPublic === 'true'
  }

  // Calculate pagination
  const skip = (parseInt(page) - 1) * parseInt(limit)

  // Parse sort parameter (e.g., '-startDate' for descending, 'startDate' for ascending)
  const sortObj = {}
  if (sort) {
    const sortField = sort.startsWith('-') ? sort.substring(1) : sort
    const sortOrder = sort.startsWith('-') ? -1 : 1
    sortObj[sortField] = sortOrder
  } else {
    sortObj.startDate = -1 // Default sort
  }

  // Execute query
  const [activities, total] = await Promise.all([
    Activity.find(query)
      .sort(sortObj)
      .limit(parseInt(limit))
      .skip(skip)
      .lean(),
    Activity.countDocuments(query)
  ])

  res.status(200).json({
    success: true,
    activities,
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      totalActivities: total,
      hasNextPage: parseInt(page) < Math.ceil(total / parseInt(limit)),
      hasPrevPage: parseInt(page) > 1,
      limit: parseInt(limit)
    }
  })
}))

// @desc    Get single activity
// @route   GET /api/activities/:id
// @access  Private
router.get('/:id', protect, asyncHandler(async (req, res) => {
  const activity = await Activity.findOne({
    _id: req.params.id,
    userGoogleId: req.user.googleId
  })

  if (!activity) {
    return res.status(404).json({
      success: false,
      error: 'Activity not found'
    })
  }

  res.status(200).json({
    success: true,
    activity
  })
}))

// @desc    Create activity
// @route   POST /api/activities
// @access  Private
router.post('/', protect, asyncHandler(async (req, res) => {
  const { waterType } = req.body
  if (waterType) {
    const exists = await WaterType.exists({ name: waterType })
    if (!exists) {
      return res.status(400).json({ success: false, error: `Invalid waterType: ${waterType}` })
    }
  }
  const activityData = {
    ...req.body,
    userId: req.user._id,
    userGoogleId: req.user.googleId
  }
  const activity = await Activity.create(activityData)
  // Update user stats
  const activities = await Activity.find({ userGoogleId: req.user.googleId })
  await req.user.updateStats(activities)
  res.status(201).json({
    success: true,
    activity
  })
}))

// @desc    Update activity
// @route   PUT /api/activities/:id
// @access  Private
router.put('/:id', protect, asyncHandler(async (req, res) => {
  let activity = await Activity.findOne({
    _id: req.params.id,
    userGoogleId: req.user.googleId
  })
  if (!activity) {
    return res.status(404).json({
      success: false,
      error: 'Activity not found'
    })
  }
  const { waterType } = req.body
  if (waterType) {
    const exists = await WaterType.exists({ name: waterType })
    if (!exists) {
      return res.status(400).json({ success: false, error: `Invalid waterType: ${waterType}` })
    }
  }
  // Update activity
  activity = await Activity.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  )
  res.status(200).json({
    success: true,
    activity
  })
}))

// @desc    Delete activity
// @route   DELETE /api/activities/:id
// @access  Private
router.delete('/:id', protect, asyncHandler(async (req, res) => {
  const activity = await Activity.findOne({
    _id: req.params.id,
    userGoogleId: req.user.googleId
  })

  if (!activity) {
    return res.status(404).json({
      success: false,
      error: 'Activity not found'
    })
  }

  await Activity.findByIdAndDelete(req.params.id)

  // Update user stats
  const activities = await Activity.find({ userGoogleId: req.user.googleId })
  await req.user.updateStats(activities)

  res.status(200).json({
    success: true,
    message: 'Activity deleted successfully'
  })
}))

// @desc    Get activity statistics
// @route   GET /api/activities/stats
// @access  Private
router.get('/stats/summary', protect, asyncHandler(async (req, res) => {
  const { timeRange } = req.query

  let dateFilter = {}
  if (timeRange) {
    const now = new Date()
    const daysAgo = parseInt(timeRange)
    const startDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000))
    dateFilter = { startDate: { $gte: startDate } }
  }

  const activities = await Activity.find({
    userGoogleId: req.user.googleId,
    ...dateFilter
  }).lean()

  // Calculate statistics
  const stats = {
    totalActivities: activities.length,
    totalDistance: activities.reduce((sum, act) => sum + act.distance, 0),
    totalTime: activities.reduce((sum, act) => sum + act.movingTime, 0),
    averageDistance: 0,
    longestActivity: Math.max(...activities.map(act => act.distance), 0),
    sportTypeBreakdown: {},
    monthlyStats: []
  }

  stats.averageDistance = stats.totalActivities > 0 ? stats.totalDistance / stats.totalActivities : 0

  // Sport type breakdown
  activities.forEach(activity => {
    const sportType = activity.sportType || 'Unknown'
    stats.sportTypeBreakdown[sportType] = (stats.sportTypeBreakdown[sportType] || 0) + 1
  })

  // Monthly stats
  const monthlyData = {}
  activities.forEach(activity => {
    const month = new Date(activity.startDate).toISOString().slice(0, 7) // YYYY-MM
    if (!monthlyData[month]) {
      monthlyData[month] = { count: 0, distance: 0 }
    }
    monthlyData[month].count++
    monthlyData[month].distance += activity.distance
  })

  stats.monthlyStats = Object.entries(monthlyData)
    .map(([month, data]) => ({ month, ...data }))
    .sort((a, b) => a.month.localeCompare(b.month))

  res.status(200).json({
    success: true,
    stats
  })
}))

// @desc    Get public activities (for sharing/discovery)
// @route   GET /api/activities/public
// @access  Public
router.get('/public/feed', asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, sportType } = req.query

  const query = { isPublic: true }
  if (sportType) {
    query.sportType = sportType
  }

  const skip = (parseInt(page) - 1) * parseInt(limit)

  const [activities, total] = await Promise.all([
    Activity.find(query)
      .sort({ startDate: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .populate('userId', 'name picture')
      .lean(),
    Activity.countDocuments(query)
  ])

  res.status(200).json({
    success: true,
    count: activities.length,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / parseInt(limit)),
    activities
  })
}))

export default router