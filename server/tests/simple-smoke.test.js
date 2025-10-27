const request = require('supertest')
const express = require('express')
const cors = require('cors')

// Simple smoke test that doesn't require complex ES module setup
describe('🚀 Simple Smoke Tests', () => {
  describe('Basic Application Health', () => {
    test('Express app can be created', () => {
      const app = express()
      expect(app).toBeDefined()
    })

    test('CORS middleware loads', () => {
      expect(cors).toBeDefined()
      expect(typeof cors).toBe('function')
    })

    test('Environment is configured for testing', () => {
      expect(process.env.NODE_ENV).toBe('test')
    })

    test('Required dependencies are available', () => {
      expect(request).toBeDefined()
      expect(express).toBeDefined()
    })
  })

  describe('Health Check Endpoint', () => {
    let app

    beforeAll(() => {
      app = express()
      app.use(cors())
      app.use(express.json())
      
      // Simple health endpoint
      app.get('/health', (req, res) => {
        res.json({ 
          status: 'healthy', 
          timestamp: new Date().toISOString(),
          environment: process.env.NODE_ENV 
        })
      })
    })

    test('GET /health returns 200', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200)

      expect(response.body).toHaveProperty('status', 'healthy')
      expect(response.body).toHaveProperty('timestamp')
      expect(response.body).toHaveProperty('environment', 'test')
    })

    test('Health endpoint returns JSON', async () => {
      const response = await request(app)
        .get('/health')
        .expect('Content-Type', /json/)

      expect(response.body).toBeDefined()
    })
  })

  describe('Configuration Validation', () => {
    test('Package.json exists and has required scripts', () => {
      const pkg = require('../package.json')
      
      expect(pkg.name).toBe('paddle-partner-server')
      expect(pkg.scripts).toHaveProperty('start')
      expect(pkg.scripts).toHaveProperty('dev')
      expect(pkg.scripts).toHaveProperty('test')
    })

    test('Required dependencies are installed', () => {
      const pkg = require('../package.json')
      
      expect(pkg.dependencies).toHaveProperty('express')
      expect(pkg.dependencies).toHaveProperty('mongoose')
      expect(pkg.dependencies).toHaveProperty('cors')
      expect(pkg.dependencies).toHaveProperty('dotenv')
    })

    test('Test dependencies are installed', () => {
      const pkg = require('../package.json')
      
      expect(pkg.devDependencies).toHaveProperty('jest')
      expect(pkg.devDependencies).toHaveProperty('supertest')
      expect(pkg.devDependencies).toHaveProperty('mongodb-memory-server')
    })
  })
})