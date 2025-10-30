const request = require('supertest')
const express = require('express')

// Integration test for GPS coordinate validation in activities
describe('🗺️ GPS Coordinate Validation (API Integration)', () => {
  let app

  beforeAll(() => {
    // Create a minimal Express app for testing
    app = express()
    app.use(express.json())
    
    // Mock activity creation endpoint
    app.post('/api/activities', (req, res) => {
      const { location } = req.body
      
      // Simulate the coordinate validation logic from the model
      const validateCoordinates = (coords) => {
        if (!coords || coords.length === 0) return true
        if (!Array.isArray(coords) || coords.length !== 2) return false
        
        const [lat, lng] = coords
        if (typeof lat !== 'number' || typeof lng !== 'number' || 
            isNaN(lat) || isNaN(lng)) return false
        
        return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180
      }
      
      // Validate startLatLng and endLatLng
      if (location?.startLatLng && !validateCoordinates(location.startLatLng)) {
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid coordinates format - must be [latitude, longitude] or empty for activities without GPS' 
        })
      }
      
      if (location?.endLatLng && !validateCoordinates(location.endLatLng)) {
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid coordinates format - must be [latitude, longitude] or empty for activities without GPS' 
        })
      }
      
      res.json({ success: true, message: 'Activity created successfully' })
    })
  })

  describe('Valid GPS coordinates', () => {
    test('should accept valid latitude and longitude', async () => {
      const response = await request(app)
        .post('/api/activities')
        .send({
          name: 'Test Activity',
          location: {
            startLatLng: [45.5017, -73.5673], // Montreal coordinates
            endLatLng: [45.5088, -73.5878]
          }
        })
      
      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
    })

    test('should accept coordinates at valid boundaries', async () => {
      const response = await request(app)
        .post('/api/activities')
        .send({
          name: 'Test Activity',
          location: {
            startLatLng: [90, 180], // Max valid coordinates
            endLatLng: [-90, -180] // Min valid coordinates
          }
        })
      
      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
    })
  })

  describe('Missing GPS coordinates (activities without GPS)', () => {
    test('should accept undefined startLatLng', async () => {
      const response = await request(app)
        .post('/api/activities')
        .send({
          name: 'Indoor Activity',
          location: {
            startLatLng: undefined,
            endLatLng: [45.5088, -73.5878]
          }
        })
      
      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
    })

    test('should accept null coordinates', async () => {
      const response = await request(app)
        .post('/api/activities')
        .send({
          name: 'Manual Entry',
          location: {
            startLatLng: null,
            endLatLng: null
          }
        })
      
      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
    })

    test('should accept empty arrays', async () => {
      const response = await request(app)
        .post('/api/activities')
        .send({
          name: 'No GPS Activity',
          location: {
            startLatLng: [],
            endLatLng: []
          }
        })
      
      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
    })

    test('should accept missing location object entirely', async () => {
      const response = await request(app)
        .post('/api/activities')
        .send({
          name: 'Simple Activity'
          // No location property at all
        })
      
      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
    })
  })

  describe('Invalid GPS coordinates', () => {
    test('should reject latitude out of range', async () => {
      const response = await request(app)
        .post('/api/activities')
        .send({
          name: 'Invalid Latitude',
          location: {
            startLatLng: [91, -73.5673], // Latitude > 90
            endLatLng: [45.5088, -73.5878]
          }
        })
      
      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('Invalid coordinates format')
    })

    test('should reject longitude out of range', async () => {
      const response = await request(app)
        .post('/api/activities')
        .send({
          name: 'Invalid Longitude',
          location: {
            startLatLng: [45.5017, -181], // Longitude < -180
            endLatLng: [45.5088, -73.5878]
          }
        })
      
      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('Invalid coordinates format')
    })

    test('should reject incomplete coordinate arrays', async () => {
      const response = await request(app)
        .post('/api/activities')
        .send({
          name: 'Incomplete Coordinates',
          location: {
            startLatLng: [45.5017], // Missing longitude
            endLatLng: [45.5088, -73.5878]
          }
        })
      
      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('Invalid coordinates format')
    })

    test('should reject arrays with too many elements', async () => {
      const response = await request(app)
        .post('/api/activities')
        .send({
          name: 'Too Many Coordinates',
          location: {
            startLatLng: [45.5017, -73.5673, 100], // Extra element
            endLatLng: [45.5088, -73.5878]
          }
        })
      
      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('Invalid coordinates format')
    })

    test('should reject non-numeric coordinates', async () => {
      const response = await request(app)
        .post('/api/activities')
        .send({
          name: 'String Coordinates',
          location: {
            startLatLng: ['45.5017', '-73.5673'], // Strings instead of numbers
            endLatLng: [45.5088, -73.5878]
          }
        })
      
      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('Invalid coordinates format')
    })

    test('should reject NaN coordinates', async () => {
      const response = await request(app)
        .post('/api/activities')
        .send({
          name: 'NaN Coordinates',
          location: {
            startLatLng: [NaN, -73.5673],
            endLatLng: [45.5088, -73.5878]
          }
        })
      
      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('Invalid coordinates format')
    })
  })

  describe('Real-world Strava scenarios', () => {
    test('should handle indoor activities without GPS', async () => {
      const response = await request(app)
        .post('/api/activities')
        .send({
          name: 'Indoor Paddle Training',
          type: 'Workout',
          location: {
            startLatLng: null, // Typical for indoor activities
            endLatLng: null
          }
        })
      
      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
    })

    test('should handle manually entered activities', async () => {
      const response = await request(app)
        .post('/api/activities')
        .send({
          name: 'Manual Entry - Lake Paddle',
          location: {
            // No GPS coordinates, just location name
            city: 'Ottawa',
            state: 'Ontario', 
            country: 'Canada'
          }
        })
      
      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
    })
  })
})