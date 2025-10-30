const request = require('supertest')
const express = require('express')
const mongoose = require('mongoose')

// Mock the database models
const mockActivities = [
  {
    _id: 'activity1',
    userGoogleId: 'user123',
    name: 'Morning Kayak',
    sportType: 'Kayaking',
    type: 'Kayaking',
    startDate: new Date('2024-01-15'),
    distance: 5000,
    movingTime: 3600
  },
  {
    _id: 'activity2', 
    userGoogleId: 'user123',
    name: 'Bike Ride',
    sportType: 'Cycling',
    type: 'Ride',
    startDate: new Date('2024-01-16'),
    distance: 25000,
    movingTime: 7200
  },
  {
    _id: 'activity3',
    userGoogleId: 'user123', 
    name: 'Evening SUP',
    sportType: 'Stand Up Paddleboarding',
    type: 'Stand Up Paddleboarding',
    startDate: new Date('2024-01-17'),
    distance: 3000,
    movingTime: 2400
  },
  {
    _id: 'activity4',
    userGoogleId: 'user123',
    name: 'Morning Run',
    sportType: 'Running',
    type: 'Run',
    startDate: new Date('2024-01-18'),
    distance: 8000,
    movingTime: 3000
  }
]

// Mock Activity model
jest.mock('../models/Activity.js', () => ({
  find: jest.fn(),
  lean: jest.fn()
}))

// Mock User model 
jest.mock('../models/User.js', () => ({
  findById: jest.fn()
}))

// Mock auth middleware
jest.mock('../middleware/auth.js', () => ({
  protect: (req, res, next) => {
    req.user = { 
      _id: 'user123',
      googleId: 'user123' 
    }
    next()
  }
}))

describe('🧪 Water Sport Filtering Tests', () => {
  let app
  let Activity

  beforeAll(async () => {
    // Import the Activity model after mocking
    Activity = require('../models/Activity.js')
    
    // Setup express app with routes
    app = express()
    app.use(express.json())
    
    // Import and use the activities routes
    const activitiesRouter = require('../routes/activities.js')
    app.use('/api/activities', activitiesRouter)
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Statistics Endpoint Water Sport Filtering', () => {
    test('should filter for water sports only in statistics', async () => {
      // Mock the Activity.find to return water sports after filtering
      const waterSportActivities = mockActivities.filter(activity => 
        activity.sportType.toLowerCase().includes('kayak') ||
        activity.sportType.toLowerCase().includes('paddle') ||
        activity.sportType.toLowerCase().includes('sup') ||
        activity.sportType.toLowerCase().includes('stand up paddleboard')
      )

      Activity.find.mockReturnValue({
        lean: jest.fn().mockResolvedValue(waterSportActivities)
      })

      const response = await request(app)
        .get('/api/activities/stats/summary')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.stats).toBeDefined()
      
      // Should only include water sport activities (2 out of 4)
      expect(response.body.stats.totalActivities).toBe(2)
      
      // Should include kayaking and SUP in sport type breakdown
      expect(response.body.stats.sportTypeBreakdown).toHaveProperty('Kayaking')
      expect(response.body.stats.sportTypeBreakdown).toHaveProperty('Stand Up Paddleboarding')
      
      // Should NOT include cycling or running
      expect(response.body.stats.sportTypeBreakdown).not.toHaveProperty('Cycling')
      expect(response.body.stats.sportTypeBreakdown).not.toHaveProperty('Running')
    })

    test('should handle empty result when no water sports found', async () => {
      // Mock no water sport activities
      Activity.find.mockReturnValue({
        lean: jest.fn().mockResolvedValue([])
      })

      const response = await request(app)
        .get('/api/activities/stats/summary')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.stats.totalActivities).toBe(0)
      expect(response.body.stats.totalDistance).toBe(0)
      expect(response.body.stats.totalTime).toBe(0)
    })

    test('should calculate correct statistics from filtered water sports', async () => {
      const waterSportActivities = [
        mockActivities[0], // Kayaking - 5000m, 3600s
        mockActivities[2]  // SUP - 3000m, 2400s
      ]

      Activity.find.mockReturnValue({
        lean: jest.fn().mockResolvedValue(waterSportActivities)
      })

      const response = await request(app)
        .get('/api/activities/stats/summary')
        .expect(200)

      const stats = response.body.stats
      expect(stats.totalDistance).toBe(8000) // 5000 + 3000
      expect(stats.totalTime).toBe(6000)     // 3600 + 2400
      expect(stats.averageDistance).toBe(4000) // 8000 / 2
      expect(stats.longestActivity).toBe(5000)
    })

    test('should handle time range filtering with water sports', async () => {
      Activity.find.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockActivities.slice(0, 2))
      })

      const response = await request(app)
        .get('/api/activities/stats/summary?timeRange=30')
        .expect(200)

      expect(response.body.success).toBe(true)
      
      // Verify that Activity.find was called with time range filter
      expect(Activity.find).toHaveBeenCalledWith(
        expect.objectContaining({
          userGoogleId: 'user123',
          startDate: expect.any(Object)
        })
      )
    })
  })

  describe('Activities Endpoint Water Sport Filtering', () => {
    test('should filter activities for water sports when no sportType specified', async () => {
      const waterSportActivities = mockActivities.filter(activity => 
        /kayak|canoe|paddle|sup|stand.*up.*paddleboard|rowing|surfing|sailing/i.test(activity.sportType) ||
        /kayak|canoe|paddle|sup|stand.*up.*paddleboard|rowing|surfing|sailing/i.test(activity.type) ||
        /kayak|canoe|paddle|sup|stand.*up.*paddleboard|rowing|surfing|sailing/i.test(activity.name)
      )

      Activity.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            skip: jest.fn().mockResolvedValue(waterSportActivities)
          })
        })
      })

      Activity.countDocuments = jest.fn().mockResolvedValue(waterSportActivities.length)

      const response = await request(app)
        .get('/api/activities')
        .expect(200)

      expect(response.body.success).toBe(true)
      
      // Verify the query includes water sport filtering
      expect(Activity.find).toHaveBeenCalledWith(
        expect.objectContaining({
          userGoogleId: 'user123',
          $or: expect.arrayContaining([
            expect.objectContaining({ sportType: expect.any(RegExp) }),
            expect.objectContaining({ type: expect.any(RegExp) }),
            expect.objectContaining({ name: expect.any(RegExp) })
          ])
        })
      )
    })

    test('should not apply water sport filter when specific sportType is provided', async () => {
      Activity.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            skip: jest.fn().mockResolvedValue([])
          })
        })
      })

      Activity.countDocuments = jest.fn().mockResolvedValue(0)

      const response = await request(app)
        .get('/api/activities?sportType=Cycling')
        .expect(200)

      expect(response.body.success).toBe(true)
      
      // Verify the query uses the specific sportType without water sport filtering
      expect(Activity.find).toHaveBeenCalledWith(
        expect.objectContaining({
          userGoogleId: 'user123',
          sportType: 'Cycling'
        })
      )
    })
  })

  describe('Water Sport Activity Pattern Matching', () => {
    test('should match kayaking activities', () => {
      const testActivities = [
        { sportType: 'Kayaking', type: 'Kayaking', name: 'River Kayak' },
        { sportType: 'Sea Kayaking', type: 'Paddling', name: 'Ocean Adventure' }
      ]

      testActivities.forEach(activity => {
        const isWaterSport = 
          /kayak|canoe|paddle|sup|stand.*up.*paddleboard/i.test(activity.sportType) ||
          /kayak|canoe|paddle|sup/i.test(activity.type) ||
          /kayak|canoe|paddle|sup/i.test(activity.name)
        
        expect(isWaterSport).toBe(true)
      })
    })

    test('should match SUP activities', () => {
      const testActivities = [
        { sportType: 'Stand Up Paddleboarding', type: 'SUP', name: 'Morning SUP' },
        { sportType: 'SUP', type: 'Paddling', name: 'Lake Paddleboard' }
      ]

      testActivities.forEach(activity => {
        const isWaterSport = 
          /kayak|canoe|paddle|sup|stand.*up.*paddleboard/i.test(activity.sportType) ||
          /kayak|canoe|paddle|sup/i.test(activity.type) ||
          /kayak|canoe|paddle|sup/i.test(activity.name)
        
        expect(isWaterSport).toBe(true)
      })
    })

    test('should not match non-water sport activities', () => {
      const testActivities = [
        { sportType: 'Cycling', type: 'Ride', name: 'Mountain Bike' },
        { sportType: 'Running', type: 'Run', name: 'Morning Jog' },
        { sportType: 'Swimming', type: 'Swim', name: 'Pool Workout' }
      ]

      testActivities.forEach(activity => {
        const isWaterSport = 
          /kayak|canoe|paddle|sup|stand.*up.*paddleboard/i.test(activity.sportType) ||
          /kayak|canoe|paddle|sup/i.test(activity.type) ||
          /kayak|canoe|paddle|sup/i.test(activity.name)
        
        expect(isWaterSport).toBe(false)
      })
    })
  })

  describe('Error Handling', () => {
    test('should handle database errors gracefully', async () => {
      Activity.find.mockReturnValue({
        lean: jest.fn().mockRejectedValue(new Error('Database error'))
      })

      const response = await request(app)
        .get('/api/activities/stats/summary')
        .expect(500)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBeDefined()
    })

    test('should handle invalid time range parameters', async () => {
      Activity.find.mockReturnValue({
        lean: jest.fn().mockResolvedValue([])
      })

      const response = await request(app)
        .get('/api/activities/stats/summary?timeRange=invalid')
        .expect(200) // Should still work, just ignore invalid param

      expect(response.body.success).toBe(true)
    })
  })
})