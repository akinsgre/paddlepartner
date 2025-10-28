import express from 'express'
import axios from 'axios'
import { asyncHandler } from '../middleware/errorHandler.js'
import { protect } from '../middleware/auth.js'
import Activity from '../models/Activity.js'
import User from '../models/User.js'

const router = express.Router()

// @desc    Exchange Strava authorization code for tokens
// @route   POST /api/strava/exchange-token
// @access  Private
router.post('/exchange-token', protect, asyncHandler(async (req, res) => {
  const { code, redirectUri } = req.body
  
  // Get environment variables directly in handler
  const STRAVA_CLIENT_ID = process.env.STRAVA_CLIENT_ID
  const STRAVA_CLIENT_SECRET = process.env.STRAVA_CLIENT_SECRET

  if (!code) {
    return res.status(400).json({
      success: false,
      error: 'Authorization code is required'
    })
  }

  if (!STRAVA_CLIENT_ID || !STRAVA_CLIENT_SECRET) {
    console.error('❌ Strava credentials not configured:', {
      clientId: !!STRAVA_CLIENT_ID,
      clientSecret: !!STRAVA_CLIENT_SECRET
    })
    return res.status(500).json({
      success: false,
      error: 'Strava API credentials not configured'
    })
  }

  // Validate redirect URI if provided (security measure)
  if (redirectUri && !isValidRedirectUri(redirectUri)) {
    console.error('❌ Invalid redirect URI provided:', redirectUri)
    return res.status(400).json({
      success: false,
      error: 'Invalid redirect URI'
    })
  }

  try {
    console.log('🔄 Attempting Strava token exchange with:')
    console.log('  Client ID:', STRAVA_CLIENT_ID)
    console.log('  Client Secret length:', STRAVA_CLIENT_SECRET?.length || 'undefined')
    console.log('  Code length:', code.length)
    console.log('  Code preview:', code.substring(0, 10) + '...')
    console.log('  Redirect URI:', redirectUri || 'not provided')
    
    const tokenRequest = {
      client_id: STRAVA_CLIENT_ID,
      client_secret: STRAVA_CLIENT_SECRET,
      code: code,
      grant_type: 'authorization_code'
    }
    
    console.log('  Request payload:', JSON.stringify(tokenRequest, null, 2))
    
    const response = await axios.post('https://www.strava.com/oauth/token', tokenRequest)

    const { access_token, refresh_token, expires_at, athlete } = response.data

    // Update user with Strava tokens
    const user = await User.findById(req.user._id)
    user.stravaAccessToken = access_token
    user.stravaRefreshToken = refresh_token
    user.stravaTokenExpiry = new Date(expires_at * 1000)
    user.stravaAthleteId = athlete.id.toString()
    await user.save()

    res.status(200).json({
      success: true,
      message: 'Strava account connected successfully',
      athlete: {
        id: athlete.id,
        firstname: athlete.firstname,
        lastname: athlete.lastname,
        profile: athlete.profile
      }
    })

  } catch (error) {
    console.error('Strava token exchange error:', error.response?.data || error.message)
    res.status(400).json({
      success: false,
      error: 'Failed to connect to Strava'
    })
  }
}))

/**
 * Validate redirect URI for security
 * @param {string} redirectUri - The redirect URI to validate
 * @returns {boolean} - Whether the URI is valid
 */
function isValidRedirectUri(redirectUri) {
  try {
    const url = new URL(redirectUri)
    
    // Environment-aware allowed hosts
    const allowedOrigins = getEnvironmentAllowedOrigins()
    const isAllowedOrigin = allowedOrigins.includes(`${url.protocol}//${url.host}`)
    
    // Check path (must be /activities or similar allowed paths)
    const allowedPaths = ['/activities', '/auth/callback', '/']
    const isValidPath = allowedPaths.includes(url.pathname)
    
    console.log('🔍 Redirect URI validation:', {
      uri: redirectUri,
      origin: `${url.protocol}//${url.host}`,
      pathname: url.pathname,
      environment: getServerEnvironment(),
      isAllowedOrigin,
      isValidPath,
      isValid: isAllowedOrigin && isValidPath
    })
    
    return isAllowedOrigin && isValidPath
    
  } catch (error) {
    console.error('❌ Error validating redirect URI:', error.message)
    return false
  }
}

/**
 * Get server environment
 */
function getServerEnvironment() {
  const nodeEnv = process.env.NODE_ENV || 'development'
  
  if (nodeEnv === 'production') return 'production'
  if (nodeEnv === 'staging' || nodeEnv === 'test') return 'staging'
  return 'development'
}

/**
 * Get allowed origins for current server environment
 */
function getEnvironmentAllowedOrigins() {
  const environment = getServerEnvironment()
  
  const allowedOrigins = {
    development: [
      'http://localhost:5173',
      'http://localhost:5174', 
      'http://localhost:3000',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5174',
      'http://127.0.0.1:3000'
    ],
    staging: [
      'https://staging.paddlepartner.com',
      'https://dev.paddlepartner.com',
      'https://test.paddlepartner.com'
    ],
    production: [
      'https://paddlepartner.com',
      'https://www.paddlepartner.com'
    ]
  }
  
  return allowedOrigins[environment] || allowedOrigins.development
}

// @desc    Refresh Strava access token
// @route   POST /api/strava/refresh-token
// @access  Private
router.post('/refresh-token', protect, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
  
  // Get environment variables directly in handler
  const STRAVA_CLIENT_ID = process.env.STRAVA_CLIENT_ID
  const STRAVA_CLIENT_SECRET = process.env.STRAVA_CLIENT_SECRET

  if (!user.stravaRefreshToken) {
    return res.status(400).json({
      success: false,
      error: 'No refresh token available'
    })
  }

  if (!STRAVA_CLIENT_ID || !STRAVA_CLIENT_SECRET) {
    return res.status(500).json({
      success: false,
      error: 'Strava API credentials not configured'
    })
  }

  try {
    const response = await axios.post('https://www.strava.com/oauth/token', {
      client_id: STRAVA_CLIENT_ID,
      client_secret: STRAVA_CLIENT_SECRET,
      refresh_token: user.stravaRefreshToken,
      grant_type: 'refresh_token'
    })

    const { access_token, refresh_token, expires_at } = response.data

    // Update user tokens
    user.stravaAccessToken = access_token
    user.stravaRefreshToken = refresh_token
    user.stravaTokenExpiry = new Date(expires_at * 1000)
    await user.save()

    res.status(200).json({
      success: true,
      message: 'Strava token refreshed successfully'
    })

  } catch (error) {
    console.error('Strava token refresh error:', error.response?.data || error.message)
    res.status(400).json({
      success: false,
      error: 'Failed to refresh Strava token'
    })
  }
}))

// @desc    Fetch and sync activities from Strava
// @route   POST /api/strava/sync-activities
// @access  Private
router.post('/sync-activities', protect, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
  const { page = 1, per_page = 30, sync_all = false } = req.body

  if (!user.stravaAccessToken) {
    return res.status(400).json({
      success: false,
      error: 'Strava not connected'
    })
  }

  // Check if token is expired
  if (user.stravaTokenExpiry && new Date() > user.stravaTokenExpiry) {
    return res.status(401).json({
      success: false,
      error: 'Strava token expired. Please refresh.'
    })
  }

  try {
    let allActivities = []
    let currentPage = page
    let totalSaved = 0
    const maxPages = sync_all ? 20 : 1 // Limit to 20 pages (600 activities) for safety
    const perPageLimit = Math.min(per_page, 200) // Strava API limit is 200

    console.log(`🔄 Starting Strava sync - Page: ${currentPage}, Per Page: ${perPageLimit}, Sync All: ${sync_all}`)

    do {
      console.log(`📄 Fetching page ${currentPage}...`)
      
      // Fetch activities from Strava
      const response = await axios.get('https://www.strava.com/api/v3/athlete/activities', {
        headers: {
          'Authorization': `Bearer ${user.stravaAccessToken}`
        },
        params: {
          per_page: perPageLimit,
          page: currentPage
        }
      })

      const stravaActivities = response.data
      console.log(`📊 Retrieved ${stravaActivities.length} activities from page ${currentPage}`)

      if (stravaActivities.length === 0) {
        console.log('📝 No more activities found, stopping sync')
        break
      }

      // Filter for paddle activities
      const paddleActivities = stravaActivities.filter(activity => 
        activity.sport_type?.toLowerCase().includes('kayak') || 
        activity.sport_type?.toLowerCase().includes('canoe') ||
        activity.sport_type?.toLowerCase().includes('paddle') ||
        activity.sport_type?.toLowerCase().includes('sup') ||
        activity.sport_type?.toLowerCase().includes('stand up paddleboard') ||
        activity.type?.toLowerCase().includes('kayak') ||
        activity.type?.toLowerCase().includes('canoe') ||
        activity.type?.toLowerCase().includes('paddle') ||
        activity.name?.toLowerCase().includes('kayak') ||
        activity.name?.toLowerCase().includes('canoe') ||
        activity.name?.toLowerCase().includes('paddle') ||
        activity.name?.toLowerCase().includes('sup')
      )

      console.log(`🛶 Found ${paddleActivities.length} paddle activities on page ${currentPage}`)

      let pageSaved = 0
      for (const stravaActivity of paddleActivities) {
        try {
          // Check if activity already exists
          const existingActivity = await Activity.findOne({ 
            stravaId: stravaActivity.id,
            userGoogleId: user.googleId 
          })

          if (existingActivity) {
            continue // Skip if already exists
          }

          // Create new activity
          const activity = new Activity({
            stravaId: stravaActivity.id,
            userId: user._id,
            userGoogleId: user.googleId,
            name: stravaActivity.name,
            type: stravaActivity.type,
            sportType: stravaActivity.sport_type,
            startDate: new Date(stravaActivity.start_date),
            distance: stravaActivity.distance || 0,
            movingTime: stravaActivity.moving_time || 0,
            totalElevationGain: stravaActivity.total_elevation_gain || 0,
            averageSpeed: stravaActivity.average_speed || 0,
            maxSpeed: stravaActivity.max_speed || 0,
            location: {
              startLatLng: stravaActivity.start_latlng,
              endLatLng: stravaActivity.end_latlng
            },
            stravaData: {
              polyline: stravaActivity.map?.polyline,
              summaryPolyline: stravaActivity.map?.summary_polyline,
              mapId: stravaActivity.map?.id,
              timezone: stravaActivity.timezone,
              startDateLocal: stravaActivity.start_date_local ? new Date(stravaActivity.start_date_local) : undefined,
              utcOffset: stravaActivity.utc_offset
            },
            isPublic: false
          })

          await activity.save()
          pageSaved++
          totalSaved++

        } catch (error) {
          console.error(`❌ Error saving activity ${stravaActivity.id}:`, error.message)
        }
      }

      console.log(`💾 Saved ${pageSaved} new activities from page ${currentPage}`)
      allActivities.push(...paddleActivities)
      currentPage++

      // Stop if we're not syncing all or if we got less than requested (last page)
      if (!sync_all || stravaActivities.length < perPageLimit) {
        break
      }

    } while (currentPage <= maxPages)

    // Update user stats
    const allUserActivities = await Activity.find({ userGoogleId: user.googleId })
    await user.updateStats(allUserActivities)

    console.log(`✅ Sync complete! Total saved: ${totalSaved}, Pages processed: ${currentPage - page}`)

    res.status(200).json({
      success: true,
      message: `Successfully synced ${totalSaved} new paddle activities`,
      totalFound: allActivities.length,
      newActivities: totalSaved,
      pagesProcessed: currentPage - page,
      hasMore: !sync_all && allActivities.length === perPageLimit
    })

  } catch (error) {
    console.error('Strava sync error:', error.response?.data || error.message)
    
    if (error.response?.status === 401) {
      return res.status(401).json({
        success: false,
        error: 'Strava token expired. Please refresh.'
      })
    }

    res.status(500).json({
      success: false,
      error: 'Failed to sync activities from Strava'
    })
  }
}))

// @desc    Get Strava connection status
// @route   GET /api/strava/status
// @access  Private
router.get('/status', protect, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)

  const isConnected = !!user.stravaAccessToken
  const isTokenValid = user.stravaTokenExpiry ? new Date() < user.stravaTokenExpiry : false

  res.status(200).json({
    success: true,
    isConnected,
    isTokenValid,
    athleteId: user.stravaAthleteId,
    tokenExpiry: user.stravaTokenExpiry
  })
}))

// @desc    Disconnect Strava
// @route   DELETE /api/strava/disconnect
// @access  Private
router.delete('/disconnect', protect, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)

  // Clear Strava tokens
  user.stravaAccessToken = undefined
  user.stravaRefreshToken = undefined
  user.stravaTokenExpiry = undefined
  user.stravaAthleteId = undefined
  await user.save()

  res.status(200).json({
    success: true,
    message: 'Strava account disconnected successfully'
  })
}))

export default router