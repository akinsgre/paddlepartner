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
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 GET /api/activities - Request received:', {
      user: req.user.googleId,
      query: req.query,
      timestamp: new Date().toISOString()
    })
  }

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
  } else {
    // If no specific sportType is requested, filter for water sports only
    const waterSportRegex = /(kayak|canoe|paddle|sup|stand.*up.*paddleboard|rowing|surfing|sailing)/i
    query.$or = [
      { sportType: waterSportRegex },
      { type: waterSportRegex },
      { name: waterSportRegex }
    ]
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

  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 GET /api/activities - Executing query:', {
      query: JSON.stringify(query),
      sort: sortObj,
      pagination: { page, limit, skip },
      timestamp: new Date().toISOString()
    })
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

  if (process.env.NODE_ENV === 'development') {
    console.log('✅ GET /api/activities - Query successful:', {
      activitiesFound: activities.length,
      totalCount: total,
      user: req.user.googleId,
      timestamp: new Date().toISOString()
    })
  }

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
  const isDevelopment = process.env.NODE_ENV === 'development'
  
  // Enhanced logging for development
  if (isDevelopment) {
    console.log('🔄 PUT /api/activities/:id - Request Details:')
    console.log('  Activity ID:', req.params.id)
    console.log('  User Google ID:', req.user.googleId)
    console.log('  Request Body:', JSON.stringify(req.body, null, 2))
    console.log('  Headers:', {
      'content-type': req.headers['content-type'],
      'authorization': req.headers.authorization ? 'Bearer [REDACTED]' : 'Missing'
    })
  }

  try {
    // Find the activity
    let activity = await Activity.findOne({
      _id: req.params.id,
      userGoogleId: req.user.googleId
    })
    
    if (isDevelopment) {
      console.log('  Found Activity:', activity ? 'Yes' : 'No')
      if (activity) {
        console.log('  Current Activity Data:', {
          id: activity._id,
          name: activity.name,
          waterType: activity.waterType,
          sportType: activity.sportType
        })
      }
    }

    if (!activity) {
      const error = {
        success: false,
        error: 'Activity not found',
        ...(isDevelopment && {
          debugInfo: {
            searchedId: req.params.id,
            userGoogleId: req.user.googleId,
            timestamp: new Date().toISOString()
          }
        })
      }
      if (isDevelopment) {
        console.log('❌ Activity not found:', error)
      }
      return res.status(404).json(error)
    }

    // Validate waterType if provided
    const { waterType } = req.body
    if (waterType) {
      if (isDevelopment) {
        console.log('  Validating waterType:', waterType)
      }
      
      const exists = await WaterType.exists({ name: waterType })
      if (!exists) {
        const availableTypes = await WaterType.find({}, 'name').lean()
        const error = {
          success: false,
          error: `Invalid waterType: ${waterType}`,
          ...(isDevelopment && {
            debugInfo: {
              providedWaterType: waterType,
              availableWaterTypes: availableTypes.map(wt => wt.name),
              timestamp: new Date().toISOString()
            }
          })
        }
        if (isDevelopment) {
          console.log('❌ Invalid waterType:', error)
        }
        return res.status(400).json(error)
      }
      
      if (isDevelopment) {
        console.log('  ✅ WaterType validation passed')
      }
    }

    // Log the update operation
    if (isDevelopment) {
      console.log('  Updating activity with data:', JSON.stringify(req.body, null, 2))
    }

    // Update activity
    activity = await Activity.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )

    if (isDevelopment) {
      console.log('  ✅ Activity updated successfully')
      console.log('  Updated Activity Data:', {
        id: activity._id,
        name: activity.name,
        waterType: activity.waterType,
        sportType: activity.sportType,
        modifiedFields: Object.keys(req.body)
      })
    }

    const response = {
      success: true,
      activity,
      ...(isDevelopment && {
        debugInfo: {
          updatedFields: Object.keys(req.body),
          timestamp: new Date().toISOString(),
          activityId: activity._id
        }
      })
    }

    res.status(200).json(response)

  } catch (error) {
    // Enhanced error logging for development
    if (isDevelopment) {
      console.error('💥 PUT /api/activities/:id - Error Details:')
      console.error('  Error Message:', error.message)
      console.error('  Error Name:', error.name)
      console.error('  Error Code:', error.code)
      console.error('  Validation Errors:', error.errors)
      console.error('  Stack Trace:', error.stack)
      console.error('  Request Data:', {
        activityId: req.params.id,
        requestBody: req.body,
        userGoogleId: req.user.googleId
      })
    }

    // Re-throw to be handled by error handler middleware
    throw error
  }
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

  // Filter for water sports only
  const waterSportTypes = [
    /kayak/i, /canoe/i, /paddle/i, /sup/i, /stand.*up.*paddleboard/i,
    /rowing/i, /surfing/i, /windsurfing/i, /kitesurfing/i, /sailing/i
  ]

  const activities = await Activity.find({
    userGoogleId: req.user.googleId,
    $or: [
      { sportType: { $in: waterSportTypes } },
      { type: { $in: waterSportTypes } },
      { name: { $in: waterSportTypes } }
    ],
    ...dateFilter
  }).lean()

  // Additional filtering for activities that might have slipped through
  const waterActivities = activities.filter(activity => {
    const sportType = (activity.sportType || '').toLowerCase()
    const type = (activity.type || '').toLowerCase()
    const name = (activity.name || '').toLowerCase()
    
    return (
      sportType.includes('kayak') || sportType.includes('canoe') || 
      sportType.includes('paddle') || sportType.includes('sup') || 
      sportType.includes('stand up paddleboard') || sportType.includes('rowing') ||
      sportType.includes('surfing') || sportType.includes('sailing') ||
      type.includes('kayak') || type.includes('canoe') || 
      type.includes('paddle') || type.includes('sup') ||
      name.includes('kayak') || name.includes('canoe') || 
      name.includes('paddle') || name.includes('sup')
    )
  })

  // Calculate statistics
  const stats = {
    totalActivities: waterActivities.length,
    totalDistance: waterActivities.reduce((sum, act) => sum + act.distance, 0),
    totalTime: waterActivities.reduce((sum, act) => sum + act.movingTime, 0),
    averageDistance: 0,
    longestActivity: Math.max(...waterActivities.map(act => act.distance), 0),
    sportTypeBreakdown: {},
    monthlyStats: []
  }

  stats.averageDistance = stats.totalActivities > 0 ? stats.totalDistance / stats.totalActivities : 0

  // Sport type breakdown
  waterActivities.forEach(activity => {
    const sportType = activity.sportType || 'Unknown'
    stats.sportTypeBreakdown[sportType] = (stats.sportTypeBreakdown[sportType] || 0) + 1
  })

  // Monthly stats
  const monthlyData = {}
  waterActivities.forEach(activity => {
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