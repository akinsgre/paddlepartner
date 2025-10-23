import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import compression from 'compression'
import rateLimit from 'express-rate-limit'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { connectDatabase } from './config/database.js'
import authRoutes from './routes/auth.js'
import userRoutes from './routes/users.js'
import activityRoutes from './routes/activities.js'
import stravaRoutes from './routes/strava.js'
import waterTypesRoutes from './routes/waterTypes.js'
import { errorHandler } from './middleware/errorHandler.js'
import WaterType from './models/WaterType.js'

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables from .env file in current directory
dotenv.config({ path: join(__dirname, '.env') })

// Alternative loading for ES modules
if (!process.env.STRAVA_CLIENT_ID) {
  console.log('⚠️ Trying alternative .env loading...')
  dotenv.config()
  dotenv.config({ path: '.env' })
}

// Debug: Verify environment variables are loaded
console.log('🔧 Environment check:')
console.log('NODE_ENV:', process.env.NODE_ENV)
console.log('MONGODB_URI configured:', !!process.env.MONGODB_URI)
console.log('PORT:', process.env.PORT)
console.log('STRAVA_CLIENT_ID:', process.env.STRAVA_CLIENT_ID ? 'loaded' : 'NOT LOADED')
console.log('STRAVA_CLIENT_ID value:', process.env.STRAVA_CLIENT_ID)


const app = express()
const PORT = process.env.PORT || 3001

// CORS middleware FIRST
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}))

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
})

// Middleware
app.use(helmet())
app.use(compression())
app.use(morgan('combined'))
app.use(limiter)
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.env.npm_package_version || '1.0.0'
  })
})

// API Routes
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/activities', activityRoutes)
app.use('/api/strava', stravaRoutes)
app.use('/api/water-types', waterTypesRoutes)

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
    timestamp: new Date().toISOString()
  })
})

// Error handling middleware
app.use(errorHandler)

// Start server

async function seedWaterTypes() {
  const allowed = [
    { name: 'whitewater', description: 'Whitewater paddling' },
    { name: 'moving water', description: 'Moving water (not whitewater)' },
    { name: 'flat water', description: 'Flat water (lakes, slow rivers)' },
    { name: 'erg', description: 'Ergometer (indoor trainer)' }
  ]
  const count = await WaterType.countDocuments()
  if (count < allowed.length) {
    for (const type of allowed) {
      await WaterType.updateOne({ name: type.name }, type, { upsert: true })
    }
    console.log('✅ Seeded WaterType collection')
  }
}

async function startServer() {
  try {
    // Connect to database
    await connectDatabase()
    // Seed water types
    await seedWaterTypes()
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Paddle Partner Server running on port ${PORT}`)
      console.log(`📊 Health check: http://localhost:${PORT}/health`)
      console.log(`🔗 Client URL: ${process.env.CLIENT_URL || 'http://localhost:5173'}`)
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`)
    })
  } catch (error) {
    console.error('❌ Failed to start server:', error)
    process.exit(1)
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...')
  process.exit(0)
})

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...')
  process.exit(0)
})

startServer()