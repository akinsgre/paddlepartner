import request from 'supertest'
import express from 'express'
import cors from 'cors'
import authRoutes from '../routes/auth.js'
import userRoutes from '../routes/users.js'
import activityRoutes from '../routes/activities.js'
import stravaRoutes from '../routes/strava.js'
import waterTypesRoutes from '../routes/waterTypes.js'
import { errorHandler } from '../middleware/errorHandler.js'
import User from '../models/User.js'
import Activity from '../models/Activity.js'
import WaterType from '../models/WaterType.js'

// Create test app
const createTestApp = () => {
  const app = express()
  
  app.use(cors())
  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))
  
  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() })
  })
  
  // Routes
  app.use('/api/auth', authRoutes)
  app.use('/api/users', userRoutes)
  app.use('/api/activities', activityRoutes)
  app.use('/api/strava', stravaRoutes)
  app.use('/api/water-types', waterTypesRoutes)
  
  // Error handling
  app.use(errorHandler)
  
  return app
}

describe('🧪 Integration Tests - API Health Check', () => {
  let app
  
  beforeAll(() => {
    app = createTestApp()
  })
  
  test('GET /health - should return healthy status', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200)
    
    expect(response.body).toHaveProperty('status', 'healthy')
    expect(response.body).toHaveProperty('timestamp')
  })
})

describe('🧪 Integration Tests - Authentication Flow', () => {
  let app
  
  beforeAll(() => {
    app = createTestApp()
  })
  
  test('POST /api/auth/google - should create new user', async () => {
    const userData = {
      googleId: 'test-google-123',
      email: 'test@example.com',
      name: 'Test User',
      picture: 'https://example.com/avatar.jpg'
    }
    
    const response = await request(app)
      .post('/api/auth/google')
      .send(userData)
      .expect(200)
    
    expect(response.body.success).toBe(true)
    expect(response.body.token).toBeDefined()
    expect(response.body.user.email).toBe(userData.email)
    expect(response.body.user.googleId).toBe(userData.googleId)
    
    // Verify user was created in database
    const user = await User.findOne({ googleId: userData.googleId })
    expect(user).toBeTruthy()
    expect(user.email).toBe(userData.email)
  })
  
  test('POST /api/auth/google - should return existing user', async () => {
    const userData = {
      googleId: 'test-google-456',
      email: 'existing@example.com',
      name: 'Existing User',
      picture: 'https://example.com/existing.jpg'
    }
    
    // Create user first
    await User.create(userData)
    
    const response = await request(app)
      .post('/api/auth/google')
      .send(userData)
      .expect(200)
    
    expect(response.body.success).toBe(true)
    expect(response.body.user.email).toBe(userData.email)
    
    // Verify only one user exists
    const userCount = await User.countDocuments({ googleId: userData.googleId })
    expect(userCount).toBe(1)
  })
  
  test('POST /api/auth/google - should fail with missing data', async () => {
    const incompleteData = {
      email: 'incomplete@example.com'
      // Missing googleId and name
    }
    
    const response = await request(app)
      .post('/api/auth/google')
      .send(incompleteData)
      .expect(400)
    
    expect(response.body.success).toBe(false)
    expect(response.body.error).toContain('googleId, email, and name')
  })
})

describe('🧪 Integration Tests - Activity Management', () => {
  let app, authToken, testUser
  
  beforeAll(() => {
    app = createTestApp()
  })
  
  beforeEach(async () => {
    // Create test user and get auth token
    const userData = {
      googleId: 'test-activity-user',
      email: 'activity@example.com',
      name: 'Activity Test User'
    }
    
    const authResponse = await request(app)
      .post('/api/auth/google')
      .send(userData)
    
    authToken = authResponse.body.token
    testUser = authResponse.body.user
    
    // Seed water types
    await WaterType.create([
      { name: 'whitewater', description: 'Whitewater paddling' },
      { name: 'moving water', description: 'Moving water (not whitewater)' },
      { name: 'flat water', description: 'Flat water (lakes, slow rivers)' }
    ])
  })
  
  test('GET /api/activities - should return empty activities for new user', async () => {
    const response = await request(app)
      .get('/api/activities')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200)
    
    expect(response.body.success).toBe(true)
    expect(response.body.activities).toHaveLength(0)
    expect(response.body.pagination.totalActivities).toBe(0)
  })
  
  test('POST /api/activities - should create new activity', async () => {
    const activityData = {
      stravaId: 12345,
      name: 'Test Paddle',
      type: 'Kayaking',
      sportType: 'Kayaking',
      startDate: new Date().toISOString(),
      distance: 5000,
      movingTime: 3600,
      waterType: 'flat water',
      notes: 'Great paddle on the lake'
    }
    
    const response = await request(app)
      .post('/api/activities')
      .set('Authorization', `Bearer ${authToken}`)
      .send(activityData)
      .expect(201)
    
    expect(response.body.success).toBe(true)
    expect(response.body.activity.name).toBe(activityData.name)
    expect(response.body.activity.userGoogleId).toBe(testUser.googleId)
    
    // Verify activity was created in database
    const activity = await Activity.findOne({ stravaId: activityData.stravaId })
    expect(activity).toBeTruthy()
    expect(activity.userGoogleId).toBe(testUser.googleId)
  })
  
  test('PUT /api/activities/:id - should update activity', async () => {
    // Create activity first
    const activity = await Activity.create({
      stravaId: 67890,
      userId: testUser.id,
      userGoogleId: testUser.googleId,
      name: 'Original Name',
      type: 'Kayaking',
      sportType: 'Kayaking',
      startDate: new Date(),
      distance: 3000,
      movingTime: 1800
    })
    
    const updateData = {
      waterType: 'whitewater',
      notes: 'Updated with new notes'
    }
    
    const response = await request(app)
      .put(`/api/activities/${activity._id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send(updateData)
      .expect(200)
    
    expect(response.body.success).toBe(true)
    expect(response.body.activity.waterType).toBe(updateData.waterType)
    expect(response.body.activity.notes).toBe(updateData.notes)
  })
  
  test('GET /api/activities - should not access other users activities', async () => {
    // Create another user's activity
    const otherUser = await User.create({
      googleId: 'other-user-123',
      email: 'other@example.com',
      name: 'Other User'
    })
    
    await Activity.create({
      stravaId: 99999,
      userId: otherUser._id,
      userGoogleId: otherUser.googleId,
      name: 'Other User Activity',
      type: 'Kayaking',
      sportType: 'Kayaking',
      startDate: new Date(),
      distance: 1000,
      movingTime: 600
    })
    
    const response = await request(app)
      .get('/api/activities')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200)
    
    expect(response.body.success).toBe(true)
    expect(response.body.activities).toHaveLength(0) // Should not see other user's activity
  })
})

describe('🧪 Integration Tests - Water Types', () => {
  let app
  
  beforeAll(() => {
    app = createTestApp()
  })
  
  test('GET /api/water-types - should return available water types', async () => {
    // Seed water types
    await WaterType.create([
      { name: 'whitewater', description: 'Whitewater paddling' },
      { name: 'flat water', description: 'Flat water (lakes, slow rivers)' }
    ])
    
    const response = await request(app)
      .get('/api/water-types')
      .expect(200)
    
    expect(response.body.success).toBe(true)
    expect(response.body.waterTypes).toHaveLength(2)
    expect(response.body.waterTypes[0].name).toBeDefined()
    expect(response.body.waterTypes[0].description).toBeDefined()
  })
})

describe('🧪 Integration Tests - Strava Integration', () => {
  let app, authToken, testUser
  
  beforeAll(() => {
    app = createTestApp()
  })
  
  beforeEach(async () => {
    // Create test user
    const userData = {
      googleId: 'test-strava-user',
      email: 'strava@example.com',
      name: 'Strava Test User'
    }
    
    const authResponse = await request(app)
      .post('/api/auth/google')
      .send(userData)
    
    authToken = authResponse.body.token
    testUser = authResponse.body.user
  })
  
  test('GET /api/strava/status - should return disconnected status for new user', async () => {
    const response = await request(app)
      .get('/api/strava/status')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200)
    
    expect(response.body.success).toBe(true)
    expect(response.body.isConnected).toBe(false)
    expect(response.body.isTokenValid).toBe(false)
  })
  
  test('POST /api/strava/exchange-token - should fail without credentials', async () => {
    // This test assumes no Strava credentials are configured in test environment
    const response = await request(app)
      .post('/api/strava/exchange-token')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ code: 'test-auth-code' })
      .expect(500)
    
    expect(response.body.success).toBe(false)
    expect(response.body.error).toContain('Strava API credentials not configured')
  })
})